import { css } from '@melodicdev/core';

export const tabsStyles = () => css`
	:host {
		display: block;
		width: 100%;
	}

	.ml-tabs {
		display: flex;
		flex-direction: column;
	}

	/* Vertical orientation */
	.ml-tabs--vertical {
		flex-direction: row;
	}

	.ml-tabs--vertical .ml-tabs__list {
		flex-direction: column;
		border-bottom: none;
		border-right: var(--ml-border) solid var(--ml-color-border);
		padding-right: var(--ml-space-2);
		margin-right: var(--ml-space-4);
	}

	.ml-tabs--vertical .ml-tabs__panels {
		flex: 1;
		min-width: 0;
	}

	/* Tab list */
	.ml-tabs__list {
		display: flex;
		gap: var(--ml-space-1);
		position: relative;
	}

	/* Tab button base */
	.ml-tabs__tab {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-2);
		padding: var(--ml-space-2) var(--ml-space-4);
		font-family: var(--ml-font-sans);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		background: transparent;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color var(--ml-duration-150) var(--ml-ease-in-out),
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			border-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-tabs__tab:hover:not(:disabled) {
		color: var(--ml-color-text);
	}

	.ml-tabs__tab:focus-visible {
		outline: 2px solid var(--ml-color-primary);
		outline-offset: 2px;
	}

	.ml-tabs__tab--active {
		color: var(--ml-color-primary);
	}

	.ml-tabs__tab--disabled {
		color: var(--ml-color-text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ml-tabs__tab-label {
		line-height: var(--ml-leading-tight);
	}

	/* Panels */
	.ml-tabs__panels {
		padding-top: var(--ml-space-4);
	}

	.ml-tabs--vertical .ml-tabs__panels {
		padding-top: 0;
	}

	/* ============================================
	   VARIANT: Line (underline style)
	   ============================================ */
	.ml-tabs--line .ml-tabs__list {
		border-bottom: var(--ml-border) solid var(--ml-color-border);
		gap: 0;
	}

	.ml-tabs--line .ml-tabs__tab {
		position: relative;
		padding-bottom: calc(var(--ml-space-2) + 2px);
		margin-bottom: -1px;
	}

	.ml-tabs--line .ml-tabs__tab::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background-color: transparent;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-tabs--line .ml-tabs__tab--active::after {
		background-color: var(--ml-color-primary);
	}

	.ml-tabs--line.ml-tabs--vertical .ml-tabs__list {
		border-bottom: none;
		border-right: var(--ml-border) solid var(--ml-color-border);
	}

	.ml-tabs--line.ml-tabs--vertical .ml-tabs__tab {
		padding-bottom: var(--ml-space-2);
		padding-right: calc(var(--ml-space-4) + 2px);
		margin-bottom: 0;
		margin-right: -1px;
	}

	.ml-tabs--line.ml-tabs--vertical .ml-tabs__tab::after {
		bottom: auto;
		left: auto;
		top: 0;
		right: 0;
		width: 2px;
		height: 100%;
	}

	/* ============================================
	   VARIANT: Enclosed (bordered tab style)
	   ============================================ */
	.ml-tabs--enclosed .ml-tabs__list {
		border-bottom: var(--ml-border) solid var(--ml-color-border);
		gap: 0;
	}

	.ml-tabs--enclosed .ml-tabs__tab {
		position: relative;
		border: var(--ml-border) solid transparent;
		border-bottom: none;
		border-radius: var(--ml-radius) var(--ml-radius) 0 0;
		margin-bottom: -1px;
		background-color: transparent;
	}

	.ml-tabs--enclosed .ml-tabs__tab:hover:not(:disabled):not(.ml-tabs__tab--active) {
		background-color: var(--ml-color-surface-secondary);
	}

	.ml-tabs--enclosed .ml-tabs__tab--active {
		background-color: var(--ml-color-surface);
		border-color: var(--ml-color-border);
		color: var(--ml-color-text);
	}

	.ml-tabs--enclosed .ml-tabs__tab--active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 1px;
		background-color: var(--ml-color-surface);
	}

	/* ============================================
	   VARIANT: Pills (soft rounded style)
	   ============================================ */
	.ml-tabs--pills .ml-tabs__list {
		gap: var(--ml-space-1);
	}

	.ml-tabs--pills .ml-tabs__tab {
		border-radius: var(--ml-radius);
	}

	.ml-tabs--pills .ml-tabs__tab:hover:not(:disabled):not(.ml-tabs__tab--active) {
		background-color: var(--ml-color-surface-secondary);
	}

	.ml-tabs--pills .ml-tabs__tab--active {
		background-color: var(--ml-color-primary-subtle);
		color: var(--ml-color-primary);
	}

	/* ============================================
	   SIZE VARIANTS
	   ============================================ */
	.ml-tabs--sm .ml-tabs__tab {
		padding: var(--ml-space-1-5) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	.ml-tabs--md .ml-tabs__tab {
		padding: var(--ml-space-2) var(--ml-space-4);
		font-size: var(--ml-text-sm);
	}

	.ml-tabs--lg .ml-tabs__tab {
		padding: var(--ml-space-2-5) var(--ml-space-5);
		font-size: var(--ml-text-base);
	}

	/* ============================================
	   SLOTTED TAB STYLING
	   ============================================ */
	::slotted(ml-tab) {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-2);
		padding: var(--ml-space-2) var(--ml-space-4);
		font-family: var(--ml-font-sans);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		background: transparent;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color var(--ml-duration-150) var(--ml-ease-in-out),
			background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	::slotted(ml-tab:hover) {
		color: var(--ml-color-text);
	}

	::slotted(ml-tab[active]) {
		color: var(--ml-color-primary);
	}

	::slotted(ml-tab[disabled]) {
		color: var(--ml-color-text-muted);
		cursor: not-allowed;
	}
`;
