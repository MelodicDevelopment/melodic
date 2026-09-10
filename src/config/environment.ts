export type Environment = 'dev' | 'qa' | 'prod';

export interface IViteEnv {
	VITE_ENV?: string;
	MODE?: string;
	PROD?: boolean;
	DEV?: boolean;
}

function readEnv(): IViteEnv | undefined {
	// `import.meta.env` only exists under a bundler (Vite statically replaces
	// these exact member expressions); guard so no-build CDN/import-map usage
	// doesn't throw at module load.
	try {
		return typeof import.meta !== 'undefined' ? ((import.meta as { env?: IViteEnv }).env ?? undefined) : undefined;
	} catch {
		return undefined;
	}
}

function isEnvironment(value: unknown): value is Environment {
	return value === 'dev' || value === 'qa' || value === 'prod';
}

/**
 * Resolve an environment from a bundler env object.
 *
 * Separated from `getEnvironment()` so the precedence rules are testable —
 * `import.meta.env` is statically replaced per module at build time, so it
 * cannot be mutated from a test.
 *
 * Order:
 *
 * 1. an explicit `VITE_ENV` (`dev` | `qa` | `prod`)
 * 2. Vite's `MODE` — so `vite build --mode qa` resolves to `'qa'` instead of
 *    falling through to `'prod'` as it used to. `development` and `production`
 *    map to `dev`/`prod`; any other mode whose name is a known environment is
 *    used directly.
 * 3. `PROD`
 * 4. `'dev'`
 */
export function resolveEnvironment(env: IViteEnv | undefined): Environment {
	if (env && isEnvironment(env.VITE_ENV)) {
		return env.VITE_ENV;
	}

	const mode = env?.MODE;
	if (typeof mode === 'string') {
		if (mode === 'development') {
			return 'dev';
		}
		if (mode === 'production') {
			return 'prod';
		}
		if (isEnvironment(mode)) {
			return mode;
		}
	}

	if (env?.PROD) {
		return 'prod';
	}

	return 'dev';
}

/** The current environment, resolved from the build's env. */
export function getEnvironment(): Environment {
	return resolveEnvironment(readEnv());
}

export const environment: Environment = getEnvironment();
