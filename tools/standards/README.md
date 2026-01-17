# Coding Standards Tooling

This folder contains reusable linting and formatting configs based on the Melodic coding standards.

## Use In This Repo

- ESLint uses `tools/standards/eslint.config.mjs` via the root `eslint.config.mjs`.
- Prettier uses the root `.prettierrc`.

## Reuse In Another Repo

1) Copy these files to the new repo root:
- `tools/standards/eslint.config.mjs` for baseline rules, or `tools/standards/eslint.config.strict.mjs` for strict typing enforcement
- `.prettierrc`

2) Add dev dependencies:
```sh
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier
```

3) Add scripts:
```json
{
	"scripts": {
		"lint": "eslint .",
		"lint:fix": "eslint . --fix"
	}
}
```

4) Rename the copied ESLint config to `eslint.config.mjs` if you place it at the root.
