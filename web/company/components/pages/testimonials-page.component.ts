import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'company-testimonials',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div class="hero-content">
					<span class="section-label">Testimonials</span>
					<h1>What clients say</h1>
					<p class="hero-lead">Don't just take my word for it. Here's what teams I've worked with have to say.</p>
				</div>
			</section>

			<section class="testimonials">
				<div class="testimonials-grid">
					<article class="testimonial-card featured">
						<div class="quote-icon">
							<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
								<path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
							</svg>
						</div>
						<blockquote>
							"Rick brings a rare combination of deep technical expertise and the ability to communicate complex concepts clearly.
							His work on our architecture transformed how our team thinks about building software."
						</blockquote>
						<div class="testimonial-author">
							<div class="author-avatar">JD</div>
							<div class="author-info">
								<span class="author-name">Coming Soon</span>
								<span class="author-title">CTO, Tech Startup</span>
							</div>
						</div>
					</article>

					<article class="testimonial-card">
						<blockquote>
							"The code quality and attention to detail exceeded our expectations. More importantly, the system was designed
							to be maintainable long after the engagement ended."
						</blockquote>
						<div class="testimonial-author">
							<div class="author-avatar">SM</div>
							<div class="author-info">
								<span class="author-name">Coming Soon</span>
								<span class="author-title">Engineering Manager</span>
							</div>
						</div>
					</article>

					<article class="testimonial-card">
						<blockquote>
							"Working with Melodic Development felt like having a senior architect embedded in our team.
							The mentoring alone was worth the investment."
						</blockquote>
						<div class="testimonial-author">
							<div class="author-avatar">AC</div>
							<div class="author-info">
								<span class="author-name">Coming Soon</span>
								<span class="author-title">VP of Engineering</span>
							</div>
						</div>
					</article>

					<article class="testimonial-card">
						<blockquote>
							"The rapid prototyping engagement helped us validate our idea quickly and gave us confidence to move forward
							with the full build. Saved us months of going down the wrong path."
						</blockquote>
						<div class="testimonial-author">
							<div class="author-avatar">MR</div>
							<div class="author-info">
								<span class="author-name">Coming Soon</span>
								<span class="author-title">Founder</span>
							</div>
						</div>
					</article>
				</div>
			</section>

			<section class="cta">
				<div class="cta-content">
					<h2>Ready to join them?</h2>
					<p>Let's discuss how I can help your team achieve similar results.</p>
					<a class="btn btn-primary btn-lg" :routerLink="/contact">
						Start a conversation
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
							<path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</a>
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

		/* Testimonials */
		.testimonials {
			max-width: 1280px;
			margin: 0 auto;
			padding: 6rem 2rem;
		}

		.testimonials-grid {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 1.5rem;
		}

		.testimonial-card {
			background: var(--alt-white);
			padding: 2rem;
			border-radius: var(--alt-radius-lg);
			border: 1px solid var(--alt-gray-200);
			display: flex;
			flex-direction: column;
		}

		.testimonial-card.featured {
			grid-column: 1 / -1;
			background: var(--alt-gradient-dark);
			border: none;
			padding: 3rem;
		}

		.quote-icon {
			color: var(--alt-primary-light);
			margin-bottom: 1.5rem;
			opacity: 0.5;
		}

		.testimonial-card blockquote {
			font-size: 1.125rem;
			line-height: 1.7;
			color: var(--alt-gray-600);
			margin: 0 0 2rem;
			flex: 1;
		}

		.testimonial-card.featured blockquote {
			font-size: 1.375rem;
			color: var(--alt-gray-300);
		}

		.testimonial-author {
			display: flex;
			align-items: center;
			gap: 1rem;
		}

		.author-avatar {
			width: 48px;
			height: 48px;
			border-radius: 50%;
			background: linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%);
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 600;
			color: var(--alt-primary);
		}

		.testimonial-card.featured .author-avatar {
			background: var(--alt-gray-800);
			color: var(--alt-primary-light);
		}

		.author-info {
			display: flex;
			flex-direction: column;
		}

		.author-name {
			font-weight: 600;
			color: var(--alt-gray-900);
		}

		.testimonial-card.featured .author-name {
			color: var(--alt-white);
		}

		.author-title {
			font-size: 0.875rem;
			color: var(--alt-gray-500);
		}

		.testimonial-card.featured .author-title {
			color: var(--alt-gray-400);
		}

		/* CTA */
		.cta {
			background: var(--alt-gray-50);
			padding: 6rem 2rem;
			text-align: center;
		}

		.cta-content {
			max-width: 640px;
			margin: 0 auto;
		}

		.cta h2 {
			font-family: var(--alt-font-display);
			font-size: clamp(2rem, 4vw, 2.5rem);
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 1rem;
		}

		.cta p {
			font-size: 1.125rem;
			color: var(--alt-gray-600);
			margin: 0 0 2rem;
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

		/* Responsive */
		@media (max-width: 900px) {
			.testimonials-grid {
				grid-template-columns: 1fr;
			}
		}

		@media (max-width: 640px) {
			.hero,
			.testimonials,
			.cta {
				padding: 4rem 1.25rem;
			}

			.testimonial-card.featured {
				padding: 2rem;
			}
		}
	`
})
export class CompanyTestimonialsPageComponent {}
