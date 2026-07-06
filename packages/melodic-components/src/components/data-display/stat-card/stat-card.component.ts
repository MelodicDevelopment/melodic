import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { statCardTemplate } from './stat-card.template.js';
import { statCardStyles } from './stat-card.styles.js';

type TrendDirection = 'up' | 'down' | 'neutral';
type ValueFont = 'serif' | 'sans';

/**
 * ml-stat-card - Dashboard metric card with label, value, optional trend, and icon
 *
 * @example
 * ```html
 * <ml-stat-card
 *   label="Total Members"
 *   value="1,247"
 *   trend="+6 this month"
 *   trend-direction="up"
 *   icon="users"
 * ></ml-stat-card>
 * ```
 *
 * @csspart value - The large value display
 * @csspart label - The label text
 * @csspart trend - The trend text
 * @csspart icon - The icon container
 *
 * @cssproperty --ml-stat-card-bg - Card background color (default: var(--ml-color-surface))
 * @cssproperty --ml-stat-card-icon-color - Icon color (default: var(--ml-color-text-tertiary))
 * @cssproperty --ml-stat-card-value-color - Value text color (default: var(--ml-color-text))
 */
@MelodicComponent({
	selector: 'ml-stat-card',
	template: statCardTemplate,
	styles: statCardStyles,
	attributes: ['label', 'value', 'trend', 'trend-direction', 'icon', 'icon-color', 'value-font']
})
export class StatCardComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Metric label */
	public label = '';

	/** Display value */
	public value: string | number = '';

	/** Trend text (e.g. "+6 this month") */
	public trend = '';

	/** Trend direction for styling (attribute: trend-direction) */
	public trendDirection: TrendDirection = 'neutral';

	/** Icon name (Phosphor icon) */
	public icon = '';

	/** Icon color — CSS color value or token (attribute: icon-color) */
	public iconColor = '';

	/** Value font family (attribute: value-font) */
	public valueFont: ValueFont = 'serif';

	/** @deprecated Legacy property alias — use `trendDirection` (attribute `trend-direction`). */
	public get 'trend-direction'(): TrendDirection {
		return this.trendDirection;
	}
	public set 'trend-direction'(value: TrendDirection) {
		this.trendDirection = value;
	}

	/** @deprecated Legacy property alias — use `iconColor` (attribute `icon-color`). */
	public get 'icon-color'(): string {
		return this.iconColor;
	}
	public set 'icon-color'(value: string) {
		this.iconColor = value;
	}

	/** @deprecated Legacy property alias — use `valueFont` (attribute `value-font`). */
	public get 'value-font'(): ValueFont {
		return this.valueFont;
	}
	public set 'value-font'(value: ValueFont) {
		this.valueFont = value;
	}
}
