# Monorepo setup

- `tsconfig.build.json` drives `tsc -b` builds for the workspace.
- When adding apps/libs manually, also add them to `tsconfig.build.json` (and `tsconfig.json` if you keep IDE references there).
