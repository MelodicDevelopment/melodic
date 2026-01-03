import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
	root: resolve(__dirname, 'web/benchmark'),
	publicDir: resolve(__dirname, 'public'),
	server: {
		port: 5174,
		open: '/',
		fs: {
			allow: [resolve(__dirname)]
		}
	},
	build: {
		rollupOptions: {
			input: {
				index: resolve(__dirname, 'web/benchmark/index.html'),
				'framework-comparison': resolve(__dirname, 'web/benchmark/framework-comparison.html')
			}
		}
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
			'@melodic-src': resolve(__dirname, 'src/index.ts'),
			'@melodic-lib': resolve(__dirname, 'lib/index.js')
		}
	}
});
