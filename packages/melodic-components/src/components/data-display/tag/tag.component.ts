import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { ControlSize } from '../../../types/index.js';
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
 * @fires ml:dismiss - Fired when the close button is clicked
 * @fires ml:close - Deprecated alias of ml:dismiss (kept for backwards compatibility)
 * @fires ml:change - Fired when checkbox state changes (when checkable)
 */
@MelodicComponent({
	selector: 'ml-tag',
	template: tagTemplate,
	styles: tagStyles,
	attributes: ['size', 'dot', 'dot-color', 'closable', 'avatar-src', 'icon', 'count', 'checkable', 'checked', 'disabled']
})
export class TagComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Tag size */
	public size: ControlSize = 'md';

	/** Show dot indicator */
	public dot = false;

	/** Dot color */
	public 'dot-color': TagDotColor = 'success';

	/** Show close button */
	public closable = false;

	/** Avatar image source */
	public 'avatar-src' = '';

	/** Icon name (Phosphor icon) */
	public icon = '';

	/** Count value displayed on the right */
	public count = '';

	/** Show checkbox */
	public checkable = false;

	/** Checkbox checked state */
	public checked = false;

	/** Disabled state */
	public disabled = false;

	/**
	 * Dot color with the canonical 'error' name resolved to this component's
	 * historical 'danger' style class. The two are interchangeable aliases;
	 * the stylesheet keys off `ml-tag__dot--danger`.
	 */
	public get resolvedDotColor(): TagDotColor {
		const color = this['dot-color'];
		return color === 'error' ? 'danger' : color;
	}

	/** Handle close button click */
	public handleClose = (event: Event): void => {
		event.stopPropagation();
		if (this.disabled) return;

		// Canonical dismissal event (shared vocabulary with ml-alert/ml-toast).
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:dismiss', {
				bubbles: true,
				composed: true
			})
		);

		// DEPRECATED: ml:close is kept for backwards compatibility and will be
		// removed in the next major release. Listen for ml:dismiss instead.
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:close', {
				bubbles: true,
				composed: true
			})
		);
	};

	/** Handle checkbox change */
	public handleCheck = (event: Event): void => {
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
