import { MelodicComponent, html, css, styleMap } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Orientation } from '../../../types/index.js';

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
	template: (c: Stack) => html`
		<div class="ml-stack" style=${styleMap(c.getStyles())}>
			<slot></slot>
		</div>
	`,
	styles: () => css`
		:host {
			display: block;
		}

		.ml-stack {
			display: flex;
		}
	`,
	attributes: ['direction', 'gap', 'align', 'justify', 'wrap']
})
export class Stack implements IElementRef {
	elementRef!: HTMLElement;

	/** Stack direction */
	direction: Orientation = 'vertical';

	/** Gap between items (uses spacing scale: 1-12) */
	gap: string = '4';

	/** Cross-axis alignment */
	align: Alignment = 'stretch';

	/** Main-axis justification */
	justify: Justify = 'start';

	/** Allow items to wrap */
	wrap = false;

	getStyles(): Record<string, string> {
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
			'flex-direction': this.direction === 'vertical' ? 'column' : 'row',
			gap: `var(--ml-space-${this.gap})`,
			'align-items': alignMap[this.align],
			'justify-content': justifyMap[this.justify],
			'flex-wrap': this.wrap ? 'wrap' : 'nowrap'
		};
	}
}
