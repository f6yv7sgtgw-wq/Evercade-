import fs from 'node:fs';

const metadata = JSON.parse(fs.readFileSync('VERSION.json', 'utf8'));
const version = metadata.version;
const baseUrl = metadata.pages_url.replace(/\/$/, '');
const deadline = Date.now() + 4 * 60 * 1000;
let lastError = null;

async function fetchText(url) {
  const response = await fetch(url, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.text();
}

while (Date.now() < deadline) {
  try {
    const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const html = await fetchText(`${baseUrl}/?release-check=${nonce}`);
    const required = [
      `meta name="app-version" content="${version}"`,
      `Version ${version}`,
      `eventlog.js?v=${version}`,
      `release.js?v=${version}`,
      `kleinanzeigen-client.js?v=${version}`
    ];
    for (const value of required) {
      if (!html.includes(value)) throw new Error(`Live HTML is missing: ${value}`);
    }

    const [releaseJson, eventlog, releaseJs, parserClient] = await Promise.all([
      fetchText(`${baseUrl}/release.json?${nonce}`),
      fetchText(`${baseUrl}/eventlog.js?v=${version}&${nonce}`),
      fetchText(`${baseUrl}/release.js?v=${version}&${nonce}`),
      fetchText(`${baseUrl}/kleinanzeigen-client.js?v=${version}&${nonce}`)
    ]);

    const live = JSON.parse(releaseJson);
    if (live.version !== version) throw new Error(`release.json is ${live.version}, expected ${version}`);
    if (!eventlog.includes('EvercadeEventLog')) throw new Error('Live eventlog module is invalid');
    if (!releaseJs.includes('Eventlog öffnen')) throw new Error('Live release layer has no Eventlog access');
    if (!parserClient.includes('generic-parser-module-v1')) throw new Error('Live Kleinanzeigen integration contract is missing');

    console.log(`LIVE VERIFIED: Project Evercade ${version} at ${baseUrl}`);
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.log(`Waiting for Pages: ${error.message}`);
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
}

throw new Error(`Live verification failed after timeout: ${lastError?.message || 'unknown error'}`);
