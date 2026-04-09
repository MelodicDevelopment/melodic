import { html, classMap, when } from '@melodicdev/core';
import type { ButtonComponent } from './button.component.js';

export function buttonTemplate(c: ButtonComponent) {
	const classes = classMap({
		'ml-button': true,
		[`ml-button--${c.variant}`]: true,
		[`ml-button--${c.size}`]: true,
		'ml-button--disabled': c.isDisabled,
		'ml-button--loading': c.loading,
		'ml-button--full-width': c.fullWidth
	});

	const content = html`
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
	`;

	if (c.href != null) {
		return html`
			<a
				href=${c.isDisabled ? undefined : c.href}
				target=${c.target ?? undefined}
				rel=${c.rel ?? undefined}
				download=${c.download ?? undefined}
				class=${classes}
				role="button"
				@click=${c.handleClick}
				aria-disabled=${c.isDisabled ? 'true' : 'false'}
				aria-busy=${c.loading ? 'true' : 'false'}
			>
				${content}
			</a>
		`;
	}

	return html`
		<button
			type="${c.type}"
			class=${classes}
			?disabled=${c.isDisabled}
			@click=${c.handleClick}
			aria-disabled=${c.isDisabled ? 'true' : 'false'}
			aria-busy=${c.loading ? 'true' : 'false'}
		>
			${content}
		</button>
	`;
}
