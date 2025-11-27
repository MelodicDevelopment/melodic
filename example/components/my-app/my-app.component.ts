import { MelodicComponent } from '../../../src/components/melodic-component.decorator';

@MelodicComponent({
	selector: 'my-app',
	template: () => `<div>Hello, MyApp Component!</div>`,
	styles: () => ``
})
export class MyApp {
	constructor(test: string) {
		console.log(`MyApp component created with test: ${test}.`);
	}
}
