import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'company-contact',
	template: () => html`
		<div class="page">
			<section class="hero">
				<p class="eyebrow">Contact</p>
				<h1>Tell us about your product.</h1>
				<p>Share your goals and timeline. We will respond with a proposed plan and next steps.</p>
			</section>

			<section class="contact-grid">
				<form class="contact-form">
					<label>
						<span>Name</span>
						<input type="text" placeholder="Your name" />
					</label>
					<label>
						<span>Email</span>
						<input type="email" placeholder="you@company.com" />
					</label>
					<label>
						<span>Company</span>
						<input type="text" placeholder="Company or product" />
					</label>
					<label>
						<span>Project goals</span>
						<textarea rows="4" placeholder="What are you trying to launch or improve?"></textarea>
					</label>
					<button type="button">Send message</button>
				</form>

				<div class="contact-info">
					<h2>Start a conversation</h2>
					<p>We respond within 2 business days and can move quickly when timing is critical.</p>
					<div class="info-card">
						<p>hello@melodic.dev</p>
						<p>Remote-first (US time zones)</p>
						<p>Available for Q1 projects</p>
					</div>
					<div class="info-card">
						<p>Interested in Melodic Framework?</p>
					<a href="/framework/home">Visit Melodic Framework</a>
					</div>
				</div>
			</section>
		</div>
	`,
	styles: () => css`
		.page {
			display: grid;
			gap: 3rem;
		}

		.hero {
			max-width: 720px;
		}

		.eyebrow {
			text-transform: uppercase;
			letter-spacing: 0.2em;
			font-size: 0.75rem;
			color: var(--md-ink-fade);
			margin: 0 0 0.8rem;
		}

		h1 {
			font-family: var(--md-font-display);
			font-size: clamp(2.3rem, 3vw, 3rem);
			margin: 0 0 1rem;
		}

		p {
			margin: 0;
			line-height: 1.7;
			color: var(--md-ink-soft);
		}

		.contact-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
			gap: 2rem;
		}

		.contact-form {
			background: var(--md-surface);
			padding: 2rem;
			border-radius: var(--md-radius-lg);
			box-shadow: var(--md-shadow-soft);
			border: 1px solid rgba(73, 33, 109, 0.12);
			display: grid;
			gap: 1rem;
		}

		label {
			display: grid;
			gap: 0.5rem;
			font-weight: 600;
			color: var(--md-ink-soft);
		}

		input,
		textarea {
			border-radius: 12px;
			border: 1px solid rgba(73, 33, 109, 0.2);
			padding: 0.75rem 0.9rem;
			font-family: var(--md-font-body);
			font-size: 0.95rem;
		}

		button {
			border: none;
			border-radius: 999px;
			padding: 0.75rem 1.2rem;
			background: linear-gradient(135deg, var(--md-pink), var(--md-purple));
			color: white;
			font-weight: 700;
			font-size: 0.95rem;
			cursor: pointer;
			justify-self: start;
		}

		.contact-info {
			display: grid;
			gap: 1.5rem;
			align-content: start;
		}

		.contact-info h2 {
			margin: 0;
			font-size: 1.6rem;
		}

		.info-card {
			padding: 1.5rem;
			border-radius: var(--md-radius-md);
			background: rgba(255, 255, 255, 0.7);
			border: 1px solid rgba(73, 33, 109, 0.12);
			display: grid;
			gap: 0.5rem;
		}

		.info-card a {
			color: var(--md-purple);
			font-weight: 700;
		}
	`
})
export class ContactPageComponent {}
