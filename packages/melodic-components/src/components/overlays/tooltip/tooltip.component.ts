import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnInit, OnDestroy } from '@melodicdev/core';
import type { Placement } from '../../../types/index.js';
import { computePosition, offset, flip, shift } from '../../../utils/positioning/index.js';
import { tooltipTemplate } from './tooltip.template.js';
import { tooltipStyles } from './tooltip.styles.js';

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
	template: tooltipTemplate,
	styles: tooltipStyles,
	attributes: ['content', 'placement', 'delay']
})
export class TooltipComponent implements IElementRef, OnInit, OnDestroy {
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
