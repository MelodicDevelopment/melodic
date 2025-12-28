import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
	root: resolve(__dirname, 'web'),
	publicDir: resolve(__dirname, 'public'),
	server: {
		port: 5174,
		open: '/home'
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src')
		}
	}
});
