import { css } from '../../../src/template/template';

export function myAppStyles() {
	return css`
		:host {
			display: block;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		}

		.app {
			min-height: 100vh;
			display: flex;
			flex-direction: column;
		}

		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 1rem 2rem;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		}

		.logo {
			margin: 0;
			font-size: 1.5rem;
			font-weight: 700;
			letter-spacing: -0.5px;
		}

		.nav {
			display: flex;
			gap: 0.5rem;
		}

		router-link {
			color: rgba(255, 255, 255, 0.9);
			text-decoration: none;
			padding: 0.5rem 1rem;
			border-radius: 6px;
			cursor: pointer;
			transition: all 0.2s ease;
			font-weight: 500;
		}

		router-link:hover {
			background: rgba(255, 255, 255, 0.15);
			color: white;
		}

		.content {
			flex: 1;
			background: #f5f7fa;
		}

		.footer {
			padding: 1.5rem 2rem;
			background: #2d3748;
			color: rgba(255, 255, 255, 0.7);
			text-align: center;
		}

		.footer p {
			margin: 0;
			font-size: 0.875rem;
		}
	`;
}
