import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
	root: resolve(__dirname, 'web/company'),
	publicDir: resolve(__dirname, 'web/company/public'),
	server: {
		port: 5174,
		open: '/home'
	},
	build: {
		outDir: resolve(__dirname, 'dist/company'),
		emptyOutDir: true
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src')
		}
	}
});
