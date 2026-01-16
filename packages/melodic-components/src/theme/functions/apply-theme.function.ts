import type { ThemeMode } from '../../types/index.js';

type ThemeChangeCallback = (theme: ThemeMode, resolvedTheme: 'light' | 'dark') => void;

let currentTheme: ThemeMode = 'system';
const themeListeners: Set<ThemeChangeCallback> = new Set();
let mediaQueryCleanup: (() => void) | null = null;

/**
 * Get the currently applied theme mode
 */
export function getTheme(): ThemeMode {
	return currentTheme;
}

/**
 * Get the resolved theme (light or dark) based on current mode
 */
export function getResolvedTheme(): 'light' | 'dark' {
	if (currentTheme === 'system') {
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	return currentTheme;
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
