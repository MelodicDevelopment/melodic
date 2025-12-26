import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from '../../src/template';
import { styleMap } from '../../src/template/directives/builtin/style-map.directive';


describe('template bindings', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
	});

	it('updates event listeners when handler changes', () => {
		let first = 0;
		let second = 0;

		const handlerOne = () => {
			first += 1;
		};
		const handlerTwo = () => {
			second += 1;
		};

		render(html`<button @click=${handlerOne}>Click</button>`, container);
		const button = container.querySelector('button') as HTMLButtonElement;
		button.click();
		expect(first).toBe(1);
		expect(second).toBe(0);

		render(html`<button @click=${handlerTwo}>Click</button>`, container);
		const buttonAgain = container.querySelector('button') as HTMLButtonElement;
		buttonAgain.click();
		expect(first).toBe(1);
		expect(second).toBe(1);
	});

	it('binds events after unquoted attributes', () => {
		let clicks = 0;
		const handler = () => {
			clicks += 1;
		};

		render(html`<button class=${'primary'} @click=${handler}>Hit</button>`, container);
		const button = container.querySelector('button') as HTMLButtonElement;
		button.click();
		expect(clicks).toBe(1);
		expect(button.className).toBe('primary');
	});

	it('binds and updates element properties', () => {
		render(html`<input .value=${'first'} />`, container);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.value).toBe('first');

		render(html`<input .value=${'second'} />`, container);
		expect(input.value).toBe('second');
	});

	it('applies and removes inline styles via styleMap', () => {
		render(
			html`<div style=${styleMap({ color: 'red', marginTop: '4px' })}></div>`,
			container
		);
		const element = container.querySelector('div') as HTMLDivElement;
		expect(element.style.color).toBe('red');
		expect(element.style.marginTop).toBe('4px');

		render(html`<div style=${styleMap({ color: 'blue' })}></div>`, container);
		expect(element.style.color).toBe('blue');
		expect(element.style.marginTop).toBe('');
	});
});
