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
 * @fires ml:open - Emitted when opened
 * @fires ml:close - Emitted when closed
 */
@MelodicComponent({
	selector: 'ml-drawer',
	template: drawerTemplate,
	styles: drawerStyles,
	attributes: ['side', 'size', 'show-close']
})
export class DrawerComponent implements IElementRef, OnCreate, OnDestroy {
	elementRef!: HTMLElement;

	/** Which side the drawer slides from */
	side: DrawerSide = 'right';

	/** Width preset */
	size: DrawerSize = 'md';

	/** Show close button in header */
	showClose = true;

	private _dialogEl!: HTMLDialogElement;
	private _panelEl!: HTMLElement;

	private get _positionProp(): 'left' | 'right' {
		return this.side === 'left' ? 'left' : 'right';
	}

	private cancelAnimations(): void {
		for (const anim of this._panelEl.getAnimations()) {
			anim.cancel();
		}
	}

	onCreate(): void {
		this._dialogEl = this.elementRef.shadowRoot?.querySelector('dialog') as HTMLDialogElement;
		this._panelEl = this._dialogEl?.querySelector('.ml-drawer__panel') as HTMLElement;
		this._dialogEl?.addEventListener('click', this.handleBackdropClick);
		this._dialogEl?.addEventListener('cancel', this.handleDialogCancel);
	}

	onDestroy(): void {
		this._dialogEl?.removeEventListener('click', this.handleBackdropClick);
		this._dialogEl?.removeEventListener('cancel', this.handleDialogCancel);
	}

	/** Open the drawer */
	open(): void {
		if (this._dialogEl?.open) return;
		this.cancelAnimations();
		this._dialogEl.showModal();
		const prop = this._positionProp;
		const width = this._panelEl.offsetWidth;
		this._panelEl.style[prop] = `${-width}px`;
		this._panelEl.getBoundingClientRect();
		const anim = this._panelEl.animate(
			[{ [prop]: `${-width}px` }, { [prop]: '0px' }],
			{ duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
		);
		anim.onfinish = () => {
			this._panelEl.style[prop] = '0px';
		};

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:open', { bubbles: true, composed: true })
		);
	}

	/** Close the drawer */
	close = (): void => {
		if (!this._dialogEl?.open) return;
		this.cancelAnimations();
		const prop = this._positionProp;
		const width = this._panelEl.offsetWidth;
		const anim = this._panelEl.animate(
			[{ [prop]: '0px' }, { [prop]: `${-width}px` }],
			{ duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' }
		);
		anim.onfinish = () => {
			this._panelEl.style[prop] = '';
			this._dialogEl.close();
		};

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
