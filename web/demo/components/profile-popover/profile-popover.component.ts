import { MelodicComponent } from '@melodicdev/core';
import { profilePopoverTemplate } from './profile-popover.template';
import { profilePopoverStyles } from './profile-popover.styles';

@MelodicComponent({
	selector: 'profile-popover',
	template: profilePopoverTemplate,
	styles: profilePopoverStyles,
	attributes: ['name', 'email', 'role', 'avatar-url']
})
export class ProfilePopover {
	name = 'Jane Doe';
	email = 'jane@example.com';
	role = 'Admin';
	avatarUrl = '';
}
