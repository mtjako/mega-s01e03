## Problem

Booking-v3 prints MM/DD/YYYY, while its form reads dates using the day-first tenant convention. People follow the hint and their dates swap. This needs an independent form fix.

## Reports covered

**33 distinct reports** merged into #4471 in the 2026-10-04 export. First received 2026-04-17; last received 2026-09-22; 3 tenants.

The export has 427 rows but only 412 report IDs. Counts deduplicate by ID and use tenant locale, form version and channel through src/lib/kb/causes.ts and locales.ts. Intake labels are guesses: parser: 15; hint: 18.

## Evidence and reproduction

R-41230: Copper Studio, es-ES, booking-v3, form. The report describes 6 January becoming 1 June. Intake tagged it parser; tenant configuration and channel identify the hint path. Affected tenants are Alder Physio, Copper Studio and Pale Harbour.

Open booking-v3 for Copper Studio. To book 6 January, follow MM/DD/YYYY and enter 01/06/2026. Expected: 6 January. The stated tenant-based form reader interprets this as 1 June.

This reproduction is derived from the exported code and reports. The production application was not available for direct testing.

## Fix and acceptance

Make the displayed hint and accepted input convention agree with the tenant locale. Verify date round trips for all booking-v3 tenants and check booking-v2 still agrees with its DD/MM/YYYY hint. Fixing the shared parser alone does not fix these instructions.

## Limits and follow-up

This count concerns the form channel on booking-v3 for day-first tenants. The same tenants can have app and email reports belonging to the shared parser issue; do not group by tenant alone.

The desk keeps receiving reports. These are snapshot counts, not live totals. Re-export, deduplicate and reclassify before closing or quoting a current count. Receipt time differs from merge time: early April reports were merged in July.

See src/routes/kb/incidents/4471-review/+page.svx, its generated rendered/incidents-4471-review.html, and evidence/analysis.json for the signed review, component output and full report-ID membership.

## Report IDs

R-41230, R-41241, R-41251, R-41259, R-41262, R-41275, R-41294, R-41305, R-41308, R-41366, R-41372, R-41384, R-41387, R-41396, R-41400, R-41406, R-41415, R-41416, R-41418, R-41428, R-41439, R-41441, R-41449, R-41453, R-41456, R-41460, R-41472, R-41485, R-41493, R-41539, R-41572, R-41582, R-41584
