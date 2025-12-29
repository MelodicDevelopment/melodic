export function injectGlobalStyles(): void {
	const style = document.createElement('style');
	style.textContent = `
		:root {
			/* Primary Colors */
			--md-primary: #7c3aed;
			--md-primary-light: #a78bfa;
			--md-primary-dark: #5b21b6;

			/* Accent (Cyan) */
			--md-accent: #06b6d4;
			--md-accent-light: #22d3ee;
			--md-accent-dark: #0891b2;

			/* Grays */
			--md-gray-50: #fafafa;
			--md-gray-100: #f4f4f5;
			--md-gray-200: #e4e4e7;
			--md-gray-300: #d4d4d8;
			--md-gray-400: #a1a1aa;
			--md-gray-500: #71717a;
			--md-gray-600: #52525b;
			--md-gray-700: #3f3f46;
			--md-gray-800: #27272a;
			--md-gray-900: #18181b;

			/* Semantic */
			--md-white: #ffffff;
			--md-black: #000000;
			--md-success: #22c55e;
			--md-warning: #f59e0b;
			--md-error: #ef4444;

			/* Gradients */
			--md-gradient-primary: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
			--md-gradient-dark: linear-gradient(180deg, #18181b 0%, #27272a 100%);

			/* Typography */
			--md-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			--md-font-display: 'Space Grotesk', var(--md-font-sans);
			--md-font-mono: ui-monospace, 'SF Mono', 'Fira Code', monospace;

			/* Spacing */
			--md-spacing-xs: 0.25rem;
			--md-spacing-sm: 0.5rem;
			--md-spacing-md: 1rem;
			--md-spacing-lg: 1.5rem;
			--md-spacing-xl: 2rem;
			--md-spacing-2xl: 3rem;
			--md-spacing-3xl: 4rem;

			/* Border Radius */
			--md-radius-sm: 0.375rem;
			--md-radius-md: 0.5rem;
			--md-radius-lg: 0.75rem;
			--md-radius-xl: 1rem;
			--md-radius-full: 9999px;

			/* Transitions */
			--md-transition-fast: 150ms ease;
			--md-transition-normal: 250ms ease;

			/* Shadows */
			--md-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
			--md-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
			--md-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

			/* Legacy aliases for compatibility */
			--alt-primary: var(--md-primary);
			--alt-primary-light: var(--md-primary-light);
			--alt-primary-dark: var(--md-primary-dark);
			--alt-accent: var(--md-accent);
			--alt-accent-light: var(--md-accent-light);
			--alt-accent-dark: var(--md-accent-dark);
			--alt-gray-50: var(--md-gray-50);
			--alt-gray-100: var(--md-gray-100);
			--alt-gray-200: var(--md-gray-200);
			--alt-gray-300: var(--md-gray-300);
			--alt-gray-400: var(--md-gray-400);
			--alt-gray-500: var(--md-gray-500);
			--alt-gray-600: var(--md-gray-600);
			--alt-gray-700: var(--md-gray-700);
			--alt-gray-800: var(--md-gray-800);
			--alt-gray-900: var(--md-gray-900);
			--alt-white: var(--md-white);
			--alt-black: var(--md-black);
			--alt-success: var(--md-success);
			--alt-warning: var(--md-warning);
			--alt-error: var(--md-error);
			--alt-gradient-primary: var(--md-gradient-primary);
			--alt-gradient-dark: var(--md-gradient-dark);
			--alt-font-sans: var(--md-font-sans);
			--alt-font-display: var(--md-font-display);
			--alt-font-mono: var(--md-font-mono);
			--alt-radius-sm: var(--md-radius-sm);
			--alt-radius-md: var(--md-radius-md);
			--alt-radius-lg: var(--md-radius-lg);
			--alt-radius-xl: var(--md-radius-xl);
			--alt-radius-full: var(--md-radius-full);
			--alt-transition-fast: var(--md-transition-fast);
			--alt-transition-normal: var(--md-transition-normal);
			--alt-shadow-sm: var(--md-shadow-sm);
			--alt-shadow-md: var(--md-shadow-md);
			--alt-shadow-lg: var(--md-shadow-lg);
		}

		*,
		*::before,
		*::after {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}

		html {
			font-size: 16px;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
		}

		body {
			font-family: var(--md-font-sans);
			font-size: 1rem;
			line-height: 1.5;
			color: var(--md-gray-900);
			background-color: var(--md-white);
		}

		a {
			color: inherit;
			text-decoration: none;
		}

		button {
			font-family: inherit;
			font-size: inherit;
			border: none;
			background: none;
			cursor: pointer;
		}

		img {
			max-width: 100%;
			height: auto;
		}

		/* Router outlet styling */
		router-outlet {
			display: contents;
		}
	`;
	document.head.appendChild(style);
}
