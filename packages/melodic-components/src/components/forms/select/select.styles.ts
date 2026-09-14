import { css } from '@melodicdev/core';

export const selectStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Label
	 * --ml-select-label-font-size: var(--ml-text-sm)
	 * --ml-select-label-font-weight: var(--ml-font-medium)
	 * --ml-select-label-color: var(--ml-color-text-secondary)
	 * --ml-select-label-line-height: var(--ml-leading-tight)
	 *
	 * Required indicator
	 * --ml-select-required-color: var(--ml-color-danger)
	 *
	 * Trigger
	 * --ml-select-bg: var(--ml-color-input-bg)
	 * --ml-select-border-width: var(--ml-border)
	 * --ml-select-border-color: var(--ml-color-border)
	 * --ml-select-border-radius: var(--ml-radius)
	 * --ml-select-color: var(--ml-color-text)
	 * --ml-select-font-family: var(--ml-font-sans)
	 * --ml-select-font-size: var(--ml-text-sm)
	 * --ml-select-padding: var(--ml-space-2-5) var(--ml-space-3-5)
	 * --ml-select-gap: var(--ml-space-2)
	 * --ml-select-hover-border-color: var(--ml-color-border-strong)
	 *
	 * Focus
	 * --ml-select-focus-border-color: var(--ml-color-primary)
	 * --ml-select-focus-shadow: var(--ml-shadow-focus-ring)
	 * --ml-select-focus-inset-shadow: none
	 *
	 * Error
	 * --ml-select-error-border-color: var(--ml-color-danger)
	 * --ml-select-error-focus-shadow: var(--ml-shadow-ring-error)
	 * --ml-select-error-color: var(--ml-color-danger)
	 *
	 * Disabled
	 * --ml-select-disabled-bg: var(--ml-color-input-disabled-bg)
	 * --ml-select-disabled-color: var(--ml-color-text-muted)
	 *
	 * Placeholder
	 * --ml-select-placeholder-color: var(--ml-color-text-muted)
	 *
	 * Chevron / Icons
	 * --ml-select-icon-color: var(--ml-color-text-muted)
	 *
	 * Dropdown
	 * --ml-select-dropdown-bg: var(--ml-color-surface)
	 * --ml-select-dropdown-border-color: var(--ml-color-border)
	 * --ml-select-dropdown-border-radius: var(--ml-radius)
	 * --ml-select-dropdown-shadow: var(--ml-shadow-lg)
	 * --ml-select-dropdown-max-height: 280px
	 * --ml-select-dropdown-padding: var(--ml-space-1-5)
	 *
	 * Option
	 * --ml-select-option-padding: var(--ml-space-2) var(--ml-space-3)
	 * --ml-select-option-border-radius: var(--ml-radius-sm)
	 * --ml-select-option-font-size: var(--ml-text-sm)
	 * --ml-select-option-font-weight: var(--ml-font-medium)
	 * --ml-select-option-color: var(--ml-color-text)
	 * --ml-select-option-hover-bg: var(--ml-color-surface-raised)
	 * --ml-select-option-selected-bg: var(--ml-color-primary-subtle)
	 * --ml-select-option-disabled-color: var(--ml-color-text-muted)
	 * --ml-select-option-check-color: var(--ml-color-primary)
	 *
	 * Tag (multi-select)
	 * --ml-select-tag-height: 20px
	 * --ml-select-tag-border-radius: var(--ml-radius-full)
	 * --ml-select-tag-border-color: var(--ml-color-border)
	 * --ml-select-tag-bg: var(--ml-color-surface)
	 * --ml-select-tag-font-size: var(--ml-text-xs)
	 * --ml-select-tag-font-weight: var(--ml-font-medium)
	 * --ml-select-tag-color: var(--ml-color-text)
	 * --ml-select-tag-remove-color: var(--ml-color-text-secondary)
	 * --ml-select-tag-remove-hover-color: var(--ml-color-text)
	 * --ml-select-tag-remove-hover-bg: var(--ml-color-surface-raised)
	 *
	 * Hint
	 * --ml-select-hint-color: var(--ml-color-text-muted)
	 * --ml-select-hint-font-size: var(--ml-text-sm)
	 *
	 * Transition
	 * --ml-select-transition-duration: var(--ml-duration-150)
	 * --ml-select-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
	}

	*,
	*::before,
	*::after {
		box-sizing: border-box;
	}

	.ml-select {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
		max-width: 100%;
	}

	.ml-select__control {
		position: relative;
		max-width: 100%;
	}

	.ml-select__label {
		font-size: var(--ml-select-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-select-label-font-weight, var(--ml-font-medium));
		color: var(--ml-select-label-color, var(--ml-color-text-secondary));
		line-height: var(--ml-select-label-line-height, var(--ml-leading-tight));
	}

	.ml-select__required {
		color: var(--ml-select-required-color, var(--ml-color-danger));
		margin-left: var(--ml-space-0-5);
	}

	.ml-select__trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-select-gap, var(--ml-space-2));
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		padding: var(--ml-select-padding, var(--ml-space-2-5) var(--ml-space-3-5));
		background-color: var(--ml-select-bg, var(--ml-color-input-bg));
		border: var(--ml-select-border-width, var(--ml-border)) solid var(--ml-select-border-color, var(--ml-color-border));
		border-radius: var(--ml-select-border-radius, var(--ml-radius));
		box-shadow: none;
		color: var(--ml-select-color, var(--ml-color-text));
		font-family: var(--ml-select-font-family, var(--ml-font-sans));
		font-size: var(--ml-select-font-size, var(--ml-text-sm));
		cursor: pointer;
		text-align: left;
		transition:
			border-color var(--ml-select-transition-duration, var(--ml-duration-150)) var(--ml-select-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-select-transition-duration, var(--ml-duration-150)) var(--ml-select-transition-easing, var(--ml-ease-in-out));
	}

	.ml-select:not(.ml-select--disabled) .ml-select__trigger:hover {
		border-color: var(--ml-select-hover-border-color, var(--ml-color-border-strong));
	}

	.ml-select__trigger:focus,
	.ml-select__trigger:focus-within {
		outline: none;
		border-color: var(--ml-select-focus-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-select-focus-shadow, var(--ml-shadow-focus-ring)), var(--ml-select-focus-inset-shadow, none);
	}

	.ml-select--disabled .ml-select__trigger {
		background-color: var(--ml-select-disabled-bg, var(--ml-color-input-disabled-bg));
		cursor: not-allowed;
		color: var(--ml-select-disabled-color, var(--ml-color-text-muted));
	}

	.ml-select--disabled .ml-select__search {
		color: var(--ml-select-disabled-color, var(--ml-color-text-muted));
	}

	.ml-select__value {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: var(--ml-select-gap, var(--ml-space-2));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-select--multiple .ml-select__value {
		flex-wrap: wrap;
		white-space: normal;
		gap: var(--ml-space-1-5);
	}

	.ml-select__value-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-select__search-icon {
		color: var(--ml-select-icon-color, var(--ml-color-text-muted));
		flex-shrink: 0;
		height: 20px;
		display: flex;
		align-items: center;
	}

	.ml-select__search {
		flex: 1 1 20px;
		min-width: 20px;
		height: 20px;
		border: none;
		outline: none;
		background: transparent;
		font: inherit;
		color: var(--ml-select-color, var(--ml-color-text));
		padding: 0;
		line-height: 20px;
	}

	.ml-select__search::placeholder {
		color: var(--ml-select-placeholder-color, var(--ml-color-text-muted));
	}

	.ml-select__placeholder {
		color: var(--ml-select-placeholder-color, var(--ml-color-text-muted));
	}

	.ml-select__value-icon {
		color: var(--ml-select-icon-color, var(--ml-color-text-muted));
		flex-shrink: 0;
	}

	.ml-select__tags {
		display: contents;
	}

	.ml-select__tag {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1);
		padding: 0 var(--ml-space-1-5);
		height: var(--ml-select-tag-height, 20px);
		border-radius: var(--ml-select-tag-border-radius, var(--ml-radius-full));
		border: var(--ml-select-border-width, var(--ml-border)) solid var(--ml-select-tag-border-color, var(--ml-color-border));
		background-color: var(--ml-select-tag-bg, var(--ml-color-surface));
		font-size: var(--ml-select-tag-font-size, var(--ml-text-xs));
		font-weight: var(--ml-select-tag-font-weight, var(--ml-font-medium));
		color: var(--ml-select-tag-color, var(--ml-color-text));
		line-height: 1;
		white-space: nowrap;
		max-width: 100%;
		overflow: hidden;
		box-sizing: border-box;
	}

	.ml-select__tag-label {
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: inherit;
	}

	.ml-select__tag-avatar {
		width: 14px;
		height: 14px;
		border-radius: var(--ml-select-tag-border-radius, var(--ml-radius-full));
		object-fit: cover;
		margin-left: -2px;
	}

	.ml-select__tag-remove {
		border: none;
		background: transparent;
		padding: 2px;
		margin-left: var(--ml-space-0-5);
		margin-right: -4px;
		color: var(--ml-select-tag-remove-color, var(--ml-color-text-secondary));
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-radius: var(--ml-select-tag-border-radius, var(--ml-radius-full));
		transition: color var(--ml-duration-100) var(--ml-select-transition-easing, var(--ml-ease-in-out)),
			background-color var(--ml-duration-100) var(--ml-select-transition-easing, var(--ml-ease-in-out));
	}

	.ml-select__tag-remove:hover {
		color: var(--ml-select-tag-remove-hover-color, var(--ml-color-text));
		background-color: var(--ml-select-tag-remove-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-select__chevron {
		flex-shrink: 0;
		color: var(--ml-select-icon-color, var(--ml-color-text-muted));
		transition: transform var(--ml-duration-200) var(--ml-select-transition-easing, var(--ml-ease-in-out));
	}

	.ml-select--open .ml-select__chevron {
		transform: rotate(180deg);
	}

	.ml-select--multiple .ml-select__trigger {
		align-items: center;
		padding-top: var(--ml-space-2);
		padding-bottom: var(--ml-space-2);
	}

	.ml-select__dropdown {
		position: fixed;
		inset: unset;
		margin: 0;
		z-index: 50;
		background-color: var(--ml-select-dropdown-bg, var(--ml-color-surface));
		border: var(--ml-select-border-width, var(--ml-border)) solid var(--ml-select-dropdown-border-color, var(--ml-color-border));
		border-radius: var(--ml-select-dropdown-border-radius, var(--ml-radius));
		box-shadow: var(--ml-select-dropdown-shadow, var(--ml-shadow-lg));
		max-height: var(--ml-select-dropdown-max-height, 280px);
		overflow-y: auto;
		padding: var(--ml-select-dropdown-padding, var(--ml-space-1-5));
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1);
	}

	.ml-select__dropdown:not(:popover-open) {
		display: none;
	}

	.ml-select__empty {
		padding: var(--ml-select-option-padding, var(--ml-space-2) var(--ml-space-3));
		font-size: var(--ml-select-option-font-size, var(--ml-text-sm));
		color: var(--ml-select-placeholder-color, var(--ml-color-text-muted));
	}

	.ml-select__option {
		display: flex;
		align-items: center;
		gap: var(--ml-select-gap, var(--ml-space-2));
		padding: var(--ml-select-option-padding, var(--ml-space-2) var(--ml-space-3));
		border-radius: var(--ml-select-option-border-radius, var(--ml-radius-sm));
		cursor: pointer;
		font-size: var(--ml-select-option-font-size, var(--ml-text-sm));
		font-weight: var(--ml-select-option-font-weight, var(--ml-font-medium));
		color: var(--ml-select-option-color, var(--ml-color-text));
		transition: background-color var(--ml-duration-100) var(--ml-select-transition-easing, var(--ml-ease-in-out));
	}

	.ml-select__option:hover:not(.ml-select__option--disabled) {
		background-color: var(--ml-select-option-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-select__option--focused {
		background-color: var(--ml-select-option-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-select__option--selected {
		background-color: var(--ml-select-option-selected-bg, var(--ml-color-primary-subtle));
	}

	.ml-select__option--selected:hover:not(.ml-select__option--disabled) {
		background-color: var(--ml-select-option-selected-bg, var(--ml-color-primary-subtle));
	}

	.ml-select__option--disabled {
		color: var(--ml-select-option-disabled-color, var(--ml-color-text-muted));
		cursor: not-allowed;
	}

	.ml-select__option-icon {
		flex-shrink: 0;
		color: var(--ml-select-icon-color, var(--ml-color-text-muted));
	}

	.ml-select__option-avatar {
		width: 24px;
		height: 24px;
		border-radius: var(--ml-radius-full);
		object-fit: cover;
		flex-shrink: 0;
	}

	.ml-select__option--selected .ml-select__option-icon {
		color: var(--ml-select-option-check-color, var(--ml-color-primary));
	}

	.ml-select__option-label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-select__option-check {
		flex-shrink: 0;
		color: var(--ml-select-option-check-color, var(--ml-color-primary));
		margin-left: auto;
	}

	.ml-select__hint,
	.ml-select__error {
		font-size: var(--ml-select-hint-font-size, var(--ml-text-sm));
		line-height: var(--ml-select-label-line-height, var(--ml-leading-tight));
	}

	.ml-select__hint {
		color: var(--ml-select-hint-color, var(--ml-color-text-muted));
	}

	.ml-select__error {
		color: var(--ml-select-error-color, var(--ml-color-danger));
	}

	.ml-select--error .ml-select__trigger {
		border-color: var(--ml-select-error-border-color, var(--ml-color-danger));
	}

	.ml-select--error .ml-select__trigger:focus {
		box-shadow: var(--ml-select-error-focus-shadow, var(--ml-shadow-ring-error));
	}

	/* Size variants */
	.ml-select--sm .ml-select__trigger {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	.ml-select--md .ml-select__trigger {
		padding: var(--ml-space-2-5) var(--ml-space-3-5);
		font-size: var(--ml-text-sm);
	}

	.ml-select--lg .ml-select__trigger {
		padding: var(--ml-space-3) var(--ml-space-3-5);
		font-size: var(--ml-text-base);
	}

	/* Disabled state */
	.ml-select--disabled {
		pointer-events: none;
	}
`;
