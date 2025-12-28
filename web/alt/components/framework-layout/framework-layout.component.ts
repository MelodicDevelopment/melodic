import { MelodicComponent } from '../../../../src/components';
import type { IRoute } from '../../../../src/routing/interfaces/iroute.interface';
import { frameworkLayoutTemplate } from './framework-layout.template';
import { frameworkLayoutStyles } from './framework-layout.styles';

@MelodicComponent({
	selector: 'alt-framework-layout',
	template: frameworkLayoutTemplate,
	styles: frameworkLayoutStyles
})
export class AltFrameworkLayoutComponent {
	basePath = '/framework';
}
