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
	{ path: 'about', component: 'company-about' },
	{ path: 'testimonials', component: 'company-testimonials' },
	{ path: 'contact', component: 'company-contact' },
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
