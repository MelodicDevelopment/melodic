import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		include: ['tests/unit/**/*.test.ts'],
		exclude: ['node_modules', 'dist', 'lib', 'example', 'benchmark']
	}
});
