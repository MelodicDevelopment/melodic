import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
	root: resolve(__dirname, 'web/docs'),
	resolve: {
		alias: {
			'@melodicdev/core': resolve(__dirname, '../../src'),
			'@melodicdev/components/theme': resolve(__dirname, 'src/theme/index.ts'),
			'@melodicdev/components/button': resolve(__dirname, 'src/components/forms/button/index.ts'),
			'@melodicdev/components/spinner': resolve(__dirname, 'src/components/feedback/spinner/index.ts'),
			'@melodicdev/components/input': resolve(__dirname, 'src/components/forms/input/index.ts'),
			'@melodicdev/components/textarea': resolve(__dirname, 'src/components/forms/textarea/index.ts'),
			'@melodicdev/components/checkbox': resolve(__dirname, 'src/components/forms/checkbox/index.ts'),
			'@melodicdev/components/radio': resolve(__dirname, 'src/components/forms/radio/index.ts'),
			'@melodicdev/components/toggle': resolve(__dirname, 'src/components/forms/toggle/index.ts'),
			'@melodicdev/components/card': resolve(__dirname, 'src/components/foundation/card/index.ts'),
			'@melodicdev/components/stack': resolve(__dirname, 'src/components/foundation/stack/index.ts'),
			'@melodicdev/components/divider': resolve(__dirname, 'src/components/foundation/divider/index.ts'),
			'@melodicdev/components/alert': resolve(__dirname, 'src/components/feedback/alert/index.ts'),
			'@melodicdev/components/badge': resolve(__dirname, 'src/components/data-display/badge/index.ts'),
			'@melodicdev/components/avatar': resolve(__dirname, 'src/components/data-display/avatar/index.ts'),
			'@melodicdev/components/tooltip': resolve(__dirname, 'src/components/overlays/tooltip/index.ts'),
			'@melodicdev/components': resolve(__dirname, 'src/index.ts')
		}
	},
	server: {
		port: 5176,
		open: true
	},
	build: {
		outDir: resolve(__dirname, 'dist/docs')
	}
});
