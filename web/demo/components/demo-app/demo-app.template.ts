import { html } from '@melodicdev/core';
import type { DemoApp } from './demo-app.component';

export const demoAppTemplate = (c: DemoApp) => {
	return html`
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
						<ml-icon icon="cursor-click" size="sm"></ml-icon>Buttons
					</a>
					<a href="#button-groups" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'button-groups')}>
						<ml-icon icon="rows" size="sm"></ml-icon>Button Groups
					</a>
					<a href="#cards" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'cards')}>
						<ml-icon icon="square" size="sm"></ml-icon>Cards
					</a>
					<a href="#badges" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'badges')}>
						<ml-icon icon="seal" size="sm"></ml-icon>Badges
					</a>
					<a href="#badge-groups" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'badge-groups')}>
						<ml-icon icon="seal" size="sm"></ml-icon>Badge Groups
					</a>
					<a href="#avatars" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'avatars')}>
						<ml-icon icon="user-circle" size="sm"></ml-icon>Avatars
					</a>
					<a href="#icons" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'icons')}>
						<ml-icon icon="star" size="sm"></ml-icon>Icons
					</a>
					<a href="#alerts" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'alerts')}>
						<ml-icon icon="warning" size="sm"></ml-icon>Alerts
					</a>
					<a href="#dividers" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'dividers')}>
						<ml-icon icon="minus" size="sm"></ml-icon>Dividers
					</a>
					<a href="#spinners" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'spinners')}>
						<ml-icon icon="spinner-gap" size="sm"></ml-icon>Spinners
					</a>
					<a href="#inputs" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'inputs')}>
						<ml-icon icon="textbox" size="sm"></ml-icon>Inputs
					</a>
					<a href="#selects" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'selects')}>
						<ml-icon icon="caret-circle-down" size="sm"></ml-icon>Selects
					</a>
					<a href="#textareas" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'textareas')}>
						<ml-icon icon="article" size="sm"></ml-icon>Textareas
					</a>
					<a href="#checkboxes" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'checkboxes')}>
						<ml-icon icon="check-square" size="sm"></ml-icon>Checkboxes
					</a>
					<a href="#radios" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'radios')}>
						<ml-icon icon="radio-button" size="sm"></ml-icon>Radios
					</a>
					<a href="#radio-cards" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'radio-cards')}>
						<ml-icon icon="radio-button" size="sm"></ml-icon>Radio Cards
					</a>
					<a href="#toggles" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'toggles')}>
						<ml-icon icon="toggle-left" size="sm"></ml-icon>Toggles
					</a>
					<a href="#form-fields" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'form-fields')}>
						<ml-icon icon="textbox" size="sm"></ml-icon>Form Fields
					</a>
					<a href="#tabs" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'tabs')}>
						<ml-icon icon="tabs" size="sm"></ml-icon>Tabs
					</a>
					<a href="#tooltips" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'tooltips')}>
						<ml-icon icon="chat-centered" size="sm"></ml-icon>Tooltips
					</a>
					<a href="#popovers" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'popovers')}>
						<ml-icon icon="chat-circle" size="sm"></ml-icon>Popovers
					</a>
					<a href="#dropdowns" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'dropdowns')}>
						<ml-icon icon="list" size="sm"></ml-icon>Dropdowns
					</a>
					<a href="#dialogs" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'dialogs')}>
						<ml-icon icon="browsers" size="sm"></ml-icon>Dialogs
					</a>
					<a href="#drawers" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'drawers')}>
						<ml-icon icon="sidebar" size="sm"></ml-icon>Drawers
					</a>
					<a href="#sliders" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'sliders')}>
						<ml-icon icon="sliders-horizontal" size="sm"></ml-icon>Sliders
					</a>
					<a href="#progress" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'progress')}>
						<ml-icon icon="chart-bar" size="sm"></ml-icon>Progress
					</a>
					<a href="#toasts" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'toasts')}>
						<ml-icon icon="bell-ringing" size="sm"></ml-icon>Toasts
					</a>
					<a href="#breadcrumbs" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'breadcrumbs')}>
						<ml-icon icon="path" size="sm"></ml-icon>Breadcrumbs
					</a>
					<a href="#pagination" class="demo-nav__item" @click=${(event: Event) => c.handleNavClick(event, 'pagination')}>
						<ml-icon icon="dots-three" size="sm"></ml-icon>Pagination
					</a>
				</nav>

				<div class="demo-sidebar__footer">
					<ml-toggle label="Dark mode" .checked=${c.isDark} @ml:change=${c.handleThemeToggle}></ml-toggle>
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

					</section>

					<!-- Button Groups Section -->
					<section id="button-groups" class="demo-section">
						<div class="demo-section__header">
							<h2>Button Groups</h2>
							<p>Connected toggle buttons for selecting between related options.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Single Selection</h3>
								<span class="demo-card__badge">Toggle</span>
							</div>
							<div class="demo-row">
								<ml-button-group value="list">
									<ml-button-group-item value="list" icon="list">List</ml-button-group-item>
									<ml-button-group-item value="grid" icon="grid-four">Grid</ml-button-group-item>
									<ml-button-group-item value="columns" icon="columns">Columns</ml-button-group-item>
								</ml-button-group>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Multiple Selection</h3>
								<span class="demo-card__badge">Multi-toggle</span>
							</div>
							<div class="demo-row">
								<ml-button-group multiple .values=${['bold']}>
									<ml-button-group-item value="bold" icon="text-bolder"></ml-button-group-item>
									<ml-button-group-item value="italic" icon="text-italic"></ml-button-group-item>
									<ml-button-group-item value="underline" icon="text-underline"></ml-button-group-item>
									<ml-button-group-item value="strikethrough" icon="text-strikethrough"></ml-button-group-item>
								</ml-button-group>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Text Only</h3>
							</div>
							<div class="demo-row">
								<ml-button-group value="monthly">
									<ml-button-group-item value="daily">Daily</ml-button-group-item>
									<ml-button-group-item value="weekly">Weekly</ml-button-group-item>
									<ml-button-group-item value="monthly">Monthly</ml-button-group-item>
									<ml-button-group-item value="yearly">Yearly</ml-button-group-item>
								</ml-button-group>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Sizes</h3>
								<span class="demo-card__badge">3 sizes</span>
							</div>
							<div class="demo-column" style="gap: var(--ml-space-4);">
								<ml-button-group value="a" size="sm">
									<ml-button-group-item value="a">Option A</ml-button-group-item>
									<ml-button-group-item value="b">Option B</ml-button-group-item>
									<ml-button-group-item value="c">Option C</ml-button-group-item>
								</ml-button-group>
								<ml-button-group value="a" size="md">
									<ml-button-group-item value="a">Option A</ml-button-group-item>
									<ml-button-group-item value="b">Option B</ml-button-group-item>
									<ml-button-group-item value="c">Option C</ml-button-group-item>
								</ml-button-group>
								<ml-button-group value="a" size="lg">
									<ml-button-group-item value="a">Option A</ml-button-group-item>
									<ml-button-group-item value="b">Option B</ml-button-group-item>
									<ml-button-group-item value="c">Option C</ml-button-group-item>
								</ml-button-group>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Variants</h3>
								<span class="demo-card__badge">2 styles</span>
							</div>
							<div class="demo-row">
								<ml-button-group value="overview">
									<ml-button-group-item value="overview" icon="chart-bar">Overview</ml-button-group-item>
									<ml-button-group-item value="analytics" icon="chart-line">Analytics</ml-button-group-item>
									<ml-button-group-item value="reports" icon="file-text">Reports</ml-button-group-item>
								</ml-button-group>
								<ml-button-group value="overview" variant="solid">
									<ml-button-group-item value="overview" icon="chart-bar">Overview</ml-button-group-item>
									<ml-button-group-item value="analytics" icon="chart-line">Analytics</ml-button-group-item>
									<ml-button-group-item value="reports" icon="file-text">Reports</ml-button-group-item>
								</ml-button-group>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Disabled</h3>
							</div>
							<div class="demo-row">
								<ml-button-group value="a" disabled>
									<ml-button-group-item value="a">Option A</ml-button-group-item>
									<ml-button-group-item value="b">Option B</ml-button-group-item>
									<ml-button-group-item value="c">Option C</ml-button-group-item>
								</ml-button-group>
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

					<!-- Badge Groups Section -->
					<section id="badge-groups" class="demo-section">
						<div class="demo-section__header">
							<h2>Badge Groups</h2>
							<p>Compound badges that pair an inner label with descriptive text.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Variants</h3>
							</div>
							<div class="demo-row">
								<ml-badge-group label="New" variant="default">Feature release</ml-badge-group>
								<ml-badge-group label="New" variant="primary">Feature release</ml-badge-group>
								<ml-badge-group label="Live" variant="success">System operational</ml-badge-group>
								<ml-badge-group label="Alert" variant="warning">Maintenance soon</ml-badge-group>
								<ml-badge-group label="Down" variant="error">Service outage</ml-badge-group>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Themes</h3>
								<span class="demo-card__badge">pill &amp; modern</span>
							</div>
							<div class="demo-row">
								<ml-badge-group label="New" variant="primary" theme="pill">Pill theme</ml-badge-group>
								<ml-badge-group label="New" variant="primary" theme="modern">Modern theme</ml-badge-group>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Badge Position</h3>
							</div>
							<div class="demo-row">
								<ml-badge-group label="New" variant="primary">Leading (default)</ml-badge-group>
								<ml-badge-group label="New" variant="primary" badge-position="trailing">Trailing</ml-badge-group>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Sizes</h3>
								<span class="demo-card__badge">3 sizes</span>
							</div>
							<div class="demo-row">
								<ml-badge-group label="New" variant="primary" size="sm">Small</ml-badge-group>
								<ml-badge-group label="New" variant="primary" size="md">Medium</ml-badge-group>
								<ml-badge-group label="New" variant="primary" size="lg">Large</ml-badge-group>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>With Icons</h3>
							</div>
							<div class="demo-row">
								<ml-badge-group label="New" variant="primary" icon="arrow-right">With arrow</ml-badge-group>
								<ml-badge-group label="Live" variant="success" icon="arrow-up-right">View status</ml-badge-group>
								<ml-badge-group label="v2.0" variant="default" icon="arrow-right" theme="modern">Release notes</ml-badge-group>
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

					<!-- Icons Section -->
					<section id="icons" class="demo-section">
						<div class="demo-section__header">
							<h2>Icons</h2>
							<p>
								Vector icons using Phosphor Icons via font ligatures. Browse all icons at
								<a href="https://phosphoricons.com/" target="_blank">phosphoricons.com</a>.
							</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Sizes</h3>
								<span class="demo-card__badge">5 sizes</span>
							</div>
							<div class="demo-row demo-row--align-end">
								<ml-icon icon="house" size="xs"></ml-icon>
								<ml-icon icon="house" size="sm"></ml-icon>
								<ml-icon icon="house" size="md"></ml-icon>
								<ml-icon icon="house" size="lg"></ml-icon>
								<ml-icon icon="house" size="xl"></ml-icon>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Formats</h3>
								<span class="demo-card__badge">5 styles</span>
							</div>
							<div class="demo-row">
								<ml-stack gap="2" align="center">
									<ml-icon .icon=${'heart'} size="lg" format="thin"></ml-icon>
									<span class="demo-label">Thin</span>
								</ml-stack>
								<ml-stack gap="2" align="center">
									<ml-icon icon="heart" size="lg" format="light"></ml-icon>
									<span class="demo-label">Light</span>
								</ml-stack>
								<ml-stack gap="2" align="center">
									<ml-icon icon="heart" size="lg" format="regular"></ml-icon>
									<span class="demo-label">Regular</span>
								</ml-stack>
								<ml-stack gap="2" align="center">
									<ml-icon icon="heart" size="lg" format="bold"></ml-icon>
									<span class="demo-label">Bold</span>
								</ml-stack>
								<ml-stack gap="2" align="center">
									<ml-icon icon="heart" size="lg" format="fill"></ml-icon>
									<span class="demo-label">Fill</span>
								</ml-stack>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Common Icons</h3>
							</div>
							<div class="demo-row">
								<ml-icon icon="house" size="lg"></ml-icon>
								<ml-icon icon="gear" size="lg"></ml-icon>
								<ml-icon icon="user" size="lg"></ml-icon>
								<ml-icon icon="magnifying-glass" size="lg"></ml-icon>
								<ml-icon icon="bell" size="lg"></ml-icon>
								<ml-icon icon="envelope" size="lg"></ml-icon>
								<ml-icon icon="trash" size="lg"></ml-icon>
								<ml-icon icon="pencil" size="lg"></ml-icon>
								<ml-icon icon="check" size="lg"></ml-icon>
								<ml-icon icon="x" size="lg"></ml-icon>
								<ml-icon icon="plus" size="lg"></ml-icon>
								<ml-icon icon="minus" size="lg"></ml-icon>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>In Buttons</h3>
							</div>
							<div class="demo-row">
								<ml-button variant="primary">
									<ml-icon icon="plus" size="sm"></ml-icon>
									Add Item
								</ml-button>
								<ml-button variant="outline">
									<ml-icon icon="pencil" size="sm"></ml-icon>
									Edit
								</ml-button>
								<ml-button variant="danger">
									<ml-icon icon="trash" size="sm"></ml-icon>
									Delete
								</ml-button>
								<ml-button variant="ghost">
									<ml-icon icon="gear" size="sm"></ml-icon>
								</ml-button>
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
							<ml-alert variant="info" title="Information"> This is an informational message for the user. </ml-alert>

							<ml-alert variant="success" title="Success"> Your changes have been saved successfully. </ml-alert>

							<ml-alert variant="warning" title="Warning"> Please review your input before proceeding. </ml-alert>

							<ml-alert variant="error" title="Error" dismissible> There was an error processing your request. </ml-alert>
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

					<!-- Select Section -->
					<section id="selects" class="demo-section">
						<div class="demo-section__header">
							<h2>Selects</h2>
							<p>Dropdown selection controls for choosing from a list of options.</p>
						</div>

						<div class="demo-grid">
							<ml-select label="Country" placeholder="Select a country" .options=${c.countryOptions}></ml-select>
							<ml-select label="Status" placeholder="Select status" .options=${c.statusOptions} hint="Inactive option is disabled"></ml-select>
							<ml-select label="With Error" placeholder="Select an option" .options=${c.statusOptions} error="Selection is required"></ml-select>
							<ml-select
								label="Multi-select"
								placeholder="Select countries"
								.options=${c.countryOptions}
								.values=${c.multiSelectValues}
								multiple
								hint="Pick multiple options"
								@ml-change=${c.handleMultiSelectChange}
							></ml-select>
							<ml-select label="Disabled" placeholder="Cannot select" .options=${c.statusOptions} disabled></ml-select>
						</div>
					</section>

					<!-- Textarea Section -->
					<section id="textareas" class="demo-section">
						<div class="demo-section__header">
							<h2>Textareas</h2>
							<p>Multi-line text inputs for longer form content.</p>
						</div>

						<div class="demo-grid-2">
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

					<!-- Radio Cards Section -->
					<section id="radio-cards" class="demo-section">
						<div class="demo-section__header">
							<h2>Radio Cards</h2>
							<p>Card-style selection controls for choosing between options with rich content.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Pricing Plans</h3>
							</div>
							<ml-radio-card-group value="business" label="Select a plan">
								<ml-radio-card value="basic" label="Basic plan" description="Up to 5 users, 10GB storage" detail="$10/mo"></ml-radio-card>
								<ml-radio-card value="business" label="Business plan" description="Up to 50 users, 100GB storage" detail="$25/mo"></ml-radio-card>
								<ml-radio-card value="enterprise" label="Enterprise plan" description="Unlimited users, 1TB storage" detail="$99/mo"></ml-radio-card>
							</ml-radio-card-group>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Horizontal Layout</h3>
							</div>
							<ml-radio-card-group value="monthly" orientation="horizontal">
								<ml-radio-card value="monthly" label="Monthly" description="Billed monthly" detail="$12/mo"></ml-radio-card>
								<ml-radio-card value="annual" label="Annual" description="Save 20%" detail="$9.60/mo"></ml-radio-card>
								<ml-radio-card value="lifetime" label="Lifetime" description="One-time payment" detail="$299"></ml-radio-card>
							</ml-radio-card-group>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>With Icons</h3>
							</div>
							<ml-radio-card-group value="visa" label="Payment method">
								<ml-radio-card value="visa" label="Visa" description="Ending in 4242" icon="credit-card"></ml-radio-card>
								<ml-radio-card value="mastercard" label="Mastercard" description="Ending in 8888" icon="credit-card"></ml-radio-card>
								<ml-radio-card value="paypal" label="PayPal" description="john@example.com" icon="wallet"></ml-radio-card>
							</ml-radio-card-group>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Disabled</h3>
							</div>
							<ml-radio-card-group value="free" label="Locked plan" disabled>
								<ml-radio-card value="free" label="Free tier" description="Currently active"></ml-radio-card>
								<ml-radio-card value="pro" label="Pro tier" description="Upgrade required" detail="$19/mo"></ml-radio-card>
							</ml-radio-card-group>
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

					<!-- Form Field Section -->
					<section id="form-fields" class="demo-section">
						<div class="demo-section__header">
							<h2>Form Fields</h2>
							<p>Wrapper component that adds labels, hints, and error messages to any form control.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>With Native Inputs</h3>
							</div>
							<div class="demo-grid">
								<ml-form-field label="Username" hint="Choose a unique username" required>
									<input type="text" placeholder="Enter username" />
								</ml-form-field>
								<ml-form-field label="Email" error="Invalid email address">
									<input type="email" placeholder="Enter email" />
								</ml-form-field>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Horizontal Layout</h3>
							</div>
							<ml-stack gap="4">
								<ml-form-field label="Full Name" orientation="horizontal" required>
									<input type="text" placeholder="John Doe" />
								</ml-form-field>
								<ml-form-field label="Company" orientation="horizontal" hint="Optional">
									<input type="text" placeholder="Acme Inc." />
								</ml-form-field>
							</ml-stack>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Size Variants</h3>
							</div>
							<ml-stack gap="4">
								<ml-form-field label="Small" size="sm">
									<input type="text" placeholder="Small input" />
								</ml-form-field>
								<ml-form-field label="Medium (default)" size="md">
									<input type="text" placeholder="Medium input" />
								</ml-form-field>
								<ml-form-field label="Large" size="lg">
									<input type="text" placeholder="Large input" />
								</ml-form-field>
							</ml-stack>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>With Melodic Components</h3>
							</div>
							<div class="demo-grid">
								<ml-form-field label="Subscribe to newsletter" hint="We'll never spam you">
									<ml-checkbox></ml-checkbox>
								</ml-form-field>
								<ml-form-field label="Enable dark mode">
									<ml-toggle></ml-toggle>
								</ml-form-field>
							</div>
						</div>
					</section>

					<!-- Tabs Section -->
					<section id="tabs" class="demo-section">
						<div class="demo-section__header">
							<h2>Tabs</h2>
							<p>Tabbed interface component with multiple variants. Supports both simple panel switching and router integration.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Line Variant (default)</h3>
							</div>
							<ml-tabs
								.tabs=${[
									{ value: 'account', label: 'Account', icon: 'user' },
									{ value: 'security', label: 'Security', icon: 'lock' },
									{ value: 'notifications', label: 'Notifications', icon: 'bell' },
									{ value: 'billing', label: 'Billing', icon: 'credit-card', disabled: true }
								]}
								value="account"
							>
								<ml-tab-panel value="account">
									<p>Manage your account settings and preferences.</p>
								</ml-tab-panel>
								<ml-tab-panel value="security">
									<p>Configure security options and two-factor authentication.</p>
								</ml-tab-panel>
								<ml-tab-panel value="notifications">
									<p>Control how you receive notifications.</p>
								</ml-tab-panel>
								<ml-tab-panel value="billing">
									<p>View and manage billing information.</p>
								</ml-tab-panel>
							</ml-tabs>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Enclosed Variant</h3>
							</div>
							<ml-tabs
								variant="enclosed"
								.tabs=${[
									{ value: 'overview', label: 'Overview' },
									{ value: 'analytics', label: 'Analytics' },
									{ value: 'reports', label: 'Reports' }
								]}
								value="overview"
							>
								<ml-tab-panel value="overview">
									<p>Dashboard overview with key metrics.</p>
								</ml-tab-panel>
								<ml-tab-panel value="analytics">
									<p>Detailed analytics and charts.</p>
								</ml-tab-panel>
								<ml-tab-panel value="reports">
									<p>Generate and download reports.</p>
								</ml-tab-panel>
							</ml-tabs>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Pills Variant</h3>
							</div>
							<ml-tabs
								variant="pills"
								.tabs=${[
									{ value: 'all', label: 'All' },
									{ value: 'active', label: 'Active' },
									{ value: 'completed', label: 'Completed' },
									{ value: 'archived', label: 'Archived' }
								]}
								value="all"
							>
								<ml-tab-panel value="all">
									<p>Showing all items.</p>
								</ml-tab-panel>
								<ml-tab-panel value="active">
									<p>Showing active items only.</p>
								</ml-tab-panel>
								<ml-tab-panel value="completed">
									<p>Showing completed items only.</p>
								</ml-tab-panel>
								<ml-tab-panel value="archived">
									<p>Showing archived items.</p>
								</ml-tab-panel>
							</ml-tabs>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Vertical Orientation</h3>
							</div>
							<ml-tabs
								orientation="vertical"
								.tabs=${[
									{ value: 'general', label: 'General', icon: 'gear' },
									{ value: 'privacy', label: 'Privacy', icon: 'eye-slash' },
									{ value: 'advanced', label: 'Advanced', icon: 'sliders' }
								]}
								value="general"
							>
								<ml-tab-panel value="general">
									<p>General application settings.</p>
								</ml-tab-panel>
								<ml-tab-panel value="privacy">
									<p>Privacy and data sharing options.</p>
								</ml-tab-panel>
								<ml-tab-panel value="advanced">
									<p>Advanced configuration options.</p>
								</ml-tab-panel>
							</ml-tabs>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Router Integration</h3>
								<span class="demo-card__badge">Code Example</span>
							</div>
							<div class="demo-code-example">
								<p class="demo-code-description">
									For apps using the Melodic router, tabs can automatically sync with child routes. Set <code>routed</code> and provide
									<code>href</code> on each tab config.
								</p>
								<pre class="demo-code"><code>// Route configuration
const routes = [
  {
    path: 'settings',
    component: SettingsPage,
    children: [
      { path: 'profile', component: ProfileTab },
      { path: 'security', component: SecurityTab },
      { path: 'billing', component: BillingTab }
    ]
  }
];

// In your template
&lt;ml-tabs
  routed
  .tabs=\${[
    { value: 'profile', label: 'Profile', href: '/settings/profile' },
    { value: 'security', label: 'Security', href: '/settings/security' },
    { value: 'billing', label: 'Billing', href: '/settings/billing' }
  ]}
&gt;
  &lt;router-outlet&gt;&lt;/router-outlet&gt;
&lt;/ml-tabs&gt;</code></pre>
								<p class="demo-code-description" style="margin-top: var(--ml-space-4);">
									<strong>Features:</strong>
								</p>
								<ul class="demo-code-list">
									<li>Clicking a tab navigates to the corresponding route</li>
									<li>Active tab automatically syncs with current URL</li>
									<li>Child components render inside the router-outlet</li>
									<li>Browser back/forward buttons work correctly</li>
								</ul>
							</div>
						</div>
					</section>

					<!-- Tooltips Section -->
					<section id="tooltips" class="demo-section">
						<div class="demo-section__header">
							<h2>Tooltips</h2>
							<p>Contextual hints that appear on hover or focus, anchored to a trigger element.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Placement</h3>
								<span class="demo-card__badge">4 sides</span>
							</div>
							<div class="demo-row">
								<ml-tooltip content="Tooltip on top" placement="top">
									<ml-button variant="outline">Top</ml-button>
								</ml-tooltip>
								<ml-tooltip content="Tooltip on bottom" placement="bottom">
									<ml-button variant="outline">Bottom</ml-button>
								</ml-tooltip>
								<ml-tooltip content="Tooltip on left" placement="left">
									<ml-button variant="outline">Left</ml-button>
								</ml-tooltip>
								<ml-tooltip content="Tooltip on right" placement="right">
									<ml-button variant="outline">Right</ml-button>
								</ml-tooltip>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>On Various Elements</h3>
							</div>
							<div class="demo-row">
								<ml-tooltip content="This is a button tooltip">
									<ml-button>Hover me</ml-button>
								</ml-tooltip>
								<ml-tooltip content="Icon with a tooltip">
									<ml-icon icon="info" size="lg"></ml-icon>
								</ml-tooltip>
								<ml-tooltip content="Badge with a tooltip">
									<ml-badge variant="primary">Hover</ml-badge>
								</ml-tooltip>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Directive Shorthand</h3>
								<span class="demo-card__badge">:tooltip</span>
							</div>
							<div class="demo-row">
								<ml-button :tooltip="Quick and easy tooltip">Hover me</ml-button>
								<ml-button variant="outline" :tooltip=${{ content: 'Bottom placement', placement: 'bottom' }}>With placement</ml-button>
								<ml-button variant="ghost" :tooltip="Works on any element">
									<ml-icon icon="gear" size="sm"></ml-icon>
								</ml-button>
							</div>
						</div>
					</section>

					<!-- Popovers Section -->
					<section id="popovers" class="demo-section">
						<div class="demo-section__header">
							<h2>Popovers</h2>
							<p>Floating overlays anchored to a trigger element, using the native Popover API.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Basic Popover</h3>
								<span class="demo-card__badge">Auto-dismiss</span>
							</div>
							<div class="demo-row">
								<ml-popover placement="bottom">
									<ml-button slot="trigger">Click me</ml-button>
									<div>
										<p><strong>Popover Title</strong></p>
										<p>This popover closes when you click outside.</p>
									</div>
								</ml-popover>

								<ml-popover placement="bottom-start">
									<ml-button slot="trigger" variant="outline">Bottom Start</ml-button>
									<p>Aligned to the start of the trigger.</p>
								</ml-popover>

								<ml-popover placement="top">
									<ml-button slot="trigger" variant="outline">Top</ml-button>
									<p>This popover appears above the trigger.</p>
								</ml-popover>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>With Arrow</h3>
							</div>
							<div class="demo-row">
								<ml-popover placement="bottom" arrow>
									<ml-button slot="trigger">With Arrow</ml-button>
									<p>This popover has an arrow pointing to the trigger.</p>
								</ml-popover>

								<ml-popover placement="right" arrow>
									<ml-button slot="trigger" variant="outline">Right Arrow</ml-button>
									<p>Arrow on the right side.</p>
								</ml-popover>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Manual Mode</h3>
								<span class="demo-card__badge">No light-dismiss</span>
							</div>
							<div class="demo-row">
								<ml-popover placement="bottom" manual>
									<ml-button slot="trigger" variant="secondary">Manual Popover</ml-button>
									<div>
										<p>This popover won't close on outside click.</p>
										<p>Click the trigger again to close it.</p>
									</div>
								</ml-popover>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Profile Popover</h3>
								<span class="demo-card__badge">Custom component</span>
							</div>
							<div class="demo-row">
								<profile-popover
									name="Jane Cooper"
									email="jane.cooper@example.com"
									role="Admin"
								></profile-popover>
								<profile-popover
									name="Alex Morgan"
									email="alex.morgan@example.com"
									role="Editor"
								></profile-popover>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Confirm Popover</h3>
								<span class="demo-card__badge">Custom events</span>
							</div>
							<div class="demo-row">
								<confirm-popover
									message="This action cannot be undone. Are you sure you want to delete this item?"
									@ml:confirm=${c.handleConfirmResult}
								>
									<ml-button slot="trigger" variant="danger">
										<ml-icon icon="trash" size="sm"></ml-icon>
										Delete Item
									</ml-button>
								</confirm-popover>
								<confirm-popover
									message="Are you sure you want to archive this project?"
									@ml:confirm=${c.handleConfirmResult}
								>
									<ml-button slot="trigger" variant="outline">
										<ml-icon icon="archive" size="sm"></ml-icon>
										Archive Project
									</ml-button>
								</confirm-popover>
							</div>
						</div>
					</section>

					<!-- Dropdowns Section -->
					<section id="dropdowns" class="demo-section">
						<div class="demo-section__header">
							<h2>Dropdowns</h2>
							<p>Menu overlays anchored to a trigger, with keyboard navigation and item groups.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Basic</h3>
								<span class="demo-card__badge">Simple items</span>
							</div>
							<div class="demo-row">
								<ml-dropdown>
									<ml-button slot="trigger" variant="outline">
										Actions
										<ml-icon icon="caret-down" size="sm"></ml-icon>
									</ml-button>
									<ml-dropdown-item value="edit" icon="pencil">Edit</ml-dropdown-item>
									<ml-dropdown-item value="duplicate" icon="copy">Duplicate</ml-dropdown-item>
									<ml-dropdown-item value="archive" icon="archive">Archive</ml-dropdown-item>
								</ml-dropdown>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Icons &amp; Addons</h3>
								<span class="demo-card__badge">Shortcuts</span>
							</div>
							<div class="demo-row">
								<ml-dropdown>
									<ml-button slot="trigger" variant="outline">
										Edit
										<ml-icon icon="caret-down" size="sm"></ml-icon>
									</ml-button>
									<ml-dropdown-item value="cut" icon="scissors" addon="Cmd+X">Cut</ml-dropdown-item>
									<ml-dropdown-item value="copy" icon="copy" addon="Cmd+C">Copy</ml-dropdown-item>
									<ml-dropdown-item value="paste" icon="clipboard-text" addon="Cmd+V">Paste</ml-dropdown-item>
								</ml-dropdown>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Sections &amp; Separators</h3>
								<span class="demo-card__badge">Groups</span>
							</div>
							<div class="demo-row">
								<ml-dropdown>
									<ml-button slot="trigger" variant="outline">
										<ml-icon icon="user" size="sm"></ml-icon>
										My Account
										<ml-icon icon="caret-down" size="sm"></ml-icon>
									</ml-button>
									<ml-dropdown-group label="Account">
										<ml-dropdown-item value="profile" icon="user">Profile</ml-dropdown-item>
										<ml-dropdown-item value="settings" icon="gear">Settings</ml-dropdown-item>
									</ml-dropdown-group>
									<ml-dropdown-separator></ml-dropdown-separator>
									<ml-dropdown-group label="Team">
										<ml-dropdown-item value="members" icon="users">Members</ml-dropdown-item>
										<ml-dropdown-item value="invite" icon="user-plus">Invite</ml-dropdown-item>
									</ml-dropdown-group>
									<ml-dropdown-separator></ml-dropdown-separator>
									<ml-dropdown-item value="sign-out" icon="sign-out" destructive>Sign out</ml-dropdown-item>
								</ml-dropdown>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Destructive &amp; Disabled</h3>
								<span class="demo-card__badge">States</span>
							</div>
							<div class="demo-row">
								<ml-dropdown>
									<ml-button slot="trigger" variant="outline">
										More
										<ml-icon icon="dots-three" size="sm"></ml-icon>
									</ml-button>
									<ml-dropdown-item value="edit" icon="pencil">Edit</ml-dropdown-item>
									<ml-dropdown-item value="share" icon="share-network" disabled>Share</ml-dropdown-item>
									<ml-dropdown-separator></ml-dropdown-separator>
									<ml-dropdown-item value="delete" icon="trash" destructive>Delete</ml-dropdown-item>
								</ml-dropdown>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Placement</h3>
								<span class="demo-card__badge">4 positions</span>
							</div>
							<div class="demo-row">
								<ml-dropdown placement="bottom-start">
									<ml-button slot="trigger" variant="outline">Bottom Start</ml-button>
									<ml-dropdown-item value="1">Item one</ml-dropdown-item>
									<ml-dropdown-item value="2">Item two</ml-dropdown-item>
								</ml-dropdown>
								<ml-dropdown placement="bottom-end">
									<ml-button slot="trigger" variant="outline">Bottom End</ml-button>
									<ml-dropdown-item value="1">Item one</ml-dropdown-item>
									<ml-dropdown-item value="2">Item two</ml-dropdown-item>
								</ml-dropdown>
								<ml-dropdown placement="top-start">
									<ml-button slot="trigger" variant="outline">Top Start</ml-button>
									<ml-dropdown-item value="1">Item one</ml-dropdown-item>
									<ml-dropdown-item value="2">Item two</ml-dropdown-item>
								</ml-dropdown>
								<ml-dropdown placement="right-start">
									<ml-button slot="trigger" variant="outline">Right Start</ml-button>
									<ml-dropdown-item value="1">Item one</ml-dropdown-item>
									<ml-dropdown-item value="2">Item two</ml-dropdown-item>
								</ml-dropdown>
							</div>
						</div>
					</section>

					<!-- Dialogs Section -->
					<section id="dialogs" class="demo-section">
						<div class="demo-section__header">
							<h2>Dialogs</h2>
							<p>Native dialog-based overlays for focused interactions, confirmations, and forms.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Dialog Development</h3>
							</div>
							<div class="demo-row">
								<ml-button @click=${() => c.openDialog('test-dialog')}>Open Dialog</ml-button>
								<ml-dialog #test-dialog>
									<div slot="dialog-header">Dialog Header</div>
									<p>Dialog content goes here</p>
									<div slot="dialog-footer">
										<ml-button variant="outline" @click=${() => c.closeDialog('test-dialog')}>Cancel</ml-button>
										<ml-button @click=${() => c.closeDialog('test-dialog')}>Confirm</ml-button>
									</div>
								</ml-dialog>
							</div>
						</div>

						<div class="demo-card__header">
							<h3>Custom Component</h3>
							<div class="demo-row">
								<ml-button @click=${() => c.openConfirmDialog()}>Open Custom Dialog</ml-button>
							</div>
						</div>
					</section>

					<!-- Drawers Section -->
					<section id="drawers" class="demo-section">
						<div class="demo-section__header">
							<h2>Drawers</h2>
							<p>Slide-out panels for secondary content, forms, and details.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Side Variants</h3>
								<span class="demo-card__badge">2 sides</span>
							</div>
							<div class="demo-row">
								<ml-button variant="outline" @click=${() => c.openDrawer('drawer-right')}>Open Right</ml-button>
								<ml-drawer id="drawer-right" side="right">
									<h3 slot="drawer-header">Settings</h3>
									<p>Drawer content slides in from the right. Click the backdrop or the X button to close.</p>
									<div slot="drawer-footer">
										<ml-button variant="outline" @click=${() => {}}>Cancel</ml-button>
										<ml-button>Save</ml-button>
									</div>
								</ml-drawer>

								<ml-button variant="outline" @click=${() => c.openDrawer('drawer-left')}>Open Left</ml-button>
								<ml-drawer id="drawer-left" side="left">
									<h3 slot="drawer-header">Navigation</h3>
									<p>This drawer slides in from the left side.</p>
								</ml-drawer>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Size Variants</h3>
								<span class="demo-card__badge">4 sizes</span>
							</div>
							<div class="demo-row">
								<ml-button variant="outline" @click=${() => c.openDrawer('drawer-sm')}>Small</ml-button>
								<ml-drawer id="drawer-sm" size="sm">
									<h3 slot="drawer-header">Small Drawer</h3>
									<p>320px wide panel.</p>
								</ml-drawer>

								<ml-button variant="outline" @click=${() => c.openDrawer('drawer-md')}>Medium</ml-button>
								<ml-drawer id="drawer-md" size="md">
									<h3 slot="drawer-header">Medium Drawer</h3>
									<p>480px wide panel (default).</p>
								</ml-drawer>

								<ml-button variant="outline" @click=${() => c.openDrawer('drawer-lg')}>Large</ml-button>
								<ml-drawer id="drawer-lg" size="lg">
									<h3 slot="drawer-header">Large Drawer</h3>
									<p>640px wide panel.</p>
								</ml-drawer>
							</div>
						</div>
					</section>

					<!-- Sliders Section -->
					<section id="sliders" class="demo-section">
						<div class="demo-section__header">
							<h2>Sliders</h2>
							<p>Range inputs for selecting numeric values within a range.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Basic</h3>
							</div>
							<ml-stack gap="6">
								<ml-slider label="Volume" value="50" show-value></ml-slider>
								<ml-slider label="Brightness" value="75" show-value></ml-slider>
							</ml-stack>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Custom Range</h3>
							</div>
							<ml-stack gap="6">
								<ml-slider label="Price" min="0" max="1000" step="10" value="250" show-value hint="Drag to set max price"></ml-slider>
								<ml-slider label="Temperature" min="-20" max="50" value="22" show-value></ml-slider>
							</ml-stack>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>States</h3>
							</div>
							<ml-stack gap="6">
								<ml-slider label="Disabled" value="40" disabled show-value></ml-slider>
								<ml-slider label="With Error" value="10" .error=${c.sliderError} show-value @ml:input=${c.handleSliderValidation}></ml-slider>
							</ml-stack>
						</div>
					</section>

					<!-- Progress Section -->
					<section id="progress" class="demo-section">
						<div class="demo-section__header">
							<h2>Progress</h2>
							<p>Linear progress bars for displaying completion state.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Variants</h3>
								<span class="demo-card__badge">4 colors</span>
							</div>
							<ml-stack gap="6">
								<ml-progress variant="primary" value="60" label="Upload" show-value></ml-progress>
								<ml-progress variant="success" value="100" label="Complete" show-value></ml-progress>
								<ml-progress variant="warning" value="45" label="Storage" show-value></ml-progress>
								<ml-progress variant="error" value="15" label="Failed" show-value></ml-progress>
							</ml-stack>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Sizes</h3>
								<span class="demo-card__badge">3 sizes</span>
							</div>
							<ml-stack gap="6">
								<ml-progress size="sm" value="60" label="Small"></ml-progress>
								<ml-progress size="md" value="60" label="Medium"></ml-progress>
								<ml-progress size="lg" value="60" label="Large"></ml-progress>
							</ml-stack>
						</div>
					</section>

					<!-- Toasts Section -->
					<section id="toasts" class="demo-section">
						<div class="demo-section__header">
							<h2>Toasts</h2>
							<p>Notification messages that appear briefly and auto-dismiss.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Trigger Toasts</h3>
								<span class="demo-card__badge">4 variants</span>
							</div>
							<div class="demo-row">
								<ml-button variant="outline" @click=${() => c.showToast('info', 'Info', 'This is an informational toast.')}>
									Info Toast
								</ml-button>
								<ml-button variant="outline" @click=${() => c.showToast('success', 'Success', 'Your changes have been saved.')}>
									Success Toast
								</ml-button>
								<ml-button variant="outline" @click=${() => c.showToast('warning', 'Warning', 'Please check your input.')}>
									Warning Toast
								</ml-button>
								<ml-button variant="outline" @click=${() => c.showToast('error', 'Error', 'Something went wrong.')}>
									Error Toast
								</ml-button>
							</div>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Static Examples</h3>
							</div>
							<ml-stack gap="3">
								<ml-toast variant="info" title="Update available" message="A new version is ready to install." duration="0"></ml-toast>
								<ml-toast variant="success" title="File uploaded" message="document.pdf was uploaded successfully." duration="0"></ml-toast>
								<ml-toast variant="warning" title="Low storage" message="You have less than 100MB remaining." duration="0"></ml-toast>
								<ml-toast variant="error" title="Connection lost" message="Please check your internet connection." duration="0"></ml-toast>
							</ml-stack>
						</div>
					</section>

					<!-- Breadcrumbs Section -->
					<section id="breadcrumbs" class="demo-section">
						<div class="demo-section__header">
							<h2>Breadcrumbs</h2>
							<p>Navigation aid showing the current page location within a hierarchy.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Chevron Separator</h3>
								<span class="demo-card__badge">Default</span>
							</div>
							<ml-breadcrumb>
								<ml-breadcrumb-item href="#" icon="house">Home</ml-breadcrumb-item>
								<ml-breadcrumb-item href="#">Settings</ml-breadcrumb-item>
								<ml-breadcrumb-item current>Profile</ml-breadcrumb-item>
							</ml-breadcrumb>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Slash Separator</h3>
							</div>
							<ml-breadcrumb separator="slash">
								<ml-breadcrumb-item href="#">Dashboard</ml-breadcrumb-item>
								<ml-breadcrumb-item href="#">Projects</ml-breadcrumb-item>
								<ml-breadcrumb-item href="#">Melodic UI</ml-breadcrumb-item>
								<ml-breadcrumb-item current>Components</ml-breadcrumb-item>
							</ml-breadcrumb>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>With Icons</h3>
							</div>
							<ml-breadcrumb>
								<ml-breadcrumb-item href="#" icon="house">Home</ml-breadcrumb-item>
								<ml-breadcrumb-item href="#" icon="folder">Documents</ml-breadcrumb-item>
								<ml-breadcrumb-item href="#" icon="file-text">Reports</ml-breadcrumb-item>
								<ml-breadcrumb-item current icon="chart-bar">Analytics</ml-breadcrumb-item>
							</ml-breadcrumb>
						</div>
					</section>

					<!-- Pagination Section -->
					<section id="pagination" class="demo-section">
						<div class="demo-section__header">
							<h2>Pagination</h2>
							<p>Page navigation controls with previous/next buttons and page numbers.</p>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Interactive</h3>
							</div>
							<ml-pagination
								.page=${c.currentPage}
								total-pages="10"
								@ml:page-change=${c.handlePageChange}
							></ml-pagination>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Many Pages</h3>
								<span class="demo-card__badge">Ellipsis</span>
							</div>
							<ml-pagination page="5" total-pages="20"></ml-pagination>
						</div>

						<div class="demo-card">
							<div class="demo-card__header">
								<h3>Few Pages</h3>
							</div>
							<ml-pagination page="2" total-pages="3"></ml-pagination>
						</div>
					</section>
				</main>

				<footer class="demo-footer">
					<p>Built with Melodic Framework</p>
				</footer>
			</div>
		</div>
	`;
};
