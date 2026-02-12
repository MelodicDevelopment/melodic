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
@Injectable()
export class ToastService {
	private _containerEl: HTMLElement | null = null;
	private _position: ToastPosition = 'top-right';

	/** Set the default position for all toasts */
	setPosition(position: ToastPosition): void {
		this._position = position;

		if (this._containerEl) {
			this._containerEl.setAttribute('position', position);
		}
	}

	/** Show a toast with full configuration */
	show(config: IToastConfig): void {
		const container = this.ensureContainer();
		const toast = document.createElement('ml-toast');

		if (config.variant) toast.setAttribute('variant', config.variant);
		if (config.title) toast.setAttribute('title', config.title);
		if (config.message) toast.setAttribute('message', config.message);
		if (config.duration !== undefined) toast.setAttribute('duration', String(config.duration));
		if (config.dismissible === false) toast.setAttribute('dismissible', 'false');

		container.appendChild(toast);
	}

	/** Show an info toast */
	info(title: string, message?: string): void {
		this.show({ variant: 'info', title, message });
	}

	/** Show a success toast */
	success(title: string, message?: string): void {
		this.show({ variant: 'success', title, message });
	}

	/** Show a warning toast */
	warning(title: string, message?: string): void {
		this.show({ variant: 'warning', title, message });
	}

	/** Show an error toast */
	error(title: string, message?: string): void {
		this.show({ variant: 'error', title, message });
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
