/**
 * Regression tests for the tooling review of 2026-11-16 (CLI items 9–14 and
 * the template changes that came with packaging items 5 and 10).
 */
import { promises as fs, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { run, shellQuote } from '../src/cli.js';
import { generateAttributeDirective, generateDirective, generateGuard, generateService } from '../src/generate.js';
import { addApp, addConfig, addLib, addTesting, initApp, initMonorepo } from '../src/scaffold.js';
import { copyTemplate, templatesRoot } from '../src/utils.js';
import { assertInsideRoot, validateName } from '../src/validate.js';

let root: string;

beforeEach(async () => {
	// realpath: on macOS os.tmpdir() is itself a symlink (/var -> /private/var).
	root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'melodic-cli-review-')));
});

afterEach(async () => {
	await fs.rm(root, { recursive: true, force: true });
	vi.restoreAllMocks();
});

const read = (relative: string): Promise<string> => fs.readFile(path.join(root, relative), 'utf8');

const exists = async (relative: string): Promise<boolean> => {
	try {
		await fs.lstat(path.join(root, relative));
		return true;
	} catch {
		return false;
	}
};

const templateFile = (relative: string): string => readFileSync(path.join(templatesRoot, relative), 'utf8');

describe('add app --dir <nested> (review item 9)', () => {
	beforeEach(async () => {
		await initMonorepo(path.join(root, 'repo'), 'web');
		root = path.join(root, 'repo');
	});

	it('points the default app at the workspace root plugin', async () => {
		expect(await read('apps/web/vite.config.ts')).toContain("from '../../vite-plugin-melodic-styles'");
	});

	it('computes the plugin import for a nested directory', async () => {
		await addApp(root, 'admin', 'packages/apps');
		const config = await read('packages/apps/admin/vite.config.ts');
		expect(config).toContain("from '../../../vite-plugin-melodic-styles'");
		expect(config).not.toContain('__ROOT_PATH__');
		// The import must actually land on the root plugin file.
		const resolved = path.resolve(root, 'packages/apps/admin', '../../../vite-plugin-melodic-styles.ts');
		expect(resolved).toBe(path.join(root, 'vite-plugin-melodic-styles.ts'));
		expect(await exists('vite-plugin-melodic-styles.ts')).toBe(true);
	});

	it('computes the plugin import for a single-level custom directory', async () => {
		await addApp(root, 'admin', 'sites');
		expect(await read('sites/admin/vite.config.ts')).toContain("from '../../vite-plugin-melodic-styles'");
	});
});

describe('template dependencies (review items 5 and 10)', () => {
	it.each(['app-basic', 'monorepo-basic'])('%s declares every package its vite plugin imports', (template) => {
		const plugin = templateFile(`${template}/vite-plugin-melodic-styles.ts`);
		const pkg = JSON.parse(templateFile(`${template}/package.json`)) as {
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
		};
		const declared = { ...pkg.dependencies, ...pkg.devDependencies };
		const imported = [...plugin.matchAll(/from '([^'.][^']*)'/g)]
			.map((match) => match[1])
			.filter((specifier) => !specifier.startsWith('node:'));
		expect(imported).toContain('esbuild');
		for (const specifier of imported) {
			expect(declared, `${template} must declare "${specifier}"`).toHaveProperty(specifier);
		}
	});

	it.each(['app-basic', 'monorepo-basic'])('%s tsconfig keeps legacy decorators but not emitDecoratorMetadata', (template) => {
		const { compilerOptions } = JSON.parse(templateFile(`${template}/tsconfig.json`)) as { compilerOptions: Record<string, unknown> };
		// Required by @melodicdev/core's decorators:
		expect(compilerOptions.experimentalDecorators).toBe(true);
		expect(compilerOptions.useDefineForClassFields).toBe(false);
		// Nothing in core reads design:* metadata, and esbuild ignores the flag.
		expect(compilerOptions).not.toHaveProperty('emitDecoratorMetadata');
	});
});

describe('generated identifiers (review item 11)', () => {
	it('refuses a directive whose exported identifier is a reserved word', async () => {
		for (const name of ['delete', 'new', 'class', 'default', 'switch']) {
			await expect(generateDirective(root, name, 'src/directives')).rejects.toThrow(/reserved word/);
		}
		expect(await exists('src/directives')).toBe(false);
	});

	it('still allows reserved words where a suffix makes the identifier safe', async () => {
		await generateGuard(root, 'delete', 'src/guards');
		expect(await read('src/guards/delete.guard.ts')).toContain('export const deleteGuard =');
		await generateAttributeDirective(root, 'new', 'src/directives');
		expect(await read('src/directives/new.attribute-directive.ts')).toContain('export const newAttributeDirective =');
		await generateDirective(root, 'delete-item', 'src/directives');
		expect(await read('src/directives/delete-item.directive.ts')).toContain('export const deleteItem =');
	});

	it('rejects leading and trailing hyphens', () => {
		expect(() => validateName('new-', 'Name')).toThrow(/invalid/);
		expect(() => validateName('-card', 'Name')).toThrow(/invalid/);
		expect(() => validateName('user-card-', 'Name')).toThrow(/invalid/);
		expect(validateName('user-card2', 'Name')).toBe('user-card2');
		expect(validateName('a', 'Name')).toBe('a');
	});

	it('collapses a run of hyphens, underscores or spaces into one hyphen', () => {
		// Kebab-casing runs before the pattern check, so these are accepted, not rejected.
		expect(validateName('user--card', 'Name')).toBe('user-card');
		expect(validateName('user__card', 'Name')).toBe('user-card');
		expect(validateName('user  card', 'Name')).toBe('user-card');
	});
});

describe('add testing (review item 12)', () => {
	it('scaffolds a component test that uses @melodicdev/core/testing in a Melodic app', async () => {
		const target = path.join(root, 'my-app');
		await initApp(target);
		await addTesting(target);

		const example = await fs.readFile(path.join(target, 'tests/unit/example.test.ts'), 'utf8');
		expect(example).toContain("from '@melodicdev/core/testing'");
		expect(example).toContain('await mount<ExampleCounterComponent>(');
		expect(example).toContain('await flush();');
		expect(example).toContain('afterEach(unmountAll)');

		const pkg = JSON.parse(await fs.readFile(path.join(target, 'package.json'), 'utf8'));
		expect(pkg.scripts['test:unit']).toBe('vitest run');
		expect(pkg.devDependencies.vitest).toBeDefined();
		expect(pkg.devDependencies['happy-dom']).toBeDefined();
	});

	it('detects core through the workspace root for --path apps/<name>', async () => {
		await initMonorepo(path.join(root, 'repo'), 'web');
		const appPath = path.join(root, 'repo/apps/web');
		await fs.writeFile(path.join(appPath, 'package.json'), JSON.stringify({ name: 'web', private: true }));
		await addTesting(appPath);
		expect(await fs.readFile(path.join(appPath, 'tests/unit/example.test.ts'), 'utf8')).toContain('@melodicdev/core/testing');
	});

	it('falls back to a plain example when the project does not use core', async () => {
		await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'plain' }));
		await addTesting(root);
		const example = await read('tests/unit/example.test.ts');
		expect(example).not.toContain('@melodicdev');
		expect(example).toContain('expect(1 + 1).toBe(2)');
	});

	it('changes nothing when a target file already exists', async () => {
		const original = JSON.stringify({ name: 'plain', scripts: { test: 'jest' } });
		await fs.writeFile(path.join(root, 'package.json'), original);
		await fs.writeFile(path.join(root, 'vitest.config.ts'), '// mine\n');

		await expect(addTesting(root)).rejects.toThrow(/already set up/);

		expect(await read('package.json')).toBe(original);
		expect(await read('vitest.config.ts')).toBe('// mine\n');
		expect(await exists('tests')).toBe(false);
	});

	it('is safe to run twice: the second run fails without rewriting package.json', async () => {
		await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'plain' }));
		await addTesting(root);
		const afterFirst = await read('package.json');
		await expect(addTesting(root)).rejects.toThrow(/already set up/);
		expect(await read('package.json')).toBe(afterFirst);
	});
});

describe('overwrite and path safety (review item 13)', () => {
	it('refuses to generate through a symlink that leaves the project', async () => {
		const project = path.join(root, 'project');
		const outside = path.join(root, 'outside');
		await fs.mkdir(project);
		await fs.mkdir(outside);
		await fs.symlink(outside, path.join(project, 'link'));

		await expect(generateService(project, 'api', 'link/services')).rejects.toThrow(/outside the project/);
		await expect(generateService(project, 'api', 'link')).rejects.toThrow(/outside the project/);
		expect(await fs.readdir(outside)).toEqual([]);
	});

	it('allows symlinks that stay inside the project, and not-yet-existing paths', async () => {
		const project = path.join(root, 'project');
		await fs.mkdir(path.join(project, 'real'), { recursive: true });
		await fs.symlink(path.join(project, 'real'), path.join(project, 'alias'));

		await generateService(project, 'api', 'alias/services');
		expect(await exists('project/real/services/api.service.ts')).toBe(true);
		await expect(assertInsideRoot(project, path.join(project, 'a/b/c'), '--path')).resolves.toBeUndefined();
	});

	it('refuses add app / add lib into a symlinked directory outside the monorepo', async () => {
		await initMonorepo(path.join(root, 'repo'), 'web');
		const outside = path.join(root, 'outside');
		await fs.mkdir(outside);
		await fs.symlink(outside, path.join(root, 'repo/elsewhere'));

		await expect(addApp(path.join(root, 'repo'), 'admin', 'elsewhere')).rejects.toThrow(/outside the project/);
		await expect(addLib(path.join(root, 'repo'), 'ui', 'elsewhere')).rejects.toThrow(/outside the project/);
		expect(await fs.readdir(outside)).toEqual([]);
	});

	it('copies binary template files byte-for-byte', async () => {
		const source = path.join(root, 'template');
		const destination = path.join(root, 'out');
		await fs.mkdir(source);
		// Invalid UTF-8 plus a NUL: a text round-trip would corrupt both.
		const binary = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0xfe, 0x5f, 0x5f, 0x41, 0x50, 0x50]);
		await fs.writeFile(path.join(source, 'icon.png'), binary);
		await fs.writeFile(path.join(source, 'name.txt'), 'hello __APP_NAME__');

		await copyTemplate(source, destination, { '__APP_NAME__': 'demo' });

		expect((await fs.readFile(path.join(destination, 'icon.png'))).equals(binary)).toBe(true);
		expect(await fs.readFile(path.join(destination, 'name.txt'), 'utf8')).toBe('hello demo');
	});

	it('quotes the "cd" hint only when the directory needs it', () => {
		expect(shellQuote('my-app')).toBe('my-app');
		expect(shellQuote('./apps/my_app')).toBe('./apps/my_app');
		expect(shellQuote('My App')).toBe('"My App"');
		expect(shellQuote('a"b$c')).toBe('"a\\"b\\$c"');
	});

	describe('run()', () => {
		let cwd: string;
		let exitCode: typeof process.exitCode;

		beforeEach(() => {
			cwd = process.cwd();
			exitCode = process.exitCode;
			process.chdir(root);
			vi.spyOn(console, 'log').mockImplementation(() => undefined);
		});

		afterEach(() => {
			process.chdir(cwd);
			process.exitCode = exitCode;
		});

		it('refuses --dry-run on init instead of writing files', async () => {
			const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
			await run(['init', 'my-app', '--dry-run']);
			expect(process.exitCode).toBe(1);
			expect(error.mock.calls.flat().join(' ')).toMatch(/--dry-run is only supported by "melodic generate"/);
			expect(await exists('my-app')).toBe(false);
		});

		it('names all four subcommands when add is given none', async () => {
			const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
			await run(['add']);
			expect(process.exitCode).toBe(1);
			const message = error.mock.calls.flat().join(' ');
			expect(message).toMatch(/add <app\|lib> <name>/);
			expect(message).toMatch(/add config/);
			expect(message).toMatch(/add testing/);
		});

		it('refuses --dry-run on add before touching package.json', async () => {
			const original = JSON.stringify({ name: 'plain' });
			await fs.writeFile(path.join(root, 'package.json'), original);
			vi.spyOn(console, 'error').mockImplementation(() => undefined);
			await run(['add', 'testing', '--dry-run']);
			expect(process.exitCode).toBe(1);
			expect(await read('package.json')).toBe(original);
			expect(await exists('vitest.config.ts')).toBe(false);
		});

		it('warns that --force does nothing on init, and still never overwrites', async () => {
			const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
			vi.spyOn(console, 'error').mockImplementation(() => undefined);
			await fs.mkdir(path.join(root, 'taken'));
			await fs.writeFile(path.join(root, 'taken/keep.txt'), 'keep');

			await run(['init', 'taken', '--force']);

			expect(warn.mock.calls.flat().join(' ')).toMatch(/--force has no effect/);
			expect(process.exitCode).toBe(1);
			expect(await fs.readdir(path.join(root, 'taken'))).toEqual(['keep.txt']);
		});

		it('still honours --dry-run for generate', async () => {
			await run(['generate', 'service', 'api', '--dry-run']);
			expect(process.exitCode).not.toBe(1);
			expect(await exists('src')).toBe(false);
		});

		it('prints a quoted cd hint for a directory with a space', async () => {
			const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
			await run(['init', 'My App']);
			expect(log.mock.calls.flat()).toContain('  cd "My App"');
			expect(JSON.parse(await read('My App/package.json')).name).toBe('my-app');
		});
	});
});

describe('add config in a monorepo', () => {
	it('adds the libs workspace glob so the config package can be linked', async () => {
		await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'acme', workspaces: ['apps/*'] }));
		vi.spyOn(console, 'log').mockImplementation(() => undefined);

		await addConfig(root);

		const pkg = JSON.parse(await read('package.json')) as { workspaces: string[] };
		expect(pkg.workspaces).toEqual(['apps/*', 'libs/*']);
		expect(JSON.parse(await read('libs/config/package.json')).name).toBe('@acme/config');
	});
});
