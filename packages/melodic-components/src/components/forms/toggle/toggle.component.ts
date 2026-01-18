import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import { toggleTemplate } from './toggle.template.js';
import { toggleStyles } from './toggle.styles.js';

/**
 * ml-toggle - Toggle/switch component
 *
 * @example
 * ```html
 * <ml-toggle label="Enable notifications"></ml-toggle>
 * <ml-toggle label="Dark mode" checked></ml-toggle>
 * <ml-toggle size="lg" label="Large toggle"></ml-toggle>
 * ```
 *
 * @fires ml-change - Emitted when toggled
 */
@MelodicComponent({
	selector: 'ml-toggle',
	template: toggleTemplate,
	styles: toggleStyles,
	attributes: ['label', 'hint', 'size', 'checked', 'disabled']
})
export class Toggle implements IElementRef {
	elementRef!: HTMLElement;

	/** Toggle label */
	label = '';

	/** Hint text */
	hint = '';

	/** Toggle size */
	size: Size = 'md';

	/** Checked state */
	checked = false;

	/** Disabled state */
	disabled = false;

	handleChange = (event: Event): void => {
		const target = event.target as HTMLInputElement;
		this.checked = target.checked;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml-change', {
				bubbles: true,
				composed: true,
				detail: { checked: this.checked }
			})
		);
	};
}
