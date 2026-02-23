import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * Vite library build for the standalone core framework bundle.
 *
 * Invoked twice by the build:bundle script:
 *   --mode development  →  dist/melodic-core.js   (readable + sourcemap)
 *   --mode production   →  dist/melodic-core.min.js (minified via esbuild)
 *
 * CDN usage:
 *   <script type="module" src="https://unpkg.com/@melodicdev/core@1.3.0/dist/melodic-core.min.js"></script>
 */
export default defineConfig(({ mode }) => {
	const minified = mode === 'production';

	return {
		build: {
			lib: {
				entry: resolve(__dirname, 'src/index.ts'),
				name: 'MelodicCore',
				formats: ['es'],
				fileName: () => (minified ? 'melodic-core.min.js' : 'melodic-core.js')
			},
			outDir: resolve(__dirname, 'bundle'),
			emptyOutDir: false,
			minify: minified ? 'esbuild' : false,
			sourcemap: !minified
		}
	};
});
