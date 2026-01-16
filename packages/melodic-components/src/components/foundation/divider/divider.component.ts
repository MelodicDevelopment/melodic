import { MelodicComponent, html, css, classMap, when } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Orientation } from '../../../types/index.js';

/**
 * ml-divider - Visual separator between content
 *
 * @example
 * ```html
 * <ml-divider></ml-divider>
 * <ml-divider orientation="vertical"></ml-divider>
 * <ml-divider>OR</ml-divider>
 * ```
 *
 * @slot default - Optional label text to display in the divider
 */
@MelodicComponent({
	selector: 'ml-divider',
	template: (c: Divider) => html`
		<div
			class=${classMap({
				'ml-divider': true,
				[`ml-divider--${c.orientation}`]: true,
				'ml-divider--with-label': c.hasLabel
			})}
			role="separator"
			aria-orientation=${c.orientation}
		>
			${when(
				c.hasLabel,
				() => html`
					<span class="ml-divider__label">
						<slot></slot>
					</span>
				`
			)}
		</div>
	`,
	styles: () => css`
		:host {
			display: block;
		}

		:host([orientation='vertical']) {
			display: inline-block;
			height: 100%;
		}

		.ml-divider {
			display: flex;
			align-items: center;
		}

		/* Horizontal */
		.ml-divider--horizontal {
			width: 100%;
			height: 1px;
			background-color: var(--ml-color-border);
		}

		.ml-divider--horizontal.ml-divider--with-label {
			height: auto;
			background-color: transparent;
		}

		.ml-divider--horizontal.ml-divider--with-label::before,
		.ml-divider--horizontal.ml-divider--with-label::after {
			content: '';
			flex: 1;
			height: 1px;
			background-color: var(--ml-color-border);
		}

		.ml-divider--horizontal .ml-divider__label {
			padding: 0 var(--ml-space-3);
			font-size: var(--ml-text-sm);
			color: var(--ml-color-text-muted);
			white-space: nowrap;
		}

		/* Vertical */
		.ml-divider--vertical {
			flex-direction: column;
			width: 1px;
			min-height: 1rem;
			height: 100%;
			background-color: var(--ml-color-border);
		}

		.ml-divider--vertical.ml-divider--with-label {
			width: auto;
			background-color: transparent;
		}

		.ml-divider--vertical.ml-divider--with-label::before,
		.ml-divider--vertical.ml-divider--with-label::after {
			content: '';
			flex: 1;
			width: 1px;
			background-color: var(--ml-color-border);
		}

		.ml-divider--vertical .ml-divider__label {
			padding: var(--ml-space-2) 0;
			font-size: var(--ml-text-sm);
			color: var(--ml-color-text-muted);
			writing-mode: vertical-rl;
		}
	`,
	attributes: ['orientation']
})
export class Divider implements IElementRef {
	elementRef!: HTMLElement;

	/** Divider orientation */
	orientation: Orientation = 'horizontal';

	/** Check if there's label content */
	get hasLabel(): boolean {
		return this.elementRef?.textContent?.trim() !== '';
	}
}
