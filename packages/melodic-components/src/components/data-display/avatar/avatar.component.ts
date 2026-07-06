import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnPropertyChange } from '@melodicdev/core';
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
export class AvatarComponent implements IElementRef, OnPropertyChange {
	public elementRef!: HTMLElement;

	/** Image source URL */
	public src = '';

	/** Alt text for image */
	public alt = '';

	/** Initials to display (fallback if no image) */
	public initials = '';

	/** Avatar size */
	public size: Size = 'md';

	/** Use rounded square instead of circle */
	public rounded = false;

	/**
	 * Tracks image load errors so the initials/icon fallback renders. Reactive
	 * (no `_` prefix) so the error actually triggers a re-render; reset whenever
	 * `src` changes so a new image gets a fresh attempt.
	 */
	public imageError = false;

	public onPropertyChange(name: string, oldVal: unknown, newVal: unknown): void {
		if (name === 'src' && oldVal !== newVal) {
			this.imageError = false;
		}
	}

	public handleImageError = (): void => {
		this.imageError = true;
	};

	public getInitials(): string {
		// Return at most 2 characters
		return this.initials.slice(0, 2).toUpperCase();
	}
}
