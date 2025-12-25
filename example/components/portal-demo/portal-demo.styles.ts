import { css } from '../../../src/template';

export function portalDemoStyles() {
	return css`
		.portal-demo {
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
		}

		h2 {
			margin: 0 0 10px 0;
			color: #333;
		}

		h3 {
			margin: 20px 0 10px 0;
			color: #444;
		}

		.description {
			color: #666;
			margin-bottom: 20px;
		}

		.demo-section {
			margin-bottom: 30px;
			padding: 20px;
			background: #f8f9fa;
			border-radius: 8px;
		}

		.demo-section p {
			color: #666;
			margin: 0 0 15px 0;
		}

		button {
			padding: 10px 20px;
			border: none;
			border-radius: 4px;
			font-size: 14px;
			font-weight: 500;
			cursor: pointer;
			background: #007bff;
			color: white;
			transition: background-color 0.2s;
		}

		button:hover {
			background: #0056b3;
		}

		.tooltip-trigger {
			background: #6c757d;
		}

		.tooltip-trigger:hover {
			background: #545b62;
		}

		/* Notification container */
		.notification-container {
			position: fixed;
			top: 20px;
			right: 20px;
			display: flex;
			flex-direction: column;
			gap: 10px;
			z-index: 1000;
		}

		.info-box {
			background: #e7f3ff;
			border: 1px solid #b6d4fe;
			border-radius: 8px;
			padding: 15px 20px;
		}

		.info-box h4 {
			margin: 0 0 10px 0;
			color: #0a58ca;
		}

		.info-box ul {
			margin: 0;
			padding-left: 20px;
		}

		.info-box li {
			margin: 5px 0;
			color: #444;
		}

		.info-box code {
			background: #fff;
			padding: 2px 6px;
			border-radius: 3px;
			font-size: 13px;
			color: #d63384;
		}
	`;
}
