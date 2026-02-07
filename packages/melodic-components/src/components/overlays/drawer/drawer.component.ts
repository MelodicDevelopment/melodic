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

	/** Open state */
	isOpen = false;

	private _dialogEl!: HTMLDialogElement;

	onCreate(): void {
		this._dialogEl = this.elementRef.shadowRoot?.querySelector('dialog') as HTMLDialogElement;
		this._dialogEl?.addEventListener('click', this.handleBackdropClick);
	}

	onDestroy(): void {
		this._dialogEl?.removeEventListener('click', this.handleBackdropClick);
	}

	/** Open the drawer */
	open(): void {
		if (this.isOpen) return;
		this._dialogEl?.showModal();
		this.isOpen = true;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:open', { bubbles: true, composed: true })
		);
	}

	/** Close the drawer */
	close = (): void => {
		if (!this.isOpen) return;
		this._dialogEl?.close();
		this.isOpen = false;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:close', { bubbles: true, composed: true })
		);
	};

	private readonly handleBackdropClick = (event: Event): void => {
		if (event.target === this._dialogEl) {
			this.close();
		}
	};
}
