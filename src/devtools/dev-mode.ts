/**
 * The single source of truth for "are we in development?".
 *
 * Before this existed there were three independent switches — `bootstrap({
 * devMode })` (which gated only bootstrap logging), `import.meta.env.DEV`
 * (template diagnostics) and `import.meta.env.VITE_ENV`/`PROD` (config) — so a
 * dev build could have diagnostics on and dev mode off at the same time, and
 * consumers without a bundler got no diagnostics at all.
 *
 * Resolution order:
 * 1. an explicit `setDevMode()` override (what `bootstrap({ devMode })` uses)
 * 2. the bundler's statically-replaced `import.meta.env` flags
 * 3. a localhost check, so no-bundler / CDN consumers still get diagnostics
 */

interface IViteEnv {
	DEV?: boolean;
	PROD?: boolean;
	MODE?: string;
}

function readEnv(): IViteEnv | undefined {
	try {
		return typeof import.meta !== 'undefined' ? ((import.meta as { env?: IViteEnv }).env ?? undefined) : undefined;
	} catch {
		return undefined;
	}
}

function detect(): boolean {
	const env = readEnv();

	if (env) {
		if (typeof env.DEV === 'boolean') {
			return env.DEV;
		}
		if (typeof env.PROD === 'boolean') {
			return !env.PROD;
		}
		if (typeof env.MODE === 'string') {
			return env.MODE !== 'production';
		}
	}

	if (typeof location !== 'undefined' && typeof location.hostname === 'string') {
		return location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '[::1]' || location.hostname === '';
	}

	return false;
}

let override: boolean | null = null;
let cached: boolean | null = null;

/** True when development diagnostics (warnings, DevTools hooks) should run. */
export function isDevMode(): boolean {
	if (override !== null) {
		return override;
	}

	if (cached === null) {
		cached = detect();
	}

	return cached;
}

/**
 * Force dev mode on or off. `bootstrap({ devMode })` calls this; pass `null`
 * to fall back to detection (used by tests).
 */
export function setDevMode(enabled: boolean | null): void {
	override = enabled;
}

/**
 * Log a dev-only warning at most once per key. Every framework warning goes
 * through here so messages share one prefix and never spam a render loop.
 */
const warned = new Set<string>();

export function devWarn(key: string, ...message: unknown[]): void {
	if (!isDevMode() || warned.has(key)) {
		return;
	}

	warned.add(key);
	console.warn('[Melodic]', ...message);
}

/** Reset the once-per-key warning memory (tests). */
export function resetDevWarnings(): void {
	warned.clear();
}
