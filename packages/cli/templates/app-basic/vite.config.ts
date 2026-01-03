import { defineConfig } from 'vite';
import { melodicStylesPlugin } from './vite-plugin-melodic-styles';
import { melodicStylesAttribute } from './melodic-styles.config';

export default defineConfig({
	plugins: [melodicStylesPlugin({ attribute: melodicStylesAttribute })],
	build: {
		target: 'es2022'
	},
	server: {
		open: true
	}
});
