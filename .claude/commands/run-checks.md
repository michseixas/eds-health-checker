# /run-checks

Run a quick sanity check across all four check modules to verify they conform
to the CheckResult contract.

Steps:
1. Read each file in `scripts/checks/` and confirm it exports a `run` function
2. Verify the stub return value has the correct shape:
   `{ id: string, label: string, status: 'pass'|'warn'|'fail', findings: string[] }`
3. Report any module that is missing the export or has an incorrect shape
4. Summarise: N/4 checks conform to contract
