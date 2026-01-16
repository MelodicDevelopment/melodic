import { MelodicComponent, html, css, classMap, when } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';

/**
 * ml-avatar - User avatar with image, initials, or icon fallback
 *
 * @example
 * ```html
 * <ml-avatar src="/images/user.jpg" alt="John Doe"></ml-avatar>
 * <ml-avatar initials="JD"></ml-avatar>
 * <ml-avatar initials="JD" size="lg"></ml-avatar>
 * ```
 *
 * @slot default - Custom fallback content (icon)
 */
@MelodicComponent({
	selector: 'ml-avatar',
	template: (c: Avatar) => html`
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
				c.src && !c._imageError,
				() => html` <img class="ml-avatar__image" src="${c.src}" alt="${c.alt}" @error=${c.handleImageError} /> `,
				() =>
					when(
						c.initials,
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
					)
			)}
		</span>
	`,
	styles: () => css`
		:host {
			display: inline-block;
		}

		.ml-avatar {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			background-color: var(--ml-gray-200);
			color: var(--ml-gray-600);
			font-weight: var(--ml-font-medium);
			vertical-align: middle;
			border-radius: var(--ml-radius-full);
		}

		.ml-avatar--rounded {
			border-radius: var(--ml-radius-lg);
		}

		/* Sizes */
		.ml-avatar--xs {
			width: 1.5rem;
			height: 1.5rem;
			font-size: var(--ml-text-xs);
		}

		.ml-avatar--sm {
			width: 2rem;
			height: 2rem;
			font-size: var(--ml-text-xs);
		}

		.ml-avatar--md {
			width: 2.5rem;
			height: 2.5rem;
			font-size: var(--ml-text-sm);
		}

		.ml-avatar--lg {
			width: 3rem;
			height: 3rem;
			font-size: var(--ml-text-base);
		}

		.ml-avatar--xl {
			width: 4rem;
			height: 4rem;
			font-size: var(--ml-text-xl);
		}

		/* Image */
		.ml-avatar__image {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		/* Initials */
		.ml-avatar__initials {
			text-transform: uppercase;
			user-select: none;
		}

		/* Fallback icon */
		.ml-avatar__fallback {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 60%;
			height: 60%;
		}

		.ml-avatar__fallback svg {
			width: 100%;
			height: 100%;
		}
	`,
	attributes: ['src', 'alt', 'initials', 'size', 'rounded']
})
export class Avatar implements IElementRef {
	elementRef!: HTMLElement;

	/** Image source URL */
	src = '';

	/** Alt text for image */
	alt = '';

	/** Initials to display (fallback if no image) */
	initials = '';

	/** Avatar size */
	size: Size = 'md';

	/** Use rounded square instead of circle */
	rounded = false;

	/** Internal: track image load errors */
	_imageError = false;

	handleImageError = (): void => {
		this._imageError = true;
	};

	getInitials(): string {
		// Return at most 2 characters
		return this.initials.slice(0, 2).toUpperCase();
	}
}
