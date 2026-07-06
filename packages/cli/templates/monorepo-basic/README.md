# __REPO_NAME__

A Melodic monorepo managed with npm workspaces.

## Layout

```
__REPO_NAME__/
├── apps/            # Applications (Vite build targets)
│   └── __APP_NAME__/
├── libs/            # Shared workspace libraries
│   ├── config/      # @__REPO_NAME__/config — shared app configuration
│   └── shared/      # @__REPO_NAME__/shared — shared utilities
├── tsconfig.json    # Typechecks apps/ and libs/ in one pass
└── package.json     # Workspace root
```

## How libraries are shared

Each folder in `libs/` is an npm workspace package (linked into `node_modules`
by `npm install`). Apps import them by package name — no path aliases needed,
and TypeScript and Vite resolve them the same way:

```ts
import { sharedConfig } from '@__REPO_NAME__/config';
import { sharedVersion } from '@__REPO_NAME__/shared';
```

After adding a new library (`melodic add lib <name>`), run `npm install` once
so the workspace link is created.

## Scripts

- `npm run dev` — dev server for `apps/__APP_NAME__`
- `npm run build` — typecheck the whole workspace, then build `apps/__APP_NAME__`
- `npm run typecheck` — `tsc --noEmit` across apps and libs
- `melodic add app <name>` adds `dev:<name>` / `build:<name>` / `preview:<name>` scripts
