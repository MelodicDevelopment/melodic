import { MelodicComponent } from '../../../src/components/melodic-component.decorator';
import { html, css } from '../../../src/template/template';
import type { IRoute } from '../../../src/routing/interfaces/iroute.interface';

const routes: IRoute[] = [
	{ path: '', redirectTo: '/home' },
	{ path: 'home', component: 'home-page' },
	{ path: 'demos', component: 'demos-page' },
	{ path: 'about', component: 'about-page' },
	{ path: 'contact', component: 'contact-page' },
	{ path: '404', component: 'not-found-page' }
];

@MelodicComponent({
	selector: 'router-demo',
	template: (_self: RouterDemoComponent) => html`
		<div class="app">
			<nav class="nav">
				<router-link href="/home">Home</router-link>
				<router-link href="/demos">Demos</router-link>
				<router-link href="/about">About</router-link>
				<router-link href="/contact">Contact</router-link>
			</nav>
			<main class="content">
				<router-outlet .routes=${routes}></router-outlet>
			</main>
		</div>
	`,
	styles: () => css`
		.app {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			max-width: 800px;
			margin: 0 auto;
		}
		.nav {
			display: flex;
			gap: 1rem;
			padding: 1rem;
			background: #333;
			border-radius: 8px 8px 0 0;
		}
		router-link {
			color: white;
			text-decoration: none;
			padding: 0.5rem 1rem;
			border-radius: 4px;
			cursor: pointer;
			transition: background 0.2s;
		}
		router-link:hover {
			background: rgba(255, 255, 255, 0.1);
		}
		.content {
			background: white;
			border: 1px solid #ddd;
			border-top: none;
			border-radius: 0 0 8px 8px;
			min-height: 300px;
		}
	`
})
export class RouterDemoComponent {}
