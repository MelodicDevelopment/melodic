import { MelodicComponent } from '../../../../src/components';
import { html, css } from '../../../../src/template/functions/html.function';

@MelodicComponent({
	selector: 'alt-not-found',
	template: () => html`
		<div class="page">
			<section class="error">
				<div class="error-content">
					<span class="error-code">404</span>
					<h1>Page not found</h1>
					<p>The page you're looking for doesn't exist or has been moved.</p>
					<a class="btn btn-primary" :routerLink="/home">
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
							<path d="M13 8H3M7 4l-4 4 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						Back to home
					</a>
				</div>
			</section>
		</div>
	`,
	styles: () => css`
		.page {
			display: flex;
			flex-direction: column;
			min-height: calc(100vh - 200px);
		}

		.error {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 4rem 2rem;
			text-align: center;
		}

		.error-content {
			max-width: 480px;
		}

		.error-code {
			display: block;
			font-family: var(--alt-font-display);
			font-size: 8rem;
			font-weight: 700;
			background: var(--alt-gradient-primary);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			line-height: 1;
			margin-bottom: 1rem;
		}

		h1 {
			font-family: var(--alt-font-display);
			font-size: 2rem;
			font-weight: 700;
			color: var(--alt-gray-900);
			margin: 0 0 1rem;
		}

		p {
			font-size: 1.125rem;
			line-height: 1.6;
			color: var(--alt-gray-600);
			margin: 0 0 2rem;
		}

		.btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			padding: 0.875rem 1.5rem;
			font-size: 0.9375rem;
			font-weight: 600;
			border-radius: var(--alt-radius-full);
			transition: all var(--alt-transition-fast);
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
	`
})
export class AltNotFoundPageComponent {}
