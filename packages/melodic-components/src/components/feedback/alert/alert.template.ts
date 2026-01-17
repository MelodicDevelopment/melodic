import { html, classMap, when } from '@melodicdev/core';
import type { Alert } from './alert.component.js';

export function alertTemplate(c: Alert) {
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
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</button>
				`
			)}
		</div>
	`;
}
