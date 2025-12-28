import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
	root: resolve(__dirname, 'example'),
	publicDir: resolve(__dirname, 'public'),
	server: {
		port: 5173,
		open: '/home'
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src')
		}
	}
});
