import { MelodicComponent } from '../../../src/components/melodic-component.decorator';
import { html, css } from '../../../src/template/template';

@MelodicComponent({
	selector: 'demos-page',
	template: () => html`<directives-demo></directives-demo>`,
	styles: () => css``
})
export class DemosPageComponent {}
