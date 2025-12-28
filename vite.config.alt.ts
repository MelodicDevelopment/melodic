import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	root: resolve(__dirname, 'web/alt'),
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
