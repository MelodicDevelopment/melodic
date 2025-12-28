import { css } from '../../../../src/template/functions/html.function';

export function frameworkLayoutStyles() {
	return css`
		:host {
			display: block;
			font-family: var(--md-font-body);
			color: var(--md-ink);
		}

		.app {
			min-height: 100vh;
			display: flex;
			flex-direction: column;
		}

		.site-header {
			display: grid;
			grid-template-columns: 1.2fr 2fr auto;
			gap: 2rem;
			align-items: center;
			padding: 2rem 4vw;
			background: rgba(246, 251, 255, 0.9);
			backdrop-filter: blur(14px);
			border-bottom: 1px solid rgba(0, 157, 217, 0.14);
		}

		.brand {
			display: grid;
			gap: 0.4rem;
		}

		.logo {
			display: inline-flex;
			align-items: center;
			gap: 0.65rem;
			font-weight: 700;
			font-size: 1rem;
			color: var(--md-ink);
		}

		.logo img {
			height: 30px;
			width: 30px;
		}

		.brand p {
			margin: 0;
			color: var(--md-ink-fade);
			font-size: 0.9rem;
		}

		.nav {
			display: flex;
			flex-wrap: wrap;
			gap: 0.7rem;
		}

		a[router-link] {
			padding: 0.4rem 0.75rem;
			border-radius: 999px;
			font-weight: 600;
			font-size: 0.9rem;
			color: var(--md-ink-soft);
			transition: all 0.2s ease;
		}

		a[router-link]:hover {
			background: rgba(0, 157, 217, 0.12);
			color: var(--md-blue);
		}

		a[router-link].active {
			background: var(--md-blue);
			color: white;
		}

		.actions {
			display: flex;
			gap: 0.75rem;
			align-items: center;
		}

		.button {
			padding: 0.65rem 1.2rem;
			border-radius: 999px;
			font-weight: 700;
			font-size: 0.9rem;
			border: 1px solid transparent;
			transition: transform 0.2s ease;
		}

		.button.primary {
			background: linear-gradient(135deg, var(--md-blue), var(--md-purple));
			color: white;
			box-shadow: 0 12px 24px rgba(0, 157, 217, 0.25);
		}

		.button.ghost {
			border: 1px solid rgba(0, 157, 217, 0.25);
			color: var(--md-blue);
			background: rgba(255, 255, 255, 0.7);
		}

		.button:hover {
			transform: translateY(-2px);
		}

		.content {
			flex: 1;
			padding: 3.5rem 4vw 4.5rem;
		}

		.site-footer {
			padding: 3rem 4vw 2.5rem;
			background: #0a1624;
			color: rgba(255, 255, 255, 0.8);
		}

		.footer-inner {
			display: grid;
			grid-template-columns: 1.4fr 1fr 1fr 1fr;
			gap: 2.5rem;
			margin-bottom: 2rem;
		}

		.site-footer h4 {
			font-family: var(--md-font-display);
			margin: 0 0 0.5rem;
			color: white;
			font-size: 1.3rem;
		}

		.site-footer h5 {
			text-transform: uppercase;
			letter-spacing: 0.16em;
			font-size: 0.75rem;
			color: rgba(255, 255, 255, 0.6);
			margin: 0 0 0.75rem;
		}

		.site-footer p {
			margin: 0 0 1rem;
			line-height: 1.6;
		}

		.site-footer ul {
			margin: 0;
			padding: 0;
			list-style: none;
			display: grid;
			gap: 0.4rem;
		}

		.footer-social {
			display: flex;
			gap: 1rem;
			margin-top: 1rem;
		}

		.footer-social a {
			color: rgba(255, 255, 255, 0.85);
			font-weight: 600;
		}

		.footer-note {
			margin: 0;
			font-size: 0.85rem;
			color: rgba(255, 255, 255, 0.5);
		}

		@media (max-width: 1100px) {
			.site-header {
				grid-template-columns: 1fr;
			}

			.actions {
				justify-content: flex-start;
			}

			.footer-inner {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}
		}

		@media (max-width: 720px) {
			.content {
				padding: 2.5rem 6vw 3.5rem;
			}

			.site-header {
				padding: 1.5rem 6vw;
			}

			.footer-inner {
				grid-template-columns: 1fr;
			}
		}
	`;
}
