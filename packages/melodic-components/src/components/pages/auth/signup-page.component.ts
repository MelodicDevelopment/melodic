import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { signupPageTemplate } from './signup-page.template.js';
import { signupPageStyles } from './signup-page.styles.js';

/**
 * ml-signup-page - A full-page signup/registration component
 *
 * @example Centered:
 * ```html
 * <ml-signup-page>
 *   <div slot="logo"><img src="logo.svg" alt="Logo" /></div>
 *   <form slot="form">...</form>
 *   <div slot="footer">
 *     <a href="/login">Already have an account? Log in</a>
 *   </div>
 * </ml-signup-page>
 * ```
 *
 * @example Split variant:
 * ```html
 * <ml-signup-page variant="split">
 *   <form slot="form">...</form>
 *   <div slot="brand">Join thousands of users</div>
 * </ml-signup-page>
 * ```
 *
 * @slot logo - Brand logo area
 * @slot header - Custom header content (overrides title/description props)
 * @slot form - The signup form
 * @slot footer - Links like "Already have an account?"
 * @slot social - Social signup buttons
 * @slot brand - Content for the brand side (split variant only)
 */
@MelodicComponent({
	selector: 'ml-signup-page',
	template: signupPageTemplate,
	styles: signupPageStyles,
	attributes: ['variant', 'title', 'description']
})
export class SignupPageComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Layout variant */
	variant: 'centered' | 'split' = 'centered';

	/** Page title */
	title = 'Create an account';

	/** Page description */
	description = 'Start your journey today.';

	/** Check if header slot has content */
	get hasHeaderSlot(): boolean {
		return this.elementRef?.querySelector('[slot="header"]') !== null;
	}

	/** Check if brand slot has content */
	get hasBrandSlot(): boolean {
		return this.elementRef?.querySelector('[slot="brand"]') !== null;
	}
}
