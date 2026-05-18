# /new-check

Scaffold a new check module in `scripts/checks/`.

Steps:
1. Ask for: check name (kebab-case id), human-readable label, brief description
   of what it audits
2. Create `scripts/checks/<name>.js` using this template:

```js
/**
 * checks/<name>.js
 *
 * <description>
 */

/**
 * @param {string} url
 * @returns {Promise<{id: string, label: string, status: 'pass'|'warn'|'fail', findings: string[]}>}
 */
export async function run(url) {
  // TODO: implement <label> check
  return {
    id: '<name>',
    label: '<label>',
    status: 'pass',
    findings: [],
  };
}
```

3. Open `scripts/main.js` and make two edits:
   a. After the last `import { run as run… }` line, add:
      `import { run as run<PascalName> } from './checks/<name>.js';`
      where `<PascalName>` is the camelCase version of the check name
      (e.g. `myCheck` → `runMyCheck`).
   b. After the last entry in the `CHECKS` array, add:
      `{ id: '<name>', label: '<label>', run: run<PascalName> },`
      Match the existing alignment style (pad with spaces so columns line up).
4. Confirm both edits were applied and show the user the updated import block and CHECKS array.
