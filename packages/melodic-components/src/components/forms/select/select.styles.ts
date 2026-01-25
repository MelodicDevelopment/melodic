import { css } from '@melodicdev/core';

export const selectStyles = () => css`
	:host {
		display: block;
		width: 100%;
		min-width: 0;
	}

	.ml-select {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
		position: relative;
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
		background-color: var(--ml-color-input-bg);
		border: var(--ml-border) solid var(--ml-color-border-strong);
		border-radius: var(--ml-radius);
		box-shadow: var(--ml-shadow-xs);
		color: var(--ml-color-text);
		font-family: var(--ml-font-sans);
		cursor: pointer;
		text-align: left;
		transition:
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-select__trigger:hover:not(:disabled) {
		border-color: var(--ml-color-border);
	}

	.ml-select__trigger:focus {
		outline: none;
		border-color: var(--ml-color-primary);
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-select__trigger:disabled {
		background-color: var(--ml-color-input-disabled-bg);
		cursor: not-allowed;
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

	.ml-select__placeholder {
		color: var(--ml-color-text-muted);
	}

	.ml-select__chevron {
		flex-shrink: 0;
		color: var(--ml-color-text-muted);
		transition: transform var(--ml-duration-200) var(--ml-ease-in-out);
	}

	.ml-select--open .ml-select__chevron {
		transform: rotate(180deg);
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
		padding: var(--ml-space-1);
	}

	.ml-select__option {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		padding: var(--ml-space-2-5) var(--ml-space-3);
		border-radius: var(--ml-radius-sm);
		cursor: pointer;
		font-size: var(--ml-text-sm);
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
