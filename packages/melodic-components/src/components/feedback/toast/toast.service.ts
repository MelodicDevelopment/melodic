import { Injectable } from '@melodicdev/core';
import type { IToastConfig, ToastPosition } from './toast-config.interface.js';

/**
 * ToastService - Injectable singleton for showing toast notifications from anywhere
 *
 * @example
 * ```typescript
 * @Service(ToastService)
 * private readonly _toastService!: ToastService;
 *
 * this._toastService.success('Saved', 'Your changes have been saved.');
 * this._toastService.error('Error', 'Something went wrong.');
 * this._toastService.show({ variant: 'warning', title: 'Warning', message: '...' });
 * ```
 */
/** Handle to a shown toast, so the caller can dismiss it early. */
export interface IToastRef {
	/** Remove the toast now. Safe to call more than once. */
	dismiss(): void;
	/** The toast element, for consumers that need to reach into it. */
	readonly element: HTMLElement;
}

@Injectable()
export class ToastService {
	private _containerEl: HTMLElement | null = null;
	private _position: ToastPosition = 'top-right';
	/** Toasts currently on screen, oldest first. */
	private readonly _active: HTMLElement[] = [];
	private _maxVisible = 5;

	/**
	 * Cap the number of toasts on screen at once (default 5, 0 = unlimited).
	 * Without a cap, a failing poll could stack hundreds of toasts over the
	 * whole viewport.
	 */
	public setMaxVisible(max: number): void {
		this._maxVisible = Math.max(0, max);
		this.enforceMaxVisible();
	}

	/** Set the default position for all toasts */
	public setPosition(position: ToastPosition): void {
		this._position = position;

		if (this._containerEl) {
			this._containerEl.setAttribute('position', position);
		}
	}

	/** Show a toast with full configuration. Returns a handle for dismissing it. */
	public show(config: IToastConfig): IToastRef {
		const container = this.ensureContainer();
		const toast = document.createElement('ml-toast');

		if (config.variant) toast.setAttribute('variant', config.variant);
		// Use the prefixed attribute: the global 'title' attribute would surface a native browser tooltip.
		if (config.title) toast.setAttribute('toast-title', config.title);
		if (config.message) toast.setAttribute('message', config.message);
		if (config.duration !== undefined) toast.setAttribute('duration', String(config.duration));
		if (config.dismissible === false) toast.setAttribute('dismissible', 'false');

		// An error toast is assertive; anything else is polite, so a success
		// message does not interrupt what the user is reading. Every toast used
		// to be role="alert", which interrupts.
		toast.setAttribute('role', config.variant === 'error' ? 'alert' : 'status');

		container.appendChild(toast);
		this._active.push(toast);
		toast.addEventListener('ml:dismiss', () => this.forget(toast), { once: true });
		this.enforceMaxVisible();

		return {
			element: toast,
			dismiss: () => {
				this.forget(toast);
				toast.remove();
			}
		};
	}

	/** Show an info toast */
	public info(title: string, message?: string): IToastRef {
		return this.show({ variant: 'info', title, message });
	}

	/** Show a success toast */
	public success(title: string, message?: string): IToastRef {
		return this.show({ variant: 'success', title, message });
	}

	/** Show a warning toast */
	public warning(title: string, message?: string): IToastRef {
		return this.show({ variant: 'warning', title, message });
	}

	/** Show an error toast */
	public error(title: string, message?: string): IToastRef {
		return this.show({ variant: 'error', title, message });
	}

	/** Remove every toast currently on screen. */
	public dismissAll(): void {
		for (const toast of [...this._active]) {
			toast.remove();
		}
		this._active.length = 0;
	}

	private forget(toast: HTMLElement): void {
		const index = this._active.indexOf(toast);
		if (index !== -1) {
			this._active.splice(index, 1);
		}
	}

	private enforceMaxVisible(): void {
		if (this._maxVisible === 0) {
			return;
		}

		while (this._active.length > this._maxVisible) {
			const oldest = this._active.shift();
			oldest?.remove();
		}
	}

	private ensureContainer(): HTMLElement {
		if (this._containerEl && document.body.contains(this._containerEl)) {
			return this._containerEl;
		}

		this._containerEl = document.createElement('ml-toast-container');
		this._containerEl.setAttribute('position', this._position);
		document.body.appendChild(this._containerEl);

		return this._containerEl;
	}
}
