import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'alt-contact',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div class="hero-content">
					<span class="section-label">Contact</span>
					<h1>Let's talk about your project</h1>
					<p class="hero-lead">
						Tell us about what you're building and we'll get back to you within 24 hours.
					</p>
				</div>
			</section>

			<section class="contact">
				<div class="contact-inner">
					<form class="contact-form">
						<div class="form-row">
							<div class="form-group">
								<label for="name">Name</label>
								<input type="text" id="name" name="name" placeholder="Your name" required />
							</div>
							<div class="form-group">
								<label for="email">Email</label>
								<input type="email" id="email" name="email" placeholder="you@company.com" required />
							</div>
						</div>
						<div class="form-group">
							<label for="company">Company</label>
							<input type="text" id="company" name="company" placeholder="Company name (optional)" />
						</div>
						<div class="form-group">
							<label for="budget">Budget range</label>
							<select id="budget" name="budget">
								<option value="">Select a range</option>
								<option value="15-30k">$15k - $30k</option>
								<option value="30-80k">$30k - $80k</option>
								<option value="80-150k">$80k - $150k</option>
								<option value="150k+">$150k+</option>
								<option value="ongoing">Ongoing retainer</option>
							</select>
						</div>
						<div class="form-group">
							<label for="message">Tell us about your project</label>
							<textarea id="message" name="message" rows="6" placeholder="What are you building? What challenges are you facing? What does success look like?" required></textarea>
						</div>
						<button type="submit" class="btn btn-primary btn-lg">
							Send message
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
					</form>

					<div class="contact-info">
						<div class="info-card">
							<h3>Prefer a call?</h3>
							<p>Book a 30-minute discovery call to discuss your project in detail.</p>
							<a href="#" class="btn btn-ghost">Schedule a call</a>
						</div>
						<div class="info-details">
							<div class="detail">
								<h4>Email</h4>
								<a href="mailto:hello@melodic.dev">hello@melodic.dev</a>
							</div>
							<div class="detail">
								<h4>Location</h4>
								<p>Remote-first, US-based</p>
							</div>
							<div class="detail">
								<h4>Availability</h4>
								<p>Now booking Q1 2025</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	`,
	styles: () => css`
		.page {
			display: flex;
			flex-direction: column;
		}

		/* Hero */
		.hero {
			background: var(--alt-gray-50);
			padding: 6rem 2rem;
			text-align: center;
		}

		.hero-content {
			max-width: 720px;
			margin: 0 auto;
		}

		.section-label {
			display: inline-block;
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--alt-primary);
			text-transform: uppercase;
			letter-spacing: 0.1em;
			margin-bottom: 0.75rem;
		}

		.hero h1 {
			font-family: var(--alt-font-display);
			font-size: clamp(2.5rem, 5vw, 3.25rem);
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 1.5rem;
		}

		.hero-lead {
			font-size: 1.25rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0;
		}

		/* Contact */
		.contact {
			padding: 6rem 2rem;
		}

		.contact-inner {
			max-width: 1000px;
			margin: 0 auto;
			display: grid;
			grid-template-columns: 1.5fr 1fr;
			gap: 4rem;
		}

		/* Form */
		.contact-form {
			background: var(--alt-white);
			padding: 2.5rem;
			border-radius: var(--alt-radius-xl);
			border: 1px solid var(--alt-gray-200);
		}

		.form-row {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 1.25rem;
		}

		.form-group {
			margin-bottom: 1.25rem;
		}

		.form-group label {
			display: block;
			font-size: 0.9375rem;
			font-weight: 600;
			color: var(--alt-gray-900);
			margin-bottom: 0.5rem;
		}

		.form-group input,
		.form-group select,
		.form-group textarea {
			width: 100%;
			padding: 0.875rem 1rem;
			font-size: 1rem;
			border: 1px solid var(--alt-gray-200);
			border-radius: var(--alt-radius-md);
			background: var(--alt-white);
			transition: all var(--alt-transition-fast);
		}

		.form-group input:focus,
		.form-group select:focus,
		.form-group textarea:focus {
			outline: none;
			border-color: var(--alt-primary);
			box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
		}

		.form-group textarea {
			resize: vertical;
			min-height: 150px;
		}

		.form-group select {
			cursor: pointer;
			appearance: none;
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
			background-repeat: no-repeat;
			background-position: right 1rem center;
			padding-right: 2.5rem;
		}

		/* Info */
		.contact-info {
			display: flex;
			flex-direction: column;
			gap: 2rem;
		}

		.info-card {
			background: var(--alt-gradient-dark);
			padding: 2rem;
			border-radius: var(--alt-radius-xl);
		}

		.info-card h3 {
			font-family: var(--alt-font-display);
			font-size: 1.375rem;
			font-weight: 700;
			color: var(--alt-white);
			margin: 0 0 0.75rem;
		}

		.info-card p {
			font-size: 1rem;
			line-height: 1.6;
			color: var(--alt-gray-400);
			margin: 0 0 1.5rem;
		}

		.info-details {
			display: flex;
			flex-direction: column;
			gap: 1.5rem;
		}

		.detail h4 {
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--alt-gray-500);
			text-transform: uppercase;
			letter-spacing: 0.1em;
			margin: 0 0 0.5rem;
		}

		.detail a,
		.detail p {
			font-size: 1rem;
			color: var(--alt-gray-900);
			margin: 0;
		}

		.detail a {
			color: var(--alt-primary);
			font-weight: 500;
		}

		.detail a:hover {
			text-decoration: underline;
		}

		/* Buttons */
		.btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			padding: 0.75rem 1.5rem;
			font-size: 0.9375rem;
			font-weight: 600;
			border-radius: var(--alt-radius-full);
			transition: all var(--alt-transition-fast);
		}

		.btn-lg {
			padding: 0.875rem 1.75rem;
			font-size: 1rem;
			width: 100%;
		}

		.btn-primary {
			background: var(--alt-gradient-primary);
			color: var(--alt-white);
			box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3);
		}

		.btn-primary:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
		}

		.btn-ghost {
			background: transparent;
			color: var(--alt-white);
			border: 1px solid var(--alt-gray-600);
		}

		.btn-ghost:hover {
			background: var(--alt-gray-800);
			border-color: var(--alt-gray-500);
		}

		/* Responsive */
		@media (max-width: 900px) {
			.contact-inner {
				grid-template-columns: 1fr;
				gap: 3rem;
			}
		}

		@media (max-width: 640px) {
			.hero,
			.contact {
				padding: 4rem 1.25rem;
			}

			.form-row {
				grid-template-columns: 1fr;
			}

			.contact-form {
				padding: 1.75rem;
			}
		}
	`
})
export class AltContactPageComponent {}
