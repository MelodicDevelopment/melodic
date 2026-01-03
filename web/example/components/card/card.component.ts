import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src';

@MelodicComponent({
	selector: 'ui-card',
	template: () => html`
		<div class="card surface">
			<div class="card-header">
				<slot name="header">Default Header</slot>
			</div>
			<div class="card-body">
				<slot>Default content goes here</slot>
			</div>
			<div class="card-footer">
				<slot name="footer"></slot>
			</div>
		</div>
	`,
	styles: () => css`
		.card {
			border: 1px solid #e0e0e0;
			overflow: hidden;
		}

		.card-header {
			padding: 16px;
			background: #f5f5f5;
			border-bottom: 1px solid #e0e0e0;
			font-weight: 600;
		}

		.card-body {
			padding: 16px;
		}

		.card-footer {
			padding: 16px;
			background: #f5f5f5;
			border-top: 1px solid #e0e0e0;
		}

		.card-footer:empty {
			display: none;
		}
	`
})
export class CardComponent {}
