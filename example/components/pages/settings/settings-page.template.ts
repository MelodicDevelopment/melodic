import { html } from '../../../../src/template/functions/html.function';

export function settingsPageTemplate() {
	return html`
		<div class="page">
			<h1>Settings</h1>
			<p class="lazy-badge">This page was lazy loaded!</p>

			<section class="settings-section surface-soft">
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

			<section class="settings-section surface-soft">
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

			<section class="settings-section surface-soft">
				<h2>Privacy</h2>
				<label class="setting">
					<span>Share Analytics</span>
					<input type="checkbox" />
				</label>
			</section>
		</div>
	`;
}
