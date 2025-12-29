import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
	root: resolve(__dirname, 'web/framework'),
	publicDir: resolve(__dirname, 'web/framework/public'),
	server: {
		port: 5175,
		open: '/home'
	},
	build: {
		outDir: resolve(__dirname, 'dist/framework'),
		emptyOutDir: true
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src')
		}
	}
});
