export function injectGlobalStyles(): void {
	const existing = document.getElementById('global-styles');
	if (existing) return;

	const style = document.createElement('style');
	style.id = 'global-styles';
	style.textContent = `
		@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@300;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

		:root {
			/* Color palette - refined and sophisticated */
			--color-black: #0a0a0b;
			--color-gray-900: #18181b;
			--color-gray-800: #27272a;
			--color-gray-700: #3f3f46;
			--color-gray-600: #52525b;
			--color-gray-500: #71717a;
			--color-gray-400: #a1a1aa;
			--color-gray-300: #d4d4d8;
			--color-gray-200: #e4e4e7;
			--color-gray-100: #f4f4f5;
			--color-gray-50: #fafafa;
			--color-white: #ffffff;

			/* Brand colors */
			--color-primary: #7c3aed;
			--color-primary-light: #a78bfa;
			--color-primary-dark: #5b21b6;
			--color-accent: #06b6d4;
			--color-accent-light: #67e8f9;

			/* Gradients */
			--gradient-primary: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
			--gradient-dark: linear-gradient(180deg, #18181b 0%, #0a0a0b 100%);
			--gradient-hero: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124, 58, 237, 0.15) 0%, transparent 70%);

			/* Typography */
			--font-display: 'Space Grotesk', system-ui, sans-serif;
			--font-body: 'Inter', system-ui, sans-serif;
			--font-mono: 'JetBrains Mono', 'SF Mono', monospace;
			--font-logo: 'Montserrat', system-ui, sans-serif;

			/* Spacing */
			--space-xs: 0.25rem;
			--space-sm: 0.5rem;
			--space-md: 1rem;
			--space-lg: 1.5rem;
			--space-xl: 2rem;
			--space-2xl: 3rem;
			--space-3xl: 4rem;
			--space-4xl: 6rem;

			/* Border radius */
			--radius-sm: 6px;
			--radius-md: 10px;
			--radius-lg: 16px;
			--radius-xl: 24px;
			--radius-full: 9999px;

			/* Shadows */
			--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
			--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
			--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
			--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
			--shadow-glow: 0 0 40px rgba(124, 58, 237, 0.15);

			/* Transitions */
			--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
			--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
			--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

			/* Legacy alt- prefixed variables for compatibility */
			--alt-black: var(--color-black);
			--alt-gray-900: var(--color-gray-900);
			--alt-gray-800: var(--color-gray-800);
			--alt-gray-700: var(--color-gray-700);
			--alt-gray-600: var(--color-gray-600);
			--alt-gray-500: var(--color-gray-500);
			--alt-gray-400: var(--color-gray-400);
			--alt-gray-300: var(--color-gray-300);
			--alt-gray-200: var(--color-gray-200);
			--alt-gray-100: var(--color-gray-100);
			--alt-gray-50: var(--color-gray-50);
			--alt-white: var(--color-white);
			--alt-primary: var(--color-primary);
			--alt-primary-light: var(--color-primary-light);
			--alt-primary-dark: var(--color-primary-dark);
			--alt-accent: var(--color-accent);
			--alt-accent-light: var(--color-accent-light);
			--alt-gradient-primary: var(--gradient-primary);
			--alt-gradient-dark: var(--gradient-dark);
			--alt-gradient-hero: var(--gradient-hero);
			--alt-font-display: var(--font-display);
			--alt-font-body: var(--font-body);
			--alt-font-mono: var(--font-mono);
			--alt-font-logo: var(--font-logo);
			--alt-space-xs: var(--space-xs);
			--alt-space-sm: var(--space-sm);
			--alt-space-md: var(--space-md);
			--alt-space-lg: var(--space-lg);
			--alt-space-xl: var(--space-xl);
			--alt-space-2xl: var(--space-2xl);
			--alt-space-3xl: var(--space-3xl);
			--alt-space-4xl: var(--space-4xl);
			--alt-radius-sm: var(--radius-sm);
			--alt-radius-md: var(--radius-md);
			--alt-radius-lg: var(--radius-lg);
			--alt-radius-xl: var(--radius-xl);
			--alt-radius-full: var(--radius-full);
			--alt-shadow-sm: var(--shadow-sm);
			--alt-shadow-md: var(--shadow-md);
			--alt-shadow-lg: var(--shadow-lg);
			--alt-shadow-xl: var(--shadow-xl);
			--alt-shadow-glow: var(--shadow-glow);
			--alt-transition-fast: var(--transition-fast);
			--alt-transition-base: var(--transition-base);
			--alt-transition-slow: var(--transition-slow);
		}

		*, *::before, *::after {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		}

		html {
			font-size: 16px;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
			text-rendering: optimizeLegibility;
		}

		body {
			font-family: var(--font-body);
			background: var(--color-white);
			color: var(--color-gray-900);
			line-height: 1.6;
			min-height: 100vh;
		}

		#app-root {
			min-height: 100vh;
			display: flex;
			flex-direction: column;
		}

		img, picture, video, canvas, svg {
			display: block;
			max-width: 100%;
		}

		a {
			color: inherit;
			text-decoration: none;
			transition: color var(--transition-fast), opacity var(--transition-fast);
		}

		a:hover {
			text-decoration: none;
			opacity: 0.8;
		}

		a:focus-visible {
			outline: 2px solid var(--color-primary);
			outline-offset: 2px;
			border-radius: 2px;
		}

		button {
			font: inherit;
			cursor: pointer;
			border: none;
			background: none;
		}

		input, textarea, select {
			font: inherit;
		}

		::selection {
			background: var(--color-primary);
			color: var(--color-white);
		}

		/* Scrollbar styling */
		::-webkit-scrollbar {
			width: 8px;
			height: 8px;
		}

		::-webkit-scrollbar-track {
			background: var(--color-gray-100);
		}

		::-webkit-scrollbar-thumb {
			background: var(--color-gray-300);
			border-radius: 4px;
		}

		::-webkit-scrollbar-thumb:hover {
			background: var(--color-gray-400);
		}
	`;
	document.head.appendChild(style);
}
