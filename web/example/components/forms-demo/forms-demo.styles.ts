import { css } from '../../../../src/template';

export function formsDemoStyles() {
	return css`
		.forms-demo {
			max-width: 500px;
			margin: 0 auto;
			padding: 20px;
		}

		h2 {
			margin: 0 0 10px 0;
			color: #333;
		}

		.description {
			color: #666;
			margin-bottom: 20px;
		}

		form {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.form-field {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}

		.form-field.checkbox {
			flex-direction: row;
			align-items: center;
		}

		.form-field.checkbox label {
			display: flex;
			align-items: center;
			gap: 8px;
			cursor: pointer;
		}

		label {
			font-weight: 500;
			color: #333;
		}

		input[type='text'],
		input[type='email'],
		input[type='password'],
		input[type='number'] {
			padding: 10px 12px;
			border: 1px solid #ccc;
			border-radius: 4px;
			font-size: 14px;
			transition: border-color 0.2s;
		}

		input:focus {
			outline: none;
			border-color: #007bff;
			box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
		}

		input.invalid {
			border-color: #dc3545;
		}

		input.invalid:focus {
			box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.1);
		}

		.errors {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}

		.error {
			color: #dc3545;
			font-size: 12px;
		}

		.pending {
			color: #007bff;
			font-size: 12px;
			font-style: italic;
		}

		.submit-result {
			padding: 12px;
			border-radius: 4px;
			font-weight: 500;
		}

		.submit-result.success {
			background: #d4edda;
			color: #155724;
			border: 1px solid #c3e6cb;
		}

		.submit-result.error {
			background: #f8d7da;
			color: #721c24;
			border: 1px solid #f5c6cb;
		}

		.form-actions {
			display: flex;
			gap: 10px;
			margin-top: 10px;
		}

		button {
			padding: 10px 20px;
			border: none;
			border-radius: 4px;
			font-size: 14px;
			font-weight: 500;
			cursor: pointer;
			transition: background-color 0.2s;
		}

		button[type='submit'] {
			background: #007bff;
			color: white;
		}

		button[type='submit']:hover:not(:disabled) {
			background: #0056b3;
		}

		button[type='submit']:disabled {
			background: #ccc;
			cursor: not-allowed;
		}

		button[type='button'] {
			background: #6c757d;
			color: white;
		}

		button[type='button']:hover {
			background: #545b62;
		}

		.debug-info {
			margin-top: 20px;
			padding: 10px;
			background: #f8f9fa;
			border-radius: 4px;
		}

		.debug-info summary {
			cursor: pointer;
			font-weight: 500;
			color: #666;
		}

		.debug-content {
			margin-top: 10px;
			font-size: 13px;
		}

		.debug-content p {
			margin: 4px 0;
		}

		.debug-content pre {
			background: #e9ecef;
			padding: 10px;
			border-radius: 4px;
			overflow-x: auto;
			font-size: 12px;
		}
	`;
}
