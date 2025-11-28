import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'Melodic',
			fileName: 'melodic',
			formats: ['es', 'umd']
		},
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
				passes: 2,
				pure_funcs: ['console.log'],
				pure_getters: true,
				unsafe: true,
				unsafe_comps: true,
				unsafe_math: true,
				unsafe_methods: true
			},
			mangle: {
				properties: {
					regex: /^#/  // Mangle private properties
				}
			},
			format: {
				comments: false
			}
		},
		rollupOptions: {
			treeshake: {
				moduleSideEffects: false,
				propertyReadSideEffects: false,
				unknownGlobalSideEffects: false
			}
		}
	}
});
