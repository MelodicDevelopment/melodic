import { registerAttributeDirective } from '../../template/directives/functions/attribute-directive.functions';
import type { AttributeDirectiveCleanupFunction } from '../../template/directives/types/attribute-directive-cleanup-function.type';
import { getAdapter } from '../adapters/adapter-registry';
import { isSignal } from '../../signals/functions/is-signal.function';
import type { Signal } from '../../signals/types/signal.type';
import { devWarn } from '../../devtools/dev-mode';

/**
 * `:model` — two-way binding between a signal and a form control.
 *
 * ```typescript
 * name = signal('');
 *
 * html`<ml-input label="Name" :model=${this.name}></ml-input>`
 * ```
 *
 * This replaces the three-part dance every two-way binding needed:
 *
 * ```typescript
 * html`<ml-input .value=${this.name()} @ml:input=${(e: Event) =>
 *   this.name.set((e.target as HTMLInputElement).value)}></ml-input>`
 * ```
 *
 * The read and write go through the same adapter registry `:formControl`
 * uses, so it works with every `ml-*` control and with plain
 * `input`/`select`/`textarea` — including checkboxes and multi-selects, whose
 * value is not `element.value`.
 *
 * Use `:formControl` when you need validation, touched/dirty state or a form
 * group; `:model` is the lightweight option for a single value.
 */
function modelDirective(element: Element, value: unknown, _name: string): AttributeDirectiveCleanupFunction | void {
	void _name;

	if (!isSignal(value)) {
		devWarn('model-not-signal', ':model expects a signal — for example `:model=${this.name}` where `name = signal("")`. Received:', value);
		return;
	}

	const model = value as Signal<unknown>;
	const adapter = getAdapter(element);

	if (!adapter) {
		devWarn(`model-no-adapter:${element.tagName}`, `:model has no adapter registered for <${element.tagName.toLowerCase()}>, so it cannot read or write its value.`);
		return;
	}

	// Guard against the write-back loop: the element→signal write triggers the
	// signal→element subscriber, which would move the caret on every keystroke.
	let writingBack = false;

	const pushToElement = (next: unknown): void => {
		if (writingBack) {
			return;
		}
		adapter.setValue(element, next);
	};

	const handleInput = (event: Event): void => {
		const target = event.target as Element;
		if (target !== element && !element.contains(target)) {
			return;
		}

		writingBack = true;
		try {
			model.set(adapter.getValue(element));
		} finally {
			writingBack = false;
		}
	};

	pushToElement(model());
	const unsubscribe = model.subscribe(pushToElement);
	element.addEventListener(adapter.inputEvent, handleInput);

	return () => {
		unsubscribe();
		element.removeEventListener(adapter.inputEvent, handleInput);
	};
}

registerAttributeDirective('model', modelDirective);

export { modelDirective };
