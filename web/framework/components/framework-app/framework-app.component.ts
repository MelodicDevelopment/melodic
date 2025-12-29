import { MelodicComponent } from '../../../../src/components';
import { frameworkAppTemplate } from './framework-app.template';
import { frameworkAppStyles } from './framework-app.styles';
import type { IRoute } from '../../../../src/routing';

const routes: IRoute[] = [
	{ path: '', redirectTo: '/home' },
	{ path: 'home', component: 'framework-home' },
	{ path: 'docs', component: 'framework-docs' },
	{ path: 'tutorials', component: 'framework-tutorials' },
	{ path: 'download', component: 'framework-download' },
	{ path: 'roadmap', component: 'framework-roadmap' },
	{ path: 'community', component: 'framework-community' },
	{ path: 'blog', component: 'framework-blog' },
	{ path: '404', component: 'framework-not-found' }
];

@MelodicComponent({
	selector: 'framework-app',
	template: frameworkAppTemplate,
	styles: frameworkAppStyles
})
export class FrameworkAppComponent {
	routes = routes;
}
