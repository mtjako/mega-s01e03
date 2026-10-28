import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const repo = process.argv[2];
const issues = JSON.parse(fs.readFileSync('deliverables/issues.json', 'utf8'));
const resolution = JSON.parse(fs.readFileSync('src/lib/data/resolution-4471.json', 'utf8'));
for (const issue of issues) {
  if (!issue.url.startsWith(`https://github.com/${repo}/issues/`)) throw new Error('Unexpected issue repository');
  const outcome = resolution[issue.cause];
  if (!outcome) throw new Error(`No engineering outcome for ${issue.cause}`);
  execFileSync('gh', ['issue', 'close', issue.url, '--reason', outcome.githubReason], { stdio: 'inherit' });
}
console.log('Closed parser as completed and hint as not planned, following the course desk update.');
