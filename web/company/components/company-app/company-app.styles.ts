import { css } from '../../../../src/template/functions/html.function';

export function companyAppStyles() {
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
			position: sticky;
			top: 0;
			z-index: 10;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 2rem;
			padding: 1.5rem 4vw;
			background: rgba(247, 244, 251, 0.92);
			backdrop-filter: blur(16px);
			border-bottom: 1px solid rgba(73, 33, 109, 0.08);
		}

		.brand {
			display: flex;
			flex-direction: column;
			gap: 0.35rem;
		}

		.logo {
			display: inline-flex;
			align-items: center;
			gap: 0.75rem;
			padding: 0;
			border-radius: 0;
		}

		.logo img {
			height: 44px;
			width: auto;
		}

		.tagline {
			font-size: 0.9rem;
			color: var(--md-ink-fade);
			letter-spacing: 0.01em;
		}

		.nav {
			display: flex;
			flex-wrap: wrap;
			gap: 0.75rem;
			align-items: center;
		}

		a[router-link],
		.nav-external {
			font-size: 0.9rem;
			font-weight: 600;
			padding: 0.45rem 0.8rem;
			border-radius: 999px;
			color: var(--md-ink-soft);
			transition: all 0.2s ease;
			border: 1px solid transparent;
		}

		a[router-link]:hover,
		.nav-external:hover {
			background: rgba(73, 33, 109, 0.08);
			border-color: rgba(73, 33, 109, 0.15);
			color: var(--md-purple);
		}

		a[router-link].active {
			background: var(--md-purple);
			color: white;
		}

		.logo[router-link],
		.logo[router-link].active {
			background: transparent;
			color: inherit;
			border-color: transparent;
		}

		.actions {
			display: flex;
			align-items: center;
			gap: 0.75rem;
		}

		.button {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			padding: 0.7rem 1.25rem;
			border-radius: 999px;
			font-weight: 700;
			font-size: 0.9rem;
			border: 1px solid transparent;
			transition: transform 0.2s ease, box-shadow 0.2s ease;
		}

		.button.primary {
			background: linear-gradient(135deg, var(--md-pink), var(--md-purple));
			color: white;
			box-shadow: 0 10px 24px rgba(73, 33, 109, 0.25);
		}

		.button.primary:hover {
			transform: translateY(-2px);
		}

		.content {
			flex: 1;
			padding: 3rem 4vw 4rem;
		}

		.site-footer {
			padding: 3rem 4vw 2.5rem;
			background: #110c1f;
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
			font-size: 1.3rem;
			margin: 0 0 0.5rem;
			color: white;
		}

		.site-footer h5 {
			text-transform: uppercase;
			font-size: 0.75rem;
			letter-spacing: 0.14em;
			color: rgba(255, 255, 255, 0.6);
			margin: 0 0 0.75rem;
		}

		.site-footer p {
			margin: 0 0 1rem;
			line-height: 1.6;
		}

		.site-footer ul {
			list-style: none;
			padding: 0;
			margin: 0;
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
				flex-direction: column;
				align-items: flex-start;
			}

			.actions {
				align-self: flex-start;
			}

			.footer-inner {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}
		}

		@media (max-width: 720px) {
			.content {
				padding: 2rem 6vw 3rem;
			}

			.site-header {
				padding: 1.25rem 6vw;
			}

			.footer-inner {
				grid-template-columns: 1fr;
			}
		}
	`;
}
