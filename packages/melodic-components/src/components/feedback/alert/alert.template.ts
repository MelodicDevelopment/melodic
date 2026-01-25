import { html, classMap, when } from '@melodicdev/core';
import type { AlertComponent } from './alert.component.js';

export function alertTemplate(c: AlertComponent) {
	return html`
		<div
			class=${classMap({
				'ml-alert': true,
				[`ml-alert--${c.variant}`]: true
			})}
			role="alert"
		>
			<div class="ml-alert__icon">
				<slot name="icon">${c.renderDefaultIcon()}</slot>
			</div>

			<div class="ml-alert__content">
				${when(!!c.title, () => html`<div class="ml-alert__title">${c.title}</div>`)}
				<div class="ml-alert__message">
					<slot></slot>
				</div>
			</div>

			${when(
				c.dismissible,
				() => html`
					<button class="ml-alert__dismiss" @click=${c.handleDismiss} aria-label="Dismiss">
						<ml-icon icon="x" size="sm"></ml-icon>
					</button>
				`
			)}
		</div>
	`;
}
