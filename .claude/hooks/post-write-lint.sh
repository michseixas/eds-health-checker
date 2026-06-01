#!/bin/bash
# PostToolUse hook: runs Biome on any .js file Claude writes or edits.
# Claude sees the output and self-corrects lint/format errors automatically.
FILE=$(python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null)

# Silently skip non-JS files
[[ "$FILE" == *.js ]] || exit 0

echo "--- Biome lint: $FILE ---"
npx biome check "$FILE" 2>&1
EXIT=$?
echo "--- End Biome (exit $EXIT) ---"
exit $EXIT
