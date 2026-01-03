import { defineConfig } from 'vite';
import { melodicStylesPlugin } from './vite-plugin-melodic-styles';

export default defineConfig({
	plugins: [melodicStylesPlugin()],
	server: {
		open: true
	}
});
