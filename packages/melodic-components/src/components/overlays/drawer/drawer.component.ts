import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy, OnRender } from '@melodicdev/core';
import { setCrossRootLabel } from '../../../utils/accessibility/cross-root-aria.js';
import { drawerTemplate } from './drawer.template.js';
import { drawerStyles } from './drawer.styles.js';

type DrawerSide = 'left' | 'right';
type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * ml-drawer - Slide-out panel overlay
 *
 * @example
 * ```html
 * <ml-drawer side="right">
 *   <div slot="drawer-header">Settings</div>
 *   <p>Drawer content here</p>
 *   <div slot="drawer-footer">
 *     <ml-button>Save</ml-button>
 *   </div>
 * </ml-drawer>
 * ```
 *
 * @slot drawer-header - Header content (title)
 * @slot default - Body content
 * @slot drawer-footer - Footer content (actions)
 * @fires ml:open - Emitted when opening starts
 * @fires ml:opened - Emitted after the open animation finishes
 * @fires ml:close - Emitted when closing starts
 * @fires ml:closed - Emitted after the close animation finishes (dialog closed)
 */
@MelodicComponent({
	selector: 'ml-drawer',
	template: drawerTemplate,
	styles: drawerStyles,
	attributes: ['side', 'size', 'show-close', 'label']
})
export class DrawerComponent implements IElementRef, OnCreate, OnDestroy, OnRender {
	public elementRef!: HTMLElement;

	/** Which side the drawer slides from */
	public side: DrawerSide = 'right';

	/** Width preset */
	public size: DrawerSize = 'md';

	/** Show close button in header */
	public showClose = true;

	/**
	 * Accessible name for the drawer (`aria-label`). Optional: when omitted,
	 * the drawer is named by whatever is slotted into `drawer-header`.
	 */
	public label = '';

	private _dialogEl!: HTMLDialogElement;
	private _panelEl!: HTMLElement;

	/** True while the slide-out animation is running (the dialog is still open). */
	private _closing = false;

	/** Off-screen transform for the current side. */
	private get _offscreen(): string {
		return this.side === 'left' ? 'translateX(-100%)' : 'translateX(100%)';
	}

	/**
	 * Resolve slide animation timing from the component-scoped tokens
	 * (--ml-drawer-transition-duration / --ml-drawer-transition-easing).
	 * Users who ask for reduced motion get no slide at all.
	 */
	private getAnimationTiming(): { duration: number; easing: string } {
		const styles = getComputedStyle(this._panelEl);
		const rawDuration = styles.getPropertyValue('--ml-drawer-transition-duration').trim();
		const rawEasing = styles.getPropertyValue('--ml-drawer-transition-easing').trim();

		let duration = NaN;
		if (rawDuration.endsWith('ms')) {
			duration = Number.parseFloat(rawDuration);
		} else if (rawDuration.endsWith('s')) {
			duration = Number.parseFloat(rawDuration) * 1000;
		}
		if (!Number.isFinite(duration)) {
			duration = 300;
		}

		if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			duration = 0;
		}

		return { duration, easing: rawEasing || 'cubic-bezier(0.16, 1, 0.3, 1)' };
	}

	private cancelAnimations(): void {
		for (const anim of this._panelEl.getAnimations()) {
			anim.cancel();
		}
	}

	public onCreate(): void {
		this._dialogEl = this.elementRef.shadowRoot?.querySelector('dialog') as HTMLDialogElement;
		this._panelEl = this._dialogEl?.querySelector('.ml-drawer__panel') as HTMLElement;
		this._dialogEl?.addEventListener('click', this.handleBackdropClick);
		this._dialogEl?.addEventListener('cancel', this.handleDialogCancel);
		this.elementRef.shadowRoot?.addEventListener('slotchange', this.syncAccessibleName);
		this.syncAccessibleName();
	}

	public onRender(): void {
		this.syncAccessibleName();
	}

	public onDestroy(): void {
		this._dialogEl?.removeEventListener('click', this.handleBackdropClick);
		this._dialogEl?.removeEventListener('cancel', this.handleDialogCancel);
		this.elementRef.shadowRoot?.removeEventListener('slotchange', this.syncAccessibleName);
	}

	/**
	 * Give the `<dialog>` an accessible name — it had none. An explicit
	 * `label` wins; otherwise the slotted header names it.
	 */
	private readonly syncAccessibleName = (): void => {
		const root = this.elementRef.shadowRoot;
		const dialogEl = root?.querySelector('dialog');
		if (!root || !dialogEl) return;

		if (this.label) {
			setCrossRootLabel(dialogEl, []);
			dialogEl.setAttribute('aria-label', this.label);
			return;
		}

		const slot = root.querySelector('slot[name="drawer-header"]') as HTMLSlotElement | null;
		setCrossRootLabel(dialogEl, slot?.assignedElements({ flatten: true }) ?? []);
	};

	/** Open the drawer */
	public open(): void {
		// Still open and not on its way out: nothing to do. A drawer that is
		// mid-close IS still `open`, and used to swallow this call — it then
		// finished closing even though open() was the last thing asked for.
		if (this._dialogEl?.open && !this._closing) return;

		this._closing = false;
		this.cancelAnimations();
		this.syncAccessibleName();
		if (!this._dialogEl.open) {
			this._dialogEl.showModal();
		}

		// Slide with a transform (compositor-only) rather than animating
		// `left`/`right`, which re-ran layout on every frame.
		const { duration, easing } = this.getAnimationTiming();
		const anim = this._panelEl.animate([{ transform: this._offscreen }, { transform: 'translateX(0)' }], { duration, easing, fill: 'forwards' });
		anim.onfinish = () => {
			// Drop the animation so no transform lingers on the panel (a
			// transformed ancestor re-anchors position: fixed descendants).
			anim.cancel();
			this.elementRef.dispatchEvent(new CustomEvent('ml:opened', { bubbles: true, composed: true }));
		};

		// ml:open keeps its historical fire-at-start timing; ml:opened fires
		// after the slide-in animation completes.
		this.elementRef.dispatchEvent(new CustomEvent('ml:open', { bubbles: true, composed: true }));
	}

	/** Close the drawer */
	public close = (): void => {
		if (!this._dialogEl?.open || this._closing) return;
		this.cancelAnimations();
		this._closing = true;

		const { duration, easing } = this.getAnimationTiming();
		const anim = this._panelEl.animate([{ transform: 'translateX(0)' }, { transform: this._offscreen }], { duration, easing, fill: 'forwards' });
		anim.onfinish = () => {
			this._closing = false;
			this._dialogEl.close();
			anim.cancel();
			this.elementRef.dispatchEvent(new CustomEvent('ml:closed', { bubbles: true, composed: true }));
		};

		// ml:close keeps its historical fire-at-start timing; ml:closed fires
		// once the slide-out animation completes and the dialog is closed.
		this.elementRef.dispatchEvent(new CustomEvent('ml:close', { bubbles: true, composed: true }));
	};

	private readonly handleBackdropClick = (event: Event): void => {
		if (event.target === this._dialogEl) {
			this.close();
		}
	};

	private readonly handleDialogCancel = (event: Event): void => {
		event.preventDefault();
		this.close();
	};
}
