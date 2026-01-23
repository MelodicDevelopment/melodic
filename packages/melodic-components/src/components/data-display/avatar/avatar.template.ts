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
									<svg viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
									</svg>
								</slot>
							</span>
						`
					)}`
			)}
		</span>
	`;
}
