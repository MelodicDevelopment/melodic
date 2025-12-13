import { MelodicComponent } from '../../../src/components/melodic-component.decorator';
import { myAppTemplate } from './my-app.template';
import { myAppStyles } from './my-app.styles';
import type { IRoute } from '../../../src/routing/interfaces/iroute.interface';

const routes: IRoute[] = [
	{ path: '', redirectTo: '/home' },
	{ path: 'home', component: 'home-page' },
	{ path: 'demos', component: 'demos-page' },
	{ path: 'about', component: 'about-page' },
	{ path: 'contact', component: 'contact-page' },
	{
		path: 'settings',
		component: 'settings-page',
		loadComponent: () => import('../pages/settings/settings-page.component')
	},
	{ path: '404', component: 'not-found-page' }
];

@MelodicComponent({
	selector: 'my-app',
	template: myAppTemplate,
	styles: myAppStyles
})
export class MyAppComponent {
	routes = routes;
}
