import { MelodicComponent } from '../../../../src/components/melodic-component.decorator';
import { html, css } from '../../../../src/template/template';

// Log when this module is loaded to demonstrate lazy loading
console.log('[Lazy] Settings page module loaded!');

@MelodicComponent({
	selector: 'settings-page',
	template: () => html`
		<div class="page">
			<h1>Settings</h1>
			<p class="lazy-badge">This page was lazy loaded!</p>

			<section class="settings-section">
				<h2>Appearance</h2>
				<label class="setting">
					<span>Dark Mode</span>
					<input type="checkbox" />
				</label>
				<label class="setting">
					<span>Compact View</span>
					<input type="checkbox" />
				</label>
			</section>

			<section class="settings-section">
				<h2>Notifications</h2>
				<label class="setting">
					<span>Email Notifications</span>
					<input type="checkbox" checked />
				</label>
				<label class="setting">
					<span>Push Notifications</span>
					<input type="checkbox" />
				</label>
			</section>

			<section class="settings-section">
				<h2>Privacy</h2>
				<label class="setting">
					<span>Share Analytics</span>
					<input type="checkbox" />
				</label>
			</section>
		</div>
	`,
	styles: () => css`
		.page {
			padding: 2rem;
			max-width: 600px;
			margin: 0 auto;
		}

		h1 {
			color: #333;
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
			background: white;
			border-radius: 8px;
			padding: 1.5rem;
			margin-bottom: 1.5rem;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

		.setting input[type="checkbox"] {
			width: 20px;
			height: 20px;
			cursor: pointer;
		}
	`
})
export class SettingsPageComponent {}
