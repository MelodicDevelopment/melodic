import { MelodicComponent, html, css, classMap, when } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { AlertVariant } from './alert.types.js';

/**
 * ml-alert - Alert/notification banner component
 *
 * @example
 * ```html
 * <ml-alert variant="info" title="Information">
 *   This is an informational message.
 * </ml-alert>
 *
 * <ml-alert variant="success" dismissible>
 *   Your changes have been saved.
 * </ml-alert>
 * ```
 *
 * @slot default - Alert message content
 * @slot icon - Custom icon (optional)
 * @fires ml-dismiss - Emitted when dismiss button is clicked
 */
@MelodicComponent({
	selector: 'ml-alert',
	template: (c: Alert) => html`
		<div
			class=${classMap({
				'ml-alert': true,
				[`ml-alert--${c.variant}`]: true
			})}
			role="alert"
		>
			<div class="ml-alert__icon">
				<slot name="icon">${c.renderDefaultIcon()}</slot>
			</div>

			<div class="ml-alert__content">
				${when(!!c.title, () => html`<div class="ml-alert__title">${c.title}</div>`)}
				<div class="ml-alert__message">
					<slot></slot>
				</div>
			</div>

			${when(
				c.dismissible,
				() => html`
					<button class="ml-alert__dismiss" @click=${c.handleDismiss} aria-label="Dismiss">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</button>
				`
			)}
		</div>
	`,
	styles: () => css`
		:host {
			display: block;
		}

		:host([hidden]) {
			display: none;
		}

		.ml-alert {
			display: flex;
			gap: var(--ml-space-3);
			padding: var(--ml-space-4);
			border-radius: var(--ml-radius-lg);
			border: var(--ml-border) solid transparent;
		}

		/* Variants */
		.ml-alert--info {
			background-color: var(--ml-color-info-subtle);
			border-color: var(--ml-cyan-200);
			color: var(--ml-cyan-800);
		}

		.ml-alert--info .ml-alert__icon {
			color: var(--ml-color-info);
		}

		.ml-alert--success {
			background-color: var(--ml-color-success-subtle);
			border-color: var(--ml-green-200);
			color: var(--ml-green-800);
		}

		.ml-alert--success .ml-alert__icon {
			color: var(--ml-color-success);
		}

		.ml-alert--warning {
			background-color: var(--ml-color-warning-subtle);
			border-color: var(--ml-amber-200);
			color: var(--ml-amber-800);
		}

		.ml-alert--warning .ml-alert__icon {
			color: var(--ml-color-warning);
		}

		.ml-alert--error {
			background-color: var(--ml-color-danger-subtle);
			border-color: var(--ml-red-200);
			color: var(--ml-red-800);
		}

		.ml-alert--error .ml-alert__icon {
			color: var(--ml-color-danger);
		}

		/* Icon */
		.ml-alert__icon {
			flex-shrink: 0;
			width: 1.25rem;
			height: 1.25rem;
		}

		.ml-alert__icon svg {
			width: 100%;
			height: 100%;
		}

		/* Content */
		.ml-alert__content {
			flex: 1;
			min-width: 0;
		}

		.ml-alert__title {
			font-weight: var(--ml-font-semibold);
			margin-bottom: var(--ml-space-1);
		}

		.ml-alert__message {
			font-size: var(--ml-text-sm);
			line-height: var(--ml-leading-relaxed);
		}

		/* Dismiss button */
		.ml-alert__dismiss {
			flex-shrink: 0;
			width: 1.25rem;
			height: 1.25rem;
			padding: 0;
			background: none;
			border: none;
			cursor: pointer;
			opacity: 0.6;
			transition: opacity var(--ml-duration-150) var(--ml-ease-in-out);
		}

		.ml-alert__dismiss:hover {
			opacity: 1;
		}

		.ml-alert__dismiss svg {
			width: 100%;
			height: 100%;
		}
	`,
	attributes: ['variant', 'title', 'dismissible']
})
export class Alert implements IElementRef {
	elementRef!: HTMLElement;

	/** Alert variant/type */
	variant: AlertVariant = 'info';

	/** Optional title */
	title = '';

	/** Show dismiss button */
	dismissible = false;

	handleDismiss = (): void => {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml-dismiss', {
				bubbles: true,
				composed: true
			})
		);
		// Optionally hide the alert
		this.elementRef.setAttribute('hidden', '');
	};

	renderDefaultIcon = () => {
		const icons: Record<AlertVariant, string> = {
			info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
			success:
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
			warning:
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>',
			error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
		};

		return html`<span .innerHTML=${icons[this.variant]}></span>`;
	};
}
