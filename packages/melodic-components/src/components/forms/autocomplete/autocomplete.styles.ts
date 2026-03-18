import { css } from '@melodicdev/core';

export const autocompleteStyles = () => css`
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
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-tight);
	}

	.ml-autocomplete__required {
		color: var(--ml-color-danger);
		margin-left: var(--ml-space-0-5);
	}

	.ml-autocomplete__trigger {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		width: 100%;
		max-width: 100%;
		overflow: hidden;
		background-color: var(--ml-color-surface);
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius);
		box-shadow: none;
		color: var(--ml-color-text);
		font-family: var(--ml-font-sans);
		cursor: text;
		text-align: left;
		transition:
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-autocomplete:not(.ml-autocomplete--disabled) .ml-autocomplete__trigger:hover {
		border-color: var(--ml-color-border-strong);
	}

	.ml-autocomplete__trigger:focus-within {
		outline: none;
		border-color: var(--ml-color-primary);
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-autocomplete--disabled .ml-autocomplete__trigger {
		background-color: var(--ml-color-input-disabled-bg);
		cursor: not-allowed;
		color: var(--ml-color-text-muted);
	}

	.ml-autocomplete__search-icon {
		color: var(--ml-color-text-muted);
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
		color: var(--ml-color-text);
		padding: 0;
		line-height: 20px;
	}

	.ml-autocomplete__input::placeholder {
		color: var(--ml-color-text-muted);
	}

	.ml-autocomplete__input:disabled {
		color: var(--ml-color-text-muted);
		cursor: not-allowed;
	}

	.ml-autocomplete__clear {
		border: none;
		background: transparent;
		padding: 2px;
		color: var(--ml-color-text-muted);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-radius: var(--ml-radius-full);
		transition: color var(--ml-duration-100) var(--ml-ease-in-out),
			background-color var(--ml-duration-100) var(--ml-ease-in-out);
	}

	.ml-autocomplete__clear:hover {
		color: var(--ml-color-text);
		background-color: var(--ml-color-surface-raised);
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
		height: 20px;
		border-radius: var(--ml-radius-full);
		border: var(--ml-border) solid var(--ml-color-border);
		background-color: var(--ml-color-surface);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
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
		border-radius: var(--ml-radius-full);
		object-fit: cover;
		margin-left: -2px;
	}

	.ml-autocomplete__tag-remove {
		border: none;
		background: transparent;
		padding: 2px;
		margin-left: var(--ml-space-0-5);
		margin-right: -4px;
		color: var(--ml-color-text-secondary);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		border-radius: var(--ml-radius-full);
		transition: color var(--ml-duration-100) var(--ml-ease-in-out),
			background-color var(--ml-duration-100) var(--ml-ease-in-out);
	}

	.ml-autocomplete__tag-remove:hover {
		color: var(--ml-color-text);
		background-color: var(--ml-color-surface-raised);
	}

	/* Dropdown */
	.ml-autocomplete__dropdown {
		position: fixed;
		inset: unset;
		margin: 0;
		z-index: 50;
		background-color: var(--ml-color-surface);
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius);
		box-shadow: var(--ml-shadow-lg);
		max-height: 280px;
		overflow-y: auto;
		padding: var(--ml-space-1-5);
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1);
	}

	.ml-autocomplete__dropdown:not(:popover-open) {
		display: none;
	}

	.ml-autocomplete__empty {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
	}

	.ml-autocomplete__loading {
		padding: var(--ml-space-3) var(--ml-space-3);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		justify-content: center;
	}

	/* Options */
	.ml-autocomplete__option {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		padding: var(--ml-space-2) var(--ml-space-3);
		border-radius: var(--ml-radius-sm);
		cursor: pointer;
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
		transition: background-color var(--ml-duration-100) var(--ml-ease-in-out);
	}

	.ml-autocomplete__option:hover:not(.ml-autocomplete__option--disabled) {
		background-color: var(--ml-color-surface-raised);
	}

	.ml-autocomplete__option--focused {
		background-color: var(--ml-color-surface-raised);
	}

	.ml-autocomplete__option--selected {
		background-color: var(--ml-color-primary-subtle);
	}

	.ml-autocomplete__option--selected:hover:not(.ml-autocomplete__option--disabled) {
		background-color: var(--ml-color-primary-subtle);
	}

	.ml-autocomplete__option--disabled {
		color: var(--ml-color-text-muted);
		cursor: not-allowed;
	}

	.ml-autocomplete__option-icon {
		flex-shrink: 0;
		color: var(--ml-color-text-muted);
	}

	.ml-autocomplete__option-avatar {
		width: 24px;
		height: 24px;
		border-radius: var(--ml-radius-full);
		object-fit: cover;
		flex-shrink: 0;
	}

	.ml-autocomplete__option--selected .ml-autocomplete__option-icon {
		color: var(--ml-color-primary);
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
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-normal);
		color: var(--ml-color-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-autocomplete__option-check {
		flex-shrink: 0;
		color: var(--ml-color-primary);
		margin-left: auto;
	}

	/* Hint / Error */
	.ml-autocomplete__hint,
	.ml-autocomplete__error {
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-tight);
	}

	.ml-autocomplete__hint {
		color: var(--ml-color-text-muted);
	}

	.ml-autocomplete__error {
		color: var(--ml-color-danger);
	}

	.ml-autocomplete--error .ml-autocomplete__trigger {
		border-color: var(--ml-color-danger);
	}

	.ml-autocomplete--error .ml-autocomplete__trigger:focus-within {
		box-shadow: var(--ml-shadow-ring-error);
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
