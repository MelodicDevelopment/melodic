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
	public elementRef!: HTMLElement;

	/** Current value (0-max) */
	public value = 0;

	/** Maximum value */
	public max = 100;

	/** Color variant */
	public variant: ProgressVariant = 'primary';

	/** Bar height / circle size */
	public size: ProgressSize = 'md';

	/** Optional label */
	public label = '';

	/** Show percentage text */
	public showValue = false;

	/** Shape: linear bar, full circle, or half circle */
	public shape: ProgressShape = 'linear';

	/** Label position for linear bars */
	public labelPosition: ProgressLabelPosition = 'top';

	public get percentage(): number {
		const max = Math.max(this.max, 1);
		return Math.min(Math.max((this.value / max) * 100, 0), 100);
	}

	public get displayValue(): string {
		return `${Math.round(this.percentage)}%`;
	}

	/** SVG circle radius based on size */
	public get circleRadius(): number {
		if (this.size === 'sm') return 28;
		if (this.size === 'lg') return 52;
		return 40;
	}

	/** SVG stroke width based on size */
	public get circleStroke(): number {
		if (this.size === 'sm') return 4;
		if (this.size === 'lg') return 8;
		return 6;
	}

	/** Full circumference for stroke-dasharray */
	public get circumference(): number {
		return 2 * Math.PI * this.circleRadius;
	}

	/** Half circumference for half-circle */
	public get halfCircumference(): number {
		return Math.PI * this.circleRadius;
	}

	/** Dash offset for full circle */
	public get circleDashOffset(): number {
		return this.circumference - (this.percentage / 100) * this.circumference;
	}

	/** Dash offset for half circle */
	public get halfCircleDashOffset(): number {
		return this.halfCircumference - (this.percentage / 100) * this.halfCircumference;
	}

	/** SVG viewBox size */
	public get svgSize(): number {
		return (this.circleRadius + this.circleStroke) * 2;
	}

	/** SVG center point */
	public get svgCenter(): number {
		return this.circleRadius + this.circleStroke;
	}
}
