import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
	plugins: [
		viteStaticCopy({
			targets: [
				{
					src: resolve(__dirname, 'packages/melodic-components/src/assets/*'),
					dest: 'public'
				}
			]
		})
	],
	root: resolve(__dirname, 'web/demo'),
	publicDir: resolve(__dirname, 'public'),
	resolve: {
		alias: {
			'@melodicdev/core': resolve(__dirname, 'src'),
			'@melodicdev/components/theme': resolve(__dirname, 'packages/melodic-components/src/theme/index.ts'),
			'@melodicdev/components/button': resolve(__dirname, 'packages/melodic-components/src/components/forms/button/index.ts'),
			'@melodicdev/components/spinner': resolve(__dirname, 'packages/melodic-components/src/components/feedback/spinner/index.ts'),
			'@melodicdev/components/input': resolve(__dirname, 'packages/melodic-components/src/components/forms/input/index.ts'),
			'@melodicdev/components/select': resolve(__dirname, 'packages/melodic-components/src/components/forms/select/index.ts'),
			'@melodicdev/components/textarea': resolve(__dirname, 'packages/melodic-components/src/components/forms/textarea/index.ts'),
			'@melodicdev/components/checkbox': resolve(__dirname, 'packages/melodic-components/src/components/forms/checkbox/index.ts'),
			'@melodicdev/components/radio': resolve(__dirname, 'packages/melodic-components/src/components/forms/radio/index.ts'),
			'@melodicdev/components/toggle': resolve(__dirname, 'packages/melodic-components/src/components/forms/toggle/index.ts'),
			'@melodicdev/components/form-field': resolve(__dirname, 'packages/melodic-components/src/components/forms/form-field/index.ts'),
			'@melodicdev/components/card': resolve(__dirname, 'packages/melodic-components/src/components/foundation/card/index.ts'),
			'@melodicdev/components/stack': resolve(__dirname, 'packages/melodic-components/src/components/foundation/stack/index.ts'),
			'@melodicdev/components/divider': resolve(__dirname, 'packages/melodic-components/src/components/foundation/divider/index.ts'),
			'@melodicdev/components/alert': resolve(__dirname, 'packages/melodic-components/src/components/feedback/alert/index.ts'),
			'@melodicdev/components/badge': resolve(__dirname, 'packages/melodic-components/src/components/data-display/badge/index.ts'),
			'@melodicdev/components/avatar': resolve(__dirname, 'packages/melodic-components/src/components/data-display/avatar/index.ts'),
			'@melodicdev/components/tooltip': resolve(__dirname, 'packages/melodic-components/src/components/overlays/tooltip/index.ts'),
			'@melodicdev/components/icon': resolve(__dirname, 'packages/melodic-components/src/components/general/icon/index.ts'),
			'@melodicdev/components/icons': resolve(__dirname, 'packages/melodic-components/src/icons/index.ts'),
			'@melodicdev/components/tabs': resolve(__dirname, 'packages/melodic-components/src/components/navigation/tabs/index.ts'),
			'@melodicdev/components/dialog': resolve(__dirname, 'packages/melodic-components/src/components/overlays/dialog/index.ts'),
			'@melodicdev/components/popover': resolve(__dirname, 'packages/melodic-components/src/components/overlays/popover/index.ts'),
			'@melodicdev/components/dropdown': resolve(__dirname, 'packages/melodic-components/src/components/overlays/dropdown/index.ts'),
			'@melodicdev/components/directives': resolve(__dirname, 'packages/melodic-components/src/directives/index.ts'),
			'@melodicdev/components': resolve(__dirname, 'packages/melodic-components/src/index.ts')
		}
	},
	server: {
		port: 5175,
		open: true,
		fs: {
			allow: [resolve(__dirname)]
		}
	},
	build: {
		outDir: resolve(__dirname, 'dist/demo'),
		rollupOptions: {
			input: {
				index: resolve(__dirname, 'web/demo/index.html')
			}
		}
	}
});
