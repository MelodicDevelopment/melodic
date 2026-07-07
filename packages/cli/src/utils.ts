import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cliDir = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the CLI's bundled template directory. */
export const templatesRoot = path.resolve(cliDir, '../templates');

export const errorMessage = (error: unknown): string => {
	return error instanceof Error ? error.message : String(error);
};

export const pathExists = async (targetPath: string): Promise<boolean> => {
	try {
		await fs.stat(targetPath);
		return true;
	} catch {
		return false;
	}
};

export const isDirectoryEmpty = async (targetPath: string): Promise<boolean> => {
	const entries = await fs.readdir(targetPath);
	return entries.length === 0;
};

export const ensureEmptyDir = async (targetPath: string, nameForError: string): Promise<void> => {
	if (await pathExists(targetPath)) {
		if (!(await isDirectoryEmpty(targetPath))) {
			throw new Error(`"${nameForError}" is not an empty directory (${targetPath}).`);
		}
		return;
	}
	await fs.mkdir(targetPath, { recursive: true });
};

export const replacePlaceholders = (input: string, replacements: Record<string, string>): string => {
	let output = input;
	for (const [key, value] of Object.entries(replacements)) {
		output = output.split(key).join(value);
	}
	return output;
};

export const copyTemplate = async (source: string, destination: string, replacements: Record<string, string>, exclude: string[] = []): Promise<void> => {
	await fs.mkdir(destination, { recursive: true });
	const entries = await fs.readdir(source, { withFileTypes: true });

	for (const entry of entries) {
		if (exclude.includes(entry.name)) {
			continue;
		}
		const sourcePath = path.join(source, entry.name);
		let resolvedName = replacePlaceholders(entry.name, replacements);

		// npm doesn't include dotfiles when publishing, so we use underscore prefix
		// in templates: _gitignore -> .gitignore, _prettierrc -> .prettierrc
		if (resolvedName.startsWith('_')) {
			resolvedName = '.' + resolvedName.slice(1);
		}

		const destinationPath = path.join(destination, resolvedName);

		if (entry.isDirectory()) {
			await copyTemplate(sourcePath, destinationPath, replacements, exclude);
			continue;
		}

		const contents = await fs.readFile(sourcePath, 'utf8');
		const output = replacePlaceholders(contents, replacements);
		await fs.writeFile(destinationPath, output);
	}
};

export const toKebabCase = (value: string): string => {
	return value
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/[_\s]+/g, '-')
		.replace(/-+/g, '-')
		.toLowerCase();
};

export const toPascalCase = (value: string): string => {
	return value
		.replace(/[_\s-]+/g, ' ')
		.split(' ')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
};

export const toCamelCase = (value: string): string => {
	const pascal = toPascalCase(value);
	return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

export const readFileWrapped = async (filePath: string): Promise<string> => {
	try {
		return await fs.readFile(filePath, 'utf8');
	} catch (error) {
		throw new Error(`Unable to read ${filePath}: ${errorMessage(error)}`);
	}
};

export const readJson = async <T>(filePath: string): Promise<T> => {
	const raw = await readFileWrapped(filePath);
	try {
		return JSON.parse(raw) as T;
	} catch (error) {
		throw new Error(`Unable to parse JSON in ${filePath}: ${errorMessage(error)}. Fix the file and re-run the command.`);
	}
};

/**
 * Strips // and /* *\/ comments and trailing commas (both legal in tsconfig
 * files) so the result can be handed to JSON.parse. String-literal aware.
 */
export const stripJsonc = (input: string): string => {
	let output = '';
	let index = 0;
	let inString = false;

	while (index < input.length) {
		const char = input[index];
		const next = input[index + 1];

		if (inString) {
			output += char;
			if (char === '\\' && next !== undefined) {
				output += next;
				index += 2;
				continue;
			}
			if (char === '"') {
				inString = false;
			}
			index += 1;
			continue;
		}

		if (char === '"') {
			inString = true;
			output += char;
			index += 1;
			continue;
		}

		if (char === '/' && next === '/') {
			while (index < input.length && input[index] !== '\n') {
				index += 1;
			}
			continue;
		}

		if (char === '/' && next === '*') {
			index += 2;
			while (index < input.length && !(input[index] === '*' && input[index + 1] === '/')) {
				index += 1;
			}
			index += 2;
			continue;
		}

		if (char === ',') {
			// Trailing comma: look ahead (past whitespace) for } or ].
			let lookahead = index + 1;
			while (lookahead < input.length && /\s/.test(input[lookahead])) {
				lookahead += 1;
			}
			if (input[lookahead] === '}' || input[lookahead] === ']') {
				index += 1;
				continue;
			}
		}

		output += char;
		index += 1;
	}

	return output;
};

/** Reads a JSONC file (tsconfig-style: comments + trailing commas tolerated). */
export const readJsonc = async <T>(filePath: string): Promise<T> => {
	const raw = await readFileWrapped(filePath);
	try {
		return JSON.parse(stripJsonc(raw)) as T;
	} catch (error) {
		throw new Error(`Unable to parse ${filePath}: ${errorMessage(error)}. Fix the file and re-run the command.`);
	}
};

export const writeJson = async (filePath: string, value: unknown): Promise<void> => {
	const contents = JSON.stringify(value, null, '\t') + '\n';
	try {
		await fs.writeFile(filePath, contents);
	} catch (error) {
		throw new Error(`Unable to write ${filePath}: ${errorMessage(error)}`);
	}
};

export const writeFileSafe = async (filePath: string, contents: string): Promise<void> => {
	if (await pathExists(filePath)) {
		throw new Error(`File already exists: ${filePath}`);
	}
	await fs.mkdir(path.dirname(filePath), { recursive: true });
	await fs.writeFile(filePath, contents);
};
