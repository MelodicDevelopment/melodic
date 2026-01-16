import { MelodicComponent, html, css, classMap } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';

/**
 * ml-spinner - Loading spinner component
 *
 * @example
 * ```html
 * <ml-spinner></ml-spinner>
 * <ml-spinner size="lg"></ml-spinner>
 * <ml-spinner label="Loading data..."></ml-spinner>
 * ```
 */
@MelodicComponent({
	selector: 'ml-spinner',
	template: (c: Spinner) => html`
		<div
			class=${classMap({
				spinner: true,
				[`spinner--${c.size}`]: true
			})}
			role="status"
			aria-label=${c.label}
		>
			<svg class="spinner__svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle class="spinner__track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
				<path
					class="spinner__indicator"
					d="M12 2C6.47715 2 2 6.47715 2 12"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
				/>
			</svg>
			${c.label ? html`<span class="visually-hidden">${c.label}</span>` : ''}
		</div>
	`,
	styles: () => css`
		:host {
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		.spinner {
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		.spinner__svg {
			animation: spin 1s linear infinite;
		}

		.spinner__track {
			opacity: 0.2;
		}

		.spinner__indicator {
			opacity: 1;
		}

		/* Sizes */
		.spinner--xs .spinner__svg {
			width: 0.75rem;
			height: 0.75rem;
		}

		.spinner--sm .spinner__svg {
			width: 1rem;
			height: 1rem;
		}

		.spinner--md .spinner__svg {
			width: 1.5rem;
			height: 1.5rem;
		}

		.spinner--lg .spinner__svg {
			width: 2rem;
			height: 2rem;
		}

		.spinner--xl .spinner__svg {
			width: 2.5rem;
			height: 2.5rem;
		}

		@keyframes spin {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}

		.visually-hidden {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}
	`,
	attributes: ['size', 'label']
})
export class Spinner implements IElementRef {
	elementRef!: HTMLElement;

	/** Size of the spinner */
	size: Size = 'md';

	/** Accessible label for screen readers */
	label = 'Loading';
}
