import { MelodicComponent } from '@melodicdev/core';
import { dropdownGroupTemplate } from './dropdown-group.template.js';
import { dropdownGroupStyles } from './dropdown-group.styles.js';

/**
 * ml-dropdown-group - Groups dropdown items with an optional label header
 *
 * @example
 * ```html
 * <ml-dropdown-group label="Account">
 *   <ml-dropdown-item value="profile" icon="user">Profile</ml-dropdown-item>
 *   <ml-dropdown-item value="settings" icon="gear">Settings</ml-dropdown-item>
 * </ml-dropdown-group>
 * ```
 *
 * @slot default - The items within this group
 */
@MelodicComponent({
	selector: 'ml-dropdown-group',
	template: dropdownGroupTemplate,
	styles: dropdownGroupStyles,
	attributes: ['label']
})
export class DropdownGroupComponent {
	/** Optional uppercase muted header label */
	label = '';
}
