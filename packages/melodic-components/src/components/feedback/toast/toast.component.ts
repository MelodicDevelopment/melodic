import { MelodicComponent, html } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import type { ToastVariant } from './toast-config.interface.js';
import { toastTemplate } from './toast.template.js';
import { toastStyles } from './toast.styles.js';
import { warnDeprecatedTitleOnce } from '../../../functions/index.js';

/**
 * ml-toast - Individual toast notification
 *
 * @example
 * ```html
 * <ml-toast variant="success" toast-title="Saved" message="Your changes have been saved."></ml-toast>
 * ```
 *
 * @fires ml:dismiss - Emitted when the toast is dismissed
 */
@MelodicComponent({
	selector: 'ml-toast',
	template: toastTemplate,
	styles: toastStyles,
	attributes: ['variant', 'toast-title', 'title', 'message', 'duration', 'dismissible']
})
export class ToastComponent implements IElementRef, OnCreate, OnDestroy {
	public elementRef!: HTMLElement;

	/** Toast variant */
	public variant: ToastVariant = 'info';

	/** Toast title (attribute: toast-title) */
	public toastTitle = '';

	/** Toast message */
	public message = '';

	/** Auto-dismiss duration in ms (0 = no auto-dismiss) */
	public duration = 5000;

	/** Show dismiss button */
	public dismissible = true;

	private _timer: ReturnType<typeof setTimeout> | null = null;

	/** @deprecated Use `toastTitle` (attribute `toast-title`); `title` collides with the global HTML attribute. */
	public get title(): string {
		return this.toastTitle;
	}
	public set title(value: string) {
		warnDeprecatedTitleOnce('ml-toast', 'toast-title');
		this.toastTitle = value;
	}

	/** Time left on the auto-dismiss timer, in ms (0 = no timer pending). */
	private _remaining = 0;
	private _startedAt = 0;

	public onCreate(): void {
		// WCAG 2.2.1: a message that disappears on a timer must be pausable.
		// Hovering or focusing the toast holds it open; leaving resumes the
		// countdown with whatever time was left.
		this.elementRef.addEventListener('mouseenter', this.handleHoldStart);
		this.elementRef.addEventListener('mouseleave', this.handleHoldEnd);
		this.elementRef.addEventListener('focusin', this.handleHoldStart);
		this.elementRef.addEventListener('focusout', this.handleHoldEnd);

		if (this.duration > 0) {
			this.startTimer(this.duration);
		}
	}

	public onDestroy(): void {
		// A toast removed before its timer fires (dismissAll, a route change,
		// the container being torn down) left the timer armed; it then ran
		// dismiss() on a detached element and kept the component alive until
		// it fired.
		this.clearTimer();
		this._remaining = 0;
		this.elementRef.removeEventListener('mouseenter', this.handleHoldStart);
		this.elementRef.removeEventListener('mouseleave', this.handleHoldEnd);
		this.elementRef.removeEventListener('focusin', this.handleHoldStart);
		this.elementRef.removeEventListener('focusout', this.handleHoldEnd);
	}

	/**
	 * Role for the inner wrapper. ToastService puts the live-region role on the
	 * host element; repeating it on the wrapper nested one live region inside
	 * another and some screen readers announced the toast twice. A standalone
	 * `<ml-toast>` with no host role keeps the role here.
	 */
	public get innerRole(): string | undefined {
		if (this.elementRef?.hasAttribute('role')) {
			return undefined;
		}
		return this.variant === 'error' ? 'alert' : 'status';
	}

	private startTimer(ms: number): void {
		this.clearTimer();
		this._remaining = ms;
		this._startedAt = Date.now();
		this._timer = setTimeout(() => this.dismiss(), ms);
	}

	private clearTimer(): void {
		if (this._timer) {
			clearTimeout(this._timer);
			this._timer = null;
		}
	}

	private _hovered = false;
	private _focused = false;

	private readonly handleHoldStart = (event: Event): void => {
		if (event.type === 'mouseenter') this._hovered = true;
		else this._focused = true;

		if (!this._timer) {
			return;
		}
		this.clearTimer();
		this._remaining = Math.max(0, this._remaining - (Date.now() - this._startedAt));
	};

	private readonly handleHoldEnd = (event: Event): void => {
		if (event.type === 'mouseleave') this._hovered = false;
		else this._focused = false;

		// Still held by the other input modality, or nothing left to resume.
		if (this._hovered || this._focused || this._timer || this._remaining <= 0) {
			return;
		}
		this.startTimer(this._remaining);
	};

	public dismiss = (): void => {
		this.clearTimer();
		this._remaining = 0;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:dismiss', {
				bubbles: true,
				composed: true
			})
		);

		this.elementRef.remove();
	};

	public renderIcon = () => {
		const icons: Record<ToastVariant, string> = {
			info: 'info',
			success: 'check-circle',
			warning: 'warning',
			error: 'x-circle'
		};

		return html`<ml-icon icon="${icons[this.variant]}"></ml-icon>`;
	};
}
