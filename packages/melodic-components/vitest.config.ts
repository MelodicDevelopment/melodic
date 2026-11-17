import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	resolve: {
		alias: {
			'@melodicdev/core': resolve(__dirname, '../../src')
		}
	},
	test: {
		environment: 'happy-dom',
		include: ['tests/**/*.test.ts'],
		exclude: ['node_modules', 'dist', 'lib'],
		// Coverage is opt-in: `npm run test:coverage`. Needs the
		// `@vitest/coverage-v8` devDependency (same version as vitest).
		// No thresholds yet — set them from the first measured baseline so
		// the gate ratchets up from reality instead of failing on day one.
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
			exclude: ['src/bundle.ts', 'src/**/index.ts', 'src/**/*.types.ts', 'src/**/*.styles.ts'],
			reporter: ['text-summary', 'html', 'lcov'],
			reportsDirectory: 'coverage'
		}
	}
});
