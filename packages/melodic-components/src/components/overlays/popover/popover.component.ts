import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import type { Placement } from '../../../types/index.js';
import { OverlayPositioner, ToggleDismissGuard } from '../../../utils/overlay/index.js';
import { createFocusTrap, isDeepFocusWithin, type FocusTrap } from '../../../utils/accessibility/focus-trap.js';
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
 * @fires ml:open - Emitted when the popover opens
 * @fires ml:close - Emitted when the popover closes
 */
@MelodicComponent({
	selector: 'ml-popover',
	template: popoverTemplate,
	styles: popoverStyles,
	attributes: ['placement', 'offset', 'manual', 'arrow']
})
export class PopoverComponent implements IElementRef, OnCreate, OnDestroy {
	public elementRef!: HTMLElement;

	/** Popover placement relative to trigger */
	public placement: Placement = 'bottom';

	/** Gap between trigger and popover in px */
	public offset = 8;

	/** When true, uses popover="manual" (no light-dismiss) */
	public manual = false;

	/** When true, shows an arrow pointing to the trigger */
	public arrow = false;

	/** Current open state */
	public isOpen = false;

	private readonly _positioner = new OverlayPositioner(() => ({
		placement: this.placement,
		offset: this.offset,
		arrowElement: this.arrow ? (this.elementRef.shadowRoot?.querySelector('.ml-popover__arrow') as HTMLElement | null) : null,
		placementAttribute: true
	}));
	private _focusTrap: FocusTrap | null = null;
	// Swallows the trigger click that just light-dismissed the open popover so
	// it doesn't immediately reopen it.
	private readonly _dismissGuard = new ToggleDismissGuard();

	public onCreate(): void {
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.addEventListener('toggle', this.handleToggle);
		}
	}

	public onDestroy(): void {
		this._positioner.stop();
		this._focusTrap?.deactivate({ returnFocus: false });
		this._focusTrap = null;
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.removeEventListener('toggle', this.handleToggle);
		}
	}

	/** Open the popover */
	public open(): void {
		const popoverEl = this.getPopoverEl();
		if (popoverEl && !this.isOpen) {
			popoverEl.showPopover();
		}
	}

	/** Close the popover */
	public close(): void {
		const popoverEl = this.getPopoverEl();
		if (popoverEl && this.isOpen) {
			popoverEl.hidePopover();
		}
	}

	/** Toggle the popover */
	public toggle = (): void => {
		// Swallow the click that just light-dismissed the open popover, so the
		// trigger doesn't immediately reopen it.
		if (this._dismissGuard.shouldSkipToggle()) {
			return;
		}
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
			this.activateFocusTrap();
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:open', { bubbles: true, composed: true })
			);
		} else {
			this.isOpen = false;
			this._dismissGuard.dismissed();
			this._positioner.stop();
			// Restore focus only when it is still inside the popover (keyboard
			// dismiss / focus parked in the content); a pointer light-dismiss
			// that moved focus elsewhere must not have it yanked back.
			this._focusTrap?.deactivate({ returnFocus: isDeepFocusWithin(this.elementRef) });
			this._focusTrap = null;
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:close', { bubbles: true, composed: true })
			);
		}
	};

	private activateFocusTrap(): void {
		const popoverEl = this.getPopoverEl();
		if (!popoverEl) return;

		this._focusTrap?.deactivate({ returnFocus: false });
		this._focusTrap = createFocusTrap(popoverEl);
		this._focusTrap.activate();
	}

	private startPositioning(): void {
		const triggerEl = this.getTriggerEl();
		const popoverEl = this.getPopoverEl();

		if (!triggerEl || !popoverEl) return;

		this._positioner.start(triggerEl, popoverEl);
	}

	private getTriggerEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-popover__trigger') as HTMLElement | null;
	}

	private getPopoverEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-popover__content') as HTMLElement | null;
	}
}
