import type { UniqueID } from '../../../functions';
import type { IDialogConfig } from './dialog-config.interface';

export class DialogRef<TResult = unknown, TData = unknown> {
	private readonly _afterOpenedCallbacks: (() => void)[] = [];
	private readonly _afterClosedCallbacks: ((result: TResult | undefined) => void)[] = [];
	private _data: TData | undefined;
	private _disableClose = false;
	private _pendingResult: TResult | undefined;
	// Guards double-fire when both the programmatic close() fallback and the
	// dialog's native `close` event run for the same close cycle.
	private _closeNotified = false;
	// Tracks whether close() already dismissed descendant popovers this cycle,
	// so the native-close path doesn't dismiss them a second time.
	private _popoversDismissed = false;
	private readonly _handleCancel = this.onCancel.bind(this);
	private readonly _handleBackdropClick = this.onBackdropClick.bind(this);
	private readonly _handleClose = this.onClose.bind(this);

	constructor(
		private readonly _dialogID: UniqueID,
		private readonly _dialogEl: HTMLDialogElement
	) {
		this._dialogEl.addEventListener('cancel', this._handleCancel);
		this._dialogEl.addEventListener('click', this._handleBackdropClick);
		// Listen to the native close event so Escape-dismiss (cancel → close)
		// and any other native close path also fire afterClosed callbacks.
		this._dialogEl.addEventListener('close', this._handleClose);
	}

	public get dialogID(): UniqueID {
		return this._dialogID;
	}

	public get data(): TData | undefined {
		return this._data;
	}

	public get disableClose(): boolean {
		return this._disableClose;
	}

	public applyConfig(config: IDialogConfig<TData>): this {
		if (config.data !== undefined) {
			this._data = config.data;
		}

		if (config.disableClose !== undefined) {
			this._disableClose = config.disableClose;
		}

		if (config.size && config.size !== 'auto') {
			this._dialogEl.classList.add(`ml-dialog--${config.size}`);
		}

		if (config.width) {
			this._dialogEl.style.maxWidth = config.width;
		}

		if (config.panelClass) {
			const classes = Array.isArray(config.panelClass) ? config.panelClass : [config.panelClass];
			this._dialogEl.classList.add(...classes);
		}

		return this;
	}

	public open(): void {
		this._closeNotified = false;
		this._popoversDismissed = false;
		this._pendingResult = undefined;
		this._dialogEl.showModal();
		this._afterOpenedCallbacks.forEach((callback) => callback());
		this._dialogEl.dispatchEvent(new CustomEvent('ml:open', { bubbles: true, composed: true }));
	}

	public close(result?: TResult): void {
		this._pendingResult = result;
		this._dismissDescendantPopovers(this._dialogEl);
		this._popoversDismissed = true;
		this._dialogEl.close();
		// The native `close` event may fire synchronously or on a queued task
		// depending on the environment; notifyClosed() is idempotent, so notify
		// here as well to guarantee synchronous afterClosed delivery.
		this.notifyClosed();
	}

	/**
	 * Register a callback invoked after the dialog opens. Multiple callbacks
	 * accumulate and are invoked in registration order.
	 */
	public afterOpened(callback: () => void): void {
		this._afterOpenedCallbacks.push(callback);
	}

	/**
	 * Register a callback invoked after the dialog closes — including native
	 * dismissals (Escape / backdrop). Multiple callbacks accumulate and are
	 * invoked in registration order.
	 */
	public afterClosed(callback: (result: TResult | undefined) => void): void {
		this._afterClosedCallbacks.push(callback);
	}

	private onCancel(event: Event): void {
		if (this._disableClose) {
			event.preventDefault();
		}
	}

	private onBackdropClick(event: MouseEvent): void {
		if (event.target === this._dialogEl && !this._disableClose) {
			this.close();
		}
	}

	private onClose(): void {
		this.notifyClosed();
	}

	private notifyClosed(): void {
		if (this._closeNotified) return;
		this._closeNotified = true;

		// Escape-dismiss skips close(), so make sure descendant popovers are
		// dismissed on this path too (hidePopover is safe post-close).
		if (!this._popoversDismissed) {
			this._dismissDescendantPopovers(this._dialogEl);
		}
		this._popoversDismissed = false;

		const result = this._pendingResult;
		this._pendingResult = undefined;
		this._afterClosedCallbacks.forEach((callback) => callback(result));
		this._dialogEl.dispatchEvent(new CustomEvent('ml:close', { bubbles: true, composed: true, detail: { result } }));
	}

	private _dismissDescendantPopovers(root: Element | ShadowRoot): void {
		const children = root.querySelectorAll('*');
		children.forEach((el) => {
			if (el.hasAttribute('popover')) {
				try {
					(el as HTMLElement).hidePopover();
				} catch {
					// Not currently in the top layer — safe to ignore
				}
			}
			if (el.shadowRoot) {
				this._dismissDescendantPopovers(el.shadowRoot);
			}
		});
	}
}
