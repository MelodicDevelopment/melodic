import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Orientation } from '../../../types/index.js';
import { stackTemplate } from './stack.template.js';
import { stackStyles } from './stack.styles.js';

type Alignment = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

/**
 * ml-stack - Flexbox layout component for stacking elements
 *
 * @example
 * ```html
 * <ml-stack gap="4">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </ml-stack>
 *
 * <ml-stack direction="horizontal" gap="2" align="center">
 *   <ml-button>Save</ml-button>
 *   <ml-button variant="outline">Cancel</ml-button>
 * </ml-stack>
 * ```
 */
@MelodicComponent({
	selector: 'ml-stack',
	template: stackTemplate,
	styles: stackStyles,
	attributes: ['direction', 'gap', 'align', 'justify', 'wrap']
})
export class StackComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Stack direction */
	public direction: Orientation = 'vertical';

	/** Gap between items (uses spacing scale: 1-12) */
	public gap: string = '4';

	/** Cross-axis alignment */
	public align: Alignment = 'stretch';

	/** Main-axis justification */
	public justify: Justify = 'start';

	/** Allow items to wrap */
	public wrap = false;

	/**
	 * Layout values, exposed as component-scoped custom properties rather than
	 * inline declarations. An inline `style` beats every stylesheet rule, so
	 * inline layout could not be overridden — not by a token, not by a class,
	 * not by a media query.
	 */
	public getStyles(): Record<string, string> {
		const alignMap: Record<Alignment, string> = {
			start: 'flex-start',
			center: 'center',
			end: 'flex-end',
			stretch: 'stretch',
			baseline: 'baseline'
		};

		const justifyMap: Record<Justify, string> = {
			start: 'flex-start',
			center: 'center',
			end: 'flex-end',
			between: 'space-between',
			around: 'space-around',
			evenly: 'space-evenly'
		};

		return {
			'--ml-stack-direction': this.direction === 'vertical' ? 'column' : 'row',
			'--ml-stack-gap': `var(--ml-space-${this.gap})`,
			'--ml-stack-align': alignMap[this.align],
			'--ml-stack-justify': justifyMap[this.justify],
			'--ml-stack-wrap': this.wrap ? 'wrap' : 'nowrap'
		};
	}
}
