import { html, classMap } from '@melodicdev/core';
import type { TagComponent } from './tag.component.js';

export function tagTemplate(c: TagComponent) {
	const avatarSrc = c['avatar-src'];
	const dotColor = c['dot-color'];

	return html`
		<span
			class=${classMap({
				'ml-tag': true,
				[`ml-tag--${c.size}`]: true,
				'ml-tag--disabled': c.disabled
			})}
		>
			${c.checkable ? html`
				<button
					class=${classMap({
						'ml-tag__checkbox': true,
						'ml-tag__checkbox--checked': c.checked
					})}
					type="button"
					role="checkbox"
					aria-checked=${c.checked ? 'true' : 'false'}
					.disabled=${c.disabled}
					@click=${c.handleCheck}
				>
					${c.checked ? html`
						<svg viewBox="0 0 12 12" fill="none">
							<path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					` : ''}
				</button>
			` : ''}
			${c.icon ? html`<ml-icon class="ml-tag__icon" icon=${c.icon} size="sm"></ml-icon>` : ''}
			${avatarSrc ? html`<img class="ml-tag__avatar" src=${avatarSrc} alt="" />` : ''}
			${c.dot ? html`<span class=${classMap({
				'ml-tag__dot': true,
				[`ml-tag__dot--${dotColor}`]: true
			})}></span>` : ''}
			<span class="ml-tag__content"><slot></slot></span>
			${c.count ? html`<span class="ml-tag__count">${c.count}</span>` : ''}
			${c.closable ? html`
				<button
					class="ml-tag__close"
					type="button"
					aria-label="Remove"
					.disabled=${c.disabled}
					@click=${c.handleClose}
				>
					<ml-icon icon="x" size="sm"></ml-icon>
				</button>
			` : ''}
		</span>
	`;
}
