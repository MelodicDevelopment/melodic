import { defineConfig } from 'vite';
import { melodicStylesPlugin } from '__ROOT_PATH__/vite-plugin-melodic-styles';

export default defineConfig({
	plugins: [melodicStylesPlugin()],
	build: {
		target: 'es2022'
	},
	server: {
		open: true
	}
});
