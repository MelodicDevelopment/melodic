import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import { avatarTemplate } from './avatar.template.js';
import { avatarStyles } from './avatar.styles.js';

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
	template: avatarTemplate,
	styles: avatarStyles,
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
