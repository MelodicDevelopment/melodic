import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	resolve: {
		alias: {
			'@melodicdev/core': resolve(__dirname, 'src/index.ts')
		}
	},
	test: {
		environment: 'happy-dom',
		include: ['tests/unit/**/*.test.ts'],
		exclude: ['node_modules', 'dist', 'lib', 'example', 'benchmark']
	}
});
