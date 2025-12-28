import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'alt-projects',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div class="hero-content">
					<span class="section-label">Projects</span>
					<h1>Open source & experiments</h1>
					<p class="hero-lead">
						Tools we've built, shared, and continue to maintain for the developer community.
					</p>
				</div>
			</section>

			<section class="projects">
				<div class="projects-grid">
					<article class="project-card featured">
						<div class="project-header">
							<div class="project-icon">
								<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
									<rect width="32" height="32" rx="8" fill="url(#proj-gradient)"/>
									<path d="M8 22V10L16 6L24 10V22L16 26L8 22Z" stroke="white" stroke-width="2" fill="none"/>
									<path d="M16 14V22M12 12L16 14L20 12" stroke="white" stroke-width="2" stroke-linecap="round"/>
									<defs>
										<linearGradient id="proj-gradient" x1="0" y1="0" x2="32" y2="32">
											<stop offset="0%" stop-color="#7c3aed"/>
											<stop offset="100%" stop-color="#06b6d4"/>
										</linearGradient>
									</defs>
								</svg>
							</div>
							<div class="project-links">
								<a href="https://github.com/melodicdev/melodic" class="project-link">
									<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
									</svg>
								</a>
								<a href="/framework/docs" class="project-link">
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
										<polyline points="15 3 21 3 21 9"/>
										<line x1="10" y1="14" x2="21" y2="3"/>
									</svg>
								</a>
							</div>
						</div>
						<h2>Melodic Framework</h2>
						<p class="project-desc">
							A lightweight web component framework with reactive state, built-in routing,
							and an expressive template system. No virtual DOM, just fast native rendering.
						</p>
						<div class="project-stats">
							<span class="stat">~8kb gzipped</span>
							<span class="stat">TypeScript-first</span>
							<span class="stat">Zero deps</span>
						</div>
						<div class="project-tech">
							<span>TypeScript</span>
							<span>Web Components</span>
							<span>Shadow DOM</span>
						</div>
					</article>

					<article class="project-card">
						<div class="project-header">
							<div class="project-icon small">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
									<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
								</svg>
							</div>
							<a href="https://github.com/melodicdev/melodic-cli" class="project-link">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
								</svg>
							</a>
						</div>
						<h3>Melodic CLI</h3>
						<p>Scaffolding tool for generating Melodic components, services, and project structure.</p>
						<div class="project-tech">
							<span>Node.js</span>
							<span>CLI</span>
						</div>
					</article>

					<article class="project-card">
						<div class="project-header">
							<div class="project-icon small">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
									<line x1="8" y1="21" x2="16" y2="21"/>
									<line x1="12" y1="17" x2="12" y2="21"/>
								</svg>
							</div>
							<a href="https://github.com/melodicdev/vscode-melodic" class="project-link">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
								</svg>
							</a>
						</div>
						<h3>VS Code Extension</h3>
						<p>Syntax highlighting, snippets, and IntelliSense for Melodic components.</p>
						<div class="project-tech">
							<span>VS Code</span>
							<span>Language Server</span>
						</div>
					</article>

					<article class="project-card">
						<div class="project-header">
							<div class="project-icon small">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polygon points="12 2 2 7 12 12 22 7 12 2"/>
									<polyline points="2 17 12 22 22 17"/>
									<polyline points="2 12 12 17 22 12"/>
								</svg>
							</div>
							<a href="https://github.com/melodicdev/melodic-router" class="project-link">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
								</svg>
							</a>
						</div>
						<h3>Standalone Router</h3>
						<p>Framework-agnostic router with nested routes, guards, and lazy loading.</p>
						<div class="project-tech">
							<span>TypeScript</span>
							<span>Framework-agnostic</span>
						</div>
					</article>

					<article class="project-card">
						<div class="project-header">
							<div class="project-icon small">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="3"/>
									<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
								</svg>
							</div>
							<a href="https://github.com/melodicdev/melodic-signals" class="project-link">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
								</svg>
							</a>
						</div>
						<h3>Melodic Signals</h3>
						<p>Fine-grained reactive state management with automatic dependency tracking.</p>
						<div class="project-tech">
							<span>TypeScript</span>
							<span>Reactive</span>
						</div>
					</article>
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

		/* Projects */
		.projects {
			max-width: 1280px;
			margin: 0 auto;
			padding: 6rem 2rem;
		}

		.projects-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
			gap: 1.5rem;
		}

		.project-card {
			background: var(--alt-white);
			padding: 1.75rem;
			border-radius: var(--alt-radius-lg);
			border: 1px solid var(--alt-gray-200);
			transition: all var(--alt-transition-base);
		}

		.project-card:hover {
			border-color: var(--alt-gray-300);
			box-shadow: var(--alt-shadow-md);
		}

		.project-card.featured {
			grid-column: 1 / -1;
			padding: 2.5rem;
			background: var(--alt-gradient-dark);
			border: none;
		}

		.project-header {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			margin-bottom: 1.25rem;
		}

		.project-icon {
			width: 48px;
			height: 48px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
			border-radius: var(--alt-radius-md);
			color: var(--alt-primary);
		}

		.project-icon.small {
			width: 40px;
			height: 40px;
		}

		.project-card.featured .project-icon {
			width: 56px;
			height: 56px;
			background: none;
		}

		.project-links {
			display: flex;
			gap: 0.5rem;
		}

		.project-link {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 36px;
			height: 36px;
			border-radius: var(--alt-radius-md);
			background: var(--alt-gray-100);
			color: var(--alt-gray-600);
			transition: all var(--alt-transition-fast);
		}

		.project-link:hover {
			background: var(--alt-gray-200);
			color: var(--alt-gray-900);
		}

		.project-card.featured .project-link {
			background: var(--alt-gray-800);
			color: var(--alt-gray-400);
		}

		.project-card.featured .project-link:hover {
			background: var(--alt-gray-700);
			color: var(--alt-white);
		}

		.project-card h2 {
			font-family: var(--alt-font-display);
			font-size: 1.75rem;
			font-weight: 700;
			color: var(--alt-white);
			margin: 0 0 1rem;
		}

		.project-card h3 {
			font-size: 1.125rem;
			font-weight: 600;
			color: var(--alt-gray-900);
			margin: 0 0 0.5rem;
		}

		.project-desc {
			font-size: 1.125rem;
			line-height: 1.6;
			color: var(--alt-gray-400);
			margin: 0 0 1.5rem;
		}

		.project-card > p {
			font-size: 0.9375rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0 0 1.25rem;
		}

		.project-stats {
			display: flex;
			gap: 1.5rem;
			margin-bottom: 1.5rem;
		}

		.project-stats .stat {
			font-size: 0.875rem;
			font-weight: 500;
			color: var(--alt-gray-300);
			padding: 0.5rem 1rem;
			background: var(--alt-gray-800);
			border-radius: var(--alt-radius-full);
		}

		.project-tech {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.project-tech span {
			padding: 0.375rem 0.75rem;
			background: var(--alt-gray-100);
			border-radius: var(--alt-radius-full);
			font-size: 0.8125rem;
			font-weight: 500;
			color: var(--alt-gray-600);
		}

		.project-card.featured .project-tech span {
			background: var(--alt-gray-800);
			color: var(--alt-gray-300);
		}

		/* Responsive */
		@media (max-width: 640px) {
			.hero,
			.projects {
				padding: 4rem 1.25rem;
			}

			.project-card.featured {
				padding: 2rem;
			}

			.project-stats {
				flex-wrap: wrap;
				gap: 0.75rem;
			}
		}
	`
})
export class AltProjectsPageComponent {}
