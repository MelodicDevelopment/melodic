export type Environment = 'dev' | 'qa' | 'prod';

export function getEnvironment(): Environment {
	// `import.meta.env` only exists under a bundler (Vite statically replaces
	// these exact member expressions); guard so no-build CDN/import-map usage
	// doesn't throw at module load. Without a bundler there is no env signal,
	// so fall back to 'dev'.
	const viteEnv = import.meta.env && import.meta.env.VITE_ENV;

	if (viteEnv === 'dev' || viteEnv === 'qa' || viteEnv === 'prod') {
		return viteEnv;
	}

	if (import.meta.env && import.meta.env.PROD) {
		return 'prod';
	}

	return 'dev';
}

export const environment: Environment = getEnvironment();
