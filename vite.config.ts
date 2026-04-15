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
			{ find: /^@melodicdev\/core$/, replacement: resolve(__dirname, 'src/index.ts') },
			{ find: '@', replacement: resolve(__dirname, 'src') }
		]
	}
});
