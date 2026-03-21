import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import { profileCardTemplate } from './profile-card.template.js';
import { profileCardStyles } from './profile-card.styles.js';

/**
 * ml-profile-card - Identity card for person/entity detail pages
 *
 * @example
 * ```html
 * <ml-profile-card
 *   name="Sarah Mitchell"
 *   subtitle="Member · Women's Ministry"
 *   avatar="https://example.com/photo.jpg"
 *   avatar-size="lg"
 * >
 *   <div slot="details">
 *     <div class="detail-row"><ml-icon icon="envelope" size="sm"></ml-icon> sarah@example.com</div>
 *     <div class="detail-row"><ml-icon icon="phone" size="sm"></ml-icon> (555) 123-4567</div>
 *   </div>
 *   <div slot="tags">
 *     <ml-tag>Women's Ministry</ml-tag>
 *     <ml-tag>Choir</ml-tag>
 *   </div>
 *   <div slot="actions">
 *     <ml-button variant="primary">Message</ml-button>
 *     <ml-button variant="outline">Edit</ml-button>
 *   </div>
 *   <div slot="meta">
 *     <div>Member since: January 2019</div>
 *     <div>Birthday: March 15</div>
 *   </div>
 * </ml-profile-card>
 * ```
 *
 * @slot details - Contact info rows (icon + text pairs)
 * @slot tags - Involvement/group tags
 * @slot actions - Action buttons (Message, Edit, etc.)
 * @slot meta - Detail fields (member since, birthday, family)
 *
 * @cssproperty --ml-profile-card-bg - Card background (default: var(--ml-color-surface))
 * @cssproperty --ml-profile-card-banner-from - Banner gradient start color
 * @cssproperty --ml-profile-card-banner-to - Banner gradient end color
 */
@MelodicComponent({
	selector: 'ml-profile-card',
	template: profileCardTemplate,
	styles: profileCardStyles,
	attributes: ['name', 'subtitle', 'avatar', 'avatar-size']
})
export class ProfileCardComponent implements IElementRef, OnCreate {
	public elementRef!: HTMLElement;

	/** Person name */
	public name = '';

	/** Subtitle (e.g. "Member · Women's Ministry") */
	public subtitle = '';

	/** Avatar image URL — falls back to initials derived from name */
	public avatar = '';

	/** Avatar size */
	public 'avatar-size': Size = 'lg';

	/** Slot visibility flags (toggled via slotchange) */
	public hasDetails = false;
	public hasTags = false;
	public hasActions = false;
	public hasMeta = false;

	/** Derive initials from name */
	public get initials(): string {
		return this.name
			.split(' ')
			.map(part => part.charAt(0))
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	public onCreate(): void {
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;
		shadow.querySelectorAll('slot[name]').forEach(slot => {
			slot.addEventListener('slotchange', () => {
				const name = slot.getAttribute('name');
				const hasContent = (slot as HTMLSlotElement).assignedNodes().length > 0;
				if (name === 'details') this.hasDetails = hasContent;
				else if (name === 'tags') this.hasTags = hasContent;
				else if (name === 'actions') this.hasActions = hasContent;
				else if (name === 'meta') this.hasMeta = hasContent;
			});
		});
	}
}
