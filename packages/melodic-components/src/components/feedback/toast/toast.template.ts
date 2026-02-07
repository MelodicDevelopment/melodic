import { html, classMap, when } from '@melodicdev/core';
import type { ToastComponent } from './toast.component.js';

export function toastTemplate(c: ToastComponent) {
	return html`
		<div
			class=${classMap({
				'ml-toast': true,
				[`ml-toast--${c.variant}`]: true
			})}
			role="alert"
		>
			<div class="ml-toast__icon">
				${c.renderIcon()}
			</div>
			<div class="ml-toast__content">
				${when(!!c.title, () => html`<div class="ml-toast__title">${c.title}</div>`)}
				${when(!!c.message, () => html`<div class="ml-toast__message">${c.message}</div>`)}
			</div>
			${when(
				c.dismissible,
				() => html`
					<button class="ml-toast__dismiss" @click=${c.dismiss} aria-label="Dismiss">
						<ml-icon icon="x" size="sm"></ml-icon>
					</button>
				`
			)}
		</div>
	`;
}
