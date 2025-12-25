import { MelodicComponent } from '../../../src/components';
import { html, css } from '../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'demos-page',
	template: (component: DemosPageComponent) => html`
		<div class="demos-container">
			<nav class="demo-tabs">
				<button class=${component.activeTab === 'features' ? 'active' : ''} @click=${() => component.setTab('features')}>
					Features
				</button>
				<button class=${component.activeTab === 'forms' ? 'active' : ''} @click=${() => component.setTab('forms')}>Forms</button>
				<button class=${component.activeTab === 'portal' ? 'active' : ''} @click=${() => component.setTab('portal')}>Portal</button>
			</nav>

			<div class="demo-content">
				${component.activeTab === 'features' ? html`<feature-demo></feature-demo>` : ''}
				${component.activeTab === 'forms' ? html`<forms-demo></forms-demo>` : ''}
				${component.activeTab === 'portal' ? html`<portal-demo></portal-demo>` : ''}
			</div>
		</div>
	`,
	styles: () => css`
		.demos-container {
			padding: 20px;
		}

		.demo-tabs {
			display: flex;
			gap: 10px;
			margin-bottom: 20px;
			border-bottom: 2px solid #e9ecef;
			padding-bottom: 10px;
		}

		.demo-tabs button {
			padding: 10px 20px;
			border: none;
			background: transparent;
			cursor: pointer;
			font-size: 14px;
			font-weight: 500;
			color: #666;
			border-radius: 4px 4px 0 0;
			transition: all 0.2s;
		}

		.demo-tabs button:hover {
			color: #333;
			background: #f8f9fa;
		}

		.demo-tabs button.active {
			color: #007bff;
			background: #e7f3ff;
		}

		.demo-content {
			min-height: 400px;
		}
	`
})
export class DemosPageComponent {
	activeTab: 'features' | 'forms' | 'portal' = 'features';

	setTab = (tab: 'features' | 'forms' | 'portal') => {
		this.activeTab = tab;
	};
}
