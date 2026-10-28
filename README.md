# kb — the support knowledge base

**kb** = knowledge base. What the support desk knows about how our products break, written
down where the code can keep it honest.

One desk takes reports for every product we run: `sched-prod` (calendar invites for about
300k people) and the rest. When something
goes wrong, the reports reach the desk first. This kb is how the desk triages them, what each
incident turned out to be, and why we decided what we decided.

## What's here

```
src/routes/kb/      the pages (.svx: Markdown with components)
  triage/           how the desk handles incoming reports
  incidents/        one page per big ticket
  decisions/        numbered decision records
src/lib/kb/         components and the logic they run
src/lib/layouts/    the frame every page shares
src/lib/data/       exports from the ticket system
```

## Conventions

- Words in the page, logic in `src/lib` (imported as `#lib/…`). A number that can be computed belongs in a component.
- Every page starts with frontmatter: `title`, `owner`, `status`, `reviewed`.
- A decision is never edited after it is accepted. A new record replaces it.
- A page you add is signed: its frontmatter carries your `signature` and it ends with `<RenderStamp {signature} />`, so the desk knows who wrote it.

## Owners

Support desk. Decision records: whoever signed them.

---

Exported 2026-10-04 from the `support` repo, `apps/kb/` → `src/`.

## S01E03 review

The signed review is at `src/routes/kb/incidents/4471-review/+page.svx`.
It separates the shared parser and booking-v3 hint causes, preserves ambiguous reports,
and distinguishes receipt time from merge time. Decision 0002 supersedes the subject-only
merge rule; accepted decision 0001 remains unchanged.

Requires Node 22.18+ (or Node 24) and npm. To render the actual exported components:

```sh
npm install
npm run analyze
npm run build
npm run preview
```

Open `/kb/incidents/4471-review/` in the preview. The static build is in `build/`.
The build also writes portable, self-contained HTML snapshots into `rendered/`, including
the signed review, original incident, triage examples and replacement decision. These
snapshots preserve the actual prerendered tables, chart and desk stamp; form controls in
the portable snapshots are static. Use the preview for the interactive explorer.

`evidence/analysis.json` lists every report ID by cause. `deliverables/` holds the issue
bodies and, after publication, their URLs. Run `node scripts/prepare-issues.mjs` to regenerate
the bodies from the data. All counts describe the export, not the live desk.

To publish into a new public repository in your own signed-in GitHub account:

```sh
bash scripts/publish.sh YOUR-LOGIN/mega-s01e03 --create
```

For an existing public repo, omit `--create`. The script builds before changing GitHub,
files or updates the two issues, inserts their links into the review, rebuilds, and pushes
the sources, evidence and rendered HTML. It never force-pushes or changes repo visibility.
