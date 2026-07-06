import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	generateAttributeDirective,
	generateClass,
	generateComponent,
	generateDirective,
	generateGuard,
	generateInterceptor,
	generateResolver,
	generateService
} from '../src/generate.js';

let root: string;

beforeEach(async () => {
	root = await fs.mkdtemp(path.join(os.tmpdir(), 'melodic-cli-test-'));
});

afterEach(async () => {
	await fs.rm(root, { recursive: true, force: true });
});

const read = (relative: string): Promise<string> => fs.readFile(path.join(root, relative), 'utf8');

const exists = async (relative: string): Promise<boolean> => {
	try {
		await fs.stat(path.join(root, relative));
		return true;
	} catch {
		return false;
	}
};

const tree = async (dir: string): Promise<string[]> => {
	const results: string[] = [];
	const walk = async (current: string): Promise<void> => {
		const entries = await fs.readdir(current, { withFileTypes: true });
		for (const entry of entries) {
			const full = path.join(current, entry.name);
			if (entry.isDirectory()) {
				await walk(full);
			} else {
				results.push(path.relative(root, full));
			}
		}
	};
	await walk(path.join(root, dir));
	return results.sort();
};

describe('generateComponent', () => {
	it('creates a component directory with barrel following the repo convention', async () => {
		await generateComponent(root, 'user-card', 'src/components');
		expect(await tree('src/components')).toEqual([
			'src/components/user-card/index.ts',
			'src/components/user-card/user-card.component.ts',
			'src/components/user-card/user-card.styles.ts',
			'src/components/user-card/user-card.template.ts'
		]);

		const component = await read('src/components/user-card/user-card.component.ts');
		expect(component).toContain("selector: 'user-card'");
		expect(component).toContain('export class UserCardComponent {}');
		expect(component).toContain("import { UserCardTemplate } from './user-card.template'");

		const barrel = await read('src/components/user-card/index.ts');
		expect(barrel).toBe("export { UserCardComponent } from './user-card.component';\n");
	});

	it('auto-prefixes hyphen-less names to a valid custom element selector', async () => {
		await generateComponent(root, 'card', 'src/components');
		const component = await read('src/components/card/card.component.ts');
		expect(component).toContain("selector: 'app-card'");
		expect(component).toContain('export class CardComponent {}');
	});

	it('dedupes the Component suffix', async () => {
		await generateComponent(root, 'UserCardComponent', 'src/components');
		expect(await exists('src/components/user-card/user-card.component.ts')).toBe(true);
		const component = await read('src/components/user-card/user-card.component.ts');
		expect(component).toContain('export class UserCardComponent {}');
		expect(component).not.toContain('UserCardComponentComponent');
	});

	it('rejects traversal names and paths without writing anything', async () => {
		await expect(generateComponent(root, '../../evil', 'src/components')).rejects.toThrow(/path separators/);
		await expect(generateComponent(root, 'ok-name', '../outside')).rejects.toThrow(/\.\./);
		await expect(generateComponent(root, 'ok-name', '/abs')).rejects.toThrow(/relative path/);
		expect(await exists('src')).toBe(false);
	});

	it('is atomic: a collision on one file prevents all writes', async () => {
		await fs.mkdir(path.join(root, 'src/components/user-card'), { recursive: true });
		await fs.writeFile(path.join(root, 'src/components/user-card/index.ts'), 'existing');
		await expect(generateComponent(root, 'user-card', 'src/components')).rejects.toThrow(/already exist/);
		expect(await exists('src/components/user-card/user-card.component.ts')).toBe(false);
		expect(await read('src/components/user-card/index.ts')).toBe('existing');
	});

	it('supports dry-run (no writes) and force (overwrite)', async () => {
		await generateComponent(root, 'user-card', 'src/components', { dryRun: true });
		expect(await exists('src/components')).toBe(false);

		await generateComponent(root, 'user-card', 'src/components');
		await expect(generateComponent(root, 'user-card', 'src/components')).rejects.toThrow(/--force/);
		await generateComponent(root, 'user-card', 'src/components', { force: true });
	});
});

describe('generateService', () => {
	it('creates an injectable service and dedupes the suffix', async () => {
		await generateService(root, 'auth-service', 'src/services');
		const service = await read('src/services/auth.service.ts');
		expect(service).toContain("import { Injectable } from '@melodicdev/core/injection';");
		expect(service).toContain('export class AuthService {');
		expect(service).not.toContain('AuthServiceService');
	});

	it('rejects quote-breakout names', async () => {
		await expect(generateService(root, "o'brien", 'src/services')).rejects.toThrow(/invalid/);
		expect(await exists('src/services')).toBe(false);
	});
});

describe('generateInterceptor', () => {
	it('emits interceptors matching the v2 http API', async () => {
		await generateInterceptor(root, 'auth', 'src/http/interceptors');
		const interceptor = await read('src/http/interceptors/auth.interceptor.ts');
		// Response error handler must take (error, context) and return
		// Promise<IHttpResponse<T> | void> — the v1 shape fails typecheck.
		expect(interceptor).toContain('IHttpResponseErrorContext');
		expect(interceptor).toContain('error: async <T>(error: Error, context: IHttpResponseErrorContext<T>): Promise<IHttpResponse<T> | void>');
		expect(interceptor).toContain('export const authRequestInterceptor: IHttpRequestInterceptor');
		expect(interceptor).toContain('export const authResponseInterceptor: IHttpResponseInterceptor');
	});
});

describe('generateDirective', () => {
	it('returns state from the render function (never undefined)', async () => {
		await generateDirective(root, 'auto-focus', 'src/directives');
		const directive = await read('src/directives/auto-focus.directive.ts');
		expect(directive).toContain('export const autoFocus = ');
		expect(directive).toContain('previousState?: AutoFocusState');
		expect(directive).toContain('return state;');
		expect(directive).not.toContain('return undefined');
	});
});

describe('generateAttributeDirective', () => {
	it('uses camelCase identifiers and registration name', async () => {
		await generateAttributeDirective(root, 'auto-focus', 'src/directives');
		const directive = await read('src/directives/auto-focus.attribute-directive.ts');
		expect(directive).toContain('export const autoFocusAttributeDirective');
		expect(directive).toContain("registerAttributeDirective('autoFocus', autoFocusAttributeDirective);");
		expect(directive).not.toMatch(/[a-z]_[a-z]/); // no snake_case identifiers
	});
});

describe('generateGuard', () => {
	it('creates a guard via createGuard', async () => {
		await generateGuard(root, 'auth', 'src/guards');
		const guard = await read('src/guards/auth.guard.ts');
		expect(guard).toContain("import { createGuard } from '@melodicdev/core/routing';");
		expect(guard).toContain('export const authGuard = createGuard(async (context) => {');
		expect(guard).toContain('return true;');
	});
});

describe('generateResolver', () => {
	it('creates a resolver via createResolver', async () => {
		await generateResolver(root, 'user', 'src/resolvers');
		const resolver = await read('src/resolvers/user.resolver.ts');
		expect(resolver).toContain("import { createResolver } from '@melodicdev/core/routing';");
		expect(resolver).toContain('export const userResolver = createResolver<UserData>(async (context) => {');
	});
});

describe('generateClass', () => {
	it('creates a plain class', async () => {
		await generateClass(root, 'user', 'src/models');
		const contents = await read('src/models/user.class.ts');
		expect(contents).toContain('export class User {');
	});
});
