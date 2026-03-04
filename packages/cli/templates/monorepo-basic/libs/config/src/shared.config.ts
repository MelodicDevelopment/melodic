import { defineConfig } from '@melodicdev/core/config';

export const sharedConfig = defineConfig({
	base: {
		appName: '__REPO_NAME__',
	},
});

export type SharedConfig = typeof sharedConfig;
