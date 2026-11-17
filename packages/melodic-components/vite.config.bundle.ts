import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { minifyCssLiteralsPlugin, minifyEsLibPlugin } from '../../scripts/lib/vite-build-plugins.mjs';

/**
 * Vite library build for the CDN/script-tag bundle.
 *
 * Invoked twice by the build script:
 *   --mode development  →  melodic-components.js   (readable, unminified)
 *   --mode production   →  melodic-components.min.js (fully minified)
 *
 * Minification is done by two build plugins rather than `build.minify`, which
 * keeps whitespace for ES-format lib builds:
 *   - minifyCssLiteralsPlugin strips comments/whitespace inside css`...` literals
 *     (a JS minifier treats them as opaque strings, so the token documentation
 *     block of every *.styles.ts used to ship to the browser);
 *   - minifyEsLibPlugin minifies the final chunk in full.
 */
export default defineConfig(({ mode }) => {
	const minified = mode === 'production';

	return {
		publicDir: false,
		plugins: minified ? [minifyCssLiteralsPlugin(), minifyEsLibPlugin()] : [],
		resolve: {
			alias: {
				'@melodicdev/core/forms': resolve(__dirname, '../../src/forms/index.ts'),
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
			minify: false,
			sourcemap: !minified,
			rollupOptions: {
				// No externals — bundle includes @melodicdev/core for standalone CDN use
			}
		}
	};
});
