import { MelodicComponent } from '../../../../src/components';
import { Service } from '../../../../src/injection/decorators/service.decorator';
import { RouterService } from '../../../../src/routing';
import { myAppTemplate } from './my-app.template';
import { myAppStyles } from './my-app.styles';
import type { IRoute } from '../../../../src/routing/interfaces/iroute.interface';

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
 * - Lazy loading (settings page)
 */
const routes: IRoute[] = [
	{ path: '', redirectTo: '/home' },
	{ path: 'home', component: 'home-page', name: 'home' },
	{ path: 'demos', component: 'demos-page', name: 'demos' },
	{ path: 'about', component: 'about-page', name: 'about' },
	{ path: 'contact', component: 'contact-page', name: 'contact' },
	{
		path: 'settings',
		component: 'settings-page',
		name: 'settings',
		loadComponent: () => import('../pages/settings/settings-page.component')
	},

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

	{ path: '404', component: 'not-found-page' }
];

@MelodicComponent({
	selector: 'my-app',
	template: myAppTemplate,
	styles: myAppStyles
})
export class MyAppComponent {
	@Service(RouterService) private _router!: RouterService;

	routes = routes;
	isLoggedIn: boolean = true;

	onCreate(): void {
		this.isLoggedIn = getAuthenticated();
	}

	toggleAuth(): void {
		this.isLoggedIn = !this.isLoggedIn;
		setAuthenticated(this.isLoggedIn);

		// If logging out while on admin page, redirect to home
		if (!this.isLoggedIn && window.location.pathname.startsWith('/admin')) {
			this._router.navigate('/home');
		}
	}
}
