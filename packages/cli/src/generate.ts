import { promises as fs } from 'node:fs';
import path from 'node:path';
import { errorMessage, pathExists, toCamelCase, toPascalCase } from './utils.js';
import { stripTypeSuffix, toSelector, validateName, validateRelativePath } from './validate.js';

export interface GenerateOptions {
	/** Print the files that would be created without writing anything. */
	dryRun?: boolean;
	/** Overwrite existing files instead of failing the precheck. */
	force?: boolean;
}

interface PlannedFile {
	filePath: string;
	contents: string;
}

/**
 * Atomic-ish generation: precheck every target path before writing anything so
 * a collision on the third file can't leave the first two behind.
 */
const writePlan = async (files: PlannedFile[], options: GenerateOptions = {}): Promise<string[]> => {
	if (!options.force) {
		const existing: string[] = [];
		for (const file of files) {
			if (await pathExists(file.filePath)) {
				existing.push(file.filePath);
			}
		}
		if (existing.length > 0) {
			throw new Error(`Refusing to generate: the following files already exist (use --force to overwrite):\n  ${existing.join('\n  ')}`);
		}
	}

	if (options.dryRun) {
		console.log('Dry run — no files written. Would create:');
		for (const file of files) {
			console.log(`  ${file.filePath}`);
		}
		return files.map((file) => file.filePath);
	}

	for (const file of files) {
		try {
			await fs.mkdir(path.dirname(file.filePath), { recursive: true });
			await fs.writeFile(file.filePath, file.contents);
		} catch (error) {
			throw new Error(`Unable to write ${file.filePath}: ${errorMessage(error)}`);
		}
	}
	return files.map((file) => file.filePath);
};

/**
 * Generates a component directory following the repo convention:
 *   <name>/
 *   ├── index.ts
 *   ├── <name>.component.ts
 *   ├── <name>.template.ts
 *   └── <name>.styles.ts
 */
export const generateComponent = async (rootPath: string, rawName: string, dirName: string, options: GenerateOptions = {}): Promise<string[]> => {
	const base = stripTypeSuffix(validateName(rawName, 'Component name'), 'component');
	const dir = validateRelativePath(dirName, '--path');
	const pascal = toPascalCase(base);
	const className = `${pascal}Component`;
	const { selector, prefixed } = toSelector(base);
	const componentDir = path.join(rootPath, dir, base);

	if (prefixed) {
		console.log(`Note: "${base}" is not a valid custom element name on its own, so the selector was prefixed to "${selector}".`);
	}

	const files: PlannedFile[] = [
		{
			filePath: path.join(componentDir, `${base}.template.ts`),
			contents: `import { html } from '@melodicdev/core/template';\nimport type { ${className} } from './${base}.component';\n\nexport const ${pascal}Template = (component: ${className}) => html\`\n\t<section>\n\t\t<h2>${pascal}</h2>\n\t</section>\n\`;\n`
		},
		{
			filePath: path.join(componentDir, `${base}.styles.ts`),
			contents: `import { css } from '@melodicdev/core/template';\n\nexport const ${pascal}Styles = () => css\`\n\t:host {\n\t\tdisplay: block;\n\t}\n\`;\n`
		},
		{
			filePath: path.join(componentDir, `${base}.component.ts`),
			contents: `import { MelodicComponent } from '@melodicdev/core/components';\nimport { ${pascal}Template } from './${base}.template';\nimport { ${pascal}Styles } from './${base}.styles';\n\n@MelodicComponent({\n\tselector: '${selector}',\n\ttemplate: ${pascal}Template,\n\tstyles: ${pascal}Styles\n})\nexport class ${className} {}\n`
		},
		{
			filePath: path.join(componentDir, 'index.ts'),
			contents: `export { ${className} } from './${base}.component';\n`
		}
	];

	return writePlan(files, options);
};

export const generateDirective = async (rootPath: string, rawName: string, dirName: string, options: GenerateOptions = {}): Promise<string[]> => {
	const base = stripTypeSuffix(validateName(rawName, 'Directive name'), 'directive');
	const dir = validateRelativePath(dirName, '--path');
	const camel = toCamelCase(base);
	const pascal = toPascalCase(base);

	const contents = `import { directive } from '@melodicdev/core/template';\nimport type { IDirectiveResult } from '@melodicdev/core/template';\n\nexport interface ${pascal}State {\n\tinitialized: boolean;\n}\n\nexport const ${camel} = (): IDirectiveResult => {\n\treturn directive((container: Node, previousState?: ${pascal}State): ${pascal}State => {\n\t\tconst element = container as HTMLElement;\n\t\tconst state: ${pascal}State = previousState ?? { initialized: false };\n\n\t\tif (!state.initialized) {\n\t\t\t// One-time setup for this element.\n\t\t\tstate.initialized = true;\n\t\t}\n\n\t\t// Update \`element\` here on every render.\n\t\tvoid element;\n\n\t\t// Always return the state object so it is passed back on the next render.\n\t\treturn state;\n\t});\n};\n`;

	return writePlan([{ filePath: path.join(rootPath, dir, `${base}.directive.ts`), contents }], options);
};

export const generateAttributeDirective = async (rootPath: string, rawName: string, dirName: string, options: GenerateOptions = {}): Promise<string[]> => {
	const base = stripTypeSuffix(validateName(rawName, 'Directive name'), 'directive');
	const dir = validateRelativePath(dirName, '--path');
	const camel = toCamelCase(base);

	const contents = `import { registerAttributeDirective } from '@melodicdev/core/template';\nimport type { AttributeDirectiveCleanupFunction } from '@melodicdev/core/template';\n\nexport const ${camel}AttributeDirective = (element: Element, value: unknown): AttributeDirectiveCleanupFunction | void => {\n\telement.setAttribute('data-${base}', String(value ?? ''));\n\n\treturn () => {\n\t\telement.removeAttribute('data-${base}');\n\t};\n};\n\nregisterAttributeDirective('${camel}', ${camel}AttributeDirective);\n`;

	return writePlan([{ filePath: path.join(rootPath, dir, `${base}.attribute-directive.ts`), contents }], options);
};

export const generateService = async (rootPath: string, rawName: string, dirName: string, options: GenerateOptions = {}): Promise<string[]> => {
	const base = stripTypeSuffix(validateName(rawName, 'Service name'), 'service');
	const dir = validateRelativePath(dirName, '--path');
	const className = `${toPascalCase(base)}Service`;

	const contents = `import { Injectable } from '@melodicdev/core/injection';\n\n@Injectable()\nexport class ${className} {\n\tgetStatus(): string {\n\t\treturn '${className} ready';\n\t}\n}\n`;

	return writePlan([{ filePath: path.join(rootPath, dir, `${base}.service.ts`), contents }], options);
};

export const generateInterceptor = async (rootPath: string, rawName: string, dirName: string, options: GenerateOptions = {}): Promise<string[]> => {
	const base = stripTypeSuffix(validateName(rawName, 'Interceptor name'), 'interceptor');
	const dir = validateRelativePath(dirName, '--path');
	const camel = toCamelCase(base);

	const contents = `import type {\n\tIHttpRequestInterceptor,\n\tIHttpResponse,\n\tIHttpResponseErrorContext,\n\tIHttpResponseInterceptor,\n\tIRequestConfig\n} from '@melodicdev/core/http';\n\nexport const ${camel}RequestInterceptor: IHttpRequestInterceptor = {\n\tintercept: async (request: IRequestConfig): Promise<IRequestConfig> => {\n\t\treturn request;\n\t},\n\terror: async (error: Error): Promise<unknown> => {\n\t\tthrow error;\n\t}\n};\n\nexport const ${camel}ResponseInterceptor: IHttpResponseInterceptor = {\n\tintercept: async <T>(response: IHttpResponse<T>): Promise<IHttpResponse<T>> => {\n\t\treturn response;\n\t},\n\terror: async <T>(error: Error, context: IHttpResponseErrorContext<T>): Promise<IHttpResponse<T> | void> => {\n\t\t// Return a response (e.g. \`await context.retry()\`) to recover, or rethrow to\n\t\t// defer to the next interceptor's error handler.\n\t\tvoid context;\n\t\tthrow error;\n\t}\n};\n`;

	return writePlan([{ filePath: path.join(rootPath, dir, `${base}.interceptor.ts`), contents }], options);
};

export const generateGuard = async (rootPath: string, rawName: string, dirName: string, options: GenerateOptions = {}): Promise<string[]> => {
	const base = stripTypeSuffix(validateName(rawName, 'Guard name'), 'guard');
	const dir = validateRelativePath(dirName, '--path');
	const camel = toCamelCase(base);

	const contents = `import { createGuard } from '@melodicdev/core/routing';\n\nexport const ${camel}Guard = createGuard(async (context) => {\n\t// Return true to allow navigation, false to cancel it,\n\t// or a path string to redirect (e.g. '/login').\n\tvoid context;\n\treturn true;\n});\n`;

	return writePlan([{ filePath: path.join(rootPath, dir, `${base}.guard.ts`), contents }], options);
};

export const generateResolver = async (rootPath: string, rawName: string, dirName: string, options: GenerateOptions = {}): Promise<string[]> => {
	const base = stripTypeSuffix(validateName(rawName, 'Resolver name'), 'resolver');
	const dir = validateRelativePath(dirName, '--path');
	const camel = toCamelCase(base);
	const pascal = toPascalCase(base);

	const contents = `import { createResolver } from '@melodicdev/core/routing';\n\nexport interface ${pascal}Data {\n\t// Shape of the data this resolver provides to the route.\n}\n\nexport const ${camel}Resolver = createResolver<${pascal}Data>(async (context) => {\n\t// Load and return the route's data. It becomes available on the\n\t// resolved route before the component renders.\n\tvoid context;\n\treturn {};\n});\n`;

	return writePlan([{ filePath: path.join(rootPath, dir, `${base}.resolver.ts`), contents }], options);
};

export const generateClass = async (rootPath: string, rawName: string, dirName: string, options: GenerateOptions = {}): Promise<string[]> => {
	const base = validateName(rawName, 'Class name');
	const dir = validateRelativePath(dirName, '--path');
	const className = toPascalCase(base);

	const contents = `export class ${className} {\n\tconstructor() {\n\t\t// TODO: Implement\n\t}\n}\n`;

	return writePlan([{ filePath: path.join(rootPath, dir, `${base}.class.ts`), contents }], options);
};
