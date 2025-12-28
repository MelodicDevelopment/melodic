import { MelodicComponent } from '../../../src/components';
import { html, css } from '../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'alt-framework-tutorials',
	template: () => html`
		<div class="page">
			<section class="hero">
				<div class="hero-content">
					<span class="section-label">Tutorials</span>
					<h1>Learn by building</h1>
					<p class="hero-lead">Step-by-step guides to help you master Melodic.</p>
				</div>
			</section>

			<section class="tutorials">
				<div class="tutorials-grid">
					<article class="tutorial-card beginner">
						<span class="difficulty">Beginner</span>
						<h2>Build Your First Component</h2>
						<p>Learn the fundamentals by creating a simple counter component with reactive state.</p>
						<div class="tutorial-meta">
							<span class="duration">15 min</span>
							<a href="#" class="btn btn-primary">Start tutorial</a>
						</div>
					</article>

					<article class="tutorial-card beginner">
						<span class="difficulty">Beginner</span>
						<h2>Working with Templates</h2>
						<p>Master the template syntax: expressions, event binding, and conditionals.</p>
						<div class="tutorial-meta">
							<span class="duration">20 min</span>
							<a href="#" class="btn btn-primary">Start tutorial</a>
						</div>
					</article>

					<article class="tutorial-card intermediate">
						<span class="difficulty">Intermediate</span>
						<h2>Building a Todo App</h2>
						<p>Put it all together with a full CRUD application using components, state, and styling.</p>
						<div class="tutorial-meta">
							<span class="duration">45 min</span>
							<a href="#" class="btn btn-primary">Start tutorial</a>
						</div>
					</article>

					<article class="tutorial-card intermediate">
						<span class="difficulty">Intermediate</span>
						<h2>Routing & Navigation</h2>
						<p>Add multi-page navigation to your app with the built-in router.</p>
						<div class="tutorial-meta">
							<span class="duration">30 min</span>
							<a href="#" class="btn btn-primary">Start tutorial</a>
						</div>
					</article>

					<article class="tutorial-card advanced">
						<span class="difficulty">Advanced</span>
						<h2>Custom Directives</h2>
						<p>Build reusable DOM manipulation primitives for your application.</p>
						<div class="tutorial-meta">
							<span class="duration">40 min</span>
							<a href="#" class="btn btn-primary">Start tutorial</a>
						</div>
					</article>

					<article class="tutorial-card advanced">
						<span class="difficulty">Advanced</span>
						<h2>State Management with Signals</h2>
						<p>Learn fine-grained reactivity patterns for complex applications.</p>
						<div class="tutorial-meta">
							<span class="duration">50 min</span>
							<a href="#" class="btn btn-primary">Start tutorial</a>
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

		.tutorials {
			max-width: 1000px;
			margin: 0 auto;
			padding: 6rem 2rem;
		}

		.tutorials-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
			gap: 1.5rem;
		}

		.tutorial-card {
			background: var(--alt-white);
			padding: 2rem;
			border-radius: var(--alt-radius-lg);
			border: 1px solid var(--alt-gray-200);
			display: flex;
			flex-direction: column;
		}

		.difficulty {
			display: inline-block;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			padding: 0.25rem 0.625rem;
			border-radius: var(--alt-radius-full);
			margin-bottom: 1rem;
			align-self: flex-start;
		}

		.beginner .difficulty {
			background: rgba(34, 197, 94, 0.1);
			color: #16a34a;
		}

		.intermediate .difficulty {
			background: rgba(234, 179, 8, 0.1);
			color: #ca8a04;
		}

		.advanced .difficulty {
			background: rgba(239, 68, 68, 0.1);
			color: #dc2626;
		}

		.tutorial-card h2 {
			font-family: var(--alt-font-display);
			font-size: 1.375rem;
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 0.75rem;
		}

		.tutorial-card p {
			font-size: 1rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0 0 1.5rem;
			flex: 1;
		}

		.tutorial-meta {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.duration {
			font-size: 0.875rem;
			font-weight: 500;
			color: var(--alt-gray-500);
		}

		.btn {
			display: inline-flex;
			align-items: center;
			padding: 0.625rem 1.25rem;
			font-size: 0.875rem;
			font-weight: 600;
			border-radius: var(--alt-radius-full);
			transition: all var(--alt-transition-fast);
		}

		.btn-primary {
			background: linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%);
			color: var(--alt-white);
		}

		.btn-primary:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
		}

		@media (max-width: 640px) {
			.hero,
			.tutorials {
				padding: 4rem 1.25rem;
			}
		}
	`
})
export class AltFrameworkTutorialsPageComponent {}
