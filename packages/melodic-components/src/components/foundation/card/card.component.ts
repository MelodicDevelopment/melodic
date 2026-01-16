import { MelodicComponent, html, css, classMap, when } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';

type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled';

/**
 * ml-card - Container component for grouping content
 *
 * @example
 * ```html
 * <ml-card>
 *   <h3 slot="header">Card Title</h3>
 *   <p>Card content goes here</p>
 *   <div slot="footer">Card footer</div>
 * </ml-card>
 * ```
 *
 * @slot header - Card header content
 * @slot default - Main card content
 * @slot footer - Card footer content
 */
@MelodicComponent({
	selector: 'ml-card',
	template: (c: Card) => html`
		<div
			class=${classMap({
				'ml-card': true,
				[`ml-card--${c.variant}`]: true,
				'ml-card--hoverable': c.hoverable,
				'ml-card--clickable': c.clickable
			})}
			@click=${c.handleClick}
		>
			${when(
				c.hasHeader,
				() => html`
					<div class="ml-card__header">
						<slot name="header"></slot>
					</div>
				`
			)}
			<div class="ml-card__body">
				<slot></slot>
			</div>
			${when(
				c.hasFooter,
				() => html`
					<div class="ml-card__footer">
						<slot name="footer"></slot>
					</div>
				`
			)}
		</div>
	`,
	styles: () => css`
		:host {
			display: block;
		}

		.ml-card {
			background-color: var(--ml-color-surface);
			border-radius: var(--ml-radius-lg);
			overflow: hidden;
		}

		/* Variants */
		.ml-card--default {
			border: var(--ml-border) solid var(--ml-color-border);
		}

		.ml-card--outlined {
			border: var(--ml-border-2) solid var(--ml-color-border-strong);
		}

		.ml-card--elevated {
			box-shadow: var(--ml-shadow-md);
		}

		.ml-card--filled {
			background-color: var(--ml-color-surface-raised);
		}

		/* Hoverable */
		.ml-card--hoverable {
			transition:
				box-shadow var(--ml-duration-200) var(--ml-ease-in-out),
				transform var(--ml-duration-200) var(--ml-ease-in-out);
		}

		.ml-card--hoverable:hover {
			box-shadow: var(--ml-shadow-lg);
			transform: translateY(-2px);
		}

		/* Clickable */
		.ml-card--clickable {
			cursor: pointer;
		}

		.ml-card--clickable:focus-visible {
			outline: var(--ml-focus-ring-width) solid var(--ml-color-focus-ring);
			outline-offset: var(--ml-focus-ring-offset);
		}

		/* Header */
		.ml-card__header {
			padding: var(--ml-space-4) var(--ml-space-5);
			border-bottom: var(--ml-border) solid var(--ml-color-border);
		}

		.ml-card__header ::slotted(*) {
			margin: 0;
		}

		/* Body */
		.ml-card__body {
			padding: var(--ml-space-5);
		}

		/* Footer */
		.ml-card__footer {
			padding: var(--ml-space-4) var(--ml-space-5);
			border-top: var(--ml-border) solid var(--ml-color-border);
			background-color: var(--ml-color-surface-raised);
		}
	`,
	attributes: ['variant', 'hoverable', 'clickable']
})
export class Card implements IElementRef {
	elementRef!: HTMLElement;

	/** Card visual style */
	variant: CardVariant = 'default';

	/** Add hover effect */
	hoverable = false;

	/** Make card clickable */
	clickable = false;

	/** Internal: check if header slot has content */
	get hasHeader(): boolean {
		return this.elementRef?.querySelector('[slot="header"]') !== null;
	}

	/** Internal: check if footer slot has content */
	get hasFooter(): boolean {
		return this.elementRef?.querySelector('[slot="footer"]') !== null;
	}

	handleClick = (event: MouseEvent): void => {
		if (this.clickable) {
			this.elementRef.dispatchEvent(
				new CustomEvent('ml-click', {
					bubbles: true,
					composed: true,
					detail: { originalEvent: event }
				})
			);
		}
	};
}
