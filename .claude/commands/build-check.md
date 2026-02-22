# Build Check

Run a TypeScript type-check across the entire monorepo and report any errors.

## Instructions

1. Run `npx tsc --noEmit` and capture output
2. If there are **no errors**, report success with a one-liner
3. If there are **errors**, group them by file and summarize what needs to be fixed — don't just dump the raw output
4. Do not attempt to fix errors automatically unless the user asks
