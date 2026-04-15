import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	resolve: {
		alias: [
			{ find: /^@melodicdev\/core\/forms$/, replacement: resolve(__dirname, 'src/forms/index.ts') },
			{ find: /^@melodicdev\/core\/template$/, replacement: resolve(__dirname, 'src/template/index.ts') },
			{ find: /^@melodicdev\/core\/signals$/, replacement: resolve(__dirname, 'src/signals/index.ts') },
			{ find: /^@melodicdev\/core\/components$/, replacement: resolve(__dirname, 'src/components/index.ts') },
			{ find: /^@melodicdev\/core\/http$/, replacement: resolve(__dirname, 'src/http/index.ts') },
			{ find: /^@melodicdev\/core\/state$/, replacement: resolve(__dirname, 'src/state/index.ts') },
			{ find: /^@melodicdev\/core\/routing$/, replacement: resolve(__dirname, 'src/routing/index.ts') },
			{ find: /^@melodicdev\/core\/injection$/, replacement: resolve(__dirname, 'src/injection/index.ts') },
			{ find: /^@melodicdev\/core\/bootstrap$/, replacement: resolve(__dirname, 'src/bootstrap/index.ts') },
			{ find: /^@melodicdev\/core\/config$/, replacement: resolve(__dirname, 'src/config/index.ts') },
			{ find: /^@melodicdev\/core$/, replacement: resolve(__dirname, 'src/index.ts') }
		]
	},
	test: {
		environment: 'happy-dom',
		include: ['tests/unit/**/*.test.ts'],
		exclude: ['node_modules', 'dist', 'lib', 'example', 'benchmark']
	}
});
