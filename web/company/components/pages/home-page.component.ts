import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'company-home',
	template: () => html`
		<div class="page">
			<!-- Hero Section -->
			<section class="hero">
				<div class="hero-bg"></div>
				<div class="hero-content">
					<div class="hero-badge">
						<span class="badge-dot"></span>
						<span>Available for Q1 2025 projects</span>
					</div>
					<h1>Software engineering with <span class="gradient-text">rhythm and purpose</span></h1>
					<p class="hero-lead">
						Principal-level engineering and architecture consulting for ambitious teams. Rapid development, prototyping, code review, and mentoring.
					</p>
					<div class="hero-actions">
						<a class="btn btn-primary btn-lg" :routerLink="/contact">
							Start a conversation
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						</a>
						<a class="btn btn-ghost btn-lg" :routerLink="/work">View my work</a>
					</div>
				</div>
				<div class="hero-visual">
					<div class="hero-card">
						<div class="hero-card-header">
							<span class="dot red"></span>
							<span class="dot yellow"></span>
							<span class="dot green"></span>
						</div>
						<pre class="hero-code">
<code><span class="keyword">import</span> { bootstrap } <span class="keyword">from</span> <span class="string">'@melodicdev/core'</span>;

<span class="keyword">await</span> <span class="function">bootstrap</span>({
	<span class="property">target</span>: <span class="string">'#app'</span>,
	<span class="property">rootComponent</span>: <span class="string">'my-app'</span>,
	<span class="property">devMode</span>: <span class="boolean">true</span>
});</code>
						</pre>
					</div>
				</div>
			</section>

			<!-- Services Section -->
			<section class="services">
				<div class="section-header">
					<span class="section-label">What I do</span>
					<h2>Engineering services that deliver</h2>
					<p>From rapid prototypes to production systems, bringing clarity and velocity to every engagement.</p>
				</div>
				<div class="services-grid">
					<article class="service-card">
						<div class="service-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
							</svg>
						</div>
						<h3>Rapid App Development</h3>
						<p>AI-augmented development using modern technologies for faster delivery without sacrificing quality.</p>
					</article>
					<article class="service-card">
						<div class="service-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="3" y="3" width="18" height="18" rx="2" />
								<path d="M9 9h6v6H9z" />
							</svg>
						</div>
						<h3>Prototyping</h3>
						<p>Quick proof-of-concepts to validate ideas before major investment. Get real feedback fast.</p>
					</article>
					<article class="service-card">
						<div class="service-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
								<polyline points="14 2 14 8 20 8" />
								<line x1="16" y1="13" x2="8" y2="13" />
								<line x1="16" y1="17" x2="8" y2="17" />
							</svg>
						</div>
						<h3>Architecture & Code Review</h3>
						<p>Expert assessment, scalability planning, and technical debt identification for existing systems.</p>
					</article>
					<article class="service-card">
						<div class="service-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="9 11 12 14 22 4" />
								<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
							</svg>
						</div>
						<h3>Automated Testing</h3>
						<p>CI/CD implementation, test strategies, and quality assurance that scales with your team.</p>
					</article>
					<article class="service-card">
						<div class="service-icon">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
								<circle cx="9" cy="7" r="4" />
								<path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
							</svg>
						</div>
						<h3>Team Mentoring</h3>
						<p>Level up your developers with best practices, code standards, and modern development workflows.</p>
					</article>
				</div>
			</section>

			<!-- Work Section -->
			<section class="work">
				<div class="section-header">
					<span class="section-label">Selected work</span>
					<h2>Results that speak for themselves</h2>
					<p>Real impact from thoughtful engineering and modern architecture.</p>
				</div>
				<div class="work-grid">
					<article class="work-card featured">
						<div class="work-card-content">
							<span class="work-category">Education Technology</span>
							<h3>Student Information Systems</h3>
							<p>Architecting large-scale systems used by hundreds of schools nationwide, serving students and parents with modern portals and mobile applications.</p>
							<div class="work-stats">
								<div class="stat">
									<span class="stat-value">100+</span>
									<span class="stat-label">Schools served</span>
								</div>
								<div class="stat">
									<span class="stat-value">Modern</span>
									<span class="stat-label">Architecture</span>
								</div>
							</div>
						</div>
					</article>
					<article class="work-card">
						<div class="work-card-content">
							<span class="work-category">Enterprise</span>
							<h3>Mobile App Platform</h3>
							<p>Capacitor-based iOS & Android apps with native build workflows and push notification systems.</p>
							<div class="work-stats">
								<div class="stat">
									<span class="stat-value">Cross-platform</span>
									<span class="stat-label">iOS & Android</span>
								</div>
							</div>
						</div>
					</article>
					<article class="work-card">
						<div class="work-card-content">
							<span class="work-category">DevOps</span>
							<h3>CI/CD Pipelines</h3>
							<p>Azure-based infrastructure automation enabling fast, reliable deployments across development teams.</p>
							<div class="work-stats">
								<div class="stat">
									<span class="stat-value">Automated</span>
									<span class="stat-label">Deployments</span>
								</div>
							</div>
						</div>
					</article>
				</div>
			</section>

			<!-- Framework Section -->
			<section class="framework">
				<div class="framework-inner">
					<div class="framework-content">
						<span class="section-label">Open source</span>
						<h2>Melodic Framework</h2>
						<p>
							The lightweight web component framework I built and use every day. Fast templates, reactive state, built-in routing &mdash; no
							virtual DOM overhead.
						</p>
						<ul class="framework-features">
							<li>
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
									<path
										d="M16.667 5L7.5 14.167 3.333 10"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								TypeScript-first with decorator syntax
							</li>
							<li>
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
									<path
										d="M16.667 5L7.5 14.167 3.333 10"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								Shadow DOM encapsulation
							</li>
							<li>
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
									<path
										d="M16.667 5L7.5 14.167 3.333 10"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								Tiny runtime (~8kb gzipped)
							</li>
						</ul>
						<div class="framework-actions">
							<a class="btn btn-primary" href="https://framework.melodic.dev">Explore the framework</a>
							<a class="btn btn-ghost" href="https://github.com/melodicdevelopment/melodic">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
									/>
								</svg>
								Star on GitHub
							</a>
						</div>
					</div>
					<div class="framework-code-wrapper">
						<div class="framework-card">
							<div class="framework-card-header">
								<span class="dot red"></span>
								<span class="dot yellow"></span>
								<span class="dot green"></span>
								<span class="file-name">counter.component.ts</span>
							</div>
							<pre class="framework-code"><code><span class="decorator">@MelodicComponent</span>({
  <span class="property">selector</span>: <span class="string">'my-counter'</span>,
  <span class="property">template</span>: () => <span class="function">html</span>\`
    <span class="tag">&lt;button</span> <span class="attr">@click</span>=\${<span class="keyword">this</span>.increment}<span class="tag">&gt;</span>
      Count: \${<span class="keyword">this</span>.count}
    <span class="tag">&lt;/button&gt;</span>
  \`
})
<span class="keyword">export class</span> <span class="class">CounterComponent</span> {
  <span class="property">count</span> = <span class="number">0</span>;

  <span class="function">increment</span>() {
    <span class="keyword">this</span>.count++;
  }
}</code></pre>
						</div>
					</div>
				</div>
			</section>

			<!-- CTA Section -->
			<section class="cta">
				<div class="cta-content">
					<h2>Ready to build something exceptional?</h2>
					<p>Let's talk about your project and see if we're a good fit.</p>
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
			position: relative;
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 4rem;
			align-items: center;
			max-width: 1280px;
			margin: 0 auto;
			padding: 6rem 2rem 4rem;
			overflow: hidden;
		}

		.hero-bg {
			position: absolute;
			top: -50%;
			left: -20%;
			width: 140%;
			height: 200%;
			background: var(--alt-gradient-hero);
			pointer-events: none;
			z-index: -1;
		}

		.hero-badge {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.5rem 1rem;
			background: var(--alt-gray-100);
			border-radius: var(--alt-radius-full);
			font-size: 0.875rem;
			font-weight: 500;
			color: var(--alt-gray-600);
			margin-bottom: 1.5rem;
		}

		.badge-dot {
			width: 8px;
			height: 8px;
			background: #22c55e;
			border-radius: 50%;
			animation: pulse 2s infinite;
		}

		@keyframes pulse {
			0%,
			100% {
				opacity: 1;
			}
			50% {
				opacity: 0.5;
			}
		}

		.hero h1 {
			font-family: var(--alt-font-display);
			font-size: clamp(2.5rem, 5vw, 3.5rem);
			font-weight: 700;
			line-height: 1.1;
			color: var(--alt-gray-900);
			margin: 0 0 1.5rem;
		}

		.gradient-text {
			background: var(--alt-gradient-primary);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}

		.hero-lead {
			font-size: 1.25rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0 0 2rem;
			max-width: 500px;
		}

		.hero-actions {
			display: flex;
			flex-wrap: wrap;
			gap: 1rem;
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

		.btn-ghost {
			background: var(--alt-white);
			color: var(--alt-gray-700);
			border: 1px solid var(--alt-gray-200);
		}

		.btn-ghost:hover {
			background: var(--alt-gray-50);
			border-color: var(--alt-gray-300);
		}

		/* Hero Code Card */
		.hero-visual {
			display: flex;
			justify-content: flex-end;
		}

		.hero-card {
			width: 100%;
			max-width: 480px;
			background: var(--alt-gray-900);
			border-radius: var(--alt-radius-lg);
			overflow: hidden;
			box-shadow: var(--alt-shadow-xl), var(--alt-shadow-glow);
		}

		.hero-card-header {
			display: flex;
			gap: 0.5rem;
			padding: 1rem 1.25rem;
			background: var(--alt-gray-800);
			border-bottom: 1px solid var(--alt-gray-700);
		}

		.dot {
			width: 12px;
			height: 12px;
			border-radius: 50%;
		}

		.dot.red {
			background: #ef4444;
		}
		.dot.yellow {
			background: #eab308;
		}
		.dot.green {
			background: #22c55e;
		}

		.hero-code {
			margin: 0;
			padding: 1.5rem;
			font-family: var(--alt-font-mono);
			font-size: 0.875rem;
			line-height: 1.7;
			color: var(--alt-gray-300);
			overflow-x: auto;
		}

		.hero-code .keyword {
			color: #c084fc;
		}
		.hero-code .string {
			color: #86efac;
		}
		.hero-code .function {
			color: #60a5fa;
		}
		.hero-code .property {
			color: #fbbf24;
		}
		.hero-code .boolean {
			color: #f472b6;
		}

		/* Section Styles */
		.section-header {
			max-width: 640px;
			margin-bottom: 3rem;
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

		.section-header h2 {
			font-family: var(--alt-font-display);
			font-size: clamp(2rem, 3.5vw, 2.5rem);
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 1rem;
		}

		.section-header p {
			font-size: 1.125rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0;
		}

		/* Services */
		.services {
			max-width: 1280px;
			margin: 0 auto;
			padding: 6rem 2rem;
		}

		.services-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: 1.5rem;
		}

		.service-card {
			background: var(--alt-white);
			padding: 2rem;
			border-radius: var(--alt-radius-lg);
			border: 1px solid var(--alt-gray-200);
			transition: all var(--alt-transition-base);
		}

		.service-card:hover {
			border-color: var(--alt-primary-light);
			box-shadow: var(--alt-shadow-lg);
			transform: translateY(-4px);
		}

		.service-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 48px;
			height: 48px;
			background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
			border-radius: var(--alt-radius-md);
			color: var(--alt-primary);
			margin-bottom: 1.5rem;
		}

		.service-card h3 {
			font-family: var(--alt-font-display);
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--alt-gray-900);
			margin: 0 0 0.75rem;
		}

		.service-card p {
			font-size: 1rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0;
		}

		/* Work */
		.work {
			background: var(--alt-gray-50);
			padding: 6rem 2rem;
		}

		.work > * {
			max-width: 1280px;
			margin-left: auto;
			margin-right: auto;
		}

		.work-grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 1.5rem;
		}

		.work-card {
			background: var(--alt-white);
			border-radius: var(--alt-radius-lg);
			border: 1px solid var(--alt-gray-200);
			overflow: hidden;
			transition: all var(--alt-transition-base);
		}

		.work-card:hover {
			box-shadow: var(--alt-shadow-lg);
			transform: translateY(-4px);
		}

		.work-card.featured {
			grid-column: 1 / -1;
			background: var(--alt-gradient-dark);
			border: none;
		}

		.work-card.featured .work-card-content {
			padding: 3rem;
		}

		.work-card.featured .work-category {
			color: var(--alt-primary-light);
		}

		.work-card.featured h3,
		.work-card.featured p {
			color: var(--alt-white);
		}

		.work-card.featured .stat-value {
			color: var(--alt-white);
		}

		.work-card.featured .stat-label {
			color: var(--alt-gray-400);
		}

		.work-card-content {
			padding: 2rem;
		}

		.work-category {
			display: inline-block;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--alt-primary);
			text-transform: uppercase;
			letter-spacing: 0.1em;
			margin-bottom: 0.75rem;
		}

		.work-card h3 {
			font-family: var(--alt-font-display);
			font-size: 1.375rem;
			font-weight: 600;
			color: var(--alt-gray-900);
			margin: 0 0 0.75rem;
		}

		.work-card p {
			font-size: 1rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0 0 1.5rem;
		}

		.work-stats {
			display: flex;
			gap: 2rem;
		}

		.stat-value {
			display: block;
			font-family: var(--alt-font-display);
			font-size: 1.75rem;
			font-weight: 700;
			color: var(--alt-gray-900);
		}

		.stat-label {
			font-size: 0.875rem;
			color: var(--alt-gray-500);
		}

		/* Framework */
		.framework {
			padding: 6rem 2rem;
			background: var(--alt-white);
		}

		.framework-inner {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 4rem;
			align-items: center;
			max-width: 1280px;
			margin: 0 auto;
		}

		.framework-content h2 {
			font-family: var(--alt-font-display);
			font-size: clamp(2rem, 3.5vw, 2.5rem);
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 1rem;
		}

		.framework-content > p {
			font-size: 1.125rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0 0 2rem;
		}

		.framework-features {
			list-style: none;
			margin: 0 0 2rem;
			padding: 0;
		}

		.framework-features li {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			padding: 0.5rem 0;
			font-size: 1rem;
			color: var(--alt-gray-700);
		}

		.framework-features svg {
			color: var(--alt-primary);
			flex-shrink: 0;
		}

		.framework-actions {
			display: flex;
			flex-wrap: wrap;
			gap: 1rem;
		}

		.framework-code-wrapper {
			display: flex;
			justify-content: flex-end;
		}

		.framework-card {
			width: 100%;
			max-width: 500px;
			background: var(--alt-gray-900);
			border-radius: var(--alt-radius-lg);
			overflow: hidden;
			box-shadow: var(--alt-shadow-xl);
		}

		.framework-card-header {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding: 1rem 1.25rem;
			background: var(--alt-gray-800);
			border-bottom: 1px solid var(--alt-gray-700);
		}

		.file-name {
			margin-left: auto;
			font-family: var(--alt-font-mono);
			font-size: 0.8125rem;
			color: var(--alt-gray-500);
		}

		.framework-code {
			margin: 0;
			padding: 1.5rem;
			font-family: var(--alt-font-mono);
			font-size: 0.8125rem;
			line-height: 1.7;
			color: var(--alt-gray-300);
			overflow-x: auto;
		}

		.framework-code .decorator {
			color: #fbbf24;
		}
		.framework-code .keyword {
			color: #c084fc;
		}
		.framework-code .string {
			color: #86efac;
		}
		.framework-code .function {
			color: #60a5fa;
		}
		.framework-code .property {
			color: #93c5fd;
		}
		.framework-code .class {
			color: #67e8f9;
		}
		.framework-code .number {
			color: #f472b6;
		}
		.framework-code .tag {
			color: #f87171;
		}
		.framework-code .attr {
			color: #a5b4fc;
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
			font-size: clamp(2rem, 4vw, 2.75rem);
			font-weight: 700;
			color: var(--alt-white);
			margin: 0 0 1rem;
		}

		.cta p {
			font-size: 1.25rem;
			color: var(--alt-gray-400);
			margin: 0 0 2rem;
		}

		/* Responsive */
		@media (max-width: 1024px) {
			.hero {
				grid-template-columns: 1fr;
				padding: 4rem 2rem;
			}

			.hero-visual {
				display: none;
			}

			.framework-inner {
				grid-template-columns: 1fr;
				gap: 3rem;
			}

			.framework-code-wrapper {
				justify-content: center;
			}

			.work-grid {
				grid-template-columns: 1fr;
			}
		}

		@media (max-width: 640px) {
			.hero {
				padding: 3rem 1.25rem;
			}

			.services,
			.work,
			.framework,
			.cta {
				padding: 4rem 1.25rem;
			}

			.services-grid {
				grid-template-columns: 1fr;
			}

			.work-card.featured .work-card-content {
				padding: 2rem;
			}

			.work-stats {
				flex-direction: column;
				gap: 1rem;
			}
		}
	`
})
export class CompanyHomePageComponent {}
