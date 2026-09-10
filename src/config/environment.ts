export type Environment = 'dev' | 'qa' | 'prod';

interface IViteEnv {
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
 * Resolve the current environment, in order:
 *
 * 1. an explicit `VITE_ENV` (`dev` | `qa` | `prod`)
 * 2. Vite's `MODE` — so `vite build --mode qa` resolves to `'qa'` instead of
 *    falling through to `'prod'` as it used to. `development` and `production`
 *    map to `dev`/`prod`; any other mode whose name is a known environment is
 *    used directly.
 * 3. `PROD`
 * 4. `'dev'`
 */
export function getEnvironment(): Environment {
	const env = readEnv();

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

export const environment: Environment = getEnvironment();
