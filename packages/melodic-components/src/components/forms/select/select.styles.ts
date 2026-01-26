import { css } from '@melodicdev/core';

export const selectStyles = () => css`
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

	.ml-select--open .ml-select__control {
		z-index: 100;
	}

	.ml-select__label {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-tight);
	}

	.ml-select__required {
		color: var(--ml-color-danger);
		margin-left: var(--ml-space-0-5);
	}

	.ml-select__trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
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
		cursor: pointer;
		text-align: left;
		transition:
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-select:not(.ml-select--disabled) .ml-select__trigger:hover {
		border-color: var(--ml-color-border-strong);
	}

	.ml-select__trigger:focus,
	.ml-select__trigger:focus-within {
		outline: none;
		border-color: var(--ml-color-primary);
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-select--disabled .ml-select__trigger {
		background-color: var(--ml-color-input-disabled-bg);
		cursor: not-allowed;
		color: var(--ml-color-text-muted);
	}

	.ml-select--disabled .ml-select__search {
		color: var(--ml-color-text-muted);
	}

	.ml-select__value {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
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
		color: var(--ml-color-text-muted);
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
		color: var(--ml-color-text);
		padding: 0;
		line-height: 20px;
	}

	.ml-select__search::placeholder {
		color: var(--ml-color-text-muted);
	}

	.ml-select__placeholder {
		color: var(--ml-color-text-muted);
	}

	.ml-select__value-icon {
		color: var(--ml-color-text-muted);
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

	.ml-select__tag-label {
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: inherit;
	}

	.ml-select__tag-avatar {
		width: 14px;
		height: 14px;
		border-radius: var(--ml-radius-full);
		object-fit: cover;
		margin-left: -2px;
	}

	.ml-select__tag-remove {
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

	.ml-select__tag-remove:hover {
		color: var(--ml-color-text);
		background-color: var(--ml-color-surface-raised);
	}

	.ml-select__chevron {
		flex-shrink: 0;
		color: var(--ml-color-text-muted);
		transition: transform var(--ml-duration-200) var(--ml-ease-in-out);
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
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 50;
		margin-top: var(--ml-space-1);
		background-color: var(--ml-color-surface);
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius);
		box-shadow: var(--ml-shadow-lg);
		max-height: 280px;
		overflow-y: auto;
		padding: var(--ml-space-1-5);
		display: none;
		flex-direction: column;
		gap: var(--ml-space-1);
	}

	.ml-select__dropdown--open {
		display: flex;
	}

	.ml-select__empty {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
	}

	.ml-select__option {
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

	.ml-select__option:hover:not(.ml-select__option--disabled) {
		background-color: var(--ml-color-surface-raised);
	}

	.ml-select__option--focused {
		background-color: var(--ml-color-surface-raised);
	}

	.ml-select__option--selected {
		background-color: var(--ml-color-primary-subtle);
	}

	.ml-select__option--selected:hover:not(.ml-select__option--disabled) {
		background-color: var(--ml-color-primary-subtle);
	}

	.ml-select__option--disabled {
		color: var(--ml-color-text-muted);
		cursor: not-allowed;
	}

	.ml-select__option-icon {
		flex-shrink: 0;
		color: var(--ml-color-text-muted);
	}

	.ml-select__option-avatar {
		width: 24px;
		height: 24px;
		border-radius: var(--ml-radius-full);
		object-fit: cover;
		flex-shrink: 0;
	}

	.ml-select__option--selected .ml-select__option-icon {
		color: var(--ml-color-primary);
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
		color: var(--ml-color-primary);
		margin-left: auto;
	}

	.ml-select__hint,
	.ml-select__error {
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-tight);
	}

	.ml-select__hint {
		color: var(--ml-color-text-muted);
	}

	.ml-select__error {
		color: var(--ml-color-danger);
	}

	.ml-select--error .ml-select__trigger {
		border-color: var(--ml-color-danger);
	}

	.ml-select--error .ml-select__trigger:focus {
		box-shadow: var(--ml-shadow-ring-error);
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
