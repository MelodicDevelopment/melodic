import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Orientation } from '../../../types/index.js';
import { dividerTemplate } from './divider.template.js';
import { dividerStyles } from './divider.styles.js';

/**
 * ml-divider - Visual separator between content
 *
 * @example
 * ```html
 * <ml-divider></ml-divider>
 * <ml-divider orientation="vertical"></ml-divider>
 * <ml-divider>OR</ml-divider>
 * ```
 *
 * @slot default - Optional label text to display in the divider
 */
@MelodicComponent({
	selector: 'ml-divider',
	template: dividerTemplate,
	styles: dividerStyles,
	attributes: ['orientation']
})
export class DividerComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Divider orientation */
	orientation: Orientation = 'horizontal';

	/** Check if there's label content */
	get hasLabel(): boolean {
		return this.elementRef?.textContent?.trim() !== '';
	}
}
