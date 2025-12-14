import { MelodicComponent } from '../../../src/components/melodic-component.decorator';
import { Service } from '../../../src/injection/decorators/service.decorator';
import { html, css } from '../../../src/template/template-result.class';
import { RouterService } from '../../../src/routing';
import type { IRoute } from '../../../src/routing';

// Import guards and resolvers
import { authGuard, adminGuard, setAuthenticated, getAuthenticated } from '../../routing/auth.guard';
import { dashboardStatsResolver, usersResolver, userResolver } from '../../routing/user.resolver';

/**
 * Route configuration demonstrating:
 * - Basic routes with redirects
 * - Nested routes (admin section)
 * - Route guards (canActivate)
 * - Route resolvers (data fetching before navigation)
 * - Route data (static metadata)
 * - Named routes
 */
const routes: IRoute[] = [
	// Redirect root to home
	{ path: '', redirectTo: '/home' },

	// Basic pages
	{ path: 'home', component: 'home-page', name: 'home' },
	{ path: 'demos', component: 'demos-page', name: 'demos' },
	{ path: 'about', component: 'about-page', name: 'about' },
	{ path: 'contact', component: 'contact-page', name: 'contact' },

	// Admin section with nested routes, guards, and resolvers
	{
		path: 'admin',
		component: 'admin-layout',
		name: 'admin',
		canActivate: [authGuard, adminGuard],
		data: { section: 'admin', requiresAuth: true },
		children: [
			// Redirect /admin to /admin/dashboard
			{ path: '', redirectTo: 'dashboard' },

			// Dashboard with resolver
			{
				path: 'dashboard',
				component: 'admin-dashboard',
				name: 'admin.dashboard',
				resolve: {
					stats: dashboardStatsResolver
				},
				data: { title: 'Dashboard' }
			},

			// Users list with resolver
			{
				path: 'users',
				component: 'admin-users',
				name: 'admin.users',
				resolve: {
					users: usersResolver
				},
				data: { title: 'Users' }
			},

			// User detail with param and resolver
			{
				path: 'users/:userId',
				component: 'admin-user-detail',
				name: 'admin.user-detail',
				resolve: {
					user: userResolver
				},
				data: { title: 'User Detail' }
			}
		]
	},

	// 404 page
	{ path: '404', component: 'not-found-page' }
];

@MelodicComponent({
	selector: 'router-demo',
	template: (self: RouterDemoComponent) => html`
		<div class="app">
			<nav class="nav">
				<div class="nav-links">
					<router-link href="/home" .exactMatch=${true}>Home</router-link>
					<router-link href="/demos">Demos</router-link>
					<router-link href="/about">About</router-link>
					<router-link href="/contact">Contact</router-link>
					<router-link href="/admin">Admin</router-link>
				</div>
				<div class="nav-controls">
					<button class="auth-btn ${self.isLoggedIn ? 'logged-in' : ''}" @click=${() => self.toggleAuth()}>
						${self.isLoggedIn ? 'Logout' : 'Login'}
					</button>
				</div>
			</nav>
			<main class="content">
				<router-outlet .routes=${routes}></router-outlet>
			</main>
			<footer class="footer">
				<div class="footer-info">
					<strong>Routing Demo Features:</strong>
					Guards, Resolvers, Nested Routes, Route Params, Active Links
				</div>
			</footer>
		</div>
	`,
	styles: () => css`
		.app {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			max-width: 900px;
			margin: 0 auto;
		}
		.nav {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 1rem;
			background: #333;
			border-radius: 8px 8px 0 0;
		}
		.nav-links {
			display: flex;
			gap: 0.5rem;
		}
		.nav-controls {
			display: flex;
			gap: 0.5rem;
		}
		router-link {
			color: rgba(255, 255, 255, 0.8);
			text-decoration: none;
			padding: 0.5rem 1rem;
			border-radius: 4px;
			cursor: pointer;
			transition: all 0.2s;
		}
		router-link:hover {
			background: rgba(255, 255, 255, 0.1);
			color: white;
		}
		router-link.active {
			background: #3498db;
			color: white;
		}
		.auth-btn {
			padding: 0.5rem 1rem;
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-size: 0.9rem;
			transition: all 0.2s;
			background: #e74c3c;
			color: white;
		}
		.auth-btn.logged-in {
			background: #27ae60;
		}
		.auth-btn:hover {
			opacity: 0.9;
		}
		.content {
			background: white;
			border: 1px solid #ddd;
			border-top: none;
			min-height: 400px;
		}
		.footer {
			background: #f8f9fa;
			border: 1px solid #ddd;
			border-top: none;
			border-radius: 0 0 8px 8px;
			padding: 1rem;
			text-align: center;
		}
		.footer-info {
			color: #7f8c8d;
			font-size: 0.85rem;
		}
		.footer-info strong {
			color: #2c3e50;
		}
	`
})
export class RouterDemoComponent {
	@Service(RouterService) private router!: RouterService;

	isLoggedIn: boolean = true;

	onCreate(): void {
		this.isLoggedIn = getAuthenticated();
	}

	toggleAuth(): void {
		this.isLoggedIn = !this.isLoggedIn;
		setAuthenticated(this.isLoggedIn);

		// If logging out while on admin page, redirect to home
		if (!this.isLoggedIn && window.location.pathname.startsWith('/admin')) {
			this.router.navigate('/home');
		}
	}
}
