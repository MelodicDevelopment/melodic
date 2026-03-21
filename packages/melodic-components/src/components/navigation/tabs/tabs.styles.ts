import { css } from '@melodicdev/core';

export const tabsStyles = () => css`
	:host {
		/* Tab list */
		--ml-tabs-list-gap: var(--ml-space-1);
		--ml-tabs-list-border-width: var(--ml-border);
		--ml-tabs-list-border-color: var(--ml-color-border);

		/* Tab button base */
		--ml-tabs-tab-gap: var(--ml-space-2);
		--ml-tabs-tab-padding-y: var(--ml-space-2);
		--ml-tabs-tab-padding-x: var(--ml-space-4);
		--ml-tabs-tab-font-family: var(--ml-font-sans);
		--ml-tabs-tab-font-weight: var(--ml-font-medium);
		--ml-tabs-tab-color: var(--ml-color-text-secondary);
		--ml-tabs-tab-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Tab hover */
		--ml-tabs-tab-hover-color: var(--ml-color-text);

		/* Tab focus */
		--ml-tabs-tab-focus-color: var(--ml-color-primary);

		/* Tab active */
		--ml-tabs-tab-active-color: var(--ml-color-primary);

		/* Tab disabled */
		--ml-tabs-tab-disabled-color: var(--ml-color-text-muted);
		--ml-tabs-tab-disabled-opacity: 0.6;

		/* Label */
		--ml-tabs-tab-label-line-height: var(--ml-leading-tight);

		/* Panels */
		--ml-tabs-panels-padding-top: var(--ml-space-4);

		/* Vertical border */
		--ml-tabs-vertical-border-padding: var(--ml-space-2);
		--ml-tabs-vertical-border-margin: var(--ml-space-4);

		/* Line variant - indicator */
		--ml-tabs-line-indicator-height: 2px;
		--ml-tabs-line-indicator-color: var(--ml-color-primary);

		/* Enclosed variant */
		--ml-tabs-enclosed-tab-radius: var(--ml-radius);
		--ml-tabs-enclosed-active-bg: var(--ml-color-surface);
		--ml-tabs-enclosed-active-border-color: var(--ml-color-border);
		--ml-tabs-enclosed-active-color: var(--ml-color-text);
		--ml-tabs-enclosed-hover-bg: var(--ml-color-surface-secondary);

		/* Pills variant */
		--ml-tabs-pills-tab-radius: var(--ml-radius);
		--ml-tabs-pills-active-bg: var(--ml-color-primary-subtle);
		--ml-tabs-pills-active-color: var(--ml-color-primary);
		--ml-tabs-pills-hover-bg: var(--ml-color-surface-secondary);

		/* Size: sm */
		--ml-tabs-sm-padding-y: var(--ml-space-1-5);
		--ml-tabs-sm-padding-x: var(--ml-space-3);
		--ml-tabs-sm-font-size: var(--ml-text-sm);

		/* Size: md */
		--ml-tabs-md-padding-y: var(--ml-space-2);
		--ml-tabs-md-padding-x: var(--ml-space-4);
		--ml-tabs-md-font-size: var(--ml-text-sm);

		/* Size: lg */
		--ml-tabs-lg-padding-y: var(--ml-space-2-5);
		--ml-tabs-lg-padding-x: var(--ml-space-5);
		--ml-tabs-lg-font-size: var(--ml-text-base);

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
		border-right: var(--ml-tabs-list-border-width) solid var(--ml-tabs-list-border-color);
		padding-right: var(--ml-tabs-vertical-border-padding);
		margin-right: var(--ml-tabs-vertical-border-margin);
	}

	.ml-tabs--vertical .ml-tabs__panels {
		flex: 1;
		min-width: 0;
	}

	/* Tab list */
	.ml-tabs__list {
		display: flex;
		gap: var(--ml-tabs-list-gap);
		position: relative;
	}

	/* Tab button base */
	.ml-tabs__tab {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-tabs-tab-gap);
		padding: var(--ml-tabs-tab-padding-y) var(--ml-tabs-tab-padding-x);
		font-family: var(--ml-tabs-tab-font-family);
		font-weight: var(--ml-tabs-tab-font-weight);
		color: var(--ml-tabs-tab-color);
		background: transparent;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color var(--ml-tabs-tab-transition),
			background-color var(--ml-tabs-tab-transition),
			border-color var(--ml-tabs-tab-transition);
	}

	.ml-tabs__tab:hover:not(:disabled) {
		color: var(--ml-tabs-tab-hover-color);
	}

	.ml-tabs__tab:focus-visible {
		outline: 2px solid var(--ml-tabs-tab-focus-color);
		outline-offset: 2px;
	}

	.ml-tabs__tab--active {
		color: var(--ml-tabs-tab-active-color);
	}

	.ml-tabs__tab--disabled {
		color: var(--ml-tabs-tab-disabled-color);
		cursor: not-allowed;
		opacity: var(--ml-tabs-tab-disabled-opacity);
	}

	.ml-tabs__tab-label {
		line-height: var(--ml-tabs-tab-label-line-height);
	}

	/* Panels */
	.ml-tabs__panels {
		padding-top: var(--ml-tabs-panels-padding-top);
	}

	.ml-tabs--vertical .ml-tabs__panels {
		padding-top: 0;
	}

	/* ============================================
	   VARIANT: Line (underline style)
	   ============================================ */
	.ml-tabs--line .ml-tabs__list {
		border-bottom: var(--ml-tabs-list-border-width) solid var(--ml-tabs-list-border-color);
		gap: 0;
	}

	.ml-tabs--line .ml-tabs__tab {
		position: relative;
		padding-bottom: calc(var(--ml-tabs-tab-padding-y) + var(--ml-tabs-line-indicator-height));
		margin-bottom: -1px;
	}

	.ml-tabs--line .ml-tabs__tab::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: var(--ml-tabs-line-indicator-height);
		background-color: transparent;
		transition: background-color var(--ml-tabs-tab-transition);
	}

	.ml-tabs--line .ml-tabs__tab--active::after {
		background-color: var(--ml-tabs-line-indicator-color);
	}

	.ml-tabs--line.ml-tabs--vertical .ml-tabs__list {
		border-bottom: none;
		border-right: var(--ml-tabs-list-border-width) solid var(--ml-tabs-list-border-color);
	}

	.ml-tabs--line.ml-tabs--vertical .ml-tabs__tab {
		padding-bottom: var(--ml-tabs-tab-padding-y);
		padding-right: calc(var(--ml-tabs-tab-padding-x) + var(--ml-tabs-line-indicator-height));
		margin-bottom: 0;
		margin-right: -1px;
	}

	.ml-tabs--line.ml-tabs--vertical .ml-tabs__tab::after {
		bottom: auto;
		left: auto;
		top: 0;
		right: 0;
		width: var(--ml-tabs-line-indicator-height);
		height: 100%;
	}

	/* ============================================
	   VARIANT: Enclosed (bordered tab style)
	   ============================================ */
	.ml-tabs--enclosed .ml-tabs__list {
		border-bottom: var(--ml-tabs-list-border-width) solid var(--ml-tabs-list-border-color);
		gap: 0;
	}

	.ml-tabs--enclosed .ml-tabs__tab {
		position: relative;
		border: var(--ml-tabs-list-border-width) solid transparent;
		border-bottom: none;
		border-radius: var(--ml-tabs-enclosed-tab-radius) var(--ml-tabs-enclosed-tab-radius) 0 0;
		margin-bottom: -1px;
		background-color: transparent;
	}

	.ml-tabs--enclosed .ml-tabs__tab:hover:not(:disabled):not(.ml-tabs__tab--active) {
		background-color: var(--ml-tabs-enclosed-hover-bg);
	}

	.ml-tabs--enclosed .ml-tabs__tab--active {
		background-color: var(--ml-tabs-enclosed-active-bg);
		border-color: var(--ml-tabs-enclosed-active-border-color);
		color: var(--ml-tabs-enclosed-active-color);
	}

	.ml-tabs--enclosed .ml-tabs__tab--active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 1px;
		background-color: var(--ml-tabs-enclosed-active-bg);
	}

	/* ============================================
	   VARIANT: Pills (soft rounded style)
	   ============================================ */
	.ml-tabs--pills .ml-tabs__list {
		gap: var(--ml-tabs-list-gap);
	}

	.ml-tabs--pills .ml-tabs__tab {
		border-radius: var(--ml-tabs-pills-tab-radius);
	}

	.ml-tabs--pills .ml-tabs__tab:hover:not(:disabled):not(.ml-tabs__tab--active) {
		background-color: var(--ml-tabs-pills-hover-bg);
	}

	.ml-tabs--pills .ml-tabs__tab--active {
		background-color: var(--ml-tabs-pills-active-bg);
		color: var(--ml-tabs-pills-active-color);
	}

	/* ============================================
	   SIZE VARIANTS
	   ============================================ */
	.ml-tabs--sm .ml-tabs__tab {
		padding: var(--ml-tabs-sm-padding-y) var(--ml-tabs-sm-padding-x);
		font-size: var(--ml-tabs-sm-font-size);
	}

	.ml-tabs--md .ml-tabs__tab {
		padding: var(--ml-tabs-md-padding-y) var(--ml-tabs-md-padding-x);
		font-size: var(--ml-tabs-md-font-size);
	}

	.ml-tabs--lg .ml-tabs__tab {
		padding: var(--ml-tabs-lg-padding-y) var(--ml-tabs-lg-padding-x);
		font-size: var(--ml-tabs-lg-font-size);
	}

	/* ============================================
	   SLOTTED TAB STYLING
	   ============================================ */
	::slotted(ml-tab) {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-tabs-tab-gap);
		padding: var(--ml-tabs-tab-padding-y) var(--ml-tabs-tab-padding-x);
		font-family: var(--ml-tabs-tab-font-family);
		font-weight: var(--ml-tabs-tab-font-weight);
		color: var(--ml-tabs-tab-color);
		background: transparent;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color var(--ml-tabs-tab-transition),
			background-color var(--ml-tabs-tab-transition);
	}

	::slotted(ml-tab:hover) {
		color: var(--ml-tabs-tab-hover-color);
	}

	::slotted(ml-tab[active]) {
		color: var(--ml-tabs-tab-active-color);
	}

	::slotted(ml-tab[disabled]) {
		color: var(--ml-tabs-tab-disabled-color);
		cursor: not-allowed;
	}
`;
