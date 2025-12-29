import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'company-services',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div class="hero-content">
					<span class="section-label">Services</span>
					<h1>Engineering that scales with your ambition</h1>
					<p class="hero-lead">
						Principal-level software engineering services designed for teams that value quality, sustainability, and results.
					</p>
				</div>
			</section>

			<section class="offerings">
				<div class="offerings-grid">
					<article class="offering-card">
						<div class="offering-header">
							<div class="offering-icon">
								<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
								</svg>
							</div>
						</div>
						<h2>Rapid App Development</h2>
						<p class="offering-desc">
							AI-augmented development using modern technologies to deliver faster without sacrificing quality or maintainability.
						</p>
						<ul class="offering-includes">
							<li>Modern framework expertise (Angular, .NET, Azure)</li>
							<li>AI-assisted code generation and review</li>
							<li>Full-stack implementation</li>
							<li>Production-ready architecture</li>
							<li>Automated testing and CI/CD</li>
						</ul>
						<div class="offering-ideal">
							<h4>Ideal for:</h4>
							<p>Teams needing to ship quality software quickly without accumulating technical debt.</p>
						</div>
					</article>

					<article class="offering-card featured">
						<div class="featured-badge">Most Popular</div>
						<div class="offering-header">
							<div class="offering-icon">
								<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="3" y="3" width="18" height="18" rx="2" />
									<path d="M9 9h6v6H9z" />
								</svg>
							</div>
						</div>
						<h2>Prototyping</h2>
						<p class="offering-desc">
							Quick proof-of-concepts to validate ideas before major investment. Get real user feedback fast and iterate confidently.
						</p>
						<ul class="offering-includes">
							<li>Rapid prototyping and iteration</li>
							<li>Interactive demonstrations</li>
							<li>User feedback integration</li>
							<li>Technical feasibility analysis</li>
							<li>Migration path to production</li>
						</ul>
						<div class="offering-ideal">
							<h4>Ideal for:</h4>
							<p>Teams validating new product ideas or exploring technical approaches before committing resources.</p>
						</div>
					</article>

					<article class="offering-card">
						<div class="offering-header">
							<div class="offering-icon">
								<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
									<polyline points="14 2 14 8 20 8" />
									<line x1="16" y1="13" x2="8" y2="13" />
									<line x1="16" y1="17" x2="8" y2="17" />
								</svg>
							</div>
						</div>
						<h2>Architecture & Code Review</h2>
						<p class="offering-desc">
							Expert assessment of your existing systems. Identify scalability issues, security concerns, and technical debt before they become problems.
						</p>
						<ul class="offering-includes">
							<li>Comprehensive codebase analysis</li>
							<li>Architecture assessment</li>
							<li>Security review</li>
							<li>Performance bottleneck identification</li>
							<li>Actionable improvement roadmap</li>
						</ul>
						<div class="offering-ideal">
							<h4>Ideal for:</h4>
							<p>Teams inheriting legacy systems or preparing for significant growth and scale.</p>
						</div>
					</article>

					<article class="offering-card">
						<div class="offering-header">
							<div class="offering-icon">
								<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="9 11 12 14 22 4" />
									<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
								</svg>
							</div>
						</div>
						<h2>Automated Testing</h2>
						<p class="offering-desc">
							Build confidence in your deployments with comprehensive test automation and CI/CD pipelines that catch issues before they reach production.
						</p>
						<ul class="offering-includes">
							<li>Test strategy development</li>
							<li>Unit, integration, and E2E testing</li>
							<li>CI/CD pipeline implementation</li>
							<li>Code coverage optimization</li>
							<li>Quality gate configuration</li>
						</ul>
						<div class="offering-ideal">
							<h4>Ideal for:</h4>
							<p>Teams looking to increase deployment confidence and reduce manual testing burden.</p>
						</div>
					</article>

					<article class="offering-card">
						<div class="offering-header">
							<div class="offering-icon">
								<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
									<circle cx="9" cy="7" r="4" />
									<path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
								</svg>
							</div>
						</div>
						<h2>Team Mentoring</h2>
						<p class="offering-desc">
							Level up your development team with hands-on guidance, code reviews, and best practice training from a senior practitioner.
						</p>
						<ul class="offering-includes">
							<li>Pair programming sessions</li>
							<li>Code review guidance</li>
							<li>Best practices training</li>
							<li>Architecture workshops</li>
							<li>Modern tooling adoption</li>
						</ul>
						<div class="offering-ideal">
							<h4>Ideal for:</h4>
							<p>Teams wanting to elevate their engineering practices and grow junior developers into senior contributors.</p>
						</div>
					</article>
				</div>
			</section>

			<section class="specialties">
				<div class="specialties-inner">
					<div class="section-header">
						<span class="section-label">Specialties</span>
						<h2>Deep expertise where it matters</h2>
						<p>Over 20 years of experience across these domains.</p>
					</div>
					<div class="specialties-grid">
						<div class="specialty-item">
							<h3>AI-Augmented Development</h3>
							<p>Modern AI tools for code generation, review, and productivity enhancement</p>
						</div>
						<div class="specialty-item">
							<h3>Modern Web Technologies</h3>
							<p>Angular, TypeScript, .NET, REST APIs, real-time systems</p>
						</div>
						<div class="specialty-item">
							<h3>Cloud Architecture</h3>
							<p>Azure, Docker, Kubernetes, infrastructure automation</p>
						</div>
						<div class="specialty-item">
							<h3>Test Automation</h3>
							<p>Unit testing, integration testing, E2E, CI/CD pipelines</p>
						</div>
						<div class="specialty-item">
							<h3>Developer Enablement</h3>
							<p>Shared libraries, monorepos, developer experience optimization</p>
						</div>
						<div class="specialty-item">
							<h3>Performance Optimization</h3>
							<p>Profiling, optimization, caching strategies, load testing</p>
						</div>
					</div>
				</div>
			</section>

			<section class="process">
				<div class="process-inner">
					<div class="section-header">
						<span class="section-label">How I work</span>
						<h2>Transparent process, predictable outcomes</h2>
					</div>
					<div class="process-steps">
						<div class="step">
							<div class="step-number">01</div>
							<h3>Discovery Call</h3>
							<p>We discuss your goals, constraints, and timeline to see if we're a good fit.</p>
						</div>
						<div class="step">
							<div class="step-number">02</div>
							<h3>Proposal</h3>
							<p>You receive a detailed scope, timeline, and investment breakdown within 48 hours.</p>
						</div>
						<div class="step">
							<div class="step-number">03</div>
							<h3>Kickoff</h3>
							<p>We align on goals, set up communication channels, and begin work immediately.</p>
						</div>
						<div class="step">
							<div class="step-number">04</div>
							<h3>Delivery</h3>
							<p>Regular demos, continuous deployment, and clear communication throughout.</p>
						</div>
					</div>
				</div>
			</section>

			<section class="cta">
				<div class="cta-content">
					<h2>Let's discuss your project</h2>
					<p>Book a 30-minute call to explore how I can help.</p>
					<a class="btn btn-primary btn-lg" :routerLink="/contact">
						Schedule a call
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

		/* Offerings */
		.offerings {
			max-width: 1280px;
			margin: 0 auto;
			padding: 6rem 2rem;
		}

		.offerings-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
			gap: 1.5rem;
		}

		.offering-card {
			position: relative;
			background: var(--alt-white);
			padding: 2rem;
			border-radius: var(--alt-radius-lg);
			border: 1px solid var(--alt-gray-200);
			display: flex;
			flex-direction: column;
		}

		.offering-card.featured {
			border-color: var(--alt-primary);
			box-shadow: 0 0 0 1px var(--alt-primary), var(--alt-shadow-lg);
		}

		.featured-badge {
			position: absolute;
			top: -12px;
			left: 50%;
			transform: translateX(-50%);
			background: var(--alt-gradient-primary);
			color: var(--alt-white);
			font-size: 0.75rem;
			font-weight: 600;
			padding: 0.375rem 1rem;
			border-radius: var(--alt-radius-full);
		}

		.offering-header {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			margin-bottom: 1.5rem;
		}

		.offering-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 56px;
			height: 56px;
			background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
			border-radius: var(--alt-radius-md);
			color: var(--alt-primary);
		}

		.offering-card h2 {
			font-family: var(--alt-font-display);
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 0.75rem;
		}

		.offering-desc {
			font-size: 1rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0 0 1.5rem;
		}

		.offering-includes {
			list-style: none;
			padding: 0;
			margin: 0 0 auto;
		}

		.offering-includes li {
			position: relative;
			padding: 0.5rem 0 0.5rem 1.5rem;
			font-size: 0.9375rem;
			color: var(--alt-gray-700);
		}

		.offering-includes li::before {
			content: '';
			position: absolute;
			left: 0;
			top: 50%;
			transform: translateY(-50%);
			width: 6px;
			height: 6px;
			background: var(--alt-primary);
			border-radius: 50%;
		}

		.offering-ideal {
			margin-top: 2rem;
			padding-top: 1.5rem;
			border-top: 1px solid var(--alt-gray-200);
		}

		.offering-ideal h4 {
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--alt-gray-900);
			margin: 0 0 0.5rem;
		}

		.offering-ideal p {
			font-size: 0.9375rem;
			color: var(--alt-gray-600);
			margin: 0;
		}

		/* Specialties */
		.specialties {
			background: var(--alt-gray-900);
			padding: 6rem 2rem;
		}

		.specialties-inner {
			max-width: 1280px;
			margin: 0 auto;
		}

		.specialties .section-header {
			margin-bottom: 3rem;
		}

		.specialties .section-label {
			color: var(--alt-accent-light);
		}

		.specialties h2 {
			font-family: var(--alt-font-display);
			font-size: clamp(2rem, 3.5vw, 2.5rem);
			font-weight: 700;
			color: var(--alt-white);
			margin: 0 0 1rem;
		}

		.specialties .section-header p {
			font-size: 1.125rem;
			color: var(--alt-gray-400);
			margin: 0;
		}

		.specialties-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: 1.5rem;
		}

		.specialty-item {
			background: var(--alt-gray-800);
			padding: 1.5rem;
			border-radius: var(--alt-radius-lg);
			border: 1px solid var(--alt-gray-700);
		}

		.specialty-item h3 {
			font-size: 1.125rem;
			font-weight: 600;
			color: var(--alt-white);
			margin: 0 0 0.5rem;
		}

		.specialty-item p {
			font-size: 0.9375rem;
			color: var(--alt-gray-400);
			margin: 0;
		}

		/* Process */
		.process {
			padding: 6rem 2rem;
		}

		.process-inner {
			max-width: 1280px;
			margin: 0 auto;
		}

		.process .section-header {
			text-align: center;
			max-width: 640px;
			margin: 0 auto 3rem;
		}

		.process h2 {
			font-family: var(--alt-font-display);
			font-size: clamp(2rem, 3.5vw, 2.5rem);
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0;
		}

		.process-steps {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 2rem;
		}

		.step {
			text-align: center;
		}

		.step-number {
			font-family: var(--alt-font-display);
			font-size: 3rem;
			font-weight: 700;
			background: var(--alt-gradient-primary);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			margin-bottom: 1rem;
		}

		.step h3 {
			font-size: 1.125rem;
			font-weight: 600;
			color: var(--alt-gray-900);
			margin: 0 0 0.75rem;
		}

		.step p {
			font-size: 0.9375rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0;
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
		@media (max-width: 1024px) {
			.offerings-grid {
				grid-template-columns: 1fr;
				max-width: 500px;
				margin: 0 auto;
			}

			.process-steps {
				grid-template-columns: repeat(2, 1fr);
			}
		}

		@media (max-width: 640px) {
			.hero,
			.offerings,
			.specialties,
			.process,
			.cta {
				padding: 4rem 1.25rem;
			}

			.process-steps {
				grid-template-columns: 1fr;
			}
		}
	`
})
export class CompanyServicesPageComponent {}
