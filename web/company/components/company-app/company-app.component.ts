import { MelodicComponent } from '../../../../src/components';
import type { IRoute } from '../../../../src/routing/interfaces/iroute.interface';
import { companyAppTemplate } from './company-app.template';
import { companyAppStyles } from './company-app.styles';

const routes: IRoute[] = [
	{ path: '', redirectTo: '/home' },
	{ path: 'home', component: 'company-home' },
	{ path: 'services', component: 'company-services' },
	{ path: 'work', component: 'company-work' },
	{ path: 'projects', component: 'company-projects' },
	{ path: 'blog', component: 'company-blog' },
	{ path: 'about', component: 'company-about' },
	{ path: 'contact', component: 'company-contact' },
	{
		path: 'framework',
		component: 'framework-layout',
		redirectTo: '/framework/home',
		children: [
			{ path: 'home', component: 'framework-home' },
			{ path: 'docs', component: 'framework-docs' },
			{ path: 'tutorials', component: 'framework-tutorials' },
			{ path: 'download', component: 'framework-download' },
			{ path: 'roadmap', component: 'framework-roadmap' },
			{ path: 'community', component: 'framework-community' },
			{ path: 'blog', component: 'framework-blog' },
			{ path: '404', component: 'framework-not-found' }
		]
	},
	{ path: '404', component: 'company-not-found' }
];

@MelodicComponent({
	selector: 'company-app',
	template: companyAppTemplate,
	styles: companyAppStyles
})
export class CompanyAppComponent {
	routes = routes;
}
