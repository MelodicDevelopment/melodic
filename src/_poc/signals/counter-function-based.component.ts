/**
 * Example Counter Component using Function-Based Signals
 * Demonstrates cleaner template syntax with count() instead of count.value
 */

import { MelodicComponent } from '../../components/melodic-component.decorator';
import { signal, computed } from './signal-function-based.class';
import { counterFunctionTemplate } from './counter-function-based.template';
import type { IElementRef } from '../../components/interfaces/ielement-ref.interface';

@MelodicComponent({
	selector: 'signal-counter-function',
	template: counterFunctionTemplate
})
export class CounterFunctionComponent implements IElementRef {
	elementRef!: HTMLElement;

	// Simple signals - call them like functions to read
	count = signal(0);
	message = signal('Click to increment');

	// Computed signals - automatically update when dependencies change
	doubled = computed(() => this.count() * 2);
	tripled = computed(() => this.count() * 3);
	isEven = computed(() => this.count() % 2 === 0);
	isPositive = computed(() => this.count() > 0);

	// Computed that depends on multiple signals
	displayText = computed(() => {
		const val = this.count();
		const evenOdd = this.isEven() ? 'even' : 'odd';
		return `Count is ${val} (${evenOdd})`;
	});

	// Regular property (still works!)
	clicks = 0;

	increment = () => {
		this.count.update((v) => v + 1);
		this.clicks++; // Regular property triggers re-render
	};

	decrement = () => {
		this.count.update((v) => v - 1);
		this.clicks++;
	};

	reset = () => {
		this.count.set(0);
		this.clicks = 0;
	};

	// Using update method with more complex logic
	incrementByFive = () => {
		this.count.update((current) => current + 5);
		this.clicks++;
	};

	// Update message signal
	updateMessage = (e: Event) => {
		this.message.set((e.target as HTMLInputElement).value);
	};
}
