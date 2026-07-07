import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addApp, addLib, initApp, initMonorepo } from '../src/scaffold.js';

let root: string;

beforeEach(async () => {
	root = await fs.mkdtemp(path.join(os.tmpdir(), 'melodic-cli-scaffold-'));
});

afterEach(async () => {
	await fs.rm(root, { recursive: true, force: true });
});

const readJson = async <T>(relative: string): Promise<T> => {
	return JSON.parse(await fs.readFile(path.join(root, relative), 'utf8')) as T;
};

const read = (relative: string): Promise<string> => fs.readFile(path.join(root, relative), 'utf8');

const exists = async (relative: string): Promise<boolean> => {
	try {
		await fs.stat(path.join(root, relative));
		return true;
	} catch {
		return false;
	}
};

describe('initApp', () => {
	it('scaffolds a single app with pinned dependencies', async () => {
		const target = path.join(root, 'my-app');
		await initApp(target);
		const pkg = JSON.parse(await fs.readFile(path.join(target, 'package.json'), 'utf8'));
		expect(pkg.name).toBe('my-app');
		expect(pkg.dependencies['@melodicdev/core']).toBe('^3.0.0');
		expect(pkg.dependencies['@melodicdev/core']).not.toBe('latest');
		expect(pkg.devDependencies['@types/node']).toBeDefined();
		expect(pkg.devDependencies.vite).toMatch(/^\^7\./);
		// _gitignore is renamed to .gitignore on copy
		expect(JSON.parse(JSON.stringify(await fs.readdir(target)))).toContain('.gitignore');
	});

	it('rejects target directories whose names cannot be package names', async () => {
		await expect(initApp(path.join(root, "o'brien"))).rejects.toThrow(/invalid/);
	});
});

describe('initMonorepo', () => {
	it('scaffolds workspace packages that tsconfig and Vite resolve the same way', async () => {
		const target = path.join(root, 'my-repo');
		await initMonorepo(target, 'web');

		// Workspace root
		const pkg = JSON.parse(await fs.readFile(path.join(target, 'package.json'), 'utf8'));
		expect(pkg.workspaces).toEqual(['apps/*', 'libs/*']);
		expect(pkg.scripts.dev).toBe('vite apps/web');
		expect(pkg.dependencies['@melodicdev/core']).toBe('^3.0.0');

		// Libs are npm workspace packages scoped to the repo, not @melodicdev
		const configPkg = JSON.parse(await fs.readFile(path.join(target, 'libs/config/package.json'), 'utf8'));
		expect(configPkg.name).toBe('@my-repo/config');
		expect(configPkg.exports['.'].default).toBe('./src/index.ts');
		const sharedPkg = JSON.parse(await fs.readFile(path.join(target, 'libs/shared/package.json'), 'utf8'));
		expect(sharedPkg.name).toBe('@my-repo/shared');

		// App imports the shared config by package name — no path aliases anywhere
		const appConfig = await fs.readFile(path.join(target, 'apps/web/src/config/app.config.ts'), 'utf8');
		expect(appConfig).toContain("from '@my-repo/config'");
		const tsconfig = await fs.readFile(path.join(target, 'tsconfig.json'), 'utf8');
		expect(tsconfig).not.toContain('paths');
		expect(JSON.parse(tsconfig).include).toContain('apps');
		expect(JSON.parse(tsconfig).include).toContain('libs');

		// No stale composite/references machinery
		expect(await fs.readdir(target)).not.toContain('tsconfig.build.json');
		expect(await fs.readdir(target)).not.toContain('tsconfig.node.json');
	});
});

describe('addApp / addLib', () => {
	it('require a workspaces monorepo root', async () => {
		await expect(addApp(root, 'admin', 'apps')).rejects.toThrow(/monorepo/);
		await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'plain' }));
		await expect(addLib(root, 'utils', 'libs')).rejects.toThrow(/workspaces/);
	});

	describe('inside a monorepo', () => {
		beforeEach(async () => {
			await initMonorepo(path.join(root, 'repo'), 'web');
			root = path.join(root, 'repo');
		});

		it('addApp seeds the same app shape as init and wires the shared config', async () => {
			await addApp(root, 'admin', 'apps');
			const seeded = (await fs.readdir(path.join(root, 'apps/web'))).sort();
			const added = (await fs.readdir(path.join(root, 'apps/admin'))).sort();
			expect(added).toEqual(seeded);

			const appConfig = await read('apps/admin/src/config/app.config.ts');
			expect(appConfig).toContain("import { sharedConfig } from '@repo/config';");
			expect(appConfig).toContain("appName: 'admin'");

			const pkg = await readJson<{ scripts: Record<string, string> }>('package.json');
			expect(pkg.scripts['dev:admin']).toBe('vite apps/admin');
			expect(pkg.scripts['build:admin']).toContain('vite build apps/admin');
		});

		it('addApp kebab-cases and validates names', async () => {
			await addApp(root, 'AdminPortal', 'apps');
			expect(await exists('apps/admin-portal')).toBe(true);
			await expect(addApp(root, '../evil', 'apps')).rejects.toThrow(/path separators/);
		});

		it('addLib scopes the package to the repo, not @melodicdev', async () => {
			const { packageName } = await addLib(root, 'utils', 'libs');
			expect(packageName).toBe('@repo/utils');
			const pkg = await readJson<{ name: string }>('libs/utils/package.json');
			expect(pkg.name).toBe('@repo/utils');
			expect(pkg.name).not.toContain('@melodicdev');
		});

		it('addLib extends workspaces and tsconfig include for custom dirs', async () => {
			await addLib(root, 'ui', 'packages');
			const pkg = await readJson<{ workspaces: string[] }>('package.json');
			expect(pkg.workspaces).toContain('packages/*');
			const tsconfig = await readJson<{ include: string[] }>('tsconfig.json');
			expect(tsconfig.include).toContain('packages');
		});
	});
});
