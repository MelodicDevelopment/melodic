import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'alt-framework-roadmap',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div class="hero-content">
					<span class="section-label">Roadmap</span>
					<h1>What's next</h1>
					<p class="hero-lead">Our plans for the future of Melodic.</p>
				</div>
			</section>

			<section class="roadmap">
				<div class="timeline">
					<div class="milestone completed">
						<div class="milestone-marker">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
								<path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</div>
						<div class="milestone-content">
							<span class="milestone-version">v1.0</span>
							<h2>Initial Release</h2>
							<p>Core component system, template engine, and reactive state management.</p>
							<ul>
								<li>Component decorator system</li>
								<li>Tagged template literals</li>
								<li>Shadow DOM encapsulation</li>
								<li>Reactive property observation</li>
							</ul>
						</div>
					</div>

					<div class="milestone current">
						<div class="milestone-marker">
							<div class="marker-dot"></div>
						</div>
						<div class="milestone-content">
							<span class="milestone-version">v1.1</span>
							<h2>Routing & Navigation</h2>
							<p>Built-in router with nested routes, guards, and lazy loading.</p>
							<ul>
								<li>Declarative route configuration</li>
								<li>Router outlet component</li>
								<li>Route guards and resolvers</li>
								<li>History and hash mode</li>
							</ul>
						</div>
					</div>

					<div class="milestone upcoming">
						<div class="milestone-marker">
							<div class="marker-dot"></div>
						</div>
						<div class="milestone-content">
							<span class="milestone-version">v1.2</span>
							<h2>Signals</h2>
							<p>Fine-grained reactivity with automatic dependency tracking.</p>
							<ul>
								<li>Signal primitives</li>
								<li>Computed values</li>
								<li>Effects</li>
								<li>Signal-based stores</li>
							</ul>
						</div>
					</div>

					<div class="milestone upcoming">
						<div class="milestone-marker">
							<div class="marker-dot"></div>
						</div>
						<div class="milestone-content">
							<span class="milestone-version">v1.3</span>
							<h2>Developer Tools</h2>
							<p>Browser extension and debugging utilities.</p>
							<ul>
								<li>Component inspector</li>
								<li>State viewer</li>
								<li>Performance profiler</li>
								<li>Time-travel debugging</li>
							</ul>
						</div>
					</div>

					<div class="milestone upcoming">
						<div class="milestone-marker">
							<div class="marker-dot"></div>
						</div>
						<div class="milestone-content">
							<span class="milestone-version">v2.0</span>
							<h2>SSR & Hydration</h2>
							<p>Server-side rendering with seamless client hydration.</p>
							<ul>
								<li>Server rendering adapter</li>
								<li>Streaming SSR</li>
								<li>Partial hydration</li>
								<li>Static site generation</li>
							</ul>
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
			color: #06b6d4;
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
			color: var(--alt-gray-600);
			margin: 0;
		}

		.roadmap {
			max-width: 720px;
			margin: 0 auto;
			padding: 6rem 2rem;
		}

		.timeline {
			position: relative;
		}

		.timeline::before {
			content: '';
			position: absolute;
			left: 15px;
			top: 0;
			bottom: 0;
			width: 2px;
			background: var(--alt-gray-200);
		}

		.milestone {
			position: relative;
			display: grid;
			grid-template-columns: 32px 1fr;
			gap: 1.5rem;
			margin-bottom: 3rem;
		}

		.milestone:last-child {
			margin-bottom: 0;
		}

		.milestone-marker {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			border-radius: 50%;
			background: var(--alt-white);
			border: 2px solid var(--alt-gray-200);
			z-index: 1;
		}

		.completed .milestone-marker {
			background: #22c55e;
			border-color: #22c55e;
			color: white;
		}

		.current .milestone-marker {
			background: #06b6d4;
			border-color: #06b6d4;
		}

		.marker-dot {
			width: 10px;
			height: 10px;
			border-radius: 50%;
			background: white;
		}

		.upcoming .marker-dot {
			background: var(--alt-gray-300);
		}

		.milestone-content {
			padding-bottom: 1rem;
		}

		.milestone-version {
			display: inline-block;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--alt-gray-500);
			text-transform: uppercase;
			letter-spacing: 0.1em;
			margin-bottom: 0.5rem;
		}

		.completed .milestone-version {
			color: #22c55e;
		}

		.current .milestone-version {
			color: #06b6d4;
		}

		.milestone-content h2 {
			font-family: var(--alt-font-display);
			font-size: 1.375rem;
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 0.5rem;
		}

		.milestone-content > p {
			font-size: 1rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0 0 1rem;
		}

		.milestone-content ul {
			margin: 0;
			padding-left: 1.25rem;
		}

		.milestone-content li {
			font-size: 0.9375rem;
			color: var(--alt-gray-600);
			margin-bottom: 0.375rem;
		}

		.upcoming .milestone-content h2,
		.upcoming .milestone-content p,
		.upcoming .milestone-content li {
			opacity: 0.6;
		}

		@media (max-width: 640px) {
			.hero,
			.roadmap {
				padding: 4rem 1.25rem;
			}
		}
	`
})
export class AltFrameworkRoadmapPageComponent {}
