import type { ThemeMode } from '../../types/index.js';

type ThemeChangeCallback = (theme: ThemeMode, resolvedTheme: 'light' | 'dark') => void;

// `null` until the first read, which adopts whatever the document already
// says. An inline anti-FOUC script setting data-theme="dark" before the module
// loads is the normal case, and assuming 'system' made the first toggleTheme()
// a no-op (it re-applied the theme that was already showing).
let currentTheme: ThemeMode | null = null;
const themeListeners: Set<ThemeChangeCallback> = new Set();
let mediaQueryCleanup: (() => void) | null = null;

function readDocumentTheme(): ThemeMode {
	if (typeof document === 'undefined') {
		return 'system';
	}

	const attribute = document.documentElement.getAttribute('data-theme');
	return attribute === 'light' || attribute === 'dark' ? attribute : 'system';
}

/**
 * Get the currently applied theme mode.
 *
 * Before `applyTheme()` has been called this reflects the document's own
 * `data-theme`, so a theme applied by an inline script is respected.
 */
export function getTheme(): ThemeMode {
	currentTheme ??= readDocumentTheme();
	return currentTheme;
}

/**
 * Get the resolved theme (light or dark) based on current mode
 */
export function getResolvedTheme(): 'light' | 'dark' {
	const theme = getTheme();

	if (theme === 'system') {
		if (typeof window === 'undefined' || !window.matchMedia) {
			return 'light';
		}
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	return theme;
}

/**
 * Apply a theme mode to the document
 * @param theme - 'light', 'dark', or 'system' (follows OS preference)
 */
export function applyTheme(theme: ThemeMode): void {
	// Clean up previous system listener
	if (mediaQueryCleanup) {
		mediaQueryCleanup();
		mediaQueryCleanup = null;
	}

	currentTheme = theme;

	// No-op in non-browser environments (SSR / tests without a DOM).
	if (typeof document === 'undefined' || typeof window === 'undefined' || !window.matchMedia) {
		notifyListeners(theme, theme === 'dark' ? 'dark' : 'light');
		return;
	}

	if (theme === 'system') {
		// Listen for system preference changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = () => {
			const resolved = mediaQuery.matches ? 'dark' : 'light';
			document.documentElement.setAttribute('data-theme', resolved);
			notifyListeners('system', resolved);
		};

		mediaQuery.addEventListener('change', handleChange);
		mediaQueryCleanup = () => mediaQuery.removeEventListener('change', handleChange);

		// Apply current system preference
		const resolved = mediaQuery.matches ? 'dark' : 'light';
		document.documentElement.setAttribute('data-theme', resolved);
		notifyListeners('system', resolved);
	} else {
		document.documentElement.setAttribute('data-theme', theme);
		notifyListeners(theme, theme);
	}
}

/**
 * Subscribe to theme changes
 * @param callback - Function called when theme changes
 * @returns Unsubscribe function
 */
export function onThemeChange(callback: ThemeChangeCallback): () => void {
	themeListeners.add(callback);
	return () => themeListeners.delete(callback);
}

function notifyListeners(theme: ThemeMode, resolved: 'light' | 'dark'): void {
	themeListeners.forEach((callback) => callback(theme, resolved));
}

/**
 * Toggle between light and dark themes
 * If currently on 'system', will switch to the opposite of current resolved theme
 */
export function toggleTheme(): void {
	const resolved = getResolvedTheme();
	applyTheme(resolved === 'light' ? 'dark' : 'light');
}
