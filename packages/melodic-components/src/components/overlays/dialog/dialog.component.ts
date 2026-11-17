import { MelodicComponent, Service } from '@melodicdev/core';
import { dialogTemplate } from './dialog.template';
import { dialogStyles } from './dialog.styles';
import type { OnCreate, OnDestroy, OnRender, IElementRef } from '@melodicdev/core';
import { setCrossRootLabel } from '../../../utils/accessibility/cross-root-aria';
import { newID, type UniqueID } from '../../../functions/new-id.function';
import { DialogService } from './dialog.service';
import type { DialogRef } from './dialog-ref.class';

@MelodicComponent({
	selector: 'ml-dialog',
	template: dialogTemplate,
	styles: dialogStyles,
	attributes: ['label']
})
export class DialogComponent implements IElementRef, OnCreate, OnDestroy, OnRender {
	public elementRef!: HTMLElement;

	/**
	 * Accessible name for the dialog (`aria-label`). Optional: when omitted,
	 * the dialog is named by whatever is slotted into `dialog-header`.
	 */
	public label = '';

	@Service(DialogService)
	private readonly _dialogService!: DialogService;

	private _dialogID: UniqueID = newID();
	private _dialogEl!: HTMLDialogElement;
	private _dialogRef!: DialogRef;
	private _registered = false;

	public onCreate(): void {
		this.registerDialog();
		this.elementRef.shadowRoot?.addEventListener('slotchange', this.syncAccessibleName);
		this.syncAccessibleName();
	}

	public onRender(): void {
		this.syncAccessibleName();
	}

	/**
	 * Give the `<dialog>` an accessible name — it had none, so a screen
	 * reader announced just "dialog". An explicit `label` wins; otherwise the
	 * slotted header names it (the header is in the light DOM, an ancestor
	 * tree of this shadow root, so an element reference to it is valid).
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

		const slot = root.querySelector('slot[name="dialog-header"]') as HTMLSlotElement | null;
		setCrossRootLabel(dialogEl, slot?.assignedElements({ flatten: true }) ?? []);
	};

	private registerDialog(): void {
		if (this._registered) return;

		const dialogEl = this.elementRef.shadowRoot?.querySelector('dialog') as HTMLDialogElement;
		if (!dialogEl) return;

		this._dialogEl = dialogEl;
		this._dialogID = this.createDialogID();
		this._dialogEl.id = this._dialogID;
		this._dialogRef = this._dialogService.addDialog(this._dialogID, this._dialogEl);
		this._registered = true;
	}

	public onDestroy(): void {
		// Only this element should be able to remove its own registration. On a
		// re-render the new instance registers (same id) before this stale one
		// tears down; passing our element lets the service ignore that delete.
		this.elementRef.shadowRoot?.removeEventListener('slotchange', this.syncAccessibleName);
		if (!this._registered) return;
		this._dialogService.removeDialog(this._dialogID, this._dialogEl);
	}

	public open(): void {
		this.registerDialog();
		if (!this._dialogRef) {
			console.warn('[ml-dialog] Cannot open: dialog element is not rendered yet.');
			return;
		}
		this.syncAccessibleName();
		this._dialogRef.open();
	}

	public close<T = unknown>(result?: T): void {
		this._dialogRef?.close(result);
	}

	private createDialogID(): UniqueID {
		return (
			(this.elementRef
				.getAttributeNames()
				.find((attr) => attr.startsWith('#'))
				?.slice(1) as UniqueID) ?? this._dialogID
		);
	}
}
