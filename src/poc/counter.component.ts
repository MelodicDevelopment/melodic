/**
 * Example Counter Component using Signals
 * This demonstrates how signals work with the Melodic framework
 */

import { MelodicComponent } from '../components/melodic-component.decorator';
import { signal, computed } from './signal.class';
import { counterTemplate } from './counter.template';
import type { IElementRef } from '../components/interfaces/ielement-ref.interface';

@MelodicComponent({
	selector: 'signal-counter',
	template: counterTemplate
})
export class CounterComponent implements IElementRef {
	elementRef!: HTMLElement;

	// Simple signals
	count = signal(0);
	message = signal('Click to increment');

	// Computed signals (auto-update when dependencies change)
	doubled = computed(() => this.count.value * 2);
	tripled = computed(() => this.count.value * 3);
	isEven = computed(() => this.count.value % 2 === 0);
	isPositive = computed(() => this.count.value > 0);

	// Computed that depends on multiple signals
	displayText = computed(() => {
		const val = this.count.value;
		const evenOdd = this.isEven.value ? 'even' : 'odd';
		return `Count is ${val} (${evenOdd})`;
	});

	// Regular property (still works!)
	clicks = 0;

	increment = () => {
		this.count.value++;
		this.clicks++; // Regular property triggers re-render
	};

	decrement = () => {
		this.count.value--;
		this.clicks++;
	};

	reset = () => {
		this.count.value = 0;
		this.clicks = 0;
	};

	// Using update method
	incrementByFive = () => {
		this.count.update((current) => current + 5);
		this.clicks++;
	};

	// Update message signal
	updateMessage = (e: Event) => {
		this.message.value = (e.target as HTMLInputElement).value;
	};
}
