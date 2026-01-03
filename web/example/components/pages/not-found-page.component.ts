import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'not-found-page',
	template: () => html`
		<div class="page">
			<h1>404 - Page Not Found</h1>
			<p>The page you're looking for doesn't exist.</p>
			<router-link href="/">Go back home</router-link>
		</div>
	`,
	styles: () => css`
		.page {
			text-align: center;
		}
		h1 {
			color: #dc3545;
			margin-bottom: 1rem;
		}
		p {
			margin-bottom: 1.5rem;
		}
		router-link {
			color: #007bff;
			cursor: pointer;
		}
	`
})
export class NotFoundPageComponent {}
