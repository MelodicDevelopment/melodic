# Melodic CLI

A lightweight scaffolding tool for Melodic apps and monorepos.

## Install (local dev)

Build the CLI in this workspace:

```
npm --workspace @melodic/cli run build
```

Run it directly:

```
node packages/cli/dist/index.js --help
```

## Commands

### `melodic init <directory> [--monorepo] [--app-name <name>]`
Create a new Melodic project.

- Single app:
  - `melodic init my-app`
- Monorepo with `apps/` and `packages/`:
  - `melodic init my-repo --monorepo --app-name web`

### `melodic add app <name> [--dir apps]`
Add a new app folder inside a monorepo.

```
melodic add app admin
```

### `melodic add lib <name> [--dir packages]`
Add a new shared library folder inside a monorepo.

```
melodic add lib shared
```

### `melodic add testing [--path .]`
Add a basic Vitest + happy-dom testing setup to the target path.

```
melodic add testing --path apps/web
```

### `melodic generate component <name> [--path src/components]`
Create a component with `.component.ts`, `.template.ts`, and `.styles.ts`.

```
melodic generate component user-card --path apps/web/src/components
```

### `melodic generate directive <name> [--path src/directives]`
Create a template directive.

### `melodic generate attribute-directive <name> [--path src/directives]`
Create and register an attribute directive.

### `melodic generate service <name> [--path src/services]`
Create an injectable service.

### `melodic generate interceptor <name> [--path src/http/interceptors]`
Create HTTP request/response interceptors.

## Templates

- `app-basic`: single app scaffold
- `monorepo-basic`: repo with `apps/` + `packages/` and a default app
- `lib-basic`: minimal shared library scaffold

## Notes

- The CLI writes files only if the target directory is empty.
- Placeholders are replaced automatically: `__APP_NAME__`, `__REPO_NAME__`, `__LIB_NAME__`.
