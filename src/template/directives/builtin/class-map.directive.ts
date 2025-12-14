/**
 * ClassMap directive - Conditional CSS classes
 *
 * Efficiently applies CSS classes based on an object of conditions.
 */

import { directive } from '../functions/directive.function';
import type { IDirectiveResult } from '../interfaces/idirective-result.interface';

/**
 * Applies CSS classes based on an object mapping.
 *
 * Usage:
 *   <div class=${classMap({ active: isActive, disabled: isDisabled })}></div>
 *
 * Only classes with truthy values are applied.
 *
 * @param classes - Object mapping class names to boolean conditions
 */
export function classMap(classes: Record<string, boolean | undefined>): IDirectiveResult {
	return directive((container: Node, previousClasses?: Set<string>) => {
		const element = container as Element;
		const currentClasses = new Set<string>();

		// Apply new classes
		for (const [className, shouldApply] of Object.entries(classes)) {
			if (shouldApply) {
				element.classList.add(className);
				currentClasses.add(className);
			}
		}

		// Remove old classes that are no longer present
		if (previousClasses) {
			for (const className of previousClasses) {
				if (!currentClasses.has(className)) {
					element.classList.remove(className);
				}
			}
		}

		return currentClasses;
	});
}
