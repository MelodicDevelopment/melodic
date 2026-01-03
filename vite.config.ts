import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { melodicStylesPlugin } from './vite-plugin-melodic-styles';

export default defineConfig({
	root: resolve(__dirname, 'web/example'),
	publicDir: resolve(__dirname, 'public'),
	plugins: [melodicStylesPlugin()],
	server: {
		port: 5173,
		open: '/',
		fs: {
			allow: [resolve(__dirname)]
		}
	},
	build: {
		rollupOptions: {
			input: {
				'index': resolve(__dirname, 'web/example/index.html')
			}
		}
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src')
		}
	}
});
