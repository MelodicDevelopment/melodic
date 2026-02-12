import { html, classMap, when } from '@melodicdev/core';
import type { SignupPageComponent } from './signup-page.component.js';

export function signupPageTemplate(c: SignupPageComponent) {
	const isSplit = c.variant === 'split';

	const cardContent = html`
		<div class="ml-auth__logo">
			<slot name="logo"></slot>
		</div>

		${when(
			c.hasHeaderSlot,
			() => html`
				<div class="ml-auth__header">
					<slot name="header"></slot>
				</div>
			`,
			() => html`
				<div class="ml-auth__header">
					<h1 class="ml-auth__title">${c.title}</h1>
					<p class="ml-auth__description">${c.description}</p>
				</div>
			`
		)}

		<div class="ml-auth__social">
			<slot name="social"></slot>
		</div>

		<div class="ml-auth__form">
			<slot name="form"></slot>
		</div>

		<div class="ml-auth__footer">
			<slot name="footer"></slot>
		</div>
	`;

	return html`
		<div class=${classMap({
			'ml-auth': true,
			'ml-auth--centered': !isSplit,
			'ml-auth--split': isSplit
		})}>
			${when(
				isSplit,
				() => html`
					<div class="ml-auth__form-side">
						<div class="ml-auth__card">
							${cardContent}
						</div>
					</div>
					<div class="ml-auth__brand-side">
						<div class="ml-auth__brand-content">
							<slot name="brand"></slot>
						</div>
					</div>
				`,
				() => html`
					<div class="ml-auth__card">
						${cardContent}
					</div>
				`
			)}
		</div>
	`;
}
