import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const [repo, existingPath] = process.argv.slice(2);
const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
const drafts = JSON.parse(fs.readFileSync('deliverables/issue-drafts.json', 'utf8'));
const issues = [];
for (const draft of drafts) {
  const found = existing.find(i => i.title === draft.title);
  let url;
  if (found) {
    execFileSync('gh', ['issue', 'edit', String(found.number), '--repo', repo, '--body-file', draft.bodyFile], { stdio: 'inherit' });
    url = found.url;
  } else {
    url = execFileSync('gh', ['issue', 'create', '--repo', repo, '--title', draft.title, '--body-file', draft.bodyFile], { encoding: 'utf8' }).trim();
  }
  if (!url.startsWith(`https://github.com/${repo}/issues/`)) throw new Error('Unexpected GitHub issue URL');
  issues.push({ ...draft, url });
}
fs.writeFileSync('deliverables/issues.json', JSON.stringify(issues, null, 2) + '\n');
const page = 'src/routes/kb/incidents/4471-review/+page.svx';
let text = fs.readFileSync(page, 'utf8');
text = text.replace(/\n<!-- published-issues:start -->[\s\S]*?<!-- published-issues:end -->\n/g, '\n');
const links = `\n<!-- published-issues:start -->\n${issues.map(i => `- [${i.title}](${i.url})`).join('\n')}\n<!-- published-issues:end -->\n`;
text = text.replace('\n<RenderStamp {signature} />', `${links}\n<RenderStamp {signature} />`);
fs.writeFileSync(page, text);
