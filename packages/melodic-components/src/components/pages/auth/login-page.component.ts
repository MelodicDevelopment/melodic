import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { loginPageTemplate } from './login-page.template.js';
import { loginPageStyles } from './login-page.styles.js';
import { warnDeprecatedTitleOnce } from '../../../functions/index.js';

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
	attributes: ['variant', 'page-title', 'title', 'description']
})
export class LoginPageComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Layout variant */
	public variant: 'centered' | 'split' = 'centered';

	/** Page title (attribute: page-title) */
	public pageTitle = 'Log in to your account';

	/** Page description */
	public description = 'Welcome back! Please enter your details.';

	/** @deprecated Use `pageTitle` (attribute `page-title`); `title` collides with the global HTML attribute. */
	public get title(): string {
		return this.pageTitle;
	}
	public set title(value: string) {
		warnDeprecatedTitleOnce('ml-login-page', 'page-title');
		this.pageTitle = value;
	}

	/**
	 * Whether the header slot has content. The template no longer reads this at
	 * render time (it uses native slot fallback, which stays reactive on its
	 * own); this is a live query kept for imperative consumers.
	 */
	public get hasHeaderSlot(): boolean {
		return this.elementRef?.querySelector('[slot="header"]') !== null;
	}

	/** Whether the brand slot has content (live query for imperative consumers). */
	public get hasBrandSlot(): boolean {
		return this.elementRef?.querySelector('[slot="brand"]') !== null;
	}
}
