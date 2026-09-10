import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/**
 * Vite library build for the standalone core framework bundle.
 *
 * Invoked twice by the build:bundle script:
 *   --mode development  →  bundle/melodic-core.js   (readable + sourcemap, dev diagnostics ON)
 *   --mode production   →  bundle/melodic-core.min.js (minified via esbuild)
 *
 * `import.meta.env.DEV` is defined explicitly for the development build.
 * Without it, `vite build` sets DEV to false regardless of `--mode`, so the
 * "development" bundle folded every dev diagnostic away and CDN consumers had
 * no way to get a build that warns.
 *
 * CDN usage:
 *   <script type="module" src="https://unpkg.com/@melodicdev/core/bundle/melodic-core.min.js"></script>
 */
export default defineConfig(({ mode }) => {
	const minified = mode === 'production';

	return {
		publicDir: false,
		define: {
			'import.meta.env.DEV': JSON.stringify(!minified),
			'import.meta.env.PROD': JSON.stringify(minified),
			'import.meta.env.MODE': JSON.stringify(minified ? 'production' : 'development')
		},
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
