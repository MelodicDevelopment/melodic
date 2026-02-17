import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { loginPageTemplate } from './login-page.template.js';
import { loginPageStyles } from './login-page.styles.js';

/**
 * ml-login-page - A full-page login component
 *
 * @example Centered:
 * ```html
 * <ml-login-page>
 *   <div slot="logo"><img src="logo.svg" alt="Logo" /></div>
 *   <form slot="form">...</form>
 *   <div slot="footer">
 *     <a href="/forgot">Forgot password?</a>
 *     <a href="/signup">Sign up</a>
 *   </div>
 * </ml-login-page>
 * ```
 *
 * @example Split variant:
 * ```html
 * <ml-login-page variant="split">
 *   <form slot="form">...</form>
 *   <div slot="brand">Welcome back to our platform</div>
 * </ml-login-page>
 * ```
 *
 * @slot logo - Brand logo area
 * @slot header - Custom header content (overrides title/description props)
 * @slot form - The login form
 * @slot footer - Links like "Forgot password?", "Sign up"
 * @slot social - Social login buttons
 * @slot brand - Content for the brand side (split variant only)
 */
@MelodicComponent({
	selector: 'ml-login-page',
	template: loginPageTemplate,
	styles: loginPageStyles,
	attributes: ['variant', 'title', 'description']
})
export class LoginPageComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Layout variant */
	variant: 'centered' | 'split' = 'centered';

	/** Page title */
	title = 'Log in to your account';

	/** Page description */
	description = 'Welcome back! Please enter your details.';

	/** Check if header slot has content */
	get hasHeaderSlot(): boolean {
		return this.elementRef?.querySelector('[slot="header"]') !== null;
	}

	/** Check if brand slot has content */
	get hasBrandSlot(): boolean {
		return this.elementRef?.querySelector('[slot="brand"]') !== null;
	}
}
