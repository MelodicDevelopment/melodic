export type Environment = 'dev' | 'qa' | 'prod';

export function getEnvironment(): Environment {
	const viteEnv = import.meta.env.VITE_ENV;

	if (viteEnv === 'dev' || viteEnv === 'qa' || viteEnv === 'prod') {
		return viteEnv;
	}

	if (import.meta.env.PROD) {
		return 'prod';
	}

	return 'dev';
}

export const environment: Environment = getEnvironment();
