#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesRoot = path.resolve(__dirname, '../templates');

const usage = (): void => {
	console.log('Usage:');
	console.log('  melodic init <directory> [--monorepo] [--app-name <name>]');
	console.log('  melodic add app <name> [--dir apps]');
	console.log('  melodic add lib <name> [--dir packages]');
	console.log('  melodic add testing [--path .]');
	console.log('  melodic generate component <name> [--path src/components]');
	console.log('  melodic generate directive <name> [--path src/directives]');
	console.log('  melodic generate attribute-directive <name> [--path src/directives]');
	console.log('  melodic generate service <name> [--path src/services]');
	console.log('  melodic generate interceptor <name> [--path src/http/interceptors]');
};

const parseArgs = (args: string[]): { positionals: string[]; options: Record<string, string | boolean> } => {
	const positionals: string[] = [];
	const options: Record<string, string | boolean> = {};
	let i = 0;

	while (i < args.length) {
		const arg = args[i];
		if (arg.startsWith('--')) {
			const key = arg.slice(2);
			const next = args[i + 1];
			if (next && !next.startsWith('--')) {
				options[key] = next;
				i += 2;
				continue;
			}
			options[key] = true;
			i += 1;
			continue;
		}
		positionals.push(arg);
		i += 1;
	}

	return { positionals, options };
};

const pathExists = async (targetPath: string): Promise<boolean> => {
	try {
		await fs.stat(targetPath);
		return true;
	} catch {
		return false;
	}
};

const isDirectoryEmpty = async (targetPath: string): Promise<boolean> => {
	const entries = await fs.readdir(targetPath);
	return entries.length === 0;
};

const replacePlaceholders = (input: string, replacements: Record<string, string>): string => {
	let output = input;
	for (const [key, value] of Object.entries(replacements)) {
		output = output.split(key).join(value);
	}
	return output;
};

const copyTemplate = async (source: string, destination: string, replacements: Record<string, string>): Promise<void> => {
	await fs.mkdir(destination, { recursive: true });
	const entries = await fs.readdir(source, { withFileTypes: true });

	for (const entry of entries) {
		const sourcePath = path.join(source, entry.name);
		const resolvedName = replacePlaceholders(entry.name, replacements);
		const destinationPath = path.join(destination, resolvedName);

		if (entry.isDirectory()) {
			await copyTemplate(sourcePath, destinationPath, replacements);
			continue;
		}

		const contents = await fs.readFile(sourcePath, 'utf8');
		const output = replacePlaceholders(contents, replacements);
		await fs.writeFile(destinationPath, output);
	}
};

const ensureEmptyDir = async (targetPath: string, nameForError: string): Promise<void> => {
	if (await pathExists(targetPath)) {
		if (!(await isDirectoryEmpty(targetPath))) {
			throw new Error(`"${nameForError}" is not an empty directory.`);
		}
		return;
	}
	await fs.mkdir(targetPath, { recursive: true });
};

const toKebabCase = (value: string): string => {
	return value
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/[_\s]+/g, '-')
		.replace(/-+/g, '-')
		.toLowerCase();
};

const toPascalCase = (value: string): string => {
	return value
		.replace(/[_\s-]+/g, ' ')
		.split(' ')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
};

const writeFileSafe = async (filePath: string, contents: string): Promise<void> => {
	if (await pathExists(filePath)) {
		throw new Error(`File already exists: ${filePath}`);
	}
	await fs.mkdir(path.dirname(filePath), { recursive: true });
	await fs.writeFile(filePath, contents);
};

const readJson = async <T>(filePath: string): Promise<T> => {
	const raw = await fs.readFile(filePath, 'utf8');
	return JSON.parse(raw) as T;
};

const writeJson = async (filePath: string, value: unknown): Promise<void> => {
	const contents = JSON.stringify(value, null, '\t') + '\n';
	await fs.writeFile(filePath, contents);
};

const initApp = async (targetPath: string): Promise<void> => {
	const appName = path.basename(targetPath);
	await ensureEmptyDir(targetPath, appName);
	await copyTemplate(path.join(templatesRoot, 'app-basic'), targetPath, {
		'__APP_NAME__': appName
	});
};

const initMonorepo = async (targetPath: string, appName: string): Promise<void> => {
	const repoName = path.basename(targetPath);
	await ensureEmptyDir(targetPath, repoName);
	await copyTemplate(path.join(templatesRoot, 'monorepo-basic'), targetPath, {
		'__REPO_NAME__': repoName,
		'__APP_NAME__': appName
	});
};

const addApp = async (rootPath: string, name: string, dirName: string): Promise<void> => {
	const appPath = path.join(rootPath, dirName, name);
	await ensureEmptyDir(appPath, name);
	await copyTemplate(path.join(templatesRoot, 'app-basic'), appPath, {
		'__APP_NAME__': name
	});
};

const addLib = async (rootPath: string, name: string, dirName: string): Promise<void> => {
	const libPath = path.join(rootPath, dirName, name);
	await ensureEmptyDir(libPath, name);
	await copyTemplate(path.join(templatesRoot, 'lib-basic'), libPath, {
		'__LIB_NAME__': name
	});
};

const addTesting = async (rootPath: string): Promise<void> => {
	const packageJsonPath = path.join(rootPath, 'package.json');
	if (!(await pathExists(packageJsonPath))) {
		throw new Error('package.json not found in target path.');
	}

	const pkg = await readJson<Record<string, any>>(packageJsonPath);
	pkg.scripts = pkg.scripts ?? {};
	pkg.scripts.test = pkg.scripts.test ?? 'vitest';
	pkg.scripts['test:unit'] = pkg.scripts['test:unit'] ?? 'vitest run';
	pkg.devDependencies = pkg.devDependencies ?? {};
	pkg.devDependencies.vitest = pkg.devDependencies.vitest ?? '^3.2.4';
	pkg.devDependencies['@vitest/ui'] = pkg.devDependencies['@vitest/ui'] ?? '^3.2.4';
	pkg.devDependencies['happy-dom'] = pkg.devDependencies['happy-dom'] ?? '^20.0.11';

	await writeJson(packageJsonPath, pkg);

	await writeFileSafe(
		path.join(rootPath, 'vitest.config.ts'),
		"import { defineConfig } from 'vitest/config';\n\nexport default defineConfig({\n\ttest: {\n\t\tenvironment: 'happy-dom',\n\t\tinclude: ['tests/unit/**/*.test.ts']\n\t}\n});\n"
	);

	await writeFileSafe(
		path.join(rootPath, 'tests/unit/example.test.ts'),
		"import { describe, it, expect } from 'vitest';\n\n\ndescribe('example', () => {\n\tit('works', () => {\n\t\texpect(1 + 1).toBe(2);\n\t});\n});\n"
	);
};

const generateComponent = async (rootPath: string, name: string, dirName: string): Promise<void> => {
	const fileBase = toKebabCase(name);
	const className = toPascalCase(name);
	const componentPath = path.join(rootPath, dirName, `${fileBase}.component.ts`);
	const templatePath = path.join(rootPath, dirName, `${fileBase}.template.ts`);
	const stylesPath = path.join(rootPath, dirName, `${fileBase}.styles.ts`);

	await writeFileSafe(
		templatePath,
		`import { html } from '@melodic/core/template';\nimport type { ${className}Component } from './${fileBase}.component';\n\nexport const ${className}Template = (component: ${className}Component) => html\`\n\t<section>\n\t\t<h2>${className}</h2>\n\t</section>\n\`;\n`
	);

	await writeFileSafe(
		stylesPath,
		`import { css } from '@melodic/core/template';\n\nexport const ${className}Styles = () => css\`\n\t:host {\n\t\tdisplay: block;\n\t}\n\`;\n`
	);

	await writeFileSafe(
		componentPath,
		`import { MelodicComponent } from '@melodic/core/components';\nimport { ${className}Template } from './${fileBase}.template';\nimport { ${className}Styles } from './${fileBase}.styles';\n\n@MelodicComponent({\n\tselector: '${fileBase}',\n\ttemplate: ${className}Template,\n\tstyles: ${className}Styles\n})\nexport class ${className}Component {}\n`
	);
};

const generateDirective = async (rootPath: string, name: string, dirName: string): Promise<void> => {
	const fileBase = toKebabCase(name);
	const exportName = toPascalCase(name);
	const directivePath = path.join(rootPath, dirName, `${fileBase}.directive.ts`);
	await writeFileSafe(
		directivePath,
		`import { directive } from '@melodic/core/template';\n\nexport const ${exportName}Directive = directive((container: Node) => {\n\tconst element = container as HTMLElement;\n\telement.textContent = element.textContent ?? '';\n\treturn undefined;\n});\n`
	);
};

const generateAttributeDirective = async (rootPath: string, name: string, dirName: string): Promise<void> => {
	const fileBase = toKebabCase(name);
	const directivePath = path.join(rootPath, dirName, `${fileBase}.attribute-directive.ts`);
	await writeFileSafe(
		directivePath,
		`import { registerAttributeDirective } from '@melodic/core/template';\nimport type { AttributeDirectiveCleanupFunction } from '@melodic/core/template';\n\nconst ${fileBase.replace(/-/g, '_')}_directive = (element: Element, value: unknown): AttributeDirectiveCleanupFunction | void => {\n\telement.setAttribute('data-${fileBase}', String(value ?? ''));\n\treturn () => {\n\t\telement.removeAttribute('data-${fileBase}');\n\t};\n};\n\nregisterAttributeDirective('${fileBase}', ${fileBase.replace(/-/g, '_')}_directive);\n\nexport { ${fileBase.replace(/-/g, '_')}_directive as ${toPascalCase(name)}AttributeDirective };\n`
	);
};

const generateService = async (rootPath: string, name: string, dirName: string): Promise<void> => {
	const fileBase = toKebabCase(name);
	const className = toPascalCase(name);
	const servicePath = path.join(rootPath, dirName, `${fileBase}.service.ts`);
	await writeFileSafe(
		servicePath,
		`import { Injectable } from '@melodic/core/injection';\n\n@Injectable()\nexport class ${className}Service {\n\tgetStatus(): string {\n\t	return '${className} ready';\n\t}\n}\n`
	);
};

const generateInterceptor = async (rootPath: string, name: string, dirName: string): Promise<void> => {
	const fileBase = toKebabCase(name);
	const className = toPascalCase(name);
	const interceptorPath = path.join(rootPath, dirName, `${fileBase}.interceptor.ts`);
	await writeFileSafe(
		interceptorPath,
		`import type { IHttpRequestInterceptor, IHttpResponseInterceptor, IRequestConfig, IHttpResponse } from '@melodic/core/http';\n\nexport const ${className}RequestInterceptor: IHttpRequestInterceptor = {\n\tintercept: async (request: IRequestConfig): Promise<IRequestConfig> => {\n\t	return request;\n\t},\n\terror: async (error: Error): Promise<unknown> => {\n\t	throw error;\n\t}\n};\n\nexport const ${className}ResponseInterceptor: IHttpResponseInterceptor = {\n\tintercept: async <T>(response: IHttpResponse<T>): Promise<IHttpResponse<T>> => {\n\t	return response;\n\t},\n\terror: async (error: Error): Promise<unknown> => {\n\t	throw error;\n\t}\n};\n`
	);
};

const run = async (): Promise<void> => {
	const args = process.argv.slice(2);
	if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
		usage();
		process.exit(args.length === 0 ? 1 : 0);
	}

	const command = args[0];
	const { positionals, options } = parseArgs(args.slice(1));

	try {
		switch (command) {
			case 'init':
			case 'create': {
				const target = positionals[0];
				if (!target) {
					throw new Error('Target directory is required.');
				}
				const targetPath = path.resolve(process.cwd(), target);
				const appName = typeof options['app-name'] === 'string' ? String(options['app-name']) : 'app';
				if (options.monorepo) {
					await initMonorepo(targetPath, appName);
				} else {
					await initApp(targetPath);
				}
				console.log('Melodic project created.');
				console.log(`Next steps:`);
				console.log(`  cd ${target}`);
				console.log('  npm install');
				console.log('  npm run dev');
				break;
			}
			case 'add': {
				const type = positionals[0];
				if (type === 'testing') {
					const targetPath = path.resolve(process.cwd(), typeof options.path === 'string' ? options.path : '.');
					await addTesting(targetPath);
					console.log('Testing setup added.');
					break;
				}

				const name = positionals[1];
				if (!type || !name) {
					throw new Error('Usage: melodic add <app|lib> <name>');
				}
				if (type === 'app') {
					const dirName = typeof options.dir === 'string' ? options.dir : 'apps';
					await addApp(process.cwd(), name, dirName);
					console.log(`App created at ${dirName}/${name}`);
					break;
				}
				if (type === 'lib') {
					const dirName = typeof options.dir === 'string' ? options.dir : 'packages';
					await addLib(process.cwd(), name, dirName);
					console.log(`Library created at ${dirName}/${name}`);
					break;
				}
				throw new Error(`Unknown add type: ${type}`);
			}
			case 'generate':
			case 'g': {
				const type = positionals[0];
				const name = positionals[1];
				if (!type || !name) {
					throw new Error('Usage: melodic generate <type> <name>');
				}
				const dirName = typeof options.path === 'string' ? options.path : undefined;
				switch (type) {
					case 'component':
						await generateComponent(process.cwd(), name, dirName ?? 'src/components');
						console.log(`Component created in ${dirName ?? 'src/components'}`);
						break;
					case 'directive':
						await generateDirective(process.cwd(), name, dirName ?? 'src/directives');
						console.log(`Directive created in ${dirName ?? 'src/directives'}`);
						break;
					case 'attribute-directive':
						await generateAttributeDirective(process.cwd(), name, dirName ?? 'src/directives');
						console.log(`Attribute directive created in ${dirName ?? 'src/directives'}`);
						break;
					case 'service':
						await generateService(process.cwd(), name, dirName ?? 'src/services');
						console.log(`Service created in ${dirName ?? 'src/services'}`);
						break;
					case 'interceptor':
						await generateInterceptor(process.cwd(), name, dirName ?? 'src/http/interceptors');
						console.log(`Interceptor created in ${dirName ?? 'src/http/interceptors'}`);
						break;
					default:
						throw new Error(`Unknown generate type: ${type}`);
				}
				break;
			}
			default:
				throw new Error(`Unknown command: ${command}`);
		}
	} catch (error) {
		console.error('Error:', error instanceof Error ? error.message : error);
		process.exit(1);
	}
};

run();
