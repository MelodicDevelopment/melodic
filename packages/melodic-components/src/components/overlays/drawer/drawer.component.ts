import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
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
	attributes: ['side', 'size', 'show-close']
})
export class DrawerComponent implements IElementRef, OnCreate, OnDestroy {
	public elementRef!: HTMLElement;

	/** Which side the drawer slides from */
	public side: DrawerSide = 'right';

	/** Width preset */
	public size: DrawerSize = 'md';

	/** Show close button in header */
	public showClose = true;

	private _dialogEl!: HTMLDialogElement;
	private _panelEl!: HTMLElement;

	private get _positionProp(): 'left' | 'right' {
		return this.side === 'left' ? 'left' : 'right';
	}

	/**
	 * Resolve slide animation timing from the component-scoped tokens
	 * (--ml-drawer-transition-duration / --ml-drawer-transition-easing).
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
	}

	public onDestroy(): void {
		this._dialogEl?.removeEventListener('click', this.handleBackdropClick);
		this._dialogEl?.removeEventListener('cancel', this.handleDialogCancel);
	}

	/** Open the drawer */
	public open(): void {
		if (this._dialogEl?.open) return;
		this.cancelAnimations();
		this._dialogEl.showModal();
		const prop = this._positionProp;
		const width = this._panelEl.offsetWidth;
		const { duration, easing } = this.getAnimationTiming();
		this._panelEl.style[prop] = `${-width}px`;
		this._panelEl.getBoundingClientRect();
		const anim = this._panelEl.animate(
			[{ [prop]: `${-width}px` }, { [prop]: '0px' }],
			{ duration, easing, fill: 'forwards' }
		);
		anim.onfinish = () => {
			this._panelEl.style[prop] = '0px';
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:opened', { bubbles: true, composed: true })
			);
		};

		// ml:open keeps its historical fire-at-start timing; ml:opened fires
		// after the slide-in animation completes.
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:open', { bubbles: true, composed: true })
		);
	}

	/** Close the drawer */
	public close = (): void => {
		if (!this._dialogEl?.open) return;
		this.cancelAnimations();
		const prop = this._positionProp;
		const width = this._panelEl.offsetWidth;
		const { duration, easing } = this.getAnimationTiming();
		const anim = this._panelEl.animate(
			[{ [prop]: '0px' }, { [prop]: `${-width}px` }],
			{ duration, easing, fill: 'forwards' }
		);
		anim.onfinish = () => {
			this._panelEl.style[prop] = '';
			this._dialogEl.close();
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:closed', { bubbles: true, composed: true })
			);
		};

		// ml:close keeps its historical fire-at-start timing; ml:closed fires
		// once the slide-out animation completes and the dialog is closed.
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:close', { bubbles: true, composed: true })
		);
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
