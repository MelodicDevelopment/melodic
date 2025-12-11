import { MelodicComponent } from '../../../src/components/melodic-component.decorator';
import { html, css } from '../../../src/template/template';
import type { IRoute } from '../../../src/routing/interfaces/iroute.interface';

const routes: IRoute[] = [
	{ path: '', redirectTo: '/home' },
	{ path: 'home', component: 'home-page' },
	{ path: 'demos', component: 'directives-demo' },
	{ path: 'about', component: 'about-page' },
	{ path: 'contact', component: 'contact-page' },
	{
		path: 'settings',
		component: 'settings-page',
		loadComponent: () => import('./../../components/pages/settings/settings-page.component')
	},
	{ path: '404', component: 'not-found-page' }
];

@MelodicComponent({
	selector: 'my-app',
	template: (self: MyAppComponent) => html`
		<div class="app">
			<header class="header">
				<h1 class="logo">Melodic</h1>
				<nav class="nav">
					<router-link href="/home">Home</router-link>
					<router-link href="/demos">Demos</router-link>
					<router-link href="/about">About</router-link>
					<router-link href="/contact">Contact</router-link>
					<router-link href="/settings">Settings</router-link>
				</nav>
			</header>
			<main class="content">
				<router-outlet .routes=${routes}></router-outlet>
			</main>
			<footer class="footer">
				<p>Melodic Framework - A lightweight web component framework</p>
			</footer>
		</div>
	`,
	styles: () => css`
		:host {
			display: block;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		}

		.app {
			min-height: 100vh;
			display: flex;
			flex-direction: column;
		}

		.header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 1rem 2rem;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		}

		.logo {
			margin: 0;
			font-size: 1.5rem;
			font-weight: 700;
			letter-spacing: -0.5px;
		}

		.nav {
			display: flex;
			gap: 0.5rem;
		}

		router-link {
			color: rgba(255, 255, 255, 0.9);
			text-decoration: none;
			padding: 0.5rem 1rem;
			border-radius: 6px;
			cursor: pointer;
			transition: all 0.2s ease;
			font-weight: 500;
		}

		router-link:hover {
			background: rgba(255, 255, 255, 0.15);
			color: white;
		}

		.content {
			flex: 1;
			background: #f5f7fa;
		}

		.footer {
			padding: 1.5rem 2rem;
			background: #2d3748;
			color: rgba(255, 255, 255, 0.7);
			text-align: center;
		}

		.footer p {
			margin: 0;
			font-size: 0.875rem;
		}
	`
})
export class MyAppComponent {}
