import { css } from '@melodicdev/core';

export const demoAppStyles = () => css`
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

	.demo-grid > * {
		min-width: 0;
	}

	.demo-grid-3 {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--ml-space-4);
	}

	.demo-grid-2 {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--ml-space-4);
	}

	.demo-grid-2 > * {
		min-width: 0;
	}

	@media (max-width: 640px) {
		.demo-grid-2 {
			grid-template-columns: 1fr;
		}
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

	/* Code Examples */
	.demo-code-example {
		background-color: var(--ml-color-surface-secondary, var(--ml-gray-50));
		border-radius: var(--ml-radius-md);
		padding: var(--ml-space-4);
	}

	.demo-code-description {
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-secondary);
		margin-bottom: var(--ml-space-3);
		line-height: var(--ml-leading-relaxed);
	}

	.demo-code-description code {
		background-color: var(--ml-color-surface, var(--ml-gray-100));
		padding: var(--ml-space-0-5) var(--ml-space-1);
		border-radius: var(--ml-radius-sm);
		font-family: var(--ml-font-mono);
		font-size: var(--ml-text-xs);
		color: var(--ml-color-primary);
	}

	.demo-code {
		background-color: var(--ml-gray-900);
		color: var(--ml-gray-100);
		border-radius: var(--ml-radius-md);
		padding: var(--ml-space-4);
		overflow-x: auto;
		font-family: var(--ml-font-mono);
		font-size: var(--ml-text-xs);
		line-height: var(--ml-leading-relaxed);
		margin: 0;
	}

	.demo-code code {
		background: none;
		padding: 0;
		color: inherit;
		font-size: inherit;
	}

	.demo-code-list {
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-secondary);
		padding-left: var(--ml-space-5);
		margin: 0;
	}

	.demo-code-list li {
		margin-bottom: var(--ml-space-1);
	}

	.demo-code-list li:last-child {
		margin-bottom: 0;
	}
`;
