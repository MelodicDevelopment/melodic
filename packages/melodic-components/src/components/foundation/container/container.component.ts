import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { containerTemplate } from './container.template.js';
import { containerStyles } from './container.styles.js';

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * ml-container - Content width constraint wrapper
 *
 * @example
 * ```html
 * <ml-container>
 *   <p>Centered content with max-width</p>
 * </ml-container>
 *
 * <ml-container size="sm" padding="6">
 *   <p>Narrow container with extra padding</p>
 * </ml-container>
 * ```
 *
 * @slot default - Container content
 */
@MelodicComponent({
	selector: 'ml-container',
	template: containerTemplate,
	styles: containerStyles,
	attributes: ['size', 'padding', 'centered']
})
export class ContainerComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Max-width preset */
	size: ContainerSize = 'lg';

	/** Horizontal padding (spacing scale: 1-12) */
	padding: string = '4';

	/** Center the container with auto margins */
	centered = true;

	getStyles(): Record<string, string> {
		const maxWidthMap: Record<ContainerSize, string> = {
			sm: '640px',
			md: '768px',
			lg: '1024px',
			xl: '1280px',
			full: '100%'
		};

		return {
			'max-width': maxWidthMap[this.size],
			'padding-left': `var(--ml-space-${this.padding})`,
			'padding-right': `var(--ml-space-${this.padding})`,
			'margin-left': this.centered ? 'auto' : '0',
			'margin-right': this.centered ? 'auto' : '0'
		};
	}
}
