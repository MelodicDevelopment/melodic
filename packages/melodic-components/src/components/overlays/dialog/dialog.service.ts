import { Injectable } from '@melodicdev/core';
import type { UniqueID } from '../../../functions/new-id.function';
import { DialogRef } from './dialog-ref.class';
import type { DialogComponentLoader } from './dialog-loader.type';
import type { ComponentBase } from '@melodicdev/core';
import type { IDialogRef } from './idialog-ref.interface';
import type { IDialogConfig } from './dialog-config.interface';

interface IDialogComponentElement<T = unknown> extends HTMLElement {
	component: ComponentBase & Partial<IDialogRef<T>>;
}

interface IDialogElements<T = unknown> {
	dialogRef: DialogRef<T>;
	dialogEl: HTMLDialogElement;
	dialogComponent?: IDialogComponentElement<T>;
	closeListener: () => void;
}

@Injectable()
export class DialogService {
	private readonly _dialogs = new Map<UniqueID, IDialogElements>();

	public addDialog(dialogID: UniqueID, dialogEl: HTMLDialogElement): DialogRef {
		// An inline <ml-dialog> re-render can re-register under the same id with
		// a new element; drop the previous registration's close listener so
		// discarded elements don't accumulate listeners.
		const previous = this._dialogs.get(dialogID);
		if (previous) {
			previous.dialogEl.removeEventListener('close', previous.closeListener);
		}

		const dialogRef = new DialogRef(dialogID, dialogEl);
		const closeListener = (): void => {
			const elements = this._dialogs.get(dialogID);
			this.cleanUpDialog(dialogID, elements?.dialogComponent);
		};

		this._dialogs.set(dialogID, {
			dialogRef,
			dialogEl,
			dialogComponent: undefined,
			closeListener
		});

		dialogEl.addEventListener('close', closeListener);

		return dialogRef;
	}

	/**
	 * Remove a dialog's registration.
	 *
	 * When `dialogEl` is supplied (component teardown), the entry is only
	 * deleted if it still belongs to that element. This prevents a stale
	 * `<ml-dialog>`'s late `onDestroy` from wiping the registration a freshly
	 * re-rendered instance (same id) just created.
	 */
	public removeDialog(dialogID: UniqueID, dialogEl?: HTMLDialogElement): void {
		const elements = this._dialogs.get(dialogID);
		if (!elements) {
			return;
		}

		if (dialogEl && elements.dialogEl !== dialogEl) {
			return;
		}

		elements.dialogEl.removeEventListener('close', elements.closeListener);
		this._dialogs.delete(dialogID);
	}

	public open<TResult = unknown, TData = unknown>(dialogComponent: new (...args: any[]) => any, config?: IDialogConfig<TData>): DialogRef<TResult, TData> | undefined;
	public open<TResult = unknown, TData = unknown>(dialogID: UniqueID): DialogRef<TResult, TData> | undefined;
	public open<TResult = unknown, TData = unknown>(dialogComponentOrID: UniqueID | (new (...args: any[]) => any), config?: IDialogConfig<TData>): DialogRef<TResult, TData> | undefined {
		let dialogID: UniqueID = dialogComponentOrID as UniqueID;
		let dialogComponent: IDialogComponentElement | undefined;

		if (typeof dialogComponentOrID !== 'string') {
			const mounted: HTMLElement = this.mountDialog(dialogComponentOrID as DialogComponentLoader);
			const mlDialogEl: HTMLElement | null = mounted.shadowRoot?.querySelector('ml-dialog') ?? null;
			const dialogEl: HTMLDialogElement | null = mlDialogEl?.shadowRoot?.querySelector('dialog') ?? null;

			if (!dialogEl) {
				console.warn(`[DialogService] Component "${(dialogComponentOrID as DialogComponentLoader).selector}" did not render an <ml-dialog>; cannot open.`);
				this.unmountDialog(mounted);
				return undefined;
			}

			dialogID = dialogEl.id as UniqueID;
			dialogComponent = mounted as IDialogComponentElement;
		}

		const dialogElements: IDialogElements | undefined = this._dialogs.get(dialogID);
		if (!dialogElements) {
			console.warn(`[DialogService] No dialog registered with id "${dialogID}"; open() ignored.`);
			if (dialogComponent) {
				this.unmountDialog(dialogComponent);
			}
			return undefined;
		}

		if (dialogComponent) {
			dialogElements.dialogComponent = dialogComponent;

			if (config) {
				dialogElements.dialogRef.applyConfig(config);
			}

			dialogComponent.component.onDialogRefSet?.(dialogElements.dialogRef);
		}

		dialogElements.dialogRef.open();

		return dialogElements.dialogRef as DialogRef<TResult, TData>;
	}

	public close<T = unknown>(dialogID: UniqueID, result?: T): void {
		const dialogElements: IDialogElements | undefined = this._dialogs.get(dialogID);
		if (!dialogElements) {
			console.warn(`[DialogService] No dialog registered with id "${dialogID}"; close() ignored.`);
			return;
		}

		dialogElements.dialogRef.close(result);
	}

	private cleanUpDialog(dialogID: UniqueID, dialogComponent?: IDialogComponentElement<unknown>): void {
		if (dialogComponent) {
			this.unmountDialog(dialogComponent);
			this.removeDialog(dialogID);
		}
	}

	private mountDialog(component: DialogComponentLoader): HTMLElement {
		const dialogElement = document.createElement(component.selector);
		document.body.appendChild(dialogElement);
		return dialogElement;
	}

	private unmountDialog(component: HTMLElement): void {
		component.remove();
	}
}
