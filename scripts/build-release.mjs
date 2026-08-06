import fs from 'node:fs';
import path from 'node:path';

const targetDir = process.argv[2] || 'public';
const versionFile = JSON.parse(fs.readFileSync('VERSION.json', 'utf8'));
const version = String(versionFile.version || '').trim();
if (!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(version)) throw new Error(`Invalid VERSION.json version: ${version}`);
if (versionFile.display_version !== version) throw new Error('display_version must equal version');

const indexPath = path.join(targetDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// VERSION.json is the only release-version source.
html = html.replace(/<meta name="app-version"[^>]*>\s*/g, '');
html = html.replace('<title>Project Evercade</title>', `<title>Project Evercade</title>\n  <meta name="app-version" content="${version}" />`);
html = html.replace(/Version\s+\d+\.\d+\.\d+(?:\.\d+)?/g, `Version ${version}`);

for (const asset of ['manifest.json', 'styles.css', 'app.js', 'kleinanzeigen-client.js']) {
  const escaped = asset.replace('.', '\\.');
  html = html.replace(new RegExp(`${escaped}(?:\\?v=[^"']*)?`, 'g'), `${asset}?v=${version}`);
}

// Remove every historical release/hotfix/eventlog injection, then add the canonical pair once.
html = html.replace(/^\s*<script[^>]+src="(?:hotfix-[^"]+|release-[^"]+|eventlog\.js)[^"]*"[^>]*><\/script>\s*$/gm, '');
const injection = `  <script src="eventlog.js?v=${version}"></script>\n  <script src="release.js?v=${version}"></script>\n`;
html = html.replace('</body>', `${injection}</body>`);
fs.writeFileSync(indexPath, html);

// Normalize embedded module versions during the build so they can never drift.
for (const file of ['eventlog.js', 'kleinanzeigen-client.js']) {
  const filePath = path.join(targetDir, file);
  let source = fs.readFileSync(filePath, 'utf8');
  source = source.replace(/const VERSION\s*=\s*['"][^'"]+['"];/, `const VERSION = '${version}';`);
  fs.writeFileSync(filePath, source);
}

fs.writeFileSync(path.join(targetDir, 'release.json'), JSON.stringify({
  product: versionFile.product,
  version,
  commit: process.env.GITHUB_SHA || null,
  built_at: new Date().toISOString()
}, null, 2) + '\n');

const requiredFiles = ['index.html', 'styles.css', 'app.js', 'manifest.json', 'VERSION.json', 'kleinanzeigen-client.js', 'eventlog.js', 'release.js', 'release.json'];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(targetDir, file))) throw new Error(`Missing release file: ${file}`);
}

const checks = [
  `meta name="app-version" content="${version}"`,
  `Version ${version}`,
  `app.js?v=${version}`,
  `kleinanzeigen-client.js?v=${version}`,
  `eventlog.js?v=${version}`,
  `release.js?v=${version}`
];
for (const value of checks) {
  if (!html.includes(value)) throw new Error(`Release HTML check failed: ${value}`);
}

for (const file of ['eventlog.js', 'kleinanzeigen-client.js']) {
  const source = fs.readFileSync(path.join(targetDir, file), 'utf8');
  if (!source.includes(`const VERSION = '${version}';`)) throw new Error(`${file} version normalization failed`);
}

console.log(`Built Project Evercade ${version} from VERSION.json`);
