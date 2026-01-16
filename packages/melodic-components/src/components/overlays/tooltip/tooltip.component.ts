import { MelodicComponent, html, css, classMap } from '@melodicdev/core';
import type { IElementRef, OnInit, OnDestroy } from '@melodicdev/core';
import type { Placement } from '../../../types/index.js';
import { computePosition, offset, flip, shift } from '../../../utils/positioning/index.js';

/**
 * ml-tooltip - Tooltip component that shows on hover/focus
 *
 * @example
 * ```html
 * <ml-tooltip content="This is a tooltip">
 *   <ml-button>Hover me</ml-button>
 * </ml-tooltip>
 *
 * <ml-tooltip content="Bottom tooltip" placement="bottom">
 *   <span>Hover for info</span>
 * </ml-tooltip>
 * ```
 *
 * @slot default - The trigger element
 */
@MelodicComponent({
	selector: 'ml-tooltip',
	template: (c: Tooltip) => html`
		<div class="ml-tooltip">
			<div
				class="ml-tooltip__trigger"
				@mouseenter=${c.show}
				@mouseleave=${c.hide}
				@focus=${c.show}
				@blur=${c.hide}
			>
				<slot></slot>
			</div>
			<div
				class=${classMap({
					'ml-tooltip__content': true,
					'ml-tooltip__content--visible': c.isVisible
				})}
				role="tooltip"
				aria-hidden=${!c.isVisible}
			>
				${c.content}
				<div class="ml-tooltip__arrow"></div>
			</div>
		</div>
	`,
	styles: () => css`
		:host {
			display: inline-block;
		}

		.ml-tooltip {
			position: relative;
			display: inline-block;
		}

		.ml-tooltip__trigger {
			display: inline-block;
		}

		.ml-tooltip__content {
			position: fixed;
			z-index: 9999;
			max-width: 250px;
			padding: var(--ml-space-2) var(--ml-space-3);
			background-color: var(--ml-gray-900);
			color: var(--ml-white);
			font-size: var(--ml-text-sm);
			line-height: var(--ml-leading-snug);
			border-radius: var(--ml-radius-md);
			box-shadow: var(--ml-shadow-lg);
			pointer-events: none;
			opacity: 0;
			transform: scale(0.95);
			transition:
				opacity var(--ml-duration-150) var(--ml-ease-out),
				transform var(--ml-duration-150) var(--ml-ease-out);
		}

		.ml-tooltip__content--visible {
			opacity: 1;
			transform: scale(1);
		}

		.ml-tooltip__arrow {
			position: absolute;
			width: 8px;
			height: 8px;
			background-color: var(--ml-gray-900);
			transform: rotate(45deg);
		}

		/* Arrow positioning based on placement */
		.ml-tooltip__content[data-placement^='top'] .ml-tooltip__arrow {
			bottom: -4px;
		}

		.ml-tooltip__content[data-placement^='bottom'] .ml-tooltip__arrow {
			top: -4px;
		}

		.ml-tooltip__content[data-placement^='left'] .ml-tooltip__arrow {
			right: -4px;
		}

		.ml-tooltip__content[data-placement^='right'] .ml-tooltip__arrow {
			left: -4px;
		}
	`,
	attributes: ['content', 'placement', 'delay']
})
export class Tooltip implements IElementRef, OnInit, OnDestroy {
	elementRef!: HTMLElement;

	/** Tooltip content text */
	content = '';

	/** Tooltip placement */
	placement: Placement = 'top';

	/** Delay before showing (ms) */
	delay = 200;

	/** Internal: visibility state */
	isVisible = false;

	private _showTimeout: number | null = null;
	private _hideTimeout: number | null = null;

	onInit(): void {
		// Initial setup if needed
	}

	onDestroy(): void {
		if (this._showTimeout) clearTimeout(this._showTimeout);
		if (this._hideTimeout) clearTimeout(this._hideTimeout);
	}

	show = (): void => {
		if (this._hideTimeout) {
			clearTimeout(this._hideTimeout);
			this._hideTimeout = null;
		}

		this._showTimeout = window.setTimeout(() => {
			this.isVisible = true;
			this.updatePosition();
		}, this.delay);
	};

	hide = (): void => {
		if (this._showTimeout) {
			clearTimeout(this._showTimeout);
			this._showTimeout = null;
		}

		this._hideTimeout = window.setTimeout(() => {
			this.isVisible = false;
		}, 100);
	};

	private updatePosition(): void {
		const trigger = this.elementRef.shadowRoot?.querySelector('.ml-tooltip__trigger') as HTMLElement;
		const tooltip = this.elementRef.shadowRoot?.querySelector('.ml-tooltip__content') as HTMLElement;
		const arrow = this.elementRef.shadowRoot?.querySelector('.ml-tooltip__arrow') as HTMLElement;

		if (!trigger || !tooltip) return;

		const { x, y, placement } = computePosition(trigger, tooltip, {
			placement: this.placement,
			middleware: [offset(8), flip(), shift({ padding: 8 })]
		});

		tooltip.style.left = `${x}px`;
		tooltip.style.top = `${y}px`;
		tooltip.setAttribute('data-placement', placement);

		// Position arrow
		if (arrow) {
			const side = placement.split('-')[0];
			arrow.style.left = '';
			arrow.style.right = '';
			arrow.style.top = '';
			arrow.style.bottom = '';

			if (side === 'top' || side === 'bottom') {
				arrow.style.left = '50%';
				arrow.style.marginLeft = '-4px';
			} else {
				arrow.style.top = '50%';
				arrow.style.marginTop = '-4px';
			}
		}
	}
}
