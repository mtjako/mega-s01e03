import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import './analyze.mjs';

fs.mkdirSync('rendered', { recursive: true });
for (const route of ['incidents/4471-review', 'incidents/4471', 'triage/dedupe', 'decisions/0002-verify-cause-before-merge']) {
  const file = path.resolve('build/kb', route, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<link\b[^>]*>/g, tag => {
    if (!/rel="stylesheet"/.test(tag)) return '';
    const href = tag.match(/href="([^"]+)"/)?.[1];
    assert(href, 'stylesheet href missing');
    const cssFile = href.startsWith('/') ? path.resolve('build', href.slice(1)) : path.resolve(path.dirname(file), href);
    return `<style>${fs.readFileSync(cssFile, 'utf8')}</style>`;
  });
  // Keep the actual prerendered component output. This portable snapshot needs no server.
  // The complete interactive version remains in build/ and runs with npm run preview.
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  if (route === 'incidents/4471-review') {
    assert(html.includes('379') && html.includes('33'), 'cause counts did not render');
    assert(html.includes('DR-'), 'RenderStamp did not render');
    assert(html.includes('<svg'), 'QueueTimeline did not render');
    assert(!html.includes('<CauseTable'), 'unrendered component');
    assert(html.includes('same subject, same tenant, different channel'), 'DedupeExplorer did not render');
  }
  fs.writeFileSync(`rendered/${route.replaceAll('/', '-')}.html`, html);
}
console.log('Exported self-contained HTML from the SvelteKit prerender.');
