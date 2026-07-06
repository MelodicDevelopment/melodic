import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { signupPageTemplate } from './signup-page.template.js';
import { signupPageStyles } from './signup-page.styles.js';
import { warnDeprecatedTitleOnce } from '../../../functions/index.js';

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
	attributes: ['variant', 'page-title', 'title', 'description']
})
export class SignupPageComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Layout variant */
	public variant: 'centered' | 'split' = 'centered';

	/** Page title (attribute: page-title) */
	public pageTitle = 'Create an account';

	/** Page description */
	public description = 'Start your journey today.';

	/** @deprecated Use `pageTitle` (attribute `page-title`); `title` collides with the global HTML attribute. */
	public get title(): string {
		return this.pageTitle;
	}
	public set title(value: string) {
		warnDeprecatedTitleOnce('ml-signup-page', 'page-title');
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
