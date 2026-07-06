import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import type { Placement } from '../../../types/index.js';
import { computePosition, autoUpdate, offset, flip, shift } from '../../../utils/positioning/index.js';
import { newID, type UniqueID } from '../../../functions/new-id.function.js';
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
export class TooltipComponent implements IElementRef, OnCreate, OnDestroy {
	public elementRef!: HTMLElement;

	/** Tooltip content text */
	public content = '';

	/** Tooltip placement */
	public placement: Placement = 'top';

	/** Delay before showing (ms) */
	public delay = 200;

	/** Internal: visibility state */
	public isVisible = false;

	/**
	 * Positioning anchor override (property only). When set — e.g. by the
	 * `:tooltip` attribute directive, which manages a slotless ml-tooltip as a
	 * sibling overlay — the popup is positioned against this element instead
	 * of the tooltip's own slotted trigger wrapper.
	 */
	public anchorEl: HTMLElement | null = null;

	/** Stable id linking the tooltip content to the trigger's aria-describedby */
	public tooltipID: UniqueID = newID();

	private _showTimeout: number | null = null;
	private _hideTimeout: number | null = null;
	private _cleanupAutoUpdate: (() => void) | null = null;

	public onCreate(): void {
		// Re-wire aria-describedby whenever the slotted trigger changes.
		this.elementRef.shadowRoot?.addEventListener('slotchange', this.syncTriggerAria);
		this.syncTriggerAria();
	}

	public onDestroy(): void {
		if (this._showTimeout) clearTimeout(this._showTimeout);
		if (this._hideTimeout) clearTimeout(this._hideTimeout);
		this.stopPositioning();
		document.removeEventListener('keydown', this.handleDocumentKeydown, true);
		this.elementRef.shadowRoot?.removeEventListener('slotchange', this.syncTriggerAria);
	}

	public show = (): void => {
		if (this._hideTimeout) {
			clearTimeout(this._hideTimeout);
			this._hideTimeout = null;
		}

		this._showTimeout = window.setTimeout(() => {
			this.isVisible = true;
			this.startPositioning();
			// WCAG 1.4.13: hoverable/focusable additional content must be
			// dismissible without moving the pointer or focus.
			document.addEventListener('keydown', this.handleDocumentKeydown, true);
		}, this.delay);
	};

	public hide = (): void => {
		if (this._showTimeout) {
			clearTimeout(this._showTimeout);
			this._showTimeout = null;
		}

		this._hideTimeout = window.setTimeout(() => {
			this.dismiss();
		}, 100);
	};

	/** Hide immediately (Escape / teardown). */
	private dismiss(): void {
		this.isVisible = false;
		this.stopPositioning();
		document.removeEventListener('keydown', this.handleDocumentKeydown, true);
	}

	private readonly handleDocumentKeydown = (event: KeyboardEvent): void => {
		if (event.key !== 'Escape') return;

		if (this._showTimeout) {
			clearTimeout(this._showTimeout);
			this._showTimeout = null;
		}
		if (this._hideTimeout) {
			clearTimeout(this._hideTimeout);
			this._hideTimeout = null;
		}
		this.dismiss();
	};

	/**
	 * Point the slotted trigger's aria-describedby at the tooltip content.
	 * Note: id references cannot cross INTO a shadow root, so this fully works
	 * for triggers whose accessible node is the slotted element itself (e.g. a
	 * plain <button>); composite triggers with their own shadow root surface
	 * the description on their host element.
	 */
	private readonly syncTriggerAria = (): void => {
		const slot = this.elementRef.shadowRoot?.querySelector('.ml-tooltip__trigger slot') as HTMLSlotElement | null;
		const assigned = slot?.assignedElements() ?? [];
		const trigger = assigned[0] as HTMLElement | undefined;
		if (trigger && !trigger.hasAttribute('aria-describedby')) {
			trigger.setAttribute('aria-describedby', this.tooltipID);
		}
	};

	private startPositioning(): void {
		const trigger = this.getReferenceEl();
		const tooltip = this.elementRef.shadowRoot?.querySelector('.ml-tooltip__content') as HTMLElement;

		if (!trigger || !tooltip) return;

		this._cleanupAutoUpdate?.();
		// autoUpdate runs an initial update immediately, then keeps the tooltip
		// positioned on scroll/resize so it doesn't drift while visible.
		this._cleanupAutoUpdate = autoUpdate(trigger, tooltip, () => this.updatePosition());
	}

	private stopPositioning(): void {
		this._cleanupAutoUpdate?.();
		this._cleanupAutoUpdate = null;
	}

	/** The element the popup is positioned against. */
	private getReferenceEl(): HTMLElement | null {
		return this.anchorEl ?? (this.elementRef.shadowRoot?.querySelector('.ml-tooltip__trigger') as HTMLElement | null);
	}

	private updatePosition(): void {
		const trigger = this.getReferenceEl();
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
