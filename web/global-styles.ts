export function injectAltGlobalStyles(): void {
	const existing = document.getElementById('alt-global-styles');
	if (existing) return;

	const style = document.createElement('style');
	style.id = 'alt-global-styles';
	style.textContent = `
		@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@300;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

		:root {
			/* Color palette - refined and sophisticated */
			--alt-black: #0a0a0b;
			--alt-gray-900: #18181b;
			--alt-gray-800: #27272a;
			--alt-gray-700: #3f3f46;
			--alt-gray-600: #52525b;
			--alt-gray-500: #71717a;
			--alt-gray-400: #a1a1aa;
			--alt-gray-300: #d4d4d8;
			--alt-gray-200: #e4e4e7;
			--alt-gray-100: #f4f4f5;
			--alt-gray-50: #fafafa;
			--alt-white: #ffffff;

			/* Brand colors */
			--alt-primary: #7c3aed;
			--alt-primary-light: #a78bfa;
			--alt-primary-dark: #5b21b6;
			--alt-accent: #06b6d4;
			--alt-accent-light: #67e8f9;

			/* Gradients */
			--alt-gradient-primary: linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%);
			--alt-gradient-dark: linear-gradient(180deg, #18181b 0%, #0a0a0b 100%);
			--alt-gradient-hero: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124, 58, 237, 0.15) 0%, transparent 70%);

			/* Typography */
			--alt-font-display: 'Space Grotesk', system-ui, sans-serif;
			--alt-font-body: 'Inter', system-ui, sans-serif;
			--alt-font-mono: 'JetBrains Mono', 'SF Mono', monospace;
			--alt-font-logo: 'Montserrat', system-ui, sans-serif;

			/* Spacing */
			--alt-space-xs: 0.25rem;
			--alt-space-sm: 0.5rem;
			--alt-space-md: 1rem;
			--alt-space-lg: 1.5rem;
			--alt-space-xl: 2rem;
			--alt-space-2xl: 3rem;
			--alt-space-3xl: 4rem;
			--alt-space-4xl: 6rem;

			/* Border radius */
			--alt-radius-sm: 6px;
			--alt-radius-md: 10px;
			--alt-radius-lg: 16px;
			--alt-radius-xl: 24px;
			--alt-radius-full: 9999px;

			/* Shadows */
			--alt-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
			--alt-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
			--alt-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
			--alt-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
			--alt-shadow-glow: 0 0 40px rgba(124, 58, 237, 0.15);

			/* Transitions */
			--alt-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
			--alt-transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
			--alt-transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
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
			font-family: var(--alt-font-body);
			background: var(--alt-white);
			color: var(--alt-gray-900);
			line-height: 1.6;
			min-height: 100vh;
		}

		#alt-root {
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
			transition: color var(--alt-transition-fast), opacity var(--alt-transition-fast);
		}

		a:hover {
			text-decoration: none;
			opacity: 0.8;
		}

		a:focus-visible {
			outline: 2px solid var(--alt-primary);
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
			background: var(--alt-primary);
			color: var(--alt-white);
		}

		/* Scrollbar styling */
		::-webkit-scrollbar {
			width: 8px;
			height: 8px;
		}

		::-webkit-scrollbar-track {
			background: var(--alt-gray-100);
		}

		::-webkit-scrollbar-thumb {
			background: var(--alt-gray-300);
			border-radius: 4px;
		}

		::-webkit-scrollbar-thumb:hover {
			background: var(--alt-gray-400);
		}
	`;
	document.head.appendChild(style);
}
