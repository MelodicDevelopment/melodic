import { MelodicComponent, html, css } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { applyTheme, getResolvedTheme, onThemeChange } from '@melodicdev/components/theme';
import type { ThemeMode } from '@melodicdev/components';

@MelodicComponent({
	selector: 'demo-app',
	template: (c: DemoApp) => html`
		<div class="demo-app">
			<header class="demo-header">
				<h1>Melodic Components</h1>
				<div class="demo-header__actions">
					<ml-toggle label="Dark Mode" .checked=${c.isDark} @ml-change=${c.handleThemeToggle}></ml-toggle>
				</div>
			</header>

			<main class="demo-main">
				<!-- Buttons Section -->
				<section class="demo-section">
					<h2>Buttons</h2>

					<div class="demo-group">
						<h3>Variants</h3>
						<div class="demo-row">
							<ml-button variant="primary">Primary</ml-button>
							<ml-button variant="secondary">Secondary</ml-button>
							<ml-button variant="outline">Outline</ml-button>
							<ml-button variant="ghost">Ghost</ml-button>
							<ml-button variant="danger">Danger</ml-button>
							<ml-button variant="link">Link</ml-button>
						</div>
					</div>

					<div class="demo-group">
						<h3>Sizes</h3>
						<div class="demo-row">
							<ml-button size="xs">Extra Small</ml-button>
							<ml-button size="sm">Small</ml-button>
							<ml-button size="md">Medium</ml-button>
							<ml-button size="lg">Large</ml-button>
							<ml-button size="xl">Extra Large</ml-button>
						</div>
					</div>

					<div class="demo-group">
						<h3>States</h3>
						<div class="demo-row">
							<ml-button loading>Loading</ml-button>
							<ml-button disabled>Disabled</ml-button>
						</div>
					</div>

					<div class="demo-group">
						<h3>With Tooltips</h3>
						<div class="demo-row">
							<ml-tooltip content="This is a tooltip!">
								<ml-button>Hover me</ml-button>
							</ml-tooltip>
							<ml-tooltip content="Tooltip on bottom" placement="bottom">
								<ml-button variant="outline">Bottom tooltip</ml-button>
							</ml-tooltip>
						</div>
					</div>
				</section>

				<!-- Cards Section -->
				<section class="demo-section">
					<h2>Cards</h2>

					<div class="demo-grid-3">
						<ml-card>
							<h3 slot="header">Default Card</h3>
							<p>This is a default card with header and content.</p>
						</ml-card>

						<ml-card variant="elevated">
							<h3 slot="header">Elevated Card</h3>
							<p>This card has an elevated shadow.</p>
						</ml-card>

						<ml-card variant="outlined" hoverable>
							<h3 slot="header">Hoverable Card</h3>
							<p>Hover over this card to see the effect.</p>
						</ml-card>
					</div>
				</section>

				<!-- Badges Section -->
				<section class="demo-section">
					<h2>Badges</h2>

					<div class="demo-group">
						<h3>Variants</h3>
						<div class="demo-row">
							<ml-badge>Default</ml-badge>
							<ml-badge variant="primary">Primary</ml-badge>
							<ml-badge variant="success">Success</ml-badge>
							<ml-badge variant="warning">Warning</ml-badge>
							<ml-badge variant="error">Error</ml-badge>
						</div>
					</div>

					<div class="demo-group">
						<h3>With Dot</h3>
						<div class="demo-row">
							<ml-badge variant="success" dot>Active</ml-badge>
							<ml-badge variant="error" dot>Offline</ml-badge>
							<ml-badge variant="warning" dot>Away</ml-badge>
						</div>
					</div>

					<div class="demo-group">
						<h3>Pill Shape</h3>
						<div class="demo-row">
							<ml-badge pill>Label</ml-badge>
							<ml-badge variant="primary" pill>New</ml-badge>
							<ml-badge variant="success" pill>Complete</ml-badge>
						</div>
					</div>
				</section>

				<!-- Avatars Section -->
				<section class="demo-section">
					<h2>Avatars</h2>

					<div class="demo-group">
						<h3>Sizes</h3>
						<div class="demo-row">
							<ml-avatar size="xs" initials="XS"></ml-avatar>
							<ml-avatar size="sm" initials="SM"></ml-avatar>
							<ml-avatar size="md" initials="MD"></ml-avatar>
							<ml-avatar size="lg" initials="LG"></ml-avatar>
							<ml-avatar size="xl" initials="XL"></ml-avatar>
						</div>
					</div>

					<div class="demo-group">
						<h3>Initials & Fallback</h3>
						<div class="demo-row">
							<ml-avatar initials="JD"></ml-avatar>
							<ml-avatar initials="AB"></ml-avatar>
							<ml-avatar></ml-avatar>
						</div>
					</div>
				</section>

				<!-- Alerts Section -->
				<section class="demo-section">
					<h2>Alerts</h2>

					<ml-stack gap="4">
						<ml-alert variant="info" title="Information">
							This is an informational message for the user.
						</ml-alert>

						<ml-alert variant="success" title="Success">
							Your changes have been saved successfully.
						</ml-alert>

						<ml-alert variant="warning" title="Warning">
							Please review your input before proceeding.
						</ml-alert>

						<ml-alert variant="error" title="Error" dismissible>
							There was an error processing your request.
						</ml-alert>
					</ml-stack>
				</section>

				<!-- Dividers Section -->
				<section class="demo-section">
					<h2>Dividers</h2>

					<ml-stack gap="4">
						<p>Content above the divider</p>
						<ml-divider></ml-divider>
						<p>Content below the divider</p>
						<ml-divider>OR</ml-divider>
						<p>Divider with label</p>
					</ml-stack>
				</section>

				<!-- Spinner Section -->
				<section class="demo-section">
					<h2>Spinner</h2>
					<div class="demo-row">
						<ml-spinner size="xs"></ml-spinner>
						<ml-spinner size="sm"></ml-spinner>
						<ml-spinner size="md"></ml-spinner>
						<ml-spinner size="lg"></ml-spinner>
						<ml-spinner size="xl"></ml-spinner>
					</div>
				</section>

				<!-- Input Section -->
				<section class="demo-section">
					<h2>Inputs</h2>

					<div class="demo-grid">
						<ml-input label="Text Input" placeholder="Enter text..."></ml-input>
						<ml-input label="Email" type="email" placeholder="email@example.com"></ml-input>
						<ml-input label="With Hint" hint="This is a helpful hint"></ml-input>
						<ml-input label="With Error" error="This field is required"></ml-input>
						<ml-input label="Disabled" disabled placeholder="Disabled input"></ml-input>
						<ml-input label="Required" required placeholder="Required field"></ml-input>
					</div>
				</section>

				<!-- Textarea Section -->
				<section class="demo-section">
					<h2>Textarea</h2>

					<div class="demo-grid">
						<ml-textarea label="Description" placeholder="Enter description..."></ml-textarea>
						<ml-textarea label="With Max Length" max-length="100" hint="Limited to 100 characters"></ml-textarea>
						<ml-textarea label="Resizable" resize></ml-textarea>
						<ml-textarea label="With Error" error="Description is required"></ml-textarea>
					</div>
				</section>

				<!-- Checkbox Section -->
				<section class="demo-section">
					<h2>Checkbox</h2>

					<div class="demo-column">
						<ml-checkbox label="Default checkbox"></ml-checkbox>
						<ml-checkbox label="Checked by default" checked></ml-checkbox>
						<ml-checkbox label="With hint" hint="Additional information about this option"></ml-checkbox>
						<ml-checkbox label="Indeterminate state" indeterminate></ml-checkbox>
						<ml-checkbox label="Disabled" disabled></ml-checkbox>
					</div>
				</section>

				<!-- Radio Section -->
				<section class="demo-section">
					<h2>Radio</h2>

					<ml-radio-group label="Select an option" name="demo-radios">
						<ml-radio value="option1" label="Option 1"></ml-radio>
						<ml-radio value="option2" label="Option 2" checked></ml-radio>
						<ml-radio value="option3" label="Option 3"></ml-radio>
					</ml-radio-group>

					<div class="demo-group" style="margin-top: var(--ml-space-6)">
						<h3>Horizontal Layout</h3>
						<ml-radio-group label="Choose one" orientation="horizontal" name="demo-radios-h">
							<ml-radio value="a" label="Choice A" checked></ml-radio>
							<ml-radio value="b" label="Choice B"></ml-radio>
							<ml-radio value="c" label="Choice C"></ml-radio>
						</ml-radio-group>
					</div>
				</section>

				<!-- Toggle Section -->
				<section class="demo-section">
					<h2>Toggle</h2>

					<div class="demo-column">
						<ml-toggle label="Enable notifications"></ml-toggle>
						<ml-toggle label="Auto-save" checked></ml-toggle>
						<ml-toggle label="With hint" hint="This will enable automatic saving"></ml-toggle>
						<ml-toggle label="Disabled" disabled></ml-toggle>
					</div>
				</section>
			</main>
		</div>
	`,
	styles: () => css`
		:host {
			display: block;
			min-height: 100vh;
			background-color: var(--ml-color-background);
			color: var(--ml-color-text);
		}

		.demo-app {
			max-width: 1200px;
			margin: 0 auto;
			padding: var(--ml-space-6);
		}

		.demo-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding-bottom: var(--ml-space-6);
			border-bottom: var(--ml-border) solid var(--ml-color-border);
			margin-bottom: var(--ml-space-8);
		}

		.demo-header h1 {
			font-size: var(--ml-text-3xl);
			font-weight: var(--ml-font-bold);
		}

		.demo-main {
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-12);
		}

		.demo-section {
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-6);
		}

		.demo-section h2 {
			font-size: var(--ml-text-2xl);
			font-weight: var(--ml-font-semibold);
			padding-bottom: var(--ml-space-2);
			border-bottom: var(--ml-border) solid var(--ml-color-border);
		}

		.demo-group {
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-3);
		}

		.demo-group h3 {
			font-size: var(--ml-text-lg);
			font-weight: var(--ml-font-medium);
			color: var(--ml-color-text-secondary);
		}

		.demo-row {
			display: flex;
			flex-wrap: wrap;
			gap: var(--ml-space-3);
			align-items: center;
		}

		.demo-column {
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-3);
		}

		.demo-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: var(--ml-space-4);
		}

		.demo-grid-3 {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
			gap: var(--ml-space-4);
		}
	`
})
export class DemoApp implements IElementRef {
	elementRef!: HTMLElement;

	isDark = false;

	constructor() {
		this.isDark = getResolvedTheme() === 'dark';
		onThemeChange((_mode: ThemeMode, resolved: 'light' | 'dark') => {
			this.isDark = resolved === 'dark';
		});
	}

	handleThemeToggle = (event: CustomEvent): void => {
		const { checked } = event.detail;
		applyTheme(checked ? 'dark' : 'light');
	};
}

// Mount the app
const app = document.getElementById('app');
if (app) {
	app.innerHTML = '<demo-app></demo-app>';
}
