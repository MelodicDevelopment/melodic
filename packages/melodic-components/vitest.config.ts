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
		exclude: ['node_modules', 'dist', 'lib']
	}
});
