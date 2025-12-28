import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'alt-about',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div class="hero-content">
					<span class="section-label">About</span>
					<h1>Built by engineers who ship</h1>
					<p class="hero-lead">
						We're a small, senior team that's spent years building products at scale.
						Now we help other teams do the same.
					</p>
				</div>
			</section>

			<section class="story">
				<div class="story-inner">
					<div class="story-content">
						<h2>Our story</h2>
						<p>
							Melodic Development started from a simple observation: most software projects
							don't fail because of technology choices. They fail because of unclear scope,
							poor communication, and architecture that doesn't scale.
						</p>
						<p>
							After a decade building products at startups and enterprises, we founded
							Melodic to offer something different &mdash; a studio that combines senior
							engineering talent with the discipline of a product team.
						</p>
						<p>
							We're remote-first, intentionally small, and selective about the projects
							we take on. This lets us go deep with every client and deliver work we're
							genuinely proud of.
						</p>
					</div>
					<div class="story-values">
						<h3>What we believe</h3>
						<div class="values-grid">
							<div class="value">
								<h4>Clarity over cleverness</h4>
								<p>Simple solutions that the whole team can understand and maintain.</p>
							</div>
							<div class="value">
								<h4>Ship early, iterate fast</h4>
								<p>Get real feedback quickly. Perfect is the enemy of launched.</p>
							</div>
							<div class="value">
								<h4>Own the outcome</h4>
								<p>We're not here to write code. We're here to solve problems.</p>
							</div>
							<div class="value">
								<h4>Transparent always</h4>
								<p>No black boxes. You'll know exactly what we're doing and why.</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section class="team">
				<div class="team-inner">
					<div class="section-header">
						<span class="section-label">Team</span>
						<h2>The people behind the code</h2>
					</div>
					<div class="team-grid">
						<div class="team-member">
							<div class="member-avatar">RH</div>
							<h3>Rick Hopkins</h3>
							<span class="member-role">Founder & Lead Engineer</span>
							<p>
								15+ years building web applications. Former tech lead at multiple startups.
								Creator of the Melodic Framework.
							</p>
							<div class="member-links">
								<a href="https://github.com/rickhopkins" aria-label="GitHub">
									<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
									</svg>
								</a>
								<a href="https://linkedin.com/in/rickhopkins" aria-label="LinkedIn">
									<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
										<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
									</svg>
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section class="cta">
				<div class="cta-content">
					<h2>Let's build something great</h2>
					<p>We're always interested in hearing about ambitious projects.</p>
					<a class="btn btn-primary btn-lg" :routerLink="/contact">
						Get in touch
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
							<path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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

		/* Story */
		.story {
			padding: 6rem 2rem;
		}

		.story-inner {
			max-width: 1000px;
			margin: 0 auto;
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 4rem;
		}

		.story-content h2 {
			font-family: var(--alt-font-display);
			font-size: 2rem;
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 1.5rem;
		}

		.story-content p {
			font-size: 1.0625rem;
			line-height: 1.7;
			color: var(--alt-gray-600);
			margin: 0 0 1.25rem;
		}

		.story-content p:last-child {
			margin-bottom: 0;
		}

		.story-values h3 {
			font-family: var(--alt-font-display);
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--alt-gray-900);
			margin: 0 0 1.5rem;
		}

		.values-grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 1.25rem;
		}

		.value {
			padding: 1.25rem;
			background: var(--alt-gray-50);
			border-radius: var(--alt-radius-lg);
		}

		.value h4 {
			font-size: 1rem;
			font-weight: 600;
			color: var(--alt-gray-900);
			margin: 0 0 0.5rem;
		}

		.value p {
			font-size: 0.9375rem;
			line-height: 1.5;
			color: var(--alt-gray-600);
			margin: 0;
		}

		/* Team */
		.team {
			background: var(--alt-gray-50);
			padding: 6rem 2rem;
		}

		.team-inner {
			max-width: 1000px;
			margin: 0 auto;
		}

		.section-header {
			text-align: center;
			margin-bottom: 3rem;
		}

		.section-header h2 {
			font-family: var(--alt-font-display);
			font-size: clamp(2rem, 3.5vw, 2.5rem);
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0;
		}

		.team-grid {
			display: flex;
			justify-content: center;
		}

		.team-member {
			text-align: center;
			max-width: 320px;
		}

		.member-avatar {
			width: 96px;
			height: 96px;
			margin: 0 auto 1.5rem;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--alt-gradient-primary);
			border-radius: 50%;
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--alt-white);
		}

		.team-member h3 {
			font-family: var(--alt-font-display);
			font-size: 1.375rem;
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 0.25rem;
		}

		.member-role {
			display: block;
			font-size: 0.9375rem;
			font-weight: 500;
			color: var(--alt-primary);
			margin-bottom: 1rem;
		}

		.team-member p {
			font-size: 0.9375rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0 0 1.25rem;
		}

		.member-links {
			display: flex;
			justify-content: center;
			gap: 0.75rem;
		}

		.member-links a {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 36px;
			height: 36px;
			border-radius: var(--alt-radius-md);
			background: var(--alt-white);
			color: var(--alt-gray-500);
			border: 1px solid var(--alt-gray-200);
			transition: all var(--alt-transition-fast);
		}

		.member-links a:hover {
			color: var(--alt-gray-900);
			border-color: var(--alt-gray-300);
		}

		/* CTA */
		.cta {
			background: var(--alt-gradient-dark);
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
			color: var(--alt-white);
			margin: 0 0 1rem;
		}

		.cta p {
			font-size: 1.125rem;
			color: var(--alt-gray-400);
			margin: 0 0 2rem;
		}

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
			.story-inner {
				grid-template-columns: 1fr;
				gap: 3rem;
			}
		}

		@media (max-width: 640px) {
			.hero,
			.story,
			.team,
			.cta {
				padding: 4rem 1.25rem;
			}

			.values-grid {
				grid-template-columns: 1fr;
			}
		}
	`
})
export class AltAboutPageComponent {}
