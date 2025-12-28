import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'framework-not-found',
	template: () => html`
		<div class="page">
			<h1>Page not found</h1>
			<p>That page is missing or has moved.</p>
			<a class="btn" :routerLink="/home">Return to home</a>
		</div>
	`,
	styles: () => css`
		.page {
			display: grid;
			gap: 1rem;
			justify-items: start;
		}

		h1 {
			font-family: var(--md-font-display);
			font-size: 2.2rem;
			margin: 0;
		}

		p {
			margin: 0;
			color: var(--md-ink-soft);
		}

		.btn {
			padding: 0.6rem 1.2rem;
			border-radius: 999px;
			background: var(--md-blue);
			color: white;
			font-weight: 700;
		}
	`
})
export class NotFoundPageComponent {}
