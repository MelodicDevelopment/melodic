# Coding Practices

## Principles
- Keep changes small and focused; avoid unrelated refactors.
- Prefer clarity over cleverness; optimize only after measuring.
- Match existing patterns before introducing new ones.

Example:
```ts
// Good: single-purpose helper with clear name.
export function normalizeId(value: string): string {
	return value.trim().toLowerCase();
}
```

## Style & Formatting
- Use tabs in TypeScript sources.
- Use `import type` for type-only imports.
- Follow existing naming and file layout conventions.
- Components live in their own folder with separate template and styles files imported by the component.

Example:
```
components/example/
  example.component.ts
  example.template.ts
  example.styles.ts
```

```ts
import { exampleTemplate } from './example.template';
import { exampleStyles } from './example.styles';
```

## Error Handling
- Surface actionable errors with context.
- Prefer early returns and guards.
- Avoid swallowing exceptions; log and rethrow if needed.

Example:
```ts
if (!config.endpoint) {
	throw new Error('Missing config.endpoint for API client');
}
```

## Testing Expectations
- Add a focused demo in `web/example/` when behavior needs manual coverage.
- Run relevant dev flows (`npm run dev`, `npm run benchmark`) when changing runtime behavior.

Example:
```
web/example/components/new-feature-demo/
```

## Performance & DX
- Avoid unnecessary DOM churn; update only what changed.
- Cache computed values when inputs are stable.
- Keep public APIs minimal and predictable.

Example:
```ts
const cached = cache.get(key);
if (cached) return cached;
```

## Review Checklist
- Behavior matches requirements and edge cases are handled.
- No unnecessary API changes; exports updated when required.
- New demos or docs added if needed.
- Errors are clear and actionable.
