import { css } from '../../../../../src/template/functions/html.function';

export function settingsPageStyles() {
	return css`
		.page {
			padding: 2rem;
			max-width: 600px;
			margin: 0 auto;
		}

		h1 {
			margin-bottom: 0.5rem;
		}

		h2 {
			color: #555;
			font-size: 1.1rem;
			margin-bottom: 1rem;
			padding-bottom: 0.5rem;
			border-bottom: 1px solid #eee;
		}

		.lazy-badge {
			display: inline-block;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			padding: 0.25rem 0.75rem;
			border-radius: 20px;
			font-size: 0.85rem;
			margin-bottom: 2rem;
		}

		.settings-section {
			padding: 1.5rem;
			margin-bottom: 1.5rem;
		}

		.setting {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0.75rem 0;
			cursor: pointer;
		}

		.setting:not(:last-child) {
			border-bottom: 1px solid #f0f0f0;
		}

		.setting span {
			color: #333;
		}

		.setting input[type='checkbox'] {
			width: 20px;
			height: 20px;
			cursor: pointer;
		}
	`;
}
