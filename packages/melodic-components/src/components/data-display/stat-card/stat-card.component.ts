import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { statCardTemplate } from './stat-card.template.js';
import { statCardStyles } from './stat-card.styles.js';
import { defineLegacyAliases } from '../../../functions/index.js';

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
}

// Deprecated quoted kebab-case property aliases (warn once on first write;
// removed in the next major release).
defineLegacyAliases(StatCardComponent.prototype, 'ml-stat-card', {
	'trend-direction': 'trendDirection',
	'icon-color': 'iconColor',
	'value-font': 'valueFont'
});
