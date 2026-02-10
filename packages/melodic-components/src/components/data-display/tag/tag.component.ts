import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import type { TagDotColor } from './tag.types.js';
import { tagTemplate } from './tag.template.js';
import { tagStyles } from './tag.styles.js';

/**
 * ml-tag - Compact element for labeling, categorizing, and organizing items
 *
 * @example
 * ```html
 * <ml-tag>Label</ml-tag>
 * <ml-tag avatar-src="photo.jpg">Label</ml-tag>
 * <ml-tag dot closable>Label</ml-tag>
 * <ml-tag count="5">Label</ml-tag>
 * <ml-tag checkable>Label</ml-tag>
 * ```
 *
 * @slot default - Tag label content
 * @fires ml:close - Fired when the close button is clicked
 * @fires ml:change - Fired when checkbox state changes (when checkable)
 */
@MelodicComponent({
	selector: 'ml-tag',
	template: tagTemplate,
	styles: tagStyles,
	attributes: ['size', 'dot', 'dot-color', 'closable', 'avatar-src', 'icon', 'count', 'checkable', 'checked', 'disabled']
})
export class TagComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Tag size */
	size: Size = 'md';

	/** Show dot indicator */
	dot = false;

	/** Dot color */
	'dot-color': TagDotColor = 'success';

	/** Show close button */
	closable = false;

	/** Avatar image source */
	'avatar-src' = '';

	/** Icon name (Phosphor icon) */
	icon = '';

	/** Count value displayed on the right */
	count = '';

	/** Show checkbox */
	checkable = false;

	/** Checkbox checked state */
	checked = false;

	/** Disabled state */
	disabled = false;

	/** Handle close button click */
	handleClose = (event: Event): void => {
		event.stopPropagation();
		if (this.disabled) return;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:close', {
				bubbles: true,
				composed: true
			})
		);
	};

	/** Handle checkbox change */
	handleCheck = (event: Event): void => {
		event.stopPropagation();
		if (this.disabled) return;

		this.checked = !this.checked;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { checked: this.checked }
			})
		);
	};
}
