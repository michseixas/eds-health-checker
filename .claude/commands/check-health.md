# /check-health

Audit the health checker's own internal consistency — verify that every check file
on disk is wired into `main.js` and every import in `main.js` points to a file
that actually exists.

Steps:

1. Read `scripts/main.js`.
   - Extract every import line that pulls from `./checks/` — collect the module
     paths (e.g. `./checks/performance.js`).
   - Extract every entry in the `CHECKS` array — collect the `id` values.

2. List all `.js` files present in `scripts/checks/` (use Glob).

3. Cross-reference — flag any issues:
   - **Ghost import**: an import in `main.js` whose file does not exist on disk.
   - **Orphaned file**: a `.js` file in `scripts/checks/` that is NOT imported
     in `main.js`.
   - **Missing CHECKS entry**: an import that exists but has no matching `id`
     entry in the `CHECKS` array.

4. For each file that IS properly imported, read it and verify:
   - It exports a `run` function (`export async function run` or
     `export function run`).
   - The stub/implementation returns an object with the shape
     `{ id, label, status, findings }`.
   - Flag any file whose `run` export is missing or whose return shape is wrong.

5. Print a summary:
   ```
   /check-health results
   ─────────────────────
   Checks on disk  : N
   Checks in main  : N
   Contract OK     : N/N

   Issues:
   - [ghost]   scripts/checks/foo.js  (imported but missing on disk)
   - [orphan]  scripts/checks/bar.js  (on disk but not imported)
   - [shape]   scripts/checks/baz.js  (run() return shape invalid)

   All clear! / X issue(s) found — see details above.
   ```

Notes:
- Do NOT modify any file. This command is read-only analysis.
- If there are no issues, say so clearly and congratulate the user.
