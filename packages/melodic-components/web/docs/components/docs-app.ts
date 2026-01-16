import { MelodicComponent, html, css, when } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { applyTheme, getResolvedTheme, onThemeChange } from '@melodicdev/components/theme';
import type { ThemeMode } from '@melodicdev/components';

type Page = 'getting-started' | 'theming' | 'button' | 'input' | 'textarea' | 'checkbox' | 'radio' | 'toggle' | 'spinner';

@MelodicComponent({
	selector: 'docs-app',
	template: (c: DocsApp) => html`
		<div class="docs">
			<aside class="docs__sidebar">
				<div class="docs__logo">
					<h1>Melodic UI</h1>
					<span class="docs__version">v0.1.0</span>
				</div>

				<nav class="docs__nav">
					<div class="docs__nav-section">
						<h3>Getting Started</h3>
						<ul>
							<li>
								<a href="#" class="${c.page === 'getting-started' ? 'active' : ''}" @click=${() => c.navigate('getting-started')}>
									Introduction
								</a>
							</li>
							<li>
								<a href="#" class="${c.page === 'theming' ? 'active' : ''}" @click=${() => c.navigate('theming')}> Theming </a>
							</li>
						</ul>
					</div>

					<div class="docs__nav-section">
						<h3>Form Components</h3>
						<ul>
							<li>
								<a href="#" class="${c.page === 'button' ? 'active' : ''}" @click=${() => c.navigate('button')}> Button </a>
							</li>
							<li>
								<a href="#" class="${c.page === 'input' ? 'active' : ''}" @click=${() => c.navigate('input')}> Input </a>
							</li>
							<li>
								<a href="#" class="${c.page === 'textarea' ? 'active' : ''}" @click=${() => c.navigate('textarea')}> Textarea </a>
							</li>
							<li>
								<a href="#" class="${c.page === 'checkbox' ? 'active' : ''}" @click=${() => c.navigate('checkbox')}> Checkbox </a>
							</li>
							<li>
								<a href="#" class="${c.page === 'radio' ? 'active' : ''}" @click=${() => c.navigate('radio')}> Radio </a>
							</li>
							<li>
								<a href="#" class="${c.page === 'toggle' ? 'active' : ''}" @click=${() => c.navigate('toggle')}> Toggle </a>
							</li>
						</ul>
					</div>

					<div class="docs__nav-section">
						<h3>Feedback</h3>
						<ul>
							<li>
								<a href="#" class="${c.page === 'spinner' ? 'active' : ''}" @click=${() => c.navigate('spinner')}> Spinner </a>
							</li>
						</ul>
					</div>
				</nav>

				<div class="docs__theme-toggle">
					<ml-toggle label="Dark Mode" .checked=${c.isDark} @ml-change=${c.handleThemeToggle}></ml-toggle>
				</div>
			</aside>

			<main class="docs__content">
				${when(c.page === 'getting-started', () => c.renderGettingStarted())}
				${when(c.page === 'theming', () => c.renderTheming())}
				${when(c.page === 'button', () => c.renderButton())}
				${when(c.page === 'input', () => c.renderInput())}
				${when(c.page === 'textarea', () => c.renderTextarea())}
				${when(c.page === 'checkbox', () => c.renderCheckbox())}
				${when(c.page === 'radio', () => c.renderRadio())}
				${when(c.page === 'toggle', () => c.renderToggle())}
				${when(c.page === 'spinner', () => c.renderSpinner())}
			</main>
		</div>
	`,
	styles: () => css`
		:host {
			display: block;
			min-height: 100vh;
			background-color: var(--ml-color-background);
			color: var(--ml-color-text);
			font-family: var(--ml-font-sans);
		}

		.docs {
			display: grid;
			grid-template-columns: 280px 1fr;
			min-height: 100vh;
		}

		/* Sidebar */
		.docs__sidebar {
			position: sticky;
			top: 0;
			height: 100vh;
			overflow-y: auto;
			padding: var(--ml-space-6);
			background-color: var(--ml-color-surface);
			border-right: var(--ml-border) solid var(--ml-color-border);
			display: flex;
			flex-direction: column;
		}

		.docs__logo {
			display: flex;
			align-items: baseline;
			gap: var(--ml-space-2);
			margin-bottom: var(--ml-space-6);
		}

		.docs__logo h1 {
			font-size: var(--ml-text-xl);
			font-weight: var(--ml-font-bold);
		}

		.docs__version {
			font-size: var(--ml-text-xs);
			color: var(--ml-color-text-muted);
			background: var(--ml-color-surface-raised);
			padding: var(--ml-space-0.5) var(--ml-space-1.5);
			border-radius: var(--ml-radius-sm);
		}

		.docs__nav {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-6);
		}

		.docs__nav-section h3 {
			font-size: var(--ml-text-xs);
			font-weight: var(--ml-font-semibold);
			text-transform: uppercase;
			letter-spacing: var(--ml-tracking-wide);
			color: var(--ml-color-text-muted);
			margin-bottom: var(--ml-space-2);
		}

		.docs__nav-section ul {
			list-style: none;
			padding: 0;
			margin: 0;
		}

		.docs__nav-section li {
			margin: 0;
		}

		.docs__nav-section a {
			display: block;
			padding: var(--ml-space-2) var(--ml-space-3);
			border-radius: var(--ml-radius);
			font-size: var(--ml-text-sm);
			color: var(--ml-color-text-secondary);
			text-decoration: none;
			transition: all var(--ml-duration-150) var(--ml-ease-in-out);
		}

		.docs__nav-section a:hover {
			background-color: var(--ml-color-surface-raised);
			color: var(--ml-color-text);
		}

		.docs__nav-section a.active {
			background-color: var(--ml-color-primary-subtle);
			color: var(--ml-color-primary);
			font-weight: var(--ml-font-medium);
		}

		.docs__theme-toggle {
			padding-top: var(--ml-space-4);
			border-top: var(--ml-border) solid var(--ml-color-border);
		}

		/* Content */
		.docs__content {
			padding: var(--ml-space-8) var(--ml-space-12);
			max-width: 900px;
		}

		.docs__page {
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-8);
		}

		.docs__page h1 {
			font-size: var(--ml-text-4xl);
			font-weight: var(--ml-font-bold);
		}

		.docs__page h2 {
			font-size: var(--ml-text-2xl);
			font-weight: var(--ml-font-semibold);
			margin-top: var(--ml-space-4);
		}

		.docs__page p {
			font-size: var(--ml-text-base);
			line-height: var(--ml-leading-relaxed);
			color: var(--ml-color-text-secondary);
		}

		.docs__demo {
			padding: var(--ml-space-6);
			background-color: var(--ml-color-surface-raised);
			border: var(--ml-border) solid var(--ml-color-border);
			border-radius: var(--ml-radius-lg);
		}

		.docs__demo-row {
			display: flex;
			flex-wrap: wrap;
			gap: var(--ml-space-3);
			align-items: center;
		}

		.docs__demo-column {
			display: flex;
			flex-direction: column;
			gap: var(--ml-space-3);
		}

		.docs__demo-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: var(--ml-space-4);
		}

		.docs__code {
			background-color: var(--ml-gray-900);
			color: var(--ml-gray-100);
			padding: var(--ml-space-4);
			border-radius: var(--ml-radius-md);
			font-family: var(--ml-font-mono);
			font-size: var(--ml-text-sm);
			overflow-x: auto;
		}

		.docs__table {
			width: 100%;
			border-collapse: collapse;
			font-size: var(--ml-text-sm);
		}

		.docs__table th,
		.docs__table td {
			text-align: left;
			padding: var(--ml-space-3);
			border-bottom: var(--ml-border) solid var(--ml-color-border);
		}

		.docs__table th {
			font-weight: var(--ml-font-semibold);
			background-color: var(--ml-color-surface-raised);
		}

		.docs__table code {
			background-color: var(--ml-color-surface-raised);
			padding: var(--ml-space-0.5) var(--ml-space-1);
			border-radius: var(--ml-radius-sm);
			font-family: var(--ml-font-mono);
			font-size: var(--ml-text-xs);
		}
	`
})
export class DocsApp implements IElementRef {
	elementRef!: HTMLElement;

	page: Page = 'getting-started';
	isDark = false;

	constructor() {
		this.isDark = getResolvedTheme() === 'dark';
		onThemeChange((_mode: ThemeMode, resolved: 'light' | 'dark') => {
			this.isDark = resolved === 'dark';
		});
	}

	navigate = (page: Page): void => {
		this.page = page;
	};

	handleThemeToggle = (event: CustomEvent): void => {
		const { checked } = event.detail;
		applyTheme(checked ? 'dark' : 'light');
	};

	renderGettingStarted = () => html`
		<div class="docs__page">
			<h1>Getting Started</h1>
			<p>Melodic Components is a themeable UI component library built on the Melodic Framework.</p>

			<h2>Installation</h2>
			<pre class="docs__code">npm install @melodicdev/components</pre>

			<h2>Usage</h2>
			<pre class="docs__code">
// Import theme and apply it
import { applyTheme } from '@melodicdev/components/theme';
applyTheme('light'); // or 'dark' or 'system'

// Import components you need
import '@melodicdev/components/button';
import '@melodicdev/components/input';

// Use in HTML
&lt;ml-button variant="primary"&gt;Click me&lt;/ml-button&gt;
&lt;ml-input label="Email" type="email"&gt;&lt;/ml-input&gt;</pre
			>
		</div>
	`;

	renderTheming = () => html`
		<div class="docs__page">
			<h1>Theming</h1>
			<p>Melodic Components uses CSS custom properties for theming, making it easy to customize colors, spacing, and more.</p>

			<h2>Apply a Theme</h2>
			<pre class="docs__code">
import { applyTheme } from '@melodicdev/components/theme';

// Light theme (default)
applyTheme('light');

// Dark theme
applyTheme('dark');

// Follow system preference
applyTheme('system');</pre
			>

			<h2>Custom Theme</h2>
			<pre class="docs__code">
// Override CSS custom properties
:root {
  --ml-color-primary: #7c3aed;
  --ml-color-primary-hover: #6d28d9;
  --ml-radius-md: 12px;
}</pre
			>

			<h2>Design Tokens</h2>
			<p>Available token categories:</p>
			<ul>
				<li><strong>Colors:</strong> --ml-color-*, --ml-gray-*, --ml-blue-*, etc.</li>
				<li><strong>Spacing:</strong> --ml-space-1 through --ml-space-96</li>
				<li><strong>Typography:</strong> --ml-text-*, --ml-font-*, --ml-leading-*</li>
				<li><strong>Shadows:</strong> --ml-shadow-xs through --ml-shadow-2xl</li>
				<li><strong>Borders:</strong> --ml-radius-*, --ml-border-*</li>
				<li><strong>Transitions:</strong> --ml-duration-*, --ml-ease-*</li>
			</ul>
		</div>
	`;

	renderButton = () => html`
		<div class="docs__page">
			<h1>Button</h1>
			<p>A versatile button component with multiple variants and sizes.</p>

			<h2>Variants</h2>
			<div class="docs__demo">
				<div class="docs__demo-row">
					<ml-button variant="primary">Primary</ml-button>
					<ml-button variant="secondary">Secondary</ml-button>
					<ml-button variant="outline">Outline</ml-button>
					<ml-button variant="ghost">Ghost</ml-button>
					<ml-button variant="danger">Danger</ml-button>
					<ml-button variant="link">Link</ml-button>
				</div>
			</div>

			<h2>Sizes</h2>
			<div class="docs__demo">
				<div class="docs__demo-row">
					<ml-button size="xs">Extra Small</ml-button>
					<ml-button size="sm">Small</ml-button>
					<ml-button size="md">Medium</ml-button>
					<ml-button size="lg">Large</ml-button>
					<ml-button size="xl">Extra Large</ml-button>
				</div>
			</div>

			<h2>States</h2>
			<div class="docs__demo">
				<div class="docs__demo-row">
					<ml-button loading>Loading</ml-button>
					<ml-button disabled>Disabled</ml-button>
				</div>
			</div>

			<h2>API</h2>
			<table class="docs__table">
				<thead>
					<tr>
						<th>Prop</th>
						<th>Type</th>
						<th>Default</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>variant</code></td>
						<td><code>'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'</code></td>
						<td><code>'primary'</code></td>
						<td>Button style variant</td>
					</tr>
					<tr>
						<td><code>size</code></td>
						<td><code>'xs' | 'sm' | 'md' | 'lg' | 'xl'</code></td>
						<td><code>'md'</code></td>
						<td>Button size</td>
					</tr>
					<tr>
						<td><code>disabled</code></td>
						<td><code>boolean</code></td>
						<td><code>false</code></td>
						<td>Disable the button</td>
					</tr>
					<tr>
						<td><code>loading</code></td>
						<td><code>boolean</code></td>
						<td><code>false</code></td>
						<td>Show loading spinner</td>
					</tr>
				</tbody>
			</table>
		</div>
	`;

	renderInput = () => html`
		<div class="docs__page">
			<h1>Input</h1>
			<p>Text input component with label, hint, and error states.</p>

			<h2>Examples</h2>
			<div class="docs__demo">
				<div class="docs__demo-grid">
					<ml-input label="Text Input" placeholder="Enter text..."></ml-input>
					<ml-input label="Email" type="email" placeholder="email@example.com"></ml-input>
					<ml-input label="With Hint" hint="This is helpful hint text"></ml-input>
					<ml-input label="With Error" error="This field is required"></ml-input>
				</div>
			</div>

			<h2>API</h2>
			<table class="docs__table">
				<thead>
					<tr>
						<th>Prop</th>
						<th>Type</th>
						<th>Default</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>type</code></td>
						<td><code>'text' | 'email' | 'password' | 'number' | 'tel' | 'url'</code></td>
						<td><code>'text'</code></td>
						<td>Input type</td>
					</tr>
					<tr>
						<td><code>label</code></td>
						<td><code>string</code></td>
						<td><code>''</code></td>
						<td>Label text</td>
					</tr>
					<tr>
						<td><code>hint</code></td>
						<td><code>string</code></td>
						<td><code>''</code></td>
						<td>Hint text below input</td>
					</tr>
					<tr>
						<td><code>error</code></td>
						<td><code>string</code></td>
						<td><code>''</code></td>
						<td>Error message</td>
					</tr>
					<tr>
						<td><code>disabled</code></td>
						<td><code>boolean</code></td>
						<td><code>false</code></td>
						<td>Disable the input</td>
					</tr>
				</tbody>
			</table>
		</div>
	`;

	renderTextarea = () => html`
		<div class="docs__page">
			<h1>Textarea</h1>
			<p>Multi-line text input with character count support.</p>

			<h2>Examples</h2>
			<div class="docs__demo">
				<div class="docs__demo-grid">
					<ml-textarea label="Description" placeholder="Enter description..."></ml-textarea>
					<ml-textarea label="With Max Length" max-length="100"></ml-textarea>
				</div>
			</div>
		</div>
	`;

	renderCheckbox = () => html`
		<div class="docs__page">
			<h1>Checkbox</h1>
			<p>Checkbox input for boolean selections.</p>

			<h2>Examples</h2>
			<div class="docs__demo">
				<div class="docs__demo-column">
					<ml-checkbox label="Default checkbox"></ml-checkbox>
					<ml-checkbox label="Checked" checked></ml-checkbox>
					<ml-checkbox label="Indeterminate" indeterminate></ml-checkbox>
					<ml-checkbox label="Disabled" disabled></ml-checkbox>
				</div>
			</div>
		</div>
	`;

	renderRadio = () => html`
		<div class="docs__page">
			<h1>Radio</h1>
			<p>Radio buttons for single selection from a group.</p>

			<h2>Examples</h2>
			<div class="docs__demo">
				<ml-radio-group label="Select an option" name="demo">
					<ml-radio value="a" label="Option A"></ml-radio>
					<ml-radio value="b" label="Option B" checked></ml-radio>
					<ml-radio value="c" label="Option C"></ml-radio>
				</ml-radio-group>
			</div>
		</div>
	`;

	renderToggle = () => html`
		<div class="docs__page">
			<h1>Toggle</h1>
			<p>Toggle switch for on/off states.</p>

			<h2>Examples</h2>
			<div class="docs__demo">
				<div class="docs__demo-column">
					<ml-toggle label="Enable notifications"></ml-toggle>
					<ml-toggle label="Dark mode" checked></ml-toggle>
					<ml-toggle label="Disabled" disabled></ml-toggle>
				</div>
			</div>
		</div>
	`;

	renderSpinner = () => html`
		<div class="docs__page">
			<h1>Spinner</h1>
			<p>Loading indicator for async operations.</p>

			<h2>Sizes</h2>
			<div class="docs__demo">
				<div class="docs__demo-row">
					<ml-spinner size="xs"></ml-spinner>
					<ml-spinner size="sm"></ml-spinner>
					<ml-spinner size="md"></ml-spinner>
					<ml-spinner size="lg"></ml-spinner>
					<ml-spinner size="xl"></ml-spinner>
				</div>
			</div>
		</div>
	`;
}

// Mount the app
const app = document.getElementById('app');
if (app) {
	app.innerHTML = '<docs-app></docs-app>';
}
