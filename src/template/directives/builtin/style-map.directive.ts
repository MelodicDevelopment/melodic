/**
 * StyleMap directive - Dynamic inline styles
 *
 * Efficiently applies inline styles based on an object.
 */

import { directive } from '../functions/directive.function';
import type { IDirectiveResult } from '../interfaces/idirective-result.interface';

/**
 * Applies inline styles based on an object mapping.
 *
 * Usage:
 *   <div style=${styleMap({ color: 'red', fontSize: '16px' })}></div>
 *
 * @param styles - Object mapping CSS property names to values
 */
/**
 * The CSS name for a `styleMap` key: camelCase becomes kebab-case, but a
 * custom property (`--rowHeight`) is passed through untouched — custom
 * property names are case-sensitive, so `--rowHeight` and `--row-height` are
 * different properties and converting one silently set the other.
 */
function cssPropertyName(property: string): string {
	return property.startsWith('--') ? property : property.replace(/([A-Z])/g, '-$1').toLowerCase();
}

export function styleMap(styles: Record<string, string | number | undefined>): IDirectiveResult {
	return directive((container: Node, previousStyles?: Set<string>) => {
		const element = container as HTMLElement;
		const currentStyles = new Set<string>();

		// Apply new styles
		for (const [property, value] of Object.entries(styles)) {
			if (value !== undefined) {
				element.style.setProperty(cssPropertyName(property), String(value));
				currentStyles.add(property);
			}
		}

		// Remove old styles that are no longer present
		if (previousStyles) {
			for (const property of previousStyles) {
				if (!currentStyles.has(property)) {
					element.style.removeProperty(cssPropertyName(property));
				}
			}
		}

		return currentStyles;
	}, 'styleMap');
}
