import { MelodicComponent } from '../../../src/components';
import { html, css } from '../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'contact-page',
	template: () => html`
		<div class="page">
			<h1>Contact Page</h1>
			<p>Get in touch with the Melodic team!</p>
			<div class="contact-info">
				<p>GitHub: <a href="https://github.com/melodic" target="_blank">github.com/melodic</a></p>
			</div>
		</div>
	`,
	styles: () => css`
		.contact-info {
			margin-top: 1.5rem;
			padding: 1rem;
			background: #f5f5f5;
			border-radius: 8px;
		}
	`
})
export class ContactPageComponent {}
