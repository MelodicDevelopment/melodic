import { describe, it, expect, vi } from 'vitest';

// Mock environment before importing defineConfig
vi.mock('../../src/config/environment', () => ({
	environment: 'dev',
	getEnvironment: () => 'dev'
}));

import { defineConfig } from '../../src/config/define-config';

describe('defineConfig', () => {
	it('should return base config when no environment overrides match', () => {
		const config = defineConfig({
			base: { appName: 'Test', apiBaseURL: '/api' }
		});

		expect(config).toEqual({ appName: 'Test', apiBaseURL: '/api' });
	});

	it('should merge environment overrides into base', () => {
		const config = defineConfig({
			base: { appName: 'Test', apiBaseURL: '/api' },
			dev: { apiBaseURL: '/dev-api' }
		});

		expect(config).toEqual({ appName: 'Test', apiBaseURL: '/dev-api' });
	});

	it('should extend a parent config with app-level base', () => {
		const shared = defineConfig({
			base: { appName: 'Default', apiBaseURL: '/api', debug: false }
		});

		const appConfig = defineConfig({
			extends: shared,
			base: { appName: 'Dashboard', dashboardRefreshMs: 30000 }
		});

		expect(appConfig).toEqual({
			appName: 'Dashboard',
			apiBaseURL: '/api',
			debug: false,
			dashboardRefreshMs: 30000
		});
	});

	it('should deep merge nested objects from extended config', () => {
		const shared = defineConfig({
			base: {
				appName: 'Default',
				features: { analytics: true, logging: true }
			}
		});

		const appConfig = defineConfig({
			extends: shared,
			base: {
				appName: 'App',
				features: { analytics: false }
			}
		});

		expect(appConfig).toEqual({
			appName: 'App',
			features: { analytics: false, logging: true }
		});
	});

	it('should apply environment overrides on top of extended config', () => {
		const shared = defineConfig({
			base: { appName: 'Default', apiBaseURL: '/api' }
		});

		const appConfig = defineConfig({
			extends: shared,
			base: { appName: 'Dashboard', dashboardRefreshMs: 30000 },
			dev: { dashboardRefreshMs: 5000 }
		});

		expect(appConfig).toEqual({
			appName: 'Dashboard',
			apiBaseURL: '/api',
			dashboardRefreshMs: 5000
		});
	});

	it('should allow arrays in app config to replace parent arrays', () => {
		const shared = defineConfig({
			base: { routes: ['/home', '/about'] }
		});

		const appConfig = defineConfig({
			extends: shared,
			base: { routes: ['/dashboard'] }
		});

		expect(appConfig).toEqual({ routes: ['/dashboard'] });
	});

	it('should deep-merge environment overrides into nested base objects', () => {
		const config = defineConfig({
			base: {
				appName: 'Test',
				api: { url: '/api', timeout: 5000, retries: 2 }
			},
			dev: {
				api: { url: '/dev-api' }
			}
		});

		// Before the fix env overrides shallow-merged and `timeout`/`retries`
		// were silently lost.
		expect(config).toEqual({
			appName: 'Test',
			api: { url: '/dev-api', timeout: 5000, retries: 2 }
		});
	});

	it('should let arrays in environment overrides replace base arrays', () => {
		const config = defineConfig({
			base: { features: ['a', 'b'] },
			dev: { features: ['c'] }
		});

		expect(config).toEqual({ features: ['c'] });
	});

	it('should not merge __proto__/constructor/prototype keys (prototype pollution guard)', () => {
		const malicious = JSON.parse('{"__proto__": {"polluted": true}, "constructor": {"bad": 1}, "safe": "ok"}');

		const config = defineConfig({
			base: { appName: 'Test', nested: { keep: true } },
			dev: malicious
		});

		expect(({} as Record<string, unknown>).polluted).toBeUndefined();
		expect(Object.prototype).not.toHaveProperty('polluted');
		expect((config as Record<string, unknown>).safe).toBe('ok');
		expect(Object.getOwnPropertyDescriptor(config, '__proto__')).toBeUndefined();

		// Same guard on the extends path.
		const extended = defineConfig({
			extends: config,
			base: JSON.parse('{"__proto__": {"polluted2": true}}')
		});
		expect(({} as Record<string, unknown>).polluted2).toBeUndefined();
		expect((extended as Record<string, unknown>).appName).toBe('Test');
	});

	it('should handle multiple levels of extension', () => {
		const org = defineConfig({
			base: { orgName: 'Acme', apiBaseURL: '/api', theme: { primary: 'blue' } }
		});

		const shared = defineConfig({
			extends: org,
			base: { appName: 'Shared', theme: { secondary: 'gray' } }
		});

		const app = defineConfig({
			extends: shared,
			base: { appName: 'Dashboard', theme: { primary: 'purple' } }
		});

		expect(app).toEqual({
			orgName: 'Acme',
			apiBaseURL: '/api',
			appName: 'Dashboard',
			theme: { primary: 'purple', secondary: 'gray' }
		});
	});
});
