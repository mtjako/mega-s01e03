import fs from 'node:fs';
import './analyze.mjs';

const analysis = JSON.parse(fs.readFileSync('evidence/analysis.json', 'utf8'));
const resolution = JSON.parse(fs.readFileSync('src/lib/data/resolution-4471.json', 'utf8'));
fs.mkdirSync('deliverables', { recursive: true });
const definitions = {
  parser: {
    title: 'S01E03: shared parser swaps day and month for day-first tenants',
    description: 'The shared date parser reads every date month first, even for tenants whose locale uses day first. Keep this separate from the booking-v3 hint defect.',
    evidence: 'R-41200: Harbour Dental, en-GB, booking-v2, app. The reporter entered 7 April and the reminder went out on 4 July. R-41201 describes the reverse swap and retains its own report ID.',
    reproduction: 'Use a day-first tenant such as Harbour Dental. Enter a local date with distinct day and month, both at most twelve, such as 07/04/2026 for 7 April. Follow the shared parser path through app, email or booking-v2. Expected: 7 April. Reported actual: 4 July.',
    fix: 'Make shared date parsing agree with the tenant input convention. Verify day/month round trips for app, email and booking-v2, including dates above twelve and unambiguous structured inputs. Verify booking-v3 independently.',
    caveat: 'Five desk-note reports are included in this classifier count: R-41202, R-41209, R-41236, R-41344 and R-41620. Their bodies describe adjacent days, June-only movement, an invite before a booking, or different dates across timezones. The exported classifier places them here, but does not prove their root cause. Investigate original inputs, stored values, timezone and event timestamps; do not count them twice or declare a third confirmed defect without evidence.'
  },
  hint: {
    title: 'S01E03: booking-v3 shows MM/DD/YYYY to day-first tenants',
    description: 'Booking-v3 prints MM/DD/YYYY, while its form reads dates using the day-first tenant convention. People follow the hint and their dates swap. This needs an independent form fix.',
    evidence: 'R-41230: Copper Studio, es-ES, booking-v3, form. The report describes 6 January becoming 1 June. Intake tagged it parser; tenant configuration and channel identify the hint path. Affected tenants are Alder Physio, Copper Studio and Pale Harbour.',
    reproduction: 'Open booking-v3 for Copper Studio. To book 6 January, follow MM/DD/YYYY and enter 01/06/2026. Expected: 6 January. The stated tenant-based form reader interprets this as 1 June.',
    fix: 'Make the displayed hint and accepted input convention agree with the tenant locale. Verify date round trips for all booking-v3 tenants and check booking-v2 still agrees with its DD/MM/YYYY hint. Fixing the shared parser alone does not fix these instructions.',
    caveat: 'This count concerns the form channel on booking-v3 for day-first tenants. The same tenants can have app and email reports belonging to the shared parser issue; do not group by tenant alone.'
  }
};
const issues = analysis.groups.map(g => {
  const d = definitions[g.cause];
  if (!d) throw new Error(`Unclassified cause: ${g.cause}; investigate before publishing`);
  const body = `## Problem\n\n${d.description}\n\n## Reports covered\n\n**${g.count} distinct reports** merged into #4471 in the 2026-10-04 export. First received ${g.firstSeen}; last received ${g.lastSeen}; ${g.tenants} tenants.\n\nThe export has ${analysis.rawRows} rows but only ${analysis.uniqueReports} report IDs. Counts deduplicate by ID and use tenant locale, form version and channel through src/lib/kb/causes.ts and locales.ts. Intake labels are guesses: ${Object.entries(g.taggedAs).map(([tag,n])=>`${tag}: ${n}`).join('; ')}.\n\n## Evidence and reproduction\n\n${d.evidence}\n\n${d.reproduction}\n\nThis reproduction is derived from the exported code and reports. The production application was not available for direct testing.\n\n## Fix and acceptance\n\n${d.fix}\n\n## Limits and follow-up\n\n${d.caveat}\n\nThe desk keeps receiving reports. These are snapshot counts, not live totals. Re-export, deduplicate and reclassify before closing or quoting a current count. Receipt time differs from merge time: early April reports were merged in July.\n\nSee src/routes/kb/incidents/4471-review/+page.svx, its generated rendered/incidents-4471-review.html, and evidence/analysis.json for the signed review, component output and full report-ID membership.\n\n## Report IDs\n\n${g.reportIds.join(', ')}\n`;
  const outcome = resolution[g.cause];
  const closure = `## Engineering update — ${resolution.closedOn}\n\nThe course desk marks #4471 closed. This cause is **${outcome.status}**: ${outcome.message}. Close this issue as **${outcome.githubReason}**. Source: ${resolution.source} (observed ${resolution.observedOn}). This records the desk's outcome; no independent production verification was available.\n\n`;
  fs.writeFileSync(`deliverables/${g.cause}.md`, closure + body);
  return { cause: g.cause, title: d.title, reports: g.count, bodyFile: `deliverables/${g.cause}.md` };
});
fs.writeFileSync('deliverables/issue-drafts.json', JSON.stringify(issues, null, 2) + '\n');
