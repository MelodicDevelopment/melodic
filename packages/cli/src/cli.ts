import path from 'node:path';
import { parseArgs } from 'node:util';
import {
	generateAttributeDirective,
	generateClass,
	generateComponent,
	generateDirective,
	generateGuard,
	generateInterceptor,
	generateResolver,
	generateService,
	type GenerateOptions
} from './generate.js';
import { addApp, addConfig, addLib, addTesting, initApp, initMonorepo } from './scaffold.js';
import { errorMessage, readJson, templatesRoot } from './utils.js';

const usage = (): void => {
	console.log('Usage:');
	console.log('  melodic init <directory> [--monorepo] [--app-name <name>]');
	console.log('  melodic add app <name> [--dir apps]');
	console.log('  melodic add lib <name> [--dir libs]');
	console.log('  melodic add config [--path .]');
	console.log('  melodic add testing [--path .]');
	console.log('  melodic generate component <name> [--path src/components]');
	console.log('  melodic generate directive <name> [--path src/directives]');
	console.log('  melodic generate attribute-directive <name> [--path src/directives]');
	console.log('  melodic generate service <name> [--path src/services]');
	console.log('  melodic generate interceptor <name> [--path src/http/interceptors]');
	console.log('  melodic generate guard <name> [--path src/guards]');
	console.log('  melodic generate resolver <name> [--path src/resolvers]');
	console.log('  melodic generate class <name> [--path src]');
	console.log('  melodic version');
	console.log('');
	console.log('Options:');
	console.log('  --dry-run   (generate) print the files that would be created without writing');
	console.log('  --force     (generate) overwrite existing files');
	console.log('  -h, --help  show this help');
	console.log('  -v, --version  print the CLI version');
};

const getVersion = async (): Promise<string> => {
	const packageJsonPath = path.resolve(templatesRoot, '../package.json');
	const pkg = await readJson<{ version: string }>(packageJsonPath);
	return pkg.version;
};

export interface CliArgs {
	positionals: string[];
	options: {
		monorepo?: boolean;
		'app-name'?: string;
		dir?: string;
		path?: string;
		force?: boolean;
		'dry-run'?: boolean;
		help?: boolean;
		version?: boolean;
	};
}

/**
 * Parses CLI arguments with Node's util.parseArgs so boolean flags never
 * swallow the following positional (`melodic init --monorepo my-repo` keeps
 * "my-repo" as a positional). Unknown options throw.
 */
export const parseCliArgs = (args: string[]): CliArgs => {
	const { values, positionals } = parseArgs({
		args,
		allowPositionals: true,
		strict: true,
		options: {
			monorepo: { type: 'boolean' },
			'app-name': { type: 'string' },
			dir: { type: 'string' },
			path: { type: 'string' },
			force: { type: 'boolean' },
			'dry-run': { type: 'boolean' },
			help: { type: 'boolean', short: 'h' },
			version: { type: 'boolean', short: 'v' }
		}
	});
	return { positionals, options: values };
};

const logGenerated = (files: string[], options: GenerateOptions): void => {
	if (options.dryRun) {
		return;
	}
	console.log('Created:');
	for (const file of files) {
		console.log(`  ${path.relative(process.cwd(), file)}`);
	}
};

export const run = async (args: string[]): Promise<void> => {
	let cliArgs: CliArgs;
	try {
		cliArgs = parseCliArgs(args);
	} catch (error) {
		console.error(`Error: ${errorMessage(error)}`);
		console.log('');
		usage();
		process.exitCode = 1;
		return;
	}

	const { positionals, options } = cliArgs;

	if (options.version) {
		console.log(await getVersion());
		return;
	}

	if (options.help || positionals.length === 0) {
		usage();
		process.exitCode = options.help ? 0 : 1;
		return;
	}

	const [command, ...rest] = positionals;

	try {
		switch (command) {
			case 'init':
			case 'create': {
				const target = rest[0];
				if (!target) {
					throw new Error('Target directory is required. Usage: melodic init <directory> [--monorepo] [--app-name <name>]');
				}
				const targetPath = path.resolve(process.cwd(), target);
				if (options.monorepo) {
					const appName = options['app-name'] ?? 'app';
					await initMonorepo(targetPath, appName);
				} else {
					await initApp(targetPath);
				}
				console.log('Melodic project created.');
				console.log('Next steps:');
				console.log(`  cd ${target}`);
				console.log('  npm install');
				console.log('  npm run dev');
				break;
			}
			case 'add': {
				const type = rest[0];
				if (type === 'config') {
					const targetPath = path.resolve(process.cwd(), options.path ?? '.');
					await addConfig(targetPath);
					break;
				}
				if (type === 'testing') {
					const targetPath = path.resolve(process.cwd(), options.path ?? '.');
					await addTesting(targetPath);
					console.log('Testing setup added.');
					break;
				}

				const name = rest[1];
				if (!type || !name) {
					throw new Error('Usage: melodic add <app|lib> <name>');
				}
				if (type === 'app') {
					const location = await addApp(process.cwd(), name, options.dir ?? 'apps');
					console.log(`App created at ${location}`);
					console.log(`Run it with: npm run dev:${path.basename(location)}`);
					break;
				}
				if (type === 'lib') {
					const { location, packageName } = await addLib(process.cwd(), name, options.dir ?? 'libs');
					console.log(`Library created at ${location}`);
					console.log('Next steps:');
					console.log('  npm install   (links the workspace package)');
					console.log(`  import { ... } from '${packageName}';`);
					break;
				}
				throw new Error(`Unknown add type: ${type}`);
			}
			case 'generate':
			case 'g': {
				const type = rest[0];
				const name = rest[1];
				if (!type || !name) {
					throw new Error('Usage: melodic generate <type> <name> [--path <dir>] [--dry-run] [--force]');
				}
				const generateOptions: GenerateOptions = {
					dryRun: options['dry-run'] === true,
					force: options.force === true
				};
				const dirName = options.path;
				switch (type) {
					case 'component':
						logGenerated(await generateComponent(process.cwd(), name, dirName ?? 'src/components', generateOptions), generateOptions);
						break;
					case 'directive':
						logGenerated(await generateDirective(process.cwd(), name, dirName ?? 'src/directives', generateOptions), generateOptions);
						break;
					case 'attribute-directive':
						logGenerated(await generateAttributeDirective(process.cwd(), name, dirName ?? 'src/directives', generateOptions), generateOptions);
						break;
					case 'service':
						logGenerated(await generateService(process.cwd(), name, dirName ?? 'src/services', generateOptions), generateOptions);
						break;
					case 'interceptor':
						logGenerated(await generateInterceptor(process.cwd(), name, dirName ?? 'src/http/interceptors', generateOptions), generateOptions);
						break;
					case 'guard':
						logGenerated(await generateGuard(process.cwd(), name, dirName ?? 'src/guards', generateOptions), generateOptions);
						break;
					case 'resolver':
						logGenerated(await generateResolver(process.cwd(), name, dirName ?? 'src/resolvers', generateOptions), generateOptions);
						break;
					case 'class':
						logGenerated(await generateClass(process.cwd(), name, dirName ?? 'src', generateOptions), generateOptions);
						break;
					default:
						throw new Error(`Unknown generate type: ${type}`);
				}
				break;
			}
			case 'version': {
				console.log(await getVersion());
				break;
			}
			default:
				throw new Error(`Unknown command: ${command}`);
		}
	} catch (error) {
		console.error('Error:', errorMessage(error));
		process.exitCode = 1;
	}
};
