import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { melodicStylesPlugin } from './vite-plugin-melodic-styles';

export default defineConfig({
	root: resolve(__dirname, 'example'),
	publicDir: resolve(__dirname, 'public'),
	plugins: [melodicStylesPlugin()],
	server: {
		port: 5173,
		open: '/home'
	},
	build: {
		rollupOptions: {
			input: {
				index: resolve(__dirname, 'example/index.html'),
				'framework-comparison': resolve(__dirname, 'example/framework-comparison.html')
			}
		}
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src')
		}
	}
});
