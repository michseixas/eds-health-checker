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

3. Remind the user to import and wire up the new check in `scripts/main.js`
4. Do NOT modify any other file — only create the new check module
