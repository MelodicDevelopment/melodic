import { defineConfig } from '@melodicdev/core/config';
import { sharedConfig } from '@config';

export const appConfig = defineConfig({
	extends: sharedConfig,
	base: {
		appName: '__APP_NAME__',
	},
});

export type AppConfig = typeof appConfig;
