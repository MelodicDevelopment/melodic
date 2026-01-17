import { MelodicComponent, html, css } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { applyTheme, getResolvedTheme, onThemeChange } from '@melodicdev/components/theme';
import type { ThemeMode } from '@melodicdev/components';

@MelodicComponent({
	selector: 'demo-app',
	template: (c: DemoApp) => html`
		<div class="demo-layout">
			<!-- Sidebar -->
			<aside class="demo-sidebar">
				<div class="demo-sidebar__header">
					<div class="demo-logo">
						<span class="demo-logo__icon">M</span>
					<span class="demo-logo__text">Melodic</span>
				</div>
				<span class="demo-version">v1.0.0</span>
			</div>

			<nav class="demo-nav">
				<span class="demo-nav__label">Components</span>
				<a href="#buttons" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'buttons')}>
					<span class="demo-nav__icon">○</span>Buttons
				</a>
				<a href="#cards" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'cards')}>
					<span class="demo-nav__icon">▢</span>Cards
				</a>
				<a href="#badges" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'badges')}>
					<span class="demo-nav__icon">●</span>Badges
				</a>
				<a href="#avatars" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'avatars')}>
					<span class="demo-nav__icon">◐</span>Avatars
				</a>
				<a href="#alerts" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'alerts')}>
					<span class="demo-nav__icon">△</span>Alerts
				</a>
				<a href="#dividers" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'dividers')}>
					<span class="demo-nav__icon">―</span>Dividers
				</a>
				<a href="#spinners" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'spinners')}>
					<span class="demo-nav__icon">◎</span>Spinners
				</a>
				<a href="#inputs" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'inputs')}>
					<span class="demo-nav__icon">▭</span>Inputs
				</a>
				<a href="#textareas" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'textareas')}>
					<span class="demo-nav__icon">▤</span>Textareas
				</a>
				<a href="#checkboxes" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'checkboxes')}>
					<span class="demo-nav__icon">☑</span>Checkboxes
				</a>
				<a href="#radios" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'radios')}>
					<span class="demo-nav__icon">◉</span>Radios
				</a>
				<a href="#toggles" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'toggles')}>
					<span class="demo-nav__icon">◑</span>Toggles
				</a>
			</nav>

				<div class="demo-sidebar__footer">
					<ml-toggle label="Dark mode" .checked=${c.isDark} @ml-change=${c.handleThemeToggle}></ml-toggle>
				</div>
			</aside>

			<!-- Main Content -->
			<div class="demo-content">
				<header class="demo-header">
					<div class="demo-header__intro">
						<h1>Component Library</h1>
						<p>A collection of beautiful, accessible UI components built with Melodic.</p>
					</div>
					<div class="demo-header__stats">
						<div class="demo-stat">
							<span class="demo-stat__value">31+</span>
							<span class="demo-stat__label">Components</span>
						</div>
						<div class="demo-stat">
							<span class="demo-stat__value">6</span>
							<span class="demo-stat__label">Categories</span>
						</div>
						<div class="demo-stat">
							<span class="demo-stat__value">100%</span>
							<span class="demo-stat__label">Accessible</span>
						</div>
					</div>
				</header>

				<main class="demo-main">
					<!-- Buttons Section -->
					<section id="buttons" class="demo-section">
						<div class="demo-section__header">
							<h2>Buttons</h2>
							<p>Interactive elements for triggering actions. Available in multiple variants and sizes.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Variants</h3>
								<span class="demo-card__badge">6 styles</span>
							</div>
							<div class="demo-row">
								<ml-button variant="primary">Primary</ml-button>
								<ml-button variant="secondary">Secondary</ml-button>
								<ml-button variant="outline">Outline</ml-button>
								<ml-button variant="ghost">Ghost</ml-button>
								<ml-button variant="danger">Danger</ml-button>
								<ml-button variant="link">Link</ml-button>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Sizes</h3>
								<span class="demo-card__badge">5 sizes</span>
							</div>
							<div class="demo-row demo-row--align-end">
								<ml-button size="xs">Extra Small</ml-button>
								<ml-button size="sm">Small</ml-button>
								<ml-button size="md">Medium</ml-button>
								<ml-button size="lg">Large</ml-button>
								<ml-button size="xl">Extra Large</ml-button>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>States</h3>
							</div>
							<div class="demo-row">
								<ml-button loading>Loading</ml-button>
								<ml-button disabled>Disabled</ml-button>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>With Tooltips</h3>
							</div>
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
					<section id="cards" class="demo-section">
						<div class="demo-section__header">
							<h2>Cards</h2>
							<p>Flexible containers for grouping related content and actions.</p>
						</div>

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
					<section id="badges" class="demo-section">
						<div class="demo-section__header">
							<h2>Badges</h2>
							<p>Small status indicators for highlighting information.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Variants</h3>
							</div>
							<div class="demo-row">
								<ml-badge>Default</ml-badge>
								<ml-badge variant="primary">Primary</ml-badge>
								<ml-badge variant="success">Success</ml-badge>
								<ml-badge variant="warning">Warning</ml-badge>
								<ml-badge variant="error">Error</ml-badge>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>With Dot Indicator</h3>
							</div>
							<div class="demo-row">
								<ml-badge variant="success" dot>Active</ml-badge>
								<ml-badge variant="error" dot>Offline</ml-badge>
								<ml-badge variant="warning" dot>Away</ml-badge>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Pill Shape</h3>
							</div>
							<div class="demo-row">
								<ml-badge pill>Label</ml-badge>
								<ml-badge variant="primary" pill>New</ml-badge>
								<ml-badge variant="success" pill>Complete</ml-badge>
							</div>
						</div>
					</section>

					<!-- Avatars Section -->
					<section id="avatars" class="demo-section">
						<div class="demo-section__header">
							<h2>Avatars</h2>
							<p>Visual representations of users or entities.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Sizes</h3>
								<span class="demo-card__badge">5 sizes</span>
							</div>
							<div class="demo-row demo-row--align-end">
								<ml-avatar size="xs" initials="XS"></ml-avatar>
								<ml-avatar size="sm" initials="SM"></ml-avatar>
								<ml-avatar size="md" initials="MD"></ml-avatar>
								<ml-avatar size="lg" initials="LG"></ml-avatar>
								<ml-avatar size="xl" initials="XL"></ml-avatar>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Initials & Fallback</h3>
							</div>
							<div class="demo-row">
								<ml-avatar initials="JD"></ml-avatar>
								<ml-avatar initials="AB"></ml-avatar>
								<ml-avatar></ml-avatar>
							</div>
						</div>
					</section>

					<!-- Alerts Section -->
					<section id="alerts" class="demo-section">
						<div class="demo-section__header">
							<h2>Alerts</h2>
							<p>Contextual feedback messages for user actions and system status.</p>
						</div>

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
					<section id="dividers" class="demo-section">
						<div class="demo-section__header">
							<h2>Dividers</h2>
							<p>Visual separators for organizing content into distinct sections.</p>
						</div>

						<div class="demo-card">
							<ml-stack gap="4">
								<p>Content above the divider</p>
								<ml-divider></ml-divider>
								<p>Content below the divider</p>
								<ml-divider>OR</ml-divider>
								<p>Divider with label</p>
							</ml-stack>
						</div>
					</section>

					<!-- Spinner Section -->
					<section id="spinners" class="demo-section">
						<div class="demo-section__header">
							<h2>Spinners</h2>
							<p>Loading indicators for async operations and pending states.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Sizes</h3>
								<span class="demo-card__badge">5 sizes</span>
							</div>
							<div class="demo-row demo-row--align-end">
								<ml-spinner size="xs"></ml-spinner>
								<ml-spinner size="sm"></ml-spinner>
								<ml-spinner size="md"></ml-spinner>
								<ml-spinner size="lg"></ml-spinner>
								<ml-spinner size="xl"></ml-spinner>
							</div>
						</div>
					</section>

					<!-- Input Section -->
					<section id="inputs" class="demo-section">
						<div class="demo-section__header">
							<h2>Inputs</h2>
							<p>Text fields for capturing user input with validation support.</p>
						</div>

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
					<section id="textareas" class="demo-section">
						<div class="demo-section__header">
							<h2>Textareas</h2>
							<p>Multi-line text inputs for longer form content.</p>
						</div>

						<div class="demo-grid">
							<ml-textarea label="Description" placeholder="Enter description..."></ml-textarea>
							<ml-textarea label="With Max Length" max-length="100" hint="Limited to 100 characters"></ml-textarea>
							<ml-textarea label="Resizable" resize></ml-textarea>
							<ml-textarea label="With Error" error="Description is required"></ml-textarea>
						</div>
					</section>

					<!-- Checkbox Section -->
					<section id="checkboxes" class="demo-section">
						<div class="demo-section__header">
							<h2>Checkboxes</h2>
							<p>Selection controls for multiple choice options.</p>
						</div>

						<div class="demo-card">
							<div class="demo-column">
								<ml-checkbox label="Default checkbox"></ml-checkbox>
								<ml-checkbox label="Checked by default" checked></ml-checkbox>
								<ml-checkbox label="With hint" hint="Additional information about this option"></ml-checkbox>
								<ml-checkbox label="Indeterminate state" indeterminate></ml-checkbox>
								<ml-checkbox label="Disabled" disabled></ml-checkbox>
							</div>
						</div>
					</section>

					<!-- Radio Section -->
					<section id="radios" class="demo-section">
						<div class="demo-section__header">
							<h2>Radio Buttons</h2>
							<p>Selection controls for mutually exclusive options.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Vertical Layout</h3>
							</div>
							<ml-radio-group label="Select an option" name="demo-radios">
								<ml-radio value="option1" label="Option 1"></ml-radio>
								<ml-radio value="option2" label="Option 2" checked></ml-radio>
								<ml-radio value="option3" label="Option 3"></ml-radio>
							</ml-radio-group>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Horizontal Layout</h3>
							</div>
							<ml-radio-group label="Choose one" orientation="horizontal" name="demo-radios-h">
								<ml-radio value="a" label="Choice A" checked></ml-radio>
								<ml-radio value="b" label="Choice B"></ml-radio>
								<ml-radio value="c" label="Choice C"></ml-radio>
							</ml-radio-group>
						</div>
					</section>

					<!-- Toggle Section -->
					<section id="toggles" class="demo-section">
						<div class="demo-section__header">
							<h2>Toggles</h2>
							<p>Switch controls for binary on/off settings.</p>
						</div>

						<div class="demo-card">
							<div class="demo-column">
								<ml-toggle label="Enable notifications"></ml-toggle>
								<ml-toggle label="Auto-save" checked></ml-toggle>
								<ml-toggle label="With hint" hint="This will enable automatic saving"></ml-toggle>
								<ml-toggle label="Disabled" disabled></ml-toggle>
							</div>
						</div>
					</section>
				</main>

				<footer class="demo-footer">
					<p>Built with Melodic Framework</p>
				</footer>
			</div>
		</div>
	`,
	styles: () => css`
		:host {
			display: block;
			min-height: 100vh;
			background-color: var(--ml-color-surface-raised, var(--ml-color-background));
			color: var(--ml-color-text);
			font-family: var(--ml-font-sans);
		}

		/* Layout */
		.demo-layout {
			display: flex;
			min-height: 100vh;
		}

		/* Sidebar */
		.demo-sidebar {
			position: fixed;
			left: 0;
			top: 0;
			bottom: 0;
			width: 260px;
			background-color: var(--ml-color-surface);
			border-right: 1px solid var(--ml-color-border);
			display: flex;
			flex-direction: column;
			z-index: 100;
		}

		.demo-sidebar__header {
			padding: var(--ml-space-5) var(--ml-space-4);
			border-bottom: 1px solid var(--ml-color-border);
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.demo-logo {
			display: flex;
			align-items: center;
			gap: var(--ml-space-3);
		}

		.demo-logo__icon {
			width: 32px;
			height: 32px;
			background: linear-gradient(135deg, var(--ml-blue-500), var(--ml-purple-600));
			border-radius: var(--ml-radius-md);
			display: flex;
			align-items: center;
			justify-content: center;
			color: white;
			font-weight: var(--ml-font-bold);
			font-size: var(--ml-text-lg);
		}

		.demo-logo__text {
			font-weight: var(--ml-font-semibold);
			font-size: var(--ml-text-lg);
			color: var(--ml-color-text);
		}

		.demo-version {
			font-size: var(--ml-text-xs);
			color: var(--ml-color-text-muted);
			background-color: var(--ml-color-surface-raised, var(--ml-gray-100));
			padding: var(--ml-space-1) var(--ml-space-2);
			border-radius: var(--ml-radius-full);
		}

		/* Navigation */
		.demo-nav {
			flex: 1;
			overflow-y: auto;
			padding: var(--ml-space-4);
		}

		.demo-nav__label {
			display: block;
			font-size: var(--ml-text-xs);
			font-weight: var(--ml-font-semibold);
			color: var(--ml-color-text-muted);
			text-transform: uppercase;
			letter-spacing: var(--ml-tracking-wider);
			margin-bottom: var(--ml-space-3);
			padding: 0 var(--ml-space-3);
		}

		.demo-nav__item {
			display: flex;
			align-items: center;
			gap: var(--ml-space-3);
			padding: var(--ml-space-2) var(--ml-space-3);
			border-radius: var(--ml-radius-md);
			color: var(--ml-color-text-secondary);
			text-decoration: none;
			font-size: var(--ml-text-sm);
			font-weight: var(--ml-font-medium);
			transition: all var(--ml-transition-fast);
			margin-bottom: var(--ml-space-1);
		}

		.demo-nav__item:hover {
			background-color: var(--ml-color-surface-raised, var(--ml-gray-100));
			color: var(--ml-color-text);
		}

		.demo-nav__icon {
			font-size: var(--ml-text-base);
			opacity: 0.7;
			width: 20px;
			text-align: center;
		}

		.demo-sidebar__footer {
			padding: var(--ml-space-4);
			border-top: 1px solid var(--ml-color-border);
		}

		/* Main Content */
		.demo-content {
			flex: 1;
			margin-left: 260px;
			min-height: 100vh;
			display: flex;
			flex-direction: column;
		}

		/* Header */
		.demo-header {
			background-color: var(--ml-color-surface);
			border-bottom: 1px solid var(--ml-color-border);
			padding: var(--ml-space-8);
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: var(--ml-space-8);
		}

		.demo-header__intro h1 {
			font-size: var(--ml-text-3xl);
			font-weight: var(--ml-font-bold);
			color: var(--ml-color-text);
			margin-bottom: var(--ml-space-2);
		}

		.demo-header__intro p {
			font-size: var(--ml-text-base);
			color: var(--ml-color-text-muted);
			max-width: 480px;
		}

		.demo-header__stats {
			display: flex;
			gap: var(--ml-space-8);
		}

		.demo-stat {
			text-align: center;
		}

		.demo-stat__value {
			display: block;
			font-size: var(--ml-text-2xl);
			font-weight: var(--ml-font-bold);
			color: var(--ml-color-primary);
		}

		.demo-stat__label {
			font-size: var(--ml-text-sm);
			color: var(--ml-color-text-muted);
		}

		/* Main */
		.demo-main {
			flex: 1;
			padding: var(--ml-space-8);
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-10);
			max-width: 900px;
		}

		/* Section */
		.demo-section {
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-5);
			scroll-margin-top: var(--ml-space-4);
		}

		.demo-section__header {
			margin-bottom: var(--ml-space-2);
		}

		.demo-section__header h2 {
			font-size: var(--ml-text-xl);
			font-weight: var(--ml-font-semibold);
			color: var(--ml-color-text);
			margin-bottom: var(--ml-space-1);
		}

		.demo-section__header p {
			font-size: var(--ml-text-sm);
			color: var(--ml-color-text-muted);
		}

		/* Card Container */
		.demo-card {
			background-color: var(--ml-color-surface);
			border: 1px solid var(--ml-color-border);
			border-radius: var(--ml-radius-lg);
			padding: var(--ml-space-5);
		}

		.demo-card__header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: var(--ml-space-4);
		}

		.demo-card__header h3 {
			font-size: var(--ml-text-sm);
			font-weight: var(--ml-font-medium);
			color: var(--ml-color-text-secondary);
		}

		.demo-card__badge {
			font-size: var(--ml-text-xs);
			color: var(--ml-color-text-muted);
			background-color: var(--ml-color-surface-raised, var(--ml-gray-100));
			padding: var(--ml-space-1) var(--ml-space-2);
			border-radius: var(--ml-radius-full);
		}

		/* Rows and Columns */
		.demo-row {
			display: flex;
			flex-wrap: wrap;
			gap: var(--ml-space-3);
			align-items: center;
		}

		.demo-row--align-end {
			align-items: flex-end;
		}

		.demo-column {
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-3);
		}

		/* Grid */
		.demo-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: var(--ml-space-4);
		}

		.demo-grid-3 {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: var(--ml-space-4);
		}

		/* Footer */
		.demo-footer {
			padding: var(--ml-space-6) var(--ml-space-8);
			border-top: 1px solid var(--ml-color-border);
			text-align: center;
		}

		.demo-footer p {
			font-size: var(--ml-text-sm);
			color: var(--ml-color-text-muted);
		}

		/* Responsive */
		@media (max-width: 1024px) {
			.demo-sidebar {
				display: none;
			}

			.demo-content {
				margin-left: 0;
			}

			.demo-header {
				flex-direction: column;
				align-items: flex-start;
			}

			.demo-header__stats {
				width: 100%;
				justify-content: space-between;
			}
		}

		@media (max-width: 640px) {
			.demo-header,
			.demo-main {
				padding: var(--ml-space-4);
			}

			.demo-header__stats {
				gap: var(--ml-space-4);
			}

			.demo-stat__value {
				font-size: var(--ml-text-xl);
			}
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

	handleNavClick = (event: Event, targetId: string): void => {
		event.preventDefault();
		const root = this.elementRef?.shadowRoot;
		const target = root?.getElementById(targetId);
		if (!target) return;

		target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		history.replaceState(null, '', `#${targetId}`);
	};
}

// Mount the app
const app = document.getElementById('app');
if (app) {
	app.innerHTML = '<demo-app></demo-app>';
}
