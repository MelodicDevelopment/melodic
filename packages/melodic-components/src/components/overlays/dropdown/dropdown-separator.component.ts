import { MelodicComponent } from '@melodicdev/core';
import { dropdownSeparatorTemplate } from './dropdown-separator.template.js';
import { dropdownSeparatorStyles } from './dropdown-separator.styles.js';

/**
 * ml-dropdown-separator - Divider line between dropdown items
 *
 * @example
 * ```html
 * <ml-dropdown-item value="edit">Edit</ml-dropdown-item>
 * <ml-dropdown-separator></ml-dropdown-separator>
 * <ml-dropdown-item value="delete" destructive>Delete</ml-dropdown-item>
 * ```
 */
@MelodicComponent({
	selector: 'ml-dropdown-separator',
	template: dropdownSeparatorTemplate,
	styles: dropdownSeparatorStyles
})
export class DropdownSeparatorComponent {}
