import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
	copyTemplate,
	ensureEmptyDir,
	pathExists,
	readJson,
	readJsonc,
	templatesRoot,
	toKebabCase,
	writeFileSafe,
	writeJson
} from './utils.js';
import { assertInsideRoot, NAME_PATTERN, validateName, validateRelativePath } from './validate.js';

interface PackageJson {
	name?: string;
	workspaces?: string[];
	scripts?: Record<string, string>;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	[key: string]: unknown;
}

/**
 * `melodic add app`/`add lib`/`add config` (monorepo mode) must run at the root
 * of a workspaces monorepo — otherwise the generated workspace package can never
 * be linked and imports will not resolve.
 */
const requireWorkspaceRoot = async (rootPath: string, command: string): Promise<PackageJson> => {
	const packageJsonPath = path.join(rootPath, 'package.json');
	if (!(await pathExists(packageJsonPath))) {
		throw new Error(`"${command}" must be run at the root of a Melodic monorepo — no package.json found in ${rootPath}.`);
	}
	const pkg = await readJson<PackageJson>(packageJsonPath);
	if (!Array.isArray(pkg.workspaces) || pkg.workspaces.length === 0) {
		throw new Error(`"${command}" must be run at the root of a Melodic monorepo — package.json has no "workspaces" array. Create one with: melodic init <dir> --monorepo`);
	}
	return pkg;
};

/**
 * npm scope used for workspace libraries: derived from the root package name
 * ("my-repo" or "@acme/platform" -> "acme"), falling back to the directory
 * name. Never `@melodicdev` — user libraries must not squat the framework scope.
 */
const resolveWorkspaceScope = (rootPkg: PackageJson, rootPath: string): string => {
	let candidate = rootPkg.name ?? '';
	if (candidate.startsWith('@')) {
		candidate = candidate.slice(1).split('/')[0];
	}
	if (!NAME_PATTERN.test(candidate)) {
		candidate = toKebabCase(path.basename(rootPath));
	}
	if (!NAME_PATTERN.test(candidate)) {
		throw new Error(`Unable to derive a workspace scope from the root package name or directory ("${rootPkg.name ?? path.basename(rootPath)}"). Set a kebab-case "name" in the root package.json.`);
	}
	return candidate;
};

/** Overwrites the app's config to extend the shared workspace config library. */
const wireSharedConfig = async (appPath: string, appName: string, configPackageName: string): Promise<void> => {
	const appConfigPath = path.join(appPath, 'src/config/app.config.ts');
	const contents = [
		"import { defineConfig } from '@melodicdev/core/config';",
		`import { sharedConfig } from '${configPackageName}';`,
		'',
		'export const appConfig = defineConfig({',
		'\textends: sharedConfig,',
		'\tbase: {',
		`\t\tappName: '${appName}',`,
		'\t},',
		'});',
		'',
		'export type AppConfig = typeof appConfig;',
		''
	].join('\n');
	await fs.mkdir(path.dirname(appConfigPath), { recursive: true });
	await fs.writeFile(appConfigPath, contents);
};

const seedMonorepoApp = async (rootPath: string, appName: string, dirName: string): Promise<string> => {
	const appPath = path.join(rootPath, dirName, appName);
	await ensureEmptyDir(appPath, appName);
	// The app's vite.config.ts imports the styles plugin from the workspace
	// root. How many levels up that is depends on --dir ("apps" -> "../..",
	// "packages/apps" -> "../../.."), so it is computed rather than hardcoded.
	const rootRelative = path.posix.relative(path.posix.join(dirName, appName), '.') || '.';
	await copyTemplate(path.join(templatesRoot, 'monorepo-app'), appPath, {
		'__APP_NAME__': appName,
		'__ROOT_PATH__': rootRelative
	});
	return appPath;
};

export const initApp = async (targetPath: string): Promise<void> => {
	const appName = validateName(path.basename(targetPath), 'Project name');
	await ensureEmptyDir(targetPath, appName);
	await copyTemplate(path.join(templatesRoot, 'app-basic'), targetPath, {
		'__APP_NAME__': appName
	});
};

export const initMonorepo = async (targetPath: string, appNameRaw: string): Promise<void> => {
	const repoName = validateName(path.basename(targetPath), 'Repository name');
	const appName = validateName(appNameRaw, 'App name (--app-name)');
	await ensureEmptyDir(targetPath, repoName);
	await copyTemplate(path.join(templatesRoot, 'monorepo-basic'), targetPath, {
		'__REPO_NAME__': repoName,
		'__APP_NAME__': appName
	});
	const appPath = await seedMonorepoApp(targetPath, appName, 'apps');
	await wireSharedConfig(appPath, appName, `@${repoName}/config`);
};

/** Adds root package.json convenience scripts for an additional app. */
const addAppScripts = async (rootPath: string, pkg: PackageJson, appName: string, dirName: string): Promise<void> => {
	const scripts = pkg.scripts ?? {};
	const appDir = `${dirName}/${appName}`;
	scripts[`dev:${appName}`] = scripts[`dev:${appName}`] ?? `vite ${appDir}`;
	scripts[`build:${appName}`] = scripts[`build:${appName}`] ?? `tsc --noEmit && vite build ${appDir}`;
	scripts[`preview:${appName}`] = scripts[`preview:${appName}`] ?? `vite preview ${appDir}`;
	pkg.scripts = scripts;
	await writeJson(path.join(rootPath, 'package.json'), pkg);
};

/**
 * Ensures the root tsconfig's "include" covers a workspace directory so new
 * apps/libs are typechecked. tsconfig files may contain comments/trailing
 * commas, so parse tolerantly. (Note: rewriting drops comments.)
 */
const ensureTsconfigIncludes = async (rootPath: string, dirName: string): Promise<void> => {
	const tsconfigPath = path.join(rootPath, 'tsconfig.json');
	if (!(await pathExists(tsconfigPath))) {
		return;
	}
	const tsconfig = await readJsonc<{ include?: string[]; [key: string]: unknown }>(tsconfigPath);
	if (!Array.isArray(tsconfig.include) || tsconfig.include.includes(dirName)) {
		return;
	}
	tsconfig.include.push(dirName);
	await writeJson(tsconfigPath, tsconfig);
};

/** Ensures the root package.json "workspaces" globs cover a directory. */
const ensureWorkspaceGlob = async (rootPath: string, pkg: PackageJson, dirName: string): Promise<void> => {
	const glob = `${dirName}/*`;
	const workspaces = pkg.workspaces ?? [];
	if (workspaces.includes(glob) || workspaces.includes(dirName)) {
		return;
	}
	workspaces.push(glob);
	pkg.workspaces = workspaces;
	await writeJson(path.join(rootPath, 'package.json'), pkg);
};

export const addApp = async (rootPath: string, rawName: string, rawDirName: string): Promise<string> => {
	const pkg = await requireWorkspaceRoot(rootPath, 'melodic add app');
	const name = validateName(rawName, 'App name');
	const dirName = validateRelativePath(rawDirName, '--dir');
	await assertInsideRoot(rootPath, path.join(rootPath, dirName), '--dir');

	const appPath = await seedMonorepoApp(rootPath, name, dirName);

	// If the monorepo has a shared config library, extend it (matches the app
	// seeded by `melodic init --monorepo`).
	const configLibPackagePath = path.join(rootPath, 'libs/config/package.json');
	if (await pathExists(configLibPackagePath)) {
		const configPkg = await readJson<PackageJson>(configLibPackagePath);
		if (configPkg.name) {
			await wireSharedConfig(appPath, name, configPkg.name);
		}
	}

	await addAppScripts(rootPath, pkg, name, dirName);
	await ensureTsconfigIncludes(rootPath, dirName);
	return `${dirName}/${name}`;
};

export const addLib = async (rootPath: string, rawName: string, rawDirName: string): Promise<{ location: string; packageName: string }> => {
	const pkg = await requireWorkspaceRoot(rootPath, 'melodic add lib');
	const name = validateName(rawName, 'Library name');
	const dirName = validateRelativePath(rawDirName, '--dir');
	await assertInsideRoot(rootPath, path.join(rootPath, dirName), '--dir');
	const scope = resolveWorkspaceScope(pkg, rootPath);
	const packageName = `@${scope}/${name}`;

	const libPath = path.join(rootPath, dirName, name);
	await ensureEmptyDir(libPath, name);
	await copyTemplate(path.join(templatesRoot, 'lib-basic'), libPath, {
		'__LIB_NAME__': name,
		'__REPO_NAME__': scope
	});

	await ensureWorkspaceGlob(rootPath, pkg, dirName);
	await ensureTsconfigIncludes(rootPath, dirName);
	return { location: `${dirName}/${name}`, packageName };
};

/**
 * True when the package at `rootPath` — or a workspace root above it, for
 * `melodic add testing --path apps/web` — depends on @melodicdev/core.
 */
const dependsOnMelodicCore = async (rootPath: string, pkg: PackageJson): Promise<boolean> => {
	const declares = (candidate: PackageJson): boolean => {
		const sections = [candidate.dependencies, candidate.devDependencies, candidate.peerDependencies];
		return sections.some((section) => typeof section === 'object' && section !== null && '@melodicdev/core' in section);
	};
	if (declares(pkg)) {
		return true;
	}
	let current = path.resolve(rootPath);
	for (let depth = 0; depth < 4; depth += 1) {
		const parent = path.dirname(current);
		if (parent === current) {
			break;
		}
		current = parent;
		const parentPackagePath = path.join(current, 'package.json');
		if (await pathExists(parentPackagePath)) {
			try {
				if (declares(await readJson<PackageJson>(parentPackagePath))) {
					return true;
				}
			} catch {
				// An unreadable ancestor package.json is not this command's problem.
			}
		}
	}
	return false;
};

const VITEST_CONFIG = [
	"import { defineConfig } from 'vitest/config';",
	'',
	'export default defineConfig({',
	'\ttest: {',
	"\t\tenvironment: 'happy-dom',",
	"\t\tinclude: ['tests/unit/**/*.test.ts']",
	'\t}',
	'});',
	''
].join('\n');

/** Example for projects without @melodicdev/core (nothing to mount). */
const PLAIN_EXAMPLE_TEST = [
	"import { describe, it, expect } from 'vitest';",
	'',
	"describe('example', () => {",
	"\tit('works', () => {",
	'\t\texpect(1 + 1).toBe(2);',
	'\t});',
	'});',
	''
].join('\n');

/**
 * Example for Melodic projects: mounts a real component with
 * `@melodicdev/core/testing`, so the first test a user reads shows the two
 * things that are easy to get wrong by hand — waiting for the render (`mount`,
 * `flush`) and querying through the shadow root (`query`, `text`).
 */
const COMPONENT_EXAMPLE_TEST = [
	"import { afterEach, describe, expect, it } from 'vitest';",
	"import { MelodicComponent } from '@melodicdev/core/components';",
	"import { signal } from '@melodicdev/core/signals';",
	"import { html } from '@melodicdev/core/template';",
	"import { flush, mount, query, text, unmountAll } from '@melodicdev/core/testing';",
	'',
	'// Normally you would import the component under test instead:',
	"//   import '../../src/components/my-counter';",
	'@MelodicComponent({',
	"\tselector: 'example-counter',",
	'\ttemplate: (component: ExampleCounterComponent) => html`<button @click=${component.increment}>Count: ${component.count()}</button>`',
	'})',
	'class ExampleCounterComponent {',
	'\tcount = signal(0);',
	'',
	'\tincrement = (): void => {',
	'\t\tthis.count.update((value) => value + 1);',
	'\t};',
	'}',
	'',
	"describe('example-counter', () => {",
	'\tafterEach(unmountAll);',
	'',
	"\tit('renders and re-renders when a signal changes', async () => {",
	"\t\tconst element = await mount<ExampleCounterComponent>('example-counter');",
	"\t\texpect(text(element)).toBe('Count: 0');",
	'',
	"\t\tquery<HTMLButtonElement>(element, 'button')!.click();",
	'\t\t// Renders are scheduled, not synchronous: flush before asserting.',
	'\t\tawait flush();',
	'',
	"\t\texpect(text(element)).toBe('Count: 1');",
	'\t\texpect(element.component.count()).toBe(1);',
	'\t});',
	'});',
	''
].join('\n');

export const addTesting = async (rootPath: string): Promise<void> => {
	const packageJsonPath = path.join(rootPath, 'package.json');
	if (!(await pathExists(packageJsonPath))) {
		throw new Error(`package.json not found in ${rootPath}.`);
	}

	// Precheck every file before touching anything: writing package.json first
	// and then failing on an existing vitest.config.ts left a half-applied setup.
	const vitestConfigPath = path.join(rootPath, 'vitest.config.ts');
	const exampleTestPath = path.join(rootPath, 'tests/unit/example.test.ts');
	const existing: string[] = [];
	for (const filePath of [vitestConfigPath, exampleTestPath]) {
		if (await pathExists(filePath)) {
			existing.push(filePath);
		}
	}
	if (existing.length > 0) {
		throw new Error(`Testing is already set up — these files exist (nothing was changed):\n  ${existing.join('\n  ')}`);
	}

	const pkg = await readJson<PackageJson>(packageJsonPath);
	const usesMelodic = await dependsOnMelodicCore(rootPath, pkg);

	pkg.scripts = pkg.scripts ?? {};
	pkg.scripts.test = pkg.scripts.test ?? 'vitest';
	pkg.scripts['test:unit'] = pkg.scripts['test:unit'] ?? 'vitest run';
	pkg.devDependencies = pkg.devDependencies ?? {};
	pkg.devDependencies.vitest = pkg.devDependencies.vitest ?? '^3.2.4';
	pkg.devDependencies['@vitest/ui'] = pkg.devDependencies['@vitest/ui'] ?? '^3.2.4';
	pkg.devDependencies['happy-dom'] = pkg.devDependencies['happy-dom'] ?? '^20.0.11';

	await writeJson(packageJsonPath, pkg);
	await writeFileSafe(vitestConfigPath, VITEST_CONFIG);
	await writeFileSafe(exampleTestPath, usesMelodic ? COMPONENT_EXAMPLE_TEST : PLAIN_EXAMPLE_TEST);
};

export const addConfig = async (rootPath: string): Promise<void> => {
	const packageJsonPath = path.join(rootPath, 'package.json');
	if (!(await pathExists(packageJsonPath))) {
		throw new Error(`package.json not found in ${rootPath}.`);
	}

	const pkg = await readJson<PackageJson>(packageJsonPath);
	const isMonorepo = Array.isArray(pkg.workspaces) && pkg.workspaces.length > 0;

	if (isMonorepo) {
		const scope = resolveWorkspaceScope(pkg, rootPath);
		const configLibPath = path.join(rootPath, 'libs/config');
		if (await pathExists(configLibPath)) {
			throw new Error('libs/config already exists.');
		}
		await copyTemplate(path.join(templatesRoot, 'monorepo-basic/libs/config'), configLibPath, {
			'__REPO_NAME__': scope
		});
		// libs/config is a workspace package: without a matching "workspaces"
		// glob `npm install` never links it and the import cannot resolve.
		await ensureWorkspaceGlob(rootPath, pkg, 'libs');
		await ensureTsconfigIncludes(rootPath, 'libs');
		console.log('Config library created at libs/config/');
		console.log('');
		console.log('Next steps:');
		console.log('  Run "npm install" so the workspace package is linked.');
		console.log('');
		console.log('  In each app, create src/config/app.config.ts:');
		console.log("    import { defineConfig } from '@melodicdev/core/config';");
		console.log(`    import { sharedConfig } from '@${scope}/config';`);
		console.log('');
		console.log('    export const appConfig = defineConfig({');
		console.log('      extends: sharedConfig,');
		console.log("      base: { appName: 'my-app' },");
		console.log('    });');
		console.log('');
		console.log('  Then in main.ts:');
		console.log("    import { provideConfig } from '@melodicdev/core/config';");
		console.log("    import { appConfig } from './config/app.config';");
	} else {
		const configPath = path.join(rootPath, 'src/config/app.config.ts');
		if (await pathExists(configPath)) {
			throw new Error('src/config/app.config.ts already exists.');
		}
		const kebabName = toKebabCase(path.basename(rootPath));
		const appName = NAME_PATTERN.test(kebabName) ? kebabName : 'app';
		await writeFileSafe(
			configPath,
			`import { defineConfig } from '@melodicdev/core/config';\n\nexport const appConfig = defineConfig({\n\tbase: {\n\t\tappName: '${appName}',\n\t},\n});\n\nexport type AppConfig = typeof appConfig;\n`
		);
		console.log('Config created at src/config/app.config.ts');
		console.log('');
		console.log('Next steps:');
		console.log('  Add to your main.ts:');
		console.log("    import { provideConfig } from '@melodicdev/core/config';");
		console.log("    import { appConfig } from './config/app.config';");
	}

	console.log('');
	console.log('  Then add provideConfig(appConfig) to your bootstrap providers array.');
};
