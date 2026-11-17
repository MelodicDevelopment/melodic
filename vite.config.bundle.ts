import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { minifyCssLiteralsPlugin, minifyEsLibPlugin } from './scripts/lib/vite-build-plugins.mjs';

/**
 * Vite library build for the standalone core framework bundle.
 *
 * Invoked twice by the build:bundle script:
 *   --mode development  →  bundle/melodic-core.js   (readable + sourcemap, dev diagnostics ON)
 *   --mode production   →  bundle/melodic-core.min.js (fully minified)
 *
 * `import.meta.env.DEV` is defined explicitly for the development build.
 * Without it, `vite build` sets DEV to false regardless of `--mode`, so the
 * "development" bundle folded every dev diagnostic away and CDN consumers had
 * no way to get a build that warns.
 *
 * Minification is done by `minifyEsLibPlugin`, not `build.minify`: for an ES-format
 * lib build Vite keeps all whitespace (to preserve pure annotations for a
 * downstream bundler), which left the "min" file gzipping larger than the
 * readable one. A CDN bundle is never tree-shaken again, so it is minified in full.
 *
 * CDN usage:
 *   <script type="module" src="https://unpkg.com/@melodicdev/core/bundle/melodic-core.min.js"></script>
 */
export default defineConfig(({ mode }) => {
	const minified = mode === 'production';

	return {
		publicDir: false,
		plugins: minified ? [minifyCssLiteralsPlugin(), minifyEsLibPlugin()] : [],
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
			// See minifyEsLibPlugin above — it replaces Vite's own minify step.
			minify: false,
			sourcemap: !minified
		}
	};
});
