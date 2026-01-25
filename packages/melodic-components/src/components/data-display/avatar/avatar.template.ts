import { html, classMap, when } from '@melodicdev/core';
import type { AvatarComponent } from './avatar.component.js';

export function avatarTemplate(c: AvatarComponent) {
	return html`
		<span
			class=${classMap({
				'ml-avatar': true,
				[`ml-avatar--${c.size}`]: true,
				'ml-avatar--rounded': c.rounded
			})}
			role="img"
			aria-label=${c.alt || c.initials || 'Avatar'}
		>
			${when(
				!!c.src && !c._imageError,
				() => html` <img class="ml-avatar__image" src="${c.src}" alt="${c.alt}" @error=${c.handleImageError} /> `,
				() => html`${when(
						!!c.initials,
						() => html`<span class="ml-avatar__initials">${c.getInitials()}</span>`,
						() => html`
							<span class="ml-avatar__fallback">
								<slot>
									<ml-icon icon="user" format="fill"></ml-icon>
								</slot>
							</span>
						`
					)}`
			)}
		</span>
	`;
}
