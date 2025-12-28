import { MelodicComponent } from '../../../src/components';
import { html, css } from '../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'alt-work',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div class="hero-content">
					<span class="section-label">Our Work</span>
					<h1>Outcomes that matter</h1>
					<p class="hero-lead">A selection of projects where thoughtful engineering created measurable business impact.</p>
				</div>
			</section>

			<section class="cases">
				<div class="cases-grid">
					<article class="case-card">
						<div class="case-image fintech"></div>
						<div class="case-content">
							<span class="case-category">Fintech</span>
							<h2>Underwriting Workflow Engine</h2>
							<p>
								A legacy loan approval system was creating bottlenecks for a growing lending platform. We rebuilt it as a modern, rules-based
								workflow engine with real-time decisioning.
							</p>
							<div class="case-results">
								<div class="result">
									<span class="result-value">38%</span>
									<span class="result-label">Faster approvals</span>
								</div>
								<div class="result">
									<span class="result-value">3x</span>
									<span class="result-label">Throughput increase</span>
								</div>
								<div class="result">
									<span class="result-value">60%</span>
									<span class="result-label">Less manual review</span>
								</div>
							</div>
							<div class="case-tech">
								<span>React</span>
								<span>Node.js</span>
								<span>PostgreSQL</span>
								<span>AWS Lambda</span>
							</div>
						</div>
					</article>

					<article class="case-card">
						<div class="case-image healthcare"></div>
						<div class="case-content">
							<span class="case-category">Healthcare</span>
							<h2>Operations Command Center</h2>
							<p>
								A regional health system needed visibility across 12 disconnected systems. We built a unified real-time dashboard that
								transformed their operations.
							</p>
							<div class="case-results">
								<div class="result">
									<span class="result-value">52%</span>
									<span class="result-label">Fewer escalations</span>
								</div>
								<div class="result">
									<span class="result-value">12</span>
									<span class="result-label">Systems unified</span>
								</div>
								<div class="result">
									<span class="result-value">Real-time</span>
									<span class="result-label">Data sync</span>
								</div>
							</div>
							<div class="case-tech">
								<span>Vue.js</span>
								<span>GraphQL</span>
								<span>Kafka</span>
								<span>Kubernetes</span>
							</div>
						</div>
					</article>

					<article class="case-card">
						<div class="case-image logistics"></div>
						<div class="case-content">
							<span class="case-category">Logistics</span>
							<h2>Fleet Tracking Platform</h2>
							<p>
								A logistics company was missing SLAs due to delayed delivery visibility. We built a real-time tracking system that enabled
								proactive issue resolution.
							</p>
							<div class="case-results">
								<div class="result">
									<span class="result-value">99.2%</span>
									<span class="result-label">SLA compliance</span>
								</div>
								<div class="result">
									<span class="result-value">15min</span>
									<span class="result-label">Avg response time</span>
								</div>
								<div class="result">
									<span class="result-value">40%</span>
									<span class="result-label">Cost reduction</span>
								</div>
							</div>
							<div class="case-tech">
								<span>React Native</span>
								<span>Go</span>
								<span>TimescaleDB</span>
								<span>WebSockets</span>
							</div>
						</div>
					</article>

					<article class="case-card">
						<div class="case-image saas"></div>
						<div class="case-content">
							<span class="case-category">SaaS</span>
							<h2>AI Content Platform</h2>
							<p>
								An AI startup needed to scale from prototype to production while maintaining sub-second response times. We rebuilt their
								architecture for 100x scale.
							</p>
							<div class="case-results">
								<div class="result">
									<span class="result-value">100x</span>
									<span class="result-label">Scale achieved</span>
								</div>
								<div class="result">
									<span class="result-value">200ms</span>
									<span class="result-label">P95 latency</span>
								</div>
								<div class="result">
									<span class="result-value">99.9%</span>
									<span class="result-label">Uptime</span>
								</div>
							</div>
							<div class="case-tech">
								<span>Next.js</span>
								<span>Python</span>
								<span>Redis</span>
								<span>GCP</span>
							</div>
						</div>
					</article>
				</div>
			</section>

			<section class="cta">
				<div class="cta-content">
					<h2>Have a similar challenge?</h2>
					<p>Let's discuss how we can help your team achieve results like these.</p>
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

		/* Cases */
		.cases {
			max-width: 1000px;
			margin: 0 auto;
			padding: 6rem 2rem;
		}

		.cases-grid {
			display: flex;
			flex-direction: column;
			gap: 3rem;
		}

		.case-card {
			display: grid;
			grid-template-columns: 400px 1fr;
			gap: 3rem;
			background: var(--alt-white);
			border-radius: var(--alt-radius-xl);
			border: 1px solid var(--alt-gray-200);
			overflow: hidden;
		}

		.case-card:nth-child(even) {
			direction: rtl;
		}

		.case-card:nth-child(even) > * {
			direction: ltr;
		}

		.case-image {
			height: 100%;
			min-height: 320px;
			background-size: cover;
			background-position: center;
		}

		.case-image.fintech {
			background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%);
		}

		.case-image.healthcare {
			background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
		}

		.case-image.logistics {
			background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		}

		.case-image.saas {
			background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
		}

		.case-content {
			padding: 2.5rem 2.5rem 2.5rem 0;
			display: flex;
			flex-direction: column;
		}

		.case-card:nth-child(even) .case-content {
			padding: 2.5rem 0 2.5rem 2.5rem;
		}

		.case-category {
			display: inline-block;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--alt-primary);
			text-transform: uppercase;
			letter-spacing: 0.1em;
			margin-bottom: 0.5rem;
		}

		.case-content h2 {
			font-family: var(--alt-font-display);
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 1rem;
		}

		.case-content > p {
			font-size: 1rem;
			line-height: 1.7;
			color: var(--alt-gray-600);
			margin: 0 0 1.5rem;
		}

		.case-results {
			display: flex;
			gap: 2rem;
			margin-bottom: 1.5rem;
		}

		.result {
			display: flex;
			flex-direction: column;
		}

		.result-value {
			font-family: var(--alt-font-display);
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--alt-gray-900);
		}

		.result-label {
			font-size: 0.8125rem;
			color: var(--alt-gray-500);
		}

		.case-tech {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
			margin-top: auto;
		}

		.case-tech span {
			padding: 0.375rem 0.75rem;
			background: var(--alt-gray-100);
			border-radius: var(--alt-radius-full);
			font-size: 0.8125rem;
			font-weight: 500;
			color: var(--alt-gray-600);
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
			.case-card,
			.case-card:nth-child(even) {
				grid-template-columns: 1fr;
				direction: ltr;
			}

			.case-image {
				min-height: 200px;
			}

			.case-content,
			.case-card:nth-child(even) .case-content {
				padding: 2rem;
			}
		}

		@media (max-width: 640px) {
			.hero,
			.cases,
			.cta {
				padding: 4rem 1.25rem;
			}

			.case-results {
				flex-wrap: wrap;
				gap: 1rem;
			}
		}
	`
})
export class AltWorkPageComponent {}
