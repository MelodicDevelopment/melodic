import { css } from '@melodicdev/core';

export const autocompleteStyles = () => css`
	:host {
		display: block;
		width: 100%;
		min-width: 0;
		box-sizing: border-box;

		/* --- Label --- */
		--ml-autocomplete-label-font-size: var(--ml-text-sm);
		--ml-autocomplete-label-font-weight: var(--ml-font-medium);
		--ml-autocomplete-label-color: var(--ml-color-text-secondary);
		--ml-autocomplete-label-line-height: var(--ml-leading-tight);

		/* --- Required indicator --- */
		--ml-autocomplete-required-color: var(--ml-color-danger);

		/* --- Trigger --- */
		--ml-autocomplete-bg: var(--ml-color-surface);
		--ml-autocomplete-border-width: var(--ml-border);
		--ml-autocomplete-border-color: var(--ml-color-border);
		--ml-autocomplete-border-radius: var(--ml-radius);
		--ml-autocomplete-color: var(--ml-color-text);
		--ml-autocomplete-font-family: var(--ml-font-sans);
		--ml-autocomplete-font-size: var(--ml-text-sm);
		--ml-autocomplete-padding: var(--ml-space-2-5) var(--ml-space-3-5);
		--ml-autocomplete-gap: var(--ml-space-2);
		--ml-autocomplete-hover-border-color: var(--ml-color-border-strong);

		/* --- Focus --- */
		--ml-autocomplete-focus-border-color: var(--ml-color-primary);
		--ml-autocomplete-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Error --- */
		--ml-autocomplete-error-border-color: var(--ml-color-danger);
		--ml-autocomplete-error-focus-shadow: var(--ml-shadow-ring-error);
		--ml-autocomplete-error-color: var(--ml-color-danger);

		/* --- Disabled --- */
		--ml-autocomplete-disabled-bg: var(--ml-color-input-disabled-bg);
		--ml-autocomplete-disabled-color: var(--ml-color-text-muted);

		/* --- Placeholder --- */
		--ml-autocomplete-placeholder-color: var(--ml-color-text-muted);

		/* --- Icons --- */
		--ml-autocomplete-icon-color: var(--ml-color-text-muted);

		/* --- Clear button --- */
		--ml-autocomplete-clear-color: var(--ml-color-text-muted);
		--ml-autocomplete-clear-hover-color: var(--ml-color-text);
		--ml-autocomplete-clear-hover-bg: var(--ml-color-surface-raised);

		/* --- Dropdown --- */
		--ml-autocomplete-dropdown-bg: var(--ml-color-surface);
		--ml-autocomplete-dropdown-border-color: var(--ml-color-border);
		--ml-autocomplete-dropdown-border-radius: var(--ml-radius);
		--ml-autocomplete-dropdown-shadow: var(--ml-shadow-lg);
		--ml-autocomplete-dropdown-max-height: 280px;
		--ml-autocomplete-dropdown-padding: var(--ml-space-1-5);

		/* --- Option --- */
		--ml-autocomplete-option-padding: var(--ml-space-2) var(--ml-space-3);
		--ml-autocomplete-option-border-radius: var(--ml-radius-sm);
		--ml-autocomplete-option-font-size: var(--ml-text-sm);
		--ml-autocomplete-option-font-weight: var(--ml-font-medium);
		--ml-autocomplete-option-color: var(--ml-color-text);
		--ml-autocomplete-option-hover-bg: var(--ml-color-surface-raised);
		--ml-autocomplete-option-selected-bg: var(--ml-color-primary-subtle);
		--ml-autocomplete-option-disabled-color: var(--ml-color-text-muted);
		--ml-autocomplete-option-check-color: var(--ml-color-primary);
		--ml-autocomplete-option-subtitle-font-size: var(--ml-text-xs);
		--ml-autocomplete-option-subtitle-color: var(--ml-color-text-muted);

		/* --- Tag (multi-select) --- */
		--ml-autocomplete-tag-height: 20px;
		--ml-autocomplete-tag-border-radius: var(--ml-radius-full);
		--ml-autocomplete-tag-border-color: var(--ml-color-border);
		--ml-autocomplete-tag-bg: var(--ml-color-surface);
		--ml-autocomplete-tag-font-size: var(--ml-text-xs);
		--ml-autocomplete-tag-font-weight: var(--ml-font-medium);
		--ml-autocomplete-tag-color: var(--ml-color-text);
		--ml-autocomplete-tag-remove-color: var(--ml-color-text-secondary);
		--ml-autocomplete-tag-remove-hover-color: var(--ml-color-text);
		--ml-autocomplete-tag-remove-hover-bg: var(--ml-color-surface-raised);

		/* --- Hint --- */
		--ml-autocomplete-hint-color: var(--ml-color-text-muted);
		--ml-autocomplete-hint-font-size: var(--ml-text-sm);

		/* --- Transition --- */
		--ml-autocomplete-transition-duration: var(--ml-duration-150);
		--ml-autocomplete-transition-easing: var(--ml-ease-in-out);
	}

	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}

	.ml-autocomplete {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
		max-width: 100%;
	}

	.ml-autocomplete__control {
		position: relative;
		max-width: 100%;
	}

	.ml-autocomplete__label {
		font-size: var(--ml-autocomplete-label-font-size);
		font-weight: var(--ml-autocomplete-label-font-weight);
		color: var(--ml-autocomplete-label-color);
		line-height: var(--ml-autocomplete-label-line-height);
	}

	.ml-autocomplete__required {
		color: var(--ml-autocomplete-required-color);
		margin-left: var(--ml-space-0-5);
	}

	.ml-autocomplete__trigger {
		display: flex;
		align-items: center;
		gap: var(--ml-autocomplete-gap);
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		padding: var(--ml-autocomplete-padding);
		background-color: var(--ml-autocomplete-bg);
		border: var(--ml-autocomplete-border-width) solid var(--ml-autocomplete-border-color);
		border-radius: var(--ml-autocomplete-border-radius);
		box-shadow: none;
		color: var(--ml-autocomplete-color);
		font-family: var(--ml-autocomplete-font-family);
		font-size: var(--ml-autocomplete-font-size);
		cursor: text;
		text-align: left;
		transition:
			border-color var(--ml-autocomplete-transition-duration) var(--ml-autocomplete-transition-easing),
			box-shadow var(--ml-autocomplete-transition-duration) var(--ml-autocomplete-transition-easing);
	}

	.ml-autocomplete:not(.ml-autocomplete--disabled) .ml-autocomplete__trigger:hover {
		border-color: var(--ml-autocomplete-hover-border-color);
	}

	.ml-autocomplete__trigger:focus-within {
		outline: none;
		border-color: var(--ml-autocomplete-focus-border-color);
		box-shadow: var(--ml-autocomplete-focus-shadow);
	}

	.ml-autocomplete--disabled .ml-autocomplete__trigger {
		background-color: var(--ml-autocomplete-disabled-bg);
		cursor: not-allowed;
		color: var(--ml-autocomplete-disabled-color);
	}

	.ml-autocomplete__search-icon {
		color: var(--ml-autocomplete-icon-color);
		flex-shrink: 0;
		height: 20px;
		display: flex;
		align-items: center;
	}

	.ml-autocomplete__input {
		flex: 1 1 20px;
		min-width: 20px;
		height: 20px;
		border: none;
		outline: none;
		background: transparent;
		font: inherit;
		color: var(--ml-autocomplete-color);
		padding: 0;
		line-height: 20px;
	}

	.ml-autocomplete__input::placeholder {
		color: var(--ml-autocomplete-placeholder-color);
	}

	.ml-autocomplete__input:disabled {
		color: var(--ml-autocomplete-disabled-color);
		cursor: not-allowed;
	}

	.ml-autocomplete__clear {
		border: none;
		background: transparent;
		padding: 2px;
		color: var(--ml-autocomplete-clear-color);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-radius: var(--ml-radius-full);
		transition: color var(--ml-duration-100) var(--ml-autocomplete-transition-easing),
			background-color var(--ml-duration-100) var(--ml-autocomplete-transition-easing);
	}

	.ml-autocomplete__clear:hover {
		color: var(--ml-autocomplete-clear-hover-color);
		background-color: var(--ml-autocomplete-clear-hover-bg);
	}

	/* Multi-mode styles */
	.ml-autocomplete--multiple .ml-autocomplete__trigger {
		flex-wrap: wrap;
		padding-top: var(--ml-space-2);
		padding-bottom: var(--ml-space-2);
	}

	.ml-autocomplete__tags {
		display: contents;
	}

	.ml-autocomplete__tag {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1);
		padding: 0 var(--ml-space-1-5);
		height: var(--ml-autocomplete-tag-height);
		border-radius: var(--ml-autocomplete-tag-border-radius);
		border: var(--ml-autocomplete-border-width) solid var(--ml-autocomplete-tag-border-color);
		background-color: var(--ml-autocomplete-tag-bg);
		font-size: var(--ml-autocomplete-tag-font-size);
		font-weight: var(--ml-autocomplete-tag-font-weight);
		color: var(--ml-autocomplete-tag-color);
		line-height: 1;
		white-space: nowrap;
		max-width: 100%;
		overflow: hidden;
		box-sizing: border-box;
	}

	.ml-autocomplete__tag-label {
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: inherit;
	}

	.ml-autocomplete__tag-avatar {
		width: 14px;
		height: 14px;
		border-radius: var(--ml-autocomplete-tag-border-radius);
		object-fit: cover;
		margin-left: -2px;
	}

	.ml-autocomplete__tag-remove {
		border: none;
		background: transparent;
		padding: 2px;
		margin-left: var(--ml-space-0-5);
		margin-right: -4px;
		color: var(--ml-autocomplete-tag-remove-color);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-radius: var(--ml-autocomplete-tag-border-radius);
		transition: color var(--ml-duration-100) var(--ml-autocomplete-transition-easing),
			background-color var(--ml-duration-100) var(--ml-autocomplete-transition-easing);
	}

	.ml-autocomplete__tag-remove:hover {
		color: var(--ml-autocomplete-tag-remove-hover-color);
		background-color: var(--ml-autocomplete-tag-remove-hover-bg);
	}

	/* Dropdown */
	.ml-autocomplete__dropdown {
		position: fixed;
		inset: unset;
		margin: 0;
		z-index: 50;
		background-color: var(--ml-autocomplete-dropdown-bg);
		border: var(--ml-autocomplete-border-width) solid var(--ml-autocomplete-dropdown-border-color);
		border-radius: var(--ml-autocomplete-dropdown-border-radius);
		box-shadow: var(--ml-autocomplete-dropdown-shadow);
		max-height: var(--ml-autocomplete-dropdown-max-height);
		overflow-y: auto;
		padding: var(--ml-autocomplete-dropdown-padding);
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1);
	}

	.ml-autocomplete__dropdown:not(:popover-open) {
		display: none;
	}

	.ml-autocomplete__empty {
		padding: var(--ml-autocomplete-option-padding);
		font-size: var(--ml-autocomplete-option-font-size);
		color: var(--ml-autocomplete-placeholder-color);
	}

	.ml-autocomplete__loading {
		padding: var(--ml-space-3) var(--ml-space-3);
		font-size: var(--ml-autocomplete-option-font-size);
		color: var(--ml-autocomplete-placeholder-color);
		display: flex;
		align-items: center;
		gap: var(--ml-autocomplete-gap);
		justify-content: center;
	}

	/* Options */
	.ml-autocomplete__option {
		display: flex;
		align-items: center;
		gap: var(--ml-autocomplete-gap);
		padding: var(--ml-autocomplete-option-padding);
		border-radius: var(--ml-autocomplete-option-border-radius);
		cursor: pointer;
		font-size: var(--ml-autocomplete-option-font-size);
		font-weight: var(--ml-autocomplete-option-font-weight);
		color: var(--ml-autocomplete-option-color);
		transition: background-color var(--ml-duration-100) var(--ml-autocomplete-transition-easing);
	}

	.ml-autocomplete__option:hover:not(.ml-autocomplete__option--disabled) {
		background-color: var(--ml-autocomplete-option-hover-bg);
	}

	.ml-autocomplete__option--focused {
		background-color: var(--ml-autocomplete-option-hover-bg);
	}

	.ml-autocomplete__option--selected {
		background-color: var(--ml-autocomplete-option-selected-bg);
	}

	.ml-autocomplete__option--selected:hover:not(.ml-autocomplete__option--disabled) {
		background-color: var(--ml-autocomplete-option-selected-bg);
	}

	.ml-autocomplete__option--disabled {
		color: var(--ml-autocomplete-option-disabled-color);
		cursor: not-allowed;
	}

	.ml-autocomplete__option-icon {
		flex-shrink: 0;
		color: var(--ml-autocomplete-icon-color);
	}

	.ml-autocomplete__option-avatar {
		width: 24px;
		height: 24px;
		border-radius: var(--ml-radius-full);
		object-fit: cover;
		flex-shrink: 0;
	}

	.ml-autocomplete__option--selected .ml-autocomplete__option-icon {
		color: var(--ml-autocomplete-option-check-color);
	}

	.ml-autocomplete__option-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.ml-autocomplete__option-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-autocomplete__option-subtitle {
		font-size: var(--ml-autocomplete-option-subtitle-font-size);
		font-weight: var(--ml-font-normal);
		color: var(--ml-autocomplete-option-subtitle-color);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-autocomplete__option-check {
		flex-shrink: 0;
		color: var(--ml-autocomplete-option-check-color);
		margin-left: auto;
	}

	/* Hint / Error */
	.ml-autocomplete__hint,
	.ml-autocomplete__error {
		font-size: var(--ml-autocomplete-hint-font-size);
		line-height: var(--ml-autocomplete-label-line-height);
	}

	.ml-autocomplete__hint {
		color: var(--ml-autocomplete-hint-color);
	}

	.ml-autocomplete__error {
		color: var(--ml-autocomplete-error-color);
	}

	.ml-autocomplete--error .ml-autocomplete__trigger {
		border-color: var(--ml-autocomplete-error-border-color);
	}

	.ml-autocomplete--error .ml-autocomplete__trigger:focus-within {
		box-shadow: var(--ml-autocomplete-error-focus-shadow);
	}

	/* Size variants */
	.ml-autocomplete--sm .ml-autocomplete__trigger {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	.ml-autocomplete--md .ml-autocomplete__trigger {
		padding: var(--ml-space-2-5) var(--ml-space-3-5);
		font-size: var(--ml-text-sm);
	}

	.ml-autocomplete--lg .ml-autocomplete__trigger {
		padding: var(--ml-space-3) var(--ml-space-3-5);
		font-size: var(--ml-text-base);
	}

	/* Disabled state */
	.ml-autocomplete--disabled {
		pointer-events: none;
	}
`;
