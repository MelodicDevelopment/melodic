import { css } from '../../../src/template/functions/html.function';

export function featureDemoStyles() {
	return css`
		:host {
			--primary-color: #007bff;
			--secondary-color: #6c757d;

			.container {
				padding: 20px;
				font-family: system-ui, -apple-system, sans-serif;
				max-width: 1200px;
				margin: 0 auto;
			}

			h1 {
				color: #333;
				margin-bottom: 30px;
				transition: color 0.3s ease;
			}

			h2 {
				color: #555;
				font-size: 1.3em;
				margin-bottom: 15px;
			}

			h3 {
				font-size: 1.1em;
				margin-bottom: 10px;
				color: #666;
			}

			section {
				margin-bottom: 30px;
			}

			button {
				margin: 5px;
				padding: 8px 16px;
				border: none;
				border-radius: 4px;
				background: #007bff;
				color: white;
				cursor: pointer;
				font-size: 14px;
				transition: background 0.2s;
			}

			button:hover {
				background: #0056b3;
			}

			button.secondary {
				background: #6c757d;
			}

			button.secondary:hover {
				background: #5a6268;
			}

			button.add-btn {
				background: #28a745;
			}

			button.add-btn:hover {
				background: #218838;
			}

			input[type='text'],
			select {
				padding: 8px;
				border: 1px solid #ccc;
				border-radius: 4px;
				font-size: 14px;
			}

			input[type='text'] {
				width: 300px;
			}

			hr {
				margin: 30px 0;
				border: none;
				border-top: 1px solid #eee;
			}

			.alert {
				padding: 12px;
				border-radius: 4px;
				margin-top: 10px;
				animation: slideIn 0.3s ease-out;
			}

			.alert-success {
				background: #d4edda;
				border-left: 4px solid #28a745;
				color: #155724;
			}

			.alert-warning {
				background: #fff3cd;
				border-left: 4px solid #ffc107;
				color: #856404;
			}

			.alert-info {
				background: #d1ecf1;
				border-left: 4px solid #17a2b8;
				color: #0c5460;
			}

			@keyframes slideIn {
				from {
					opacity: 0;
					transform: translateY(-10px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}

			.info {
				background: #e7f3ff;
				padding: 12px;
				border-radius: 4px;
				border-left: 4px solid #007bff;
				margin-bottom: 20px;
			}

			.info code {
				background: #fff;
				padding: 2px 6px;
				border-radius: 3px;
				font-family: 'Courier New', monospace;
				color: #d63384;
			}

			.showcase-grid {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
				gap: 20px;
				margin-top: 20px;
			}

			.showcase-card {
				border: 1px solid #ddd;
				border-radius: 8px;
				padding: 20px;
				background: white;
			}

			.feature-box {
				background: #d4edda;
				border: 1px solid #28a745;
				border-radius: 4px;
				padding: 15px;
				margin-top: 10px;
				animation: fadeIn 0.3s;
			}

			@keyframes fadeIn {
				from {
					opacity: 0;
				}
				to {
					opacity: 1;
				}
			}

			.demo-box {
				padding: 20px;
				border: 2px solid #ddd;
				border-radius: 8px;
				text-align: center;
				margin: 10px 0;
				transition: all 0.3s;
				background: #f8f9fa;
			}

			.demo-box.active {
				background: #d4edda;
				border-color: #28a745;
				color: #155724;
			}

			.demo-box.disabled {
				opacity: 0.5;
				background: #e9ecef;
			}

			.demo-box.pulsing {
				animation: pulse 1s infinite;
			}

			@keyframes pulse {
				0%,
				100% {
					transform: scale(1);
				}
				50% {
					transform: scale(1.05);
				}
			}

			.style-demo-box {
				width: 100px;
				height: 100px;
				margin: 10px auto;
				display: flex;
				align-items: center;
				justify-content: center;
				color: white;
				font-weight: bold;
				transition: all 0.3s;
				background-color: #007bff;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
			}

			.controls {
				display: flex;
				flex-direction: column;
				gap: 10px;
				margin-top: 10px;
			}

			.controls label {
				display: flex;
				align-items: center;
				gap: 10px;
				font-size: 14px;
			}

			.controls input[type='range'] {
				flex: 1;
			}

			.warning {
				color: #856404;
				font-size: 14px;
				margin-bottom: 10px;
			}

			.html-demo {
				border: 1px solid #ddd;
				border-radius: 4px;
				padding: 15px;
				min-height: 60px;
				background: #f8f9fa;
			}

			.todo-input {
				display: flex;
				gap: 10px;
				margin-bottom: 15px;
				flex-wrap: wrap;
			}

			.todo-input input {
				flex: 1;
				min-width: 200px;
			}

			.todo-actions {
				margin-bottom: 15px;
			}

			.filter-controls {
				margin-bottom: 15px;
			}

			.filter-controls label {
				display: flex;
				align-items: center;
				gap: 8px;
				cursor: pointer;
			}

			.todo-list {
				list-style: none;
				padding: 0;
				margin: 0;
			}

			.todo-list li {
				display: flex;
				align-items: center;
				gap: 10px;
				padding: 12px;
				border: 1px solid #ddd;
				border-radius: 4px;
				margin-bottom: 8px;
				background: white;
				transition: all 0.2s;
			}

			.todo-list li:hover {
				background: #f8f9fa;
				border-color: #007bff;
			}

			.todo-list li.completed {
				background: #f0f0f0;
			}

			.todo-list li.completed .todo-text {
				text-decoration: line-through;
				color: #999;
			}

			.todo-list li.priority-high {
				border-left: 4px solid #dc3545;
			}

			.todo-list li.priority-medium {
				border-left: 4px solid #ffc107;
			}

			.todo-list li.priority-low {
				border-left: 4px solid #28a745;
			}

			.todo-text {
				flex: 1;
				font-size: 16px;
			}

			.todo-id {
				font-size: 12px;
				color: #999;
				font-family: monospace;
			}

			.priority-badge {
				font-size: 11px;
				padding: 3px 8px;
				border-radius: 12px;
				text-transform: uppercase;
				font-weight: bold;
			}

			.delete-btn {
				background: #dc3545;
				width: 28px;
				height: 28px;
				border-radius: 50%;
				padding: 0;
				font-size: 14px;
				line-height: 1;
				margin: 0;
			}

			.delete-btn:hover {
				background: #c82333;
			}

			input[type='checkbox'] {
				width: 20px;
				height: 20px;
				cursor: pointer;
			}

			.empty-state {
				text-align: center;
				padding: 40px;
				color: #999;
				font-size: 18px;
			}

			.stats {
				margin-top: 15px;
				padding: 10px;
				background: #f8f9fa;
				border-radius: 4px;
				font-size: 14px;
				color: #666;
			}

			/* Slots Demo */
			.slots-demo .cards-row {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
				gap: 20px;
				margin-top: 20px;
			}

			.slots-demo ui-card button {
				margin: 0;
			}
		}
	`;
}
