import { html, classMap, when } from '@melodicdev/core';
import type { Button } from './button.component.js';

export function buttonTemplate(c: Button) {
	return html`
		<button
			type="${c.type}"
			class=${classMap({
				'ml-button': true,
				[`ml-button--${c.variant}`]: true,
				[`ml-button--${c.size}`]: true,
				'ml-button--disabled': c.isDisabled,
				'ml-button--loading': c.loading,
				'ml-button--full-width': c.fullWidth
			})}
			?disabled=${c.isDisabled}
			@click=${c.handleClick}
			aria-disabled=${c.isDisabled ? 'true' : 'false'}
			aria-busy=${c.loading ? 'true' : 'false'}
		>
			${when(
				c.loading,
				() => html`
					<span class="ml-button__spinner">
						<ml-spinner size="sm"></ml-spinner>
					</span>
				`
			)}
			<span class="ml-button__content">
				<slot name="icon-start"></slot>
				<slot></slot>
				<slot name="icon-end"></slot>
			</span>
		</button>
	`;
}
