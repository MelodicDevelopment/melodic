import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { registerAdapter } from '@melodicdev/core/forms';
import type { Size } from '../../../types/index.js';
import { toggleTemplate } from './toggle.template.js';
import { toggleStyles } from './toggle.styles.js';

registerAdapter<boolean>((el) => el.tagName === 'ML-TOGGLE', {
	inputEvent: 'ml:change',
	blurEvent: 'focusout',
	getValue: (el) => Boolean((el as unknown as { checked: boolean }).checked),
	setValue: (el, value) => { (el as unknown as { checked: boolean }).checked = Boolean(value); },
	setDisabled: (el, disabled) => { (el as unknown as { disabled: boolean }).disabled = disabled; }
});

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
 * @fires ml:change - Emitted when toggled
 */
@MelodicComponent({
	selector: 'ml-toggle',
	template: toggleTemplate,
	styles: toggleStyles,
	attributes: ['label', 'hint', 'size', 'checked', 'disabled']
})
export class ToggleComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Toggle label */
	public label = '';

	/** Hint text */
	public hint = '';

	/** Toggle size */
	public size: Size = 'md';

	/** Checked state */
	public checked = false;

	/** Disabled state */
	public disabled = false;

	public handleChange = (event: Event): void => {
		if (this.disabled) {
			event.preventDefault();
			return;
		}

		const target = event.target as HTMLInputElement;
		this.checked = target.checked;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { checked: this.checked }
			})
		);
	};
}
