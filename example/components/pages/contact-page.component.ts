import { MelodicComponent } from '../../../src/components/melodic-component.decorator';
import { html, css } from '../../../src/template/template-result.class';

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
		.page {
			padding: 2rem;
		}
		h1 {
			color: #333;
			margin-bottom: 1rem;
		}
		p {
			color: #666;
			line-height: 1.6;
		}
		.contact-info {
			margin-top: 1.5rem;
			padding: 1rem;
			background: #f5f5f5;
			border-radius: 8px;
		}
		a {
			color: #007bff;
		}
	`
})
export class ContactPageComponent {}
