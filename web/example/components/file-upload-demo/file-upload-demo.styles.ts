import { css } from '../../../../src/template/functions/html.function';

export const fileUploadDemoStyles = () => css`
	.file-upload-demo {
		max-width: 640px;
	}

	h2 {
		font-size: 24px;
		font-weight: 600;
		margin: 0 0 8px;
		color: #111827;
	}

	.description {
		color: #6b7280;
		font-size: 14px;
		margin: 0 0 24px;
	}

	.demo-section {
		margin-bottom: 32px;
	}

	h3 {
		font-size: 16px;
		font-weight: 600;
		margin: 0 0 12px;
		color: #374151;
	}

	.file-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.icon-row {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
		align-items: center;
	}
`;
