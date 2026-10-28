import fs from 'node:fs';
import { groupByCause, uniqueById, readAs } from '../src/lib/kb/causes.ts';
import { deskRef } from '../src/lib/kb/desk-ref.ts';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const raw = read('src/lib/data/reports-4471.json');
const reports = uniqueById(raw).filter(r => r.mergedInto === 4471);
const tenants = fs.readdirSync('src/lib/data/tenants').map(f => read(`src/lib/data/tenants/${f}`));
const tenantOf = r => tenants.find(t => t.handle === r.tenant);
const notes = read('src/lib/data/desk-notes.json');
const groups = groupByCause(reports, tenantOf);
const weeks = new Map();
const start = Date.parse('2026-03-30');
const weekOf = iso => new Date(start + Math.floor((Date.parse(iso.slice(0, 10)) - start) / 604800000) * 604800000).toISOString().slice(0, 10);
for (const r of reports) {
  for (const [field, kind] of [['receivedAt', 'received'], ['mergedAt', 'merged']]) {
    if (!r[field]) continue;
    const week = weekOf(r[field]);
    const row = weeks.get(week) ?? { week, received: 0, merged: 0 };
    row[kind]++;
    weeks.set(week, row);
  }
}
const result = {
  source: 'support kb export, 2026-10-04; not a live queue',
  rawRows: raw.length,
  uniqueReports: reports.length,
  repeatedRows: raw.length - uniqueById(raw).length,
  signature: 'Mateusz Jakowlew / Codex / S01E03',
  deskRef: deskRef('Mateusz Jakowlew / Codex / S01E03'),
  groups: groups.map(({ reports: rs, ...g }) => ({
    ...g,
    count: rs.length,
    oneDayMoveNotes: readAs({ ...g, reports: rs }, notes.oneDayMove),
    reportIds: rs.map(r => r.id),
    tenantHandles: [...new Set(rs.map(r => r.tenant))].sort()
  })),
  weeks: [...weeks.values()].sort((a, b) => a.week.localeCompare(b.week)),
  ambiguousReports: notes.oneDayMove.map(id => reports.find(r => r.id === id))
};
fs.mkdirSync('evidence', { recursive: true });
fs.writeFileSync('evidence/analysis.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ rawRows: result.rawRows, uniqueReports: result.uniqueReports, repeatedRows: result.repeatedRows, deskRef: result.deskRef, groups: result.groups.map(({ cause, count, taggedAs, oneDayMoveNotes }) => ({ cause, count, taggedAs, oneDayMoveNotes })) }, null, 2));
