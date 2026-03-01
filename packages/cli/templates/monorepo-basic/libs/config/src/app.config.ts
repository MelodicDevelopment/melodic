import { defineConfig } from '@melodicdev/core/config';

export const appConfig = defineConfig({
	base: {
		appName: '__REPO_NAME__',
	},
});

export type AppConfig = typeof appConfig;
