import { MelodicComponent } from '../../../../src/components';
import { frameworkLayoutTemplate } from './framework-layout.template';
import { frameworkLayoutStyles } from './framework-layout.styles';

@MelodicComponent({
	selector: 'framework-layout',
	template: frameworkLayoutTemplate,
	styles: frameworkLayoutStyles
})
export class FrameworkLayoutComponent {
	basePath = '/framework';
}
