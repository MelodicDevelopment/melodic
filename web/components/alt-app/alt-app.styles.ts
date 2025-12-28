import { css } from '../../../src/template/functions/html.function';
import { anchorStyles } from '../../shared-styles';

export const altAppStyles = () => {
	return css`
		:host {
			display: flex;
			flex-direction: column;
			min-height: 100vh;
		}

		${anchorStyles()}

		/* Header */
		.header {
			position: sticky;
			top: 0;
			z-index: 100;
			background: rgba(255, 255, 255, 0.8);
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
			height: 36px;
			width: auto;
		}

		.logo-text {
			display: flex;
			flex-direction: column;
			line-height: 1;
		}

		.logo-melodic {
			font-family: var(--alt-font-logo);
			font-size: 1.5rem;
			font-weight: 700;
			letter-spacing: -0.02em;
			color: var(--alt-gray-900);
			letter-spacing: 2px;
		}

		.logo-development {
			font-family: var(--alt-font-logo);
			font-size: 0.6rem;
			font-weight: 300;
			letter-spacing: 0.34em;
			text-transform: uppercase;
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
			color: var(--alt-primary);
		}

		.nav-framework {
			margin-left: 0.75rem;
			background: var(--alt-gray-100);
			color: var(--alt-accent) !important;
		}

		.nav-framework:hover {
			background: var(--alt-gray-200);
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
			padding: 0.625rem 1.25rem;
			font-size: 0.9375rem;
			font-weight: 600;
			border-radius: var(--alt-radius-full);
			transition: all var(--alt-transition-fast);
			white-space: nowrap;
		}

		.btn-primary {
			background: var(--alt-gradient-primary);
			color: var(--alt-white);
			box-shadow: 0 2px 8px rgba(124, 58, 237, 0.25);
		}

		.btn-primary:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 16px rgba(124, 58, 237, 0.35);
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
			height: 32px;
			filter: brightness(0) invert(1);
		}

		.footer-brand .logo-melodic {
			color: var(--alt-white);
		}

		.footer-brand .logo-development {
			color: var(--alt-white);
		}

		.footer-tagline {
			font-size: 0.9375rem;
			line-height: 1.6;
			color: var(--alt-gray-400);
			max-width: 280px;
			margin-bottom: 1.5rem;
		}

		.footer-social {
			display: flex;
			gap: 0.75rem;
		}

		.social-link {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 36px;
			height: 36px;
			border-radius: var(--alt-radius-md);
			background: var(--alt-gray-800);
			color: var(--alt-gray-400);
			transition: all var(--alt-transition-fast);
		}

		.social-link:hover {
			background: var(--alt-gray-700);
			color: var(--alt-white);
		}

		.footer-links {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
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

		.footer-col a,
		.footer-col span {
			display: block;
			font-size: 0.9375rem;
			color: var(--alt-gray-400);
			padding: 0.375rem 0;
			transition: color var(--alt-transition-fast);
		}

		.footer-col a:hover {
			color: var(--alt-white);
		}

		.footer-meta {
			font-size: 0.875rem !important;
			color: var(--alt-gray-500) !important;
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
				grid-template-columns: repeat(2, 1fr);
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
};
