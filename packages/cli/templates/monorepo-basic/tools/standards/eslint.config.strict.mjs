import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';

const codeFiles = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.mjs', '**/*.cjs'];
const ignorePatterns = [
	'**/dist/**',
	'**/lib/**',
	'**/node_modules/**',
	'**/coverage/**',
	'**/.vite/**'
];

export default [
	{ ignores: ignorePatterns },
	{
		files: codeFiles,
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module'
			}
		},
		plugins: {
			'@typescript-eslint': tseslint
		},
		rules: {
			'no-unused-vars': 'off',
			'brace-style': ['error', '1tbs'],
			'curly': ['error', 'all'],
			'default-case': 'error',
			'eqeqeq': ['error', 'always'],
			'no-fallthrough': 'error',
			'no-var': 'error',
			'one-var': ['error', 'never'],
			'prefer-const': 'error',
			'semi': ['error', 'always'],
			'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
			'@typescript-eslint/explicit-function-return-type': [
				'error',
				{
					allowExpressions: true,
					allowHigherOrderFunctions: true,
					allowTypedFunctionExpressions: true
				}
			],
			'@typescript-eslint/naming-convention': [
				'error',
				{ selector: 'class', format: ['PascalCase'] },
				{ selector: 'interface', format: ['PascalCase'] },
				{ selector: 'typeAlias', format: ['PascalCase'] },
				{ selector: 'enum', format: ['PascalCase'] },
				{ selector: 'enumMember', format: ['PascalCase'] },
				{ selector: 'parameter', format: null, filter: { regex: '^_+$', match: true } },
				{ selector: 'variable', format: null, filter: { regex: '^_+$', match: true } },
				{ selector: 'function', modifiers: ['exported'], format: ['camelCase', 'PascalCase'] },
				{ selector: 'variable', modifiers: ['exported', 'const'], format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
				{ selector: 'classMethod', format: ['camelCase'] },
				{ selector: 'function', format: ['camelCase'] },
				{ selector: 'parameter', format: ['camelCase'] },
				{ selector: 'variable', modifiers: ['const'], format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
				{ selector: 'variable', format: ['camelCase', 'PascalCase'] },
				{ selector: 'classProperty', modifiers: ['private'], format: ['camelCase'], leadingUnderscore: 'require' },
				{ selector: 'classProperty', modifiers: ['protected', 'public'], format: ['camelCase'], leadingUnderscore: 'forbid' }
			],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_+$',
					caughtErrorsIgnorePattern: '^_+$',
					varsIgnorePattern: '^_+$'
				}
			],
			'@typescript-eslint/typedef': [
				'error',
				{
					arrowParameter: true,
					memberVariableDeclaration: true,
					parameter: true,
					propertyDeclaration: true,
					variableDeclaration: true
				}
			]
		}
	},
	prettierConfig
];
