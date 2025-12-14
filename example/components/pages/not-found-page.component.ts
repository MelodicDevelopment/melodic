import { MelodicComponent } from '../../../src/components/melodic-component.decorator';
import { html, css } from '../../../src/template/template-result.class';

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
			padding: 2rem;
			text-align: center;
		}
		h1 {
			color: #dc3545;
			margin-bottom: 1rem;
		}
		p {
			color: #666;
			margin-bottom: 1.5rem;
		}
		router-link {
			color: #007bff;
			cursor: pointer;
		}
	`
})
export class NotFoundPageComponent {}
