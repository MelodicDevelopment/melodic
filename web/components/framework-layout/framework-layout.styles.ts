import { css } from '../../../src/template/functions/html.function';
import { anchorStyles } from '../../shared-styles';

export function frameworkLayoutStyles() {
	return css`
		:host {
			display: flex;
			flex-direction: column;
			min-height: 100vh;
			background: linear-gradient(180deg, rgba(6, 182, 212, 0.05) 0%, var(--alt-white) 30%);
		}

		${anchorStyles()}

		/* Header */
		.header {
			position: sticky;
			top: 0;
			z-index: 100;
			background: rgba(255, 255, 255, 0.9);
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
			border-bottom: 1px solid var(--alt-gray-200);
		}

		.header-inner {
			display: flex;
			align-items: center;
			justify-content: space-between;
			max-width: 1280px;
			margin: 0 auto;
			padding: 1rem 2rem;
			gap: 2rem;
		}

		.logo {
			display: flex;
			align-items: center;
			gap: 0.75rem;
		}

		.logo img {
			height: 32px;
			width: auto;
		}

		.logo-text {
			font-family: var(--alt-font-display);
			font-weight: 700;
			font-size: 1.125rem;
			color: var(--alt-gray-900);
		}

		.nav {
			display: flex;
			align-items: center;
			gap: 0.25rem;
		}

		.nav a {
			padding: 0.5rem 1rem;
			font-size: 0.9375rem;
			font-weight: 500;
			color: var(--alt-gray-600);
			border-radius: var(--alt-radius-md);
			transition: color var(--alt-transition-fast), background var(--alt-transition-fast);
		}

		.nav a:hover {
			color: var(--alt-gray-900);
			background: var(--alt-gray-100);
		}

		.nav a.active {
			color: var(--alt-accent);
		}

		.header-actions {
			display: flex;
			align-items: center;
			gap: 1rem;
		}

		/* Buttons */
		.btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			padding: 0.625rem 1.25rem;
			font-size: 0.9375rem;
			font-weight: 600;
			border-radius: var(--alt-radius-full);
			transition: all var(--alt-transition-fast);
			white-space: nowrap;
		}

		.btn-primary {
			background: linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%);
			color: var(--alt-white);
			box-shadow: 0 2px 8px rgba(6, 182, 212, 0.25);
		}

		.btn-primary:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 16px rgba(6, 182, 212, 0.35);
		}

		.btn-ghost {
			color: var(--alt-gray-700);
			border: 1px solid var(--alt-gray-200);
		}

		.btn-ghost:hover {
			background: var(--alt-gray-50);
			border-color: var(--alt-gray-300);
		}

		.company-link {
			font-size: 0.875rem;
			font-weight: 500;
			color: var(--alt-gray-500);
			transition: color var(--alt-transition-fast);
		}

		.company-link:hover {
			color: var(--alt-gray-700);
		}

		/* Main */
		.main {
			flex: 1;
		}

		/* Footer */
		.footer {
			background: var(--alt-gray-900);
			color: var(--alt-gray-300);
			margin-top: auto;
		}

		.footer-inner {
			display: grid;
			grid-template-columns: 1fr 2fr;
			gap: 4rem;
			max-width: 1280px;
			margin: 0 auto;
			padding: 4rem 2rem;
		}

		.footer-brand .logo {
			margin-bottom: 1rem;
		}

		.footer-brand .logo img {
			height: 28px;
			filter: brightness(0) invert(1);
		}

		.footer-brand .logo-text {
			color: var(--alt-white);
		}

		.footer-tagline {
			font-size: 0.9375rem;
			line-height: 1.6;
			color: var(--alt-gray-400);
			max-width: 280px;
		}

		.footer-links {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 2rem;
		}

		.footer-col h4 {
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--alt-white);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 1rem;
		}

		.footer-col a {
			display: block;
			font-size: 0.9375rem;
			color: var(--alt-gray-400);
			padding: 0.375rem 0;
			transition: color var(--alt-transition-fast);
		}

		.footer-col a:hover {
			color: var(--alt-white);
		}

		.footer-bottom {
			border-top: 1px solid var(--alt-gray-800);
		}

		.footer-bottom-inner {
			max-width: 1280px;
			margin: 0 auto;
			padding: 1.5rem 2rem;
		}

		.footer-bottom p {
			font-size: 0.875rem;
			color: var(--alt-gray-500);
		}

		/* Responsive */
		@media (max-width: 1024px) {
			.nav {
				display: none;
			}

			.footer-inner {
				grid-template-columns: 1fr;
				gap: 3rem;
			}

			.footer-links {
				grid-template-columns: repeat(3, 1fr);
			}
		}

		@media (max-width: 640px) {
			.header-inner {
				padding: 0.875rem 1.25rem;
			}

			.footer-inner {
				padding: 3rem 1.25rem;
			}

			.footer-links {
				grid-template-columns: 1fr 1fr;
				gap: 2rem 1.5rem;
			}

			.footer-bottom-inner {
				padding: 1.25rem;
			}
		}
	`;
}
