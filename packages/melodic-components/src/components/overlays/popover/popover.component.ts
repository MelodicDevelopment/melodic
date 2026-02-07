import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import type { Placement } from '../../../types/index.js';
import { computePosition, autoUpdate, offset, flip, shift, arrow as arrowMiddleware } from '../../../utils/positioning/index.js';
import { popoverTemplate } from './popover.template.js';
import { popoverStyles } from './popover.styles.js';

/**
 * ml-popover - Popover component that shows on trigger click
 *
 * @example
 * ```html
 * <ml-popover placement="bottom">
 *   <button slot="trigger">Open</button>
 *   <p>Popover content here</p>
 * </ml-popover>
 *
 * <ml-popover placement="bottom-start" manual>
 *   <button slot="trigger">Open</button>
 *   <div>
 *     <p>Locked content</p>
 *     <button>Close me manually</button>
 *   </div>
 * </ml-popover>
 * ```
 *
 * @slot trigger - The element that toggles the popover
 * @slot default - The popover content
 */
@MelodicComponent({
	selector: 'ml-popover',
	template: popoverTemplate,
	styles: popoverStyles,
	attributes: ['placement', 'offset', 'manual', 'arrow']
})
export class PopoverComponent implements IElementRef, OnCreate, OnDestroy {
	elementRef!: HTMLElement;

	/** Popover placement relative to trigger */
	placement: Placement = 'bottom';

	/** Gap between trigger and popover in px */
	offset = 8;

	/** When true, uses popover="manual" (no light-dismiss) */
	manual = false;

	/** When true, shows an arrow pointing to the trigger */
	arrow = false;

	/** Current open state */
	isOpen = false;

	private _cleanupAutoUpdate: (() => void) | null = null;

	onCreate(): void {
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.addEventListener('toggle', this.handleToggle);
		}
	}

	onDestroy(): void {
		this._cleanupAutoUpdate?.();
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.removeEventListener('toggle', this.handleToggle);
		}
	}

	/** Open the popover */
	open(): void {
		const popoverEl = this.getPopoverEl();
		if (popoverEl && !this.isOpen) {
			popoverEl.showPopover();
		}
	}

	/** Close the popover */
	close(): void {
		const popoverEl = this.getPopoverEl();
		if (popoverEl && this.isOpen) {
			popoverEl.hidePopover();
		}
	}

	/** Toggle the popover */
	toggle = (): void => {
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.togglePopover();
		}
	};

	private readonly handleToggle = (event: Event): void => {
		const toggleEvent = event as ToggleEvent;
		if (toggleEvent.newState === 'open') {
			this.isOpen = true;
			this.startPositioning();
		} else {
			this.isOpen = false;
			this._cleanupAutoUpdate?.();
			this._cleanupAutoUpdate = null;
		}
	};

	private startPositioning(): void {
		const triggerEl = this.getTriggerEl();
		const popoverEl = this.getPopoverEl();

		if (!triggerEl || !popoverEl) return;

		const update = () => this.updatePosition(triggerEl, popoverEl);

		this._cleanupAutoUpdate?.();
		this._cleanupAutoUpdate = autoUpdate(triggerEl, popoverEl, update);
	}

	private updatePosition(triggerEl: HTMLElement, popoverEl: HTMLElement): void {
		const arrowEl = this.arrow ? (this.elementRef.shadowRoot?.querySelector('.ml-popover__arrow') as HTMLElement) : null;

		const middleware = [offset(this.offset), flip(), shift({ padding: 8 })];

		if (arrowEl) {
			middleware.push(arrowMiddleware({ element: arrowEl, padding: 8 }));
		}

		const { x, y, placement, middlewareData } = computePosition(triggerEl, popoverEl, {
			placement: this.placement,
			middleware
		});

		popoverEl.style.left = `${x}px`;
		popoverEl.style.top = `${y}px`;
		popoverEl.dataset.placement = placement;

		if (arrowEl && middlewareData.arrow) {
			this.positionArrow(arrowEl, placement, middlewareData.arrow as { x?: number; y?: number });
		}
	}

	private positionArrow(arrowEl: HTMLElement, placement: string, arrowData: { x?: number; y?: number }): void {
		const side = placement.split('-')[0];

		arrowEl.style.left = arrowData.x === undefined ? '' : `${arrowData.x}px`;
		arrowEl.style.right = '';
		arrowEl.style.top = arrowData.y === undefined ? '' : `${arrowData.y}px`;
		arrowEl.style.bottom = '';

		if (side === 'top') {
			arrowEl.style.bottom = '-4px';
		}
		if (side === 'bottom') {
			arrowEl.style.top = '-4px';
		}
		if (side === 'left') {
			arrowEl.style.right = '-4px';
		}
		if (side === 'right') {
			arrowEl.style.left = '-4px';
		}
	}

	private getTriggerEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-popover__trigger') as HTMLElement | null;
	}

	private getPopoverEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-popover__content') as HTMLElement | null;
	}
}
