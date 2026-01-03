import { css } from '../../../../src/template/functions/html.function';

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
			background: #f8f9fa;
			color: #333;
			box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
		}

		.logo {
			display: flex;
			align-items: center;
			text-decoration: none;
		}

		.logo img {
			height: 36px;
			width: auto;
		}

		.nav {
			display: flex;
			gap: 0.5rem;
		}

		a[router-link] {
			color: #49216d;
			text-decoration: none;
			padding: 0.5rem 1rem;
			border-radius: 6px;
			cursor: pointer;
			transition: all 0.2s ease;
			font-weight: 500;
		}

		a[router-link]:hover {
			background: rgba(73, 33, 109, 0.1);
			color: #ff0082;
		}

		a[router-link].active {
			background: #49216d;
			color: white;
		}

		.header-actions {
			display: flex;
			align-items: center;
			gap: 0.75rem;
		}

		.auth-btn {
			padding: 0.5rem 1rem;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			font-size: 0.875rem;
			font-weight: 500;
			transition: all 0.2s ease;
			background: #e74c3c;
			color: white;
		}

		.auth-btn.logged-in {
			background: #27ae60;
		}

		.auth-btn:hover {
			opacity: 0.9;
			transform: translateY(-1px);
		}

		.github-link {
			display: flex;
			align-items: center;
			justify-content: center;
			color: #49216d;
			padding: 0.5rem;
			border-radius: 6px;
			transition: all 0.2s ease;
		}

		.github-link:hover {
			background: rgba(73, 33, 109, 0.1);
			color: #ff0082;
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
