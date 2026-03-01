import { defineConfig } from '../../../src/config';

export const appConfig = defineConfig({
	base: {
		appName: 'Melodic Example',
		apiBaseURL: '/data',
	},
	prod: {
		apiBaseURL: '/api',
	},
});

export type AppConfig = typeof appConfig;
