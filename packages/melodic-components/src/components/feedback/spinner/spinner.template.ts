import { html, classMap } from '@melodicdev/core';
import type { SpinnerComponent } from './spinner.component.js';

export function spinnerTemplate(c: SpinnerComponent) {
	return html`
		<div
			class=${classMap({
				spinner: true,
				[`spinner--${c.size}`]: true
			})}
			role="status"
			aria-label=${c.label}
		>
			<svg class="spinner__svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle class="spinner__track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
				<path
					class="spinner__indicator"
					d="M12 2C6.47715 2 2 6.47715 2 12"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
				/>
			</svg>
			${c.label ? html`<span class="visually-hidden">${c.label}</span>` : ''}
		</div>
	`;
}
