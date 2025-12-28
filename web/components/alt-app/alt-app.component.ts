import { MelodicComponent } from '../../../src/components';
import type { IRoute } from '../../../src/routing/interfaces/iroute.interface';
import { altAppTemplate } from './alt-app.template';
import { altAppStyles } from './alt-app.styles';

const routes: IRoute[] = [
	{ path: '', redirectTo: '/home' },
	{ path: 'home', component: 'alt-home' },
	{ path: 'services', component: 'alt-services' },
	{ path: 'work', component: 'alt-work' },
	{ path: 'projects', component: 'alt-projects' },
	{ path: 'blog', component: 'alt-blog' },
	{ path: 'about', component: 'alt-about' },
	{ path: 'contact', component: 'alt-contact' },
	{
		path: 'framework',
		component: 'alt-framework-layout',
		redirectTo: '/framework/home',
		children: [
			{ path: 'home', component: 'alt-framework-home' },
			{ path: 'docs', component: 'alt-framework-docs' },
			{ path: 'tutorials', component: 'alt-framework-tutorials' },
			{ path: 'download', component: 'alt-framework-download' },
			{ path: 'roadmap', component: 'alt-framework-roadmap' },
			{ path: 'community', component: 'alt-framework-community' },
			{ path: 'blog', component: 'alt-framework-blog' },
			{ path: '404', component: 'alt-framework-not-found' }
		]
	},
	{ path: '404', component: 'alt-not-found' }
];

@MelodicComponent({
	selector: 'alt-app',
	template: altAppTemplate,
	styles: altAppStyles
})
export class AltAppComponent {
	routes = routes;
}
