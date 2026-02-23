import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * Vite library build for the CDN/script-tag bundle.
 *
 * Invoked twice by the build script:
 *   --mode development  →  melodic-components.js   (readable, unminified)
 *   --mode production   →  melodic-components.min.js (minified via esbuild)
 */
export default defineConfig(({ mode }) => {
	const minified = mode === 'production';

	return {
		resolve: {
			alias: {
				'@melodicdev/core': resolve(__dirname, '../../src')
			}
		},
		build: {
			lib: {
				entry: resolve(__dirname, 'src/bundle.ts'),
				name: 'MelodicComponents',
				formats: ['es'],
				fileName: () => (minified ? 'melodic-components.min.js' : 'melodic-components.js')
			},
			outDir: resolve(__dirname, 'assets'),
			emptyOutDir: false,
			minify: minified ? 'esbuild' : false,
			sourcemap: !minified,
			rollupOptions: {
				// No externals — bundle includes @melodicdev/core for standalone CDN use
			}
		}
	};
});
