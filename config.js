(() => {
  'use strict';

  const version = document.querySelector('meta[name="app-version"]')?.content || 'unknown';

  window.ProjectEvercadeConfig = Object.freeze({
    version,
    pagesUrl: 'https://f6yv7sgtgw-wq.github.io/Evercade-/',
    dealApiUrl: 'https://project-evercade-deal-api.jnldc.chatgpt.site',
    genericParserWorkerUrl: 'https://genericparser.f6yv7sgtgw.workers.dev',
    genericParserContract: 'generic-parser-module-v1'
  });
})();
