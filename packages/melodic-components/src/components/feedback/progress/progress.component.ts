import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { progressTemplate } from './progress.template.js';
import { progressStyles } from './progress.styles.js';

type ProgressVariant = 'primary' | 'success' | 'warning' | 'error';
type ProgressSize = 'sm' | 'md' | 'lg';
type ProgressShape = 'linear' | 'circle' | 'half-circle';
type ProgressLabelPosition = 'top' | 'right' | 'bottom' | 'floating-top' | 'floating-bottom' | 'none';

/**
 * ml-progress - Progress indicator with linear, circle, and half-circle shapes
 *
 * @example
 * ```html
 * <ml-progress value="60"></ml-progress>
 * <ml-progress value="80" label="Upload" show-value label-position="right"></ml-progress>
 * <ml-progress value="40" shape="circle" show-value></ml-progress>
 * <ml-progress value="60" shape="half-circle" show-value></ml-progress>
 * ```
 */
@MelodicComponent({
	selector: 'ml-progress',
	template: progressTemplate,
	styles: progressStyles,
	attributes: ['value', 'max', 'variant', 'size', 'label', 'show-value', 'shape', 'label-position']
})
export class ProgressComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Current value (0-max) */
	value = 0;

	/** Maximum value */
	max = 100;

	/** Color variant */
	variant: ProgressVariant = 'primary';

	/** Bar height / circle size */
	size: ProgressSize = 'md';

	/** Optional label */
	label = '';

	/** Show percentage text */
	showValue = false;

	/** Shape: linear bar, full circle, or half circle */
	shape: ProgressShape = 'linear';

	/** Label position for linear bars */
	labelPosition: ProgressLabelPosition = 'top';

	get percentage(): number {
		const max = Math.max(this.max, 1);
		return Math.min(Math.max((this.value / max) * 100, 0), 100);
	}

	get displayValue(): string {
		return `${Math.round(this.percentage)}%`;
	}

	/** SVG circle radius based on size */
	get circleRadius(): number {
		if (this.size === 'sm') return 28;
		if (this.size === 'lg') return 52;
		return 40;
	}

	/** SVG stroke width based on size */
	get circleStroke(): number {
		if (this.size === 'sm') return 4;
		if (this.size === 'lg') return 8;
		return 6;
	}

	/** Full circumference for stroke-dasharray */
	get circumference(): number {
		return 2 * Math.PI * this.circleRadius;
	}

	/** Half circumference for half-circle */
	get halfCircumference(): number {
		return Math.PI * this.circleRadius;
	}

	/** Dash offset for full circle */
	get circleDashOffset(): number {
		return this.circumference - (this.percentage / 100) * this.circumference;
	}

	/** Dash offset for half circle */
	get halfCircleDashOffset(): number {
		return this.halfCircumference - (this.percentage / 100) * this.halfCircumference;
	}

	/** SVG viewBox size */
	get svgSize(): number {
		return (this.circleRadius + this.circleStroke) * 2;
	}

	/** SVG center point */
	get svgCenter(): number {
		return this.circleRadius + this.circleStroke;
	}
}
