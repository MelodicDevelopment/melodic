import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { progressTemplate } from './progress.template.js';
import { progressStyles } from './progress.styles.js';

type ProgressVariant = 'primary' | 'success' | 'warning' | 'error';
type ProgressSize = 'sm' | 'md' | 'lg';

/**
 * ml-progress - Linear progress bar
 *
 * @example
 * ```html
 * <ml-progress value="60"></ml-progress>
 * <ml-progress value="80" label="Upload progress" show-value></ml-progress>
 * <ml-progress variant="success" value="100"></ml-progress>
 * ```
 */
@MelodicComponent({
	selector: 'ml-progress',
	template: progressTemplate,
	styles: progressStyles,
	attributes: ['value', 'max', 'variant', 'size', 'label', 'show-value']
})
export class ProgressComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Current value (0-max) */
	value = 0;

	/** Maximum value */
	max = 100;

	/** Color variant */
	variant: ProgressVariant = 'primary';

	/** Bar height */
	size: ProgressSize = 'md';

	/** Optional label above the bar */
	label = '';

	/** Show percentage text */
	showValue = false;

	get percentage(): number {
		const max = Math.max(this.max, 1);
		return Math.min(Math.max((this.value / max) * 100, 0), 100);
	}

	get displayValue(): string {
		return `${Math.round(this.percentage)}%`;
	}
}
