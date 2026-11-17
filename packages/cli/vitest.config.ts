import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['tests/**/*.test.ts'],
		// Coverage is opt-in: `npm run test:coverage`. Needs the
		// `@vitest/coverage-v8` devDependency (same version as vitest).
		// No thresholds yet — set them from the first measured baseline so
		// the gate ratchets up from reality instead of failing on day one.
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			exclude: ['src/index.ts'],
			reporter: ['text-summary', 'html', 'lcov'],
			reportsDirectory: 'coverage'
		}
	}
});
