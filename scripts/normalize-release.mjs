import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, content) => fs.writeFileSync(path.join(root, file), content);
const exists = file => fs.existsSync(path.join(root, file));
const versionInfo = JSON.parse(read('VERSION.json'));
const version = String(versionInfo.version || '').trim();

if (!/^\d+\.\d+\.\d+(?:\.\d+){0,2}$/.test(version)) throw new Error(`Invalid release version: ${version}`);
if (versionInfo.display_version !== version) throw new Error('VERSION.json display_version must equal version');

// index.html: one runtime config and one canonical script chain.
let html = read('index.html');
html = html.replace(/<meta name="app-version"[^>]*>\s*/g, '');
html = html.replace('<title>Project Evercade</title>', `<title>Project Evercade</title><meta name="app-version" content="${version}" />`);
html = html.replace(/Version\s+\d+\.\d+\.\d+(?:\.\d+){0,2}/g, `Version ${version}`);
for (const asset of ['manifest.json','styles.css','config.js','app.js','kleinanzeigen-client.js','eventlog.js','release.js']) {
  const escaped = asset.replaceAll('.', '\\.');
  html = html.replace(new RegExp(`${escaped}(?:\\?v=[^"']*)?`, 'g'), `${asset}?v=${version}`);
}
html = html.replace(/^\s*<script[^>]+src="(?:config\.js|app\.js|kleinanzeigen-client\.js|eventlog\.js|release\.js|hotfix-[^"]+|release-[^"]+)[^"]*"[^>]*><\/script>\s*$/gm, '');
const scripts = ['config.js','app.js','kleinanzeigen-client.js','eventlog.js','release.js']
  .map(file => `<script src="${file}?v=${version}"></script>`).join('');
html = html.replace('</body>', `${scripts}</body>`);
write('index.html', html);

// Manifest is generated from VERSION.json.
const manifest = JSON.parse(read('manifest.json'));
manifest.name = `Project Evercade ${version}`;
manifest.short_name = `Evercade ${version}`;
manifest.start_url = './';
manifest.version = version;
write('manifest.json', JSON.stringify(manifest, null, 2) + '\n');

// Runtime modules read version and endpoints centrally.
let eventlog = read('eventlog.js');
eventlog = eventlog.replace(/const VERSION\s*=\s*['"][^'"]+['"];/, `const VERSION = window.ProjectEvercadeConfig?.version || document.querySelector('meta[name="app-version"]')?.content || 'unknown';`);
eventlog = eventlog.replace(/const LOG_KEY\s*=\s*['"][^'"]+['"];/, "const LOG_KEY = `evercade-eventlog-${VERSION.replace(/[^0-9a-z]+/gi, '-')}`;");
write('eventlog.js', eventlog);

let kleinanzeigen = read('kleinanzeigen-client.js');
kleinanzeigen = kleinanzeigen.replace(/const VERSION\s*=\s*['"][^'"]+['"];/, `const VERSION = window.ProjectEvercadeConfig?.version || document.querySelector('meta[name="app-version"]')?.content || 'unknown';`);
kleinanzeigen = kleinanzeigen.replace(/const CONTRACT\s*=\s*['"][^'"]+['"];/, `const CONTRACT = window.ProjectEvercadeConfig?.genericParserContract || 'generic-parser-module-v1';`);
kleinanzeigen = kleinanzeigen.replace(/const WORKER\s*=\s*['"][^'"]+['"];/, `const WORKER = window.ProjectEvercadeConfig?.genericParserWorkerUrl || '';`);
kleinanzeigen = kleinanzeigen.replace(/const DAILY_KEY\s*=\s*['"][^'"]+['"];/, "const STORAGE_NS = VERSION.replace(/[^0-9a-z]+/gi, '-');\n  const DAILY_KEY = `evercade-ka-${STORAGE_NS}-daily`;");
kleinanzeigen = kleinanzeigen.replace(/const STATUS_KEY\s*=\s*['"][^'"]+['"];/, "const STATUS_KEY = `evercade-ka-${STORAGE_NS}-status`;");
kleinanzeigen = kleinanzeigen.replace(/const LOG_KEY\s*=\s*['"][^'"]+['"];/, "const LOG_KEY = `evercade-ka-${STORAGE_NS}-log`;");
kleinanzeigen = kleinanzeigen.replace(/console\.info\('\[Evercade [^']+\]\[Kleinanzeigen\]', event, details\);/, 'console.info(`[Evercade ${VERSION}][Kleinanzeigen]`, event, details);');
write('kleinanzeigen-client.js', kleinanzeigen);

let app = read('app.js');
app = app.replace(/const DEAL_API_URL\s*=\s*['"][^'"]+['"];/, 'const DEAL_API_URL = window.ProjectEvercadeConfig?.dealApiUrl || "";');
write('app.js', app);

write('release.json', JSON.stringify({ product: versionInfo.product, version, source: 'VERSION.json', commit: process.env.GITHUB_SHA || null, built_at: new Date().toISOString() }, null, 2) + '\n');

write('README.md', `# Project Evercade – Version ${version}\n\nSammlungsmanager, Preisüberwachung und Deal-Suche für Evercade-Cartridges.\n\n## Verbindlicher Release-Standard\n\n- \`VERSION.json\` ist die einzige Build-Versionsquelle.\n- \`config.js\` enthält die zentralen Service-Endpunkte.\n- Laufzeitmodule lesen Version und Endpunkte aus der zentralen Konfiguration.\n- GitHub Pages wird ausschließlich durch \`.github/workflows/publish-gh-pages.yml\` aus \`main\` veröffentlicht.\n- Historische Runtime- und Hotfix-Dateien werden nicht veröffentlicht.\n\nGitHub Pages: \`https://f6yv7sgtgw-wq.github.io/Evercade-/\`\n`);

// Remove obsolete files that can overwrite or reintroduce old releases.
for (const file of [
  '.github/workflows/integrate-kleinanzeigen.yml',
  'app-0.9.4.js', 'app-0.9.4.1.js', 'hotfix-0.9.5.1.js',
  'release-0.9.5.2.js', 'version-runtime.js', 'VERSION_TEST.json',
  'release-requests/0.9.5.2-verify.txt'
]) {
  if (exists(file)) fs.rmSync(path.join(root, file));
}

// Forward and backward checks.
const required = ['VERSION.json','config.js','index.html','manifest.json','app.js','kleinanzeigen-client.js','eventlog.js','release.js','release.json'];
for (const file of required) if (!exists(file)) throw new Error(`Missing canonical file: ${file}`);
for (const asset of ['manifest.json','styles.css','config.js','app.js','kleinanzeigen-client.js','eventlog.js','release.js']) {
  if (!html.includes(`${asset}?v=${version}`)) throw new Error(`Index asset mismatch: ${asset}`);
}
if (!html.includes(`meta name="app-version" content="${version}"`)) throw new Error('HTML version metadata mismatch');
if (manifest.version !== version) throw new Error('Manifest version mismatch');
if (!eventlog.includes('ProjectEvercadeConfig?.version')) throw new Error('Eventlog version is not neutral');
if (!kleinanzeigen.includes('ProjectEvercadeConfig?.version')) throw new Error('Kleinanzeigen version is not neutral');
if (!kleinanzeigen.includes('ProjectEvercadeConfig?.genericParserWorkerUrl')) throw new Error('Kleinanzeigen worker URL is not centralized');
if (!app.includes('ProjectEvercadeConfig?.dealApiUrl')) throw new Error('Deal API URL is not centralized');

console.log(`Normalized Project Evercade ${version}: version-neutral runtime, canonical endpoints and one Pages workflow.`);
