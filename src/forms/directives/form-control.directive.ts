import { registerAttributeDirective } from '../../template/directives/functions/attribute-directive.functions';
import type { AttributeDirectiveCleanupFunction } from '../../template/directives/types/attribute-directive-cleanup-function.type';
import { AbstractControl } from '../classes/abstract-control.class';
import { getAdapter } from '../adapters/adapter-registry';

function formControlDirective(element: Element, value: unknown, _: string): AttributeDirectiveCleanupFunction | void {
	if (!(value instanceof AbstractControl)) {
		console.warn('formControl directive: value must be an AbstractControl');
		return;
	}

	const control = value;
	const adapter = getAdapter(element);

	if (!adapter) {
		console.warn(`formControl directive: no adapter registered for <${element.tagName.toLowerCase()}>`);
		return;
	}

	const cleanupFns: (() => void)[] = [];

	const syncElementValue = (val: unknown): void => {
		adapter.setValue(element, val);
	};

	const syncDisabled = (disabled: boolean): void => {
		adapter.setDisabled?.(element, disabled);
	};

	const syncClasses = (): void => {
		element.classList.toggle('mf-valid', control.valid());
		element.classList.toggle('mf-invalid', control.invalid());
		element.classList.toggle('mf-dirty', control.dirty());
		element.classList.toggle('mf-pristine', control.pristine());
		element.classList.toggle('mf-touched', control.touched());
		element.classList.toggle('mf-pending', control.pending());
		element.classList.toggle('mf-disabled', control.disabled());
	};

	const syncError = (): void => {
		if (!control.touched() || !control.errors()) {
			element.removeAttribute('error');
			return;
		}

		const message = control.getFirstErrorMessage();
		if (message) {
			element.setAttribute('error', message);
		} else {
			element.removeAttribute('error');
		}
	};

	const handleInput = (event: Event): void => {
		const target = event.target as Element;
		if (target === element || element.contains(target)) {
			control.setValue(adapter.getValue(element));
		}
	};

	const handleBlur = (): void => {
		control.markAsTouched();
	};

	syncElementValue(control.value());
	syncDisabled(control.disabled());
	syncClasses();
	syncError();

	cleanupFns.push(control.value.subscribe((v) => syncElementValue(v)));
	cleanupFns.push(control.disabled.subscribe((d) => syncDisabled(d)));
	cleanupFns.push(control.state.subscribe(() => syncClasses()));
	cleanupFns.push(control.state.subscribe(() => syncError()));

	element.addEventListener(adapter.inputEvent, handleInput);
	element.addEventListener(adapter.blurEvent, handleBlur);

	element.setAttribute('data-form-control', '');

	return () => {
		element.removeEventListener(adapter.inputEvent, handleInput);
		element.removeEventListener(adapter.blurEvent, handleBlur);
		element.removeAttribute('data-form-control');
		for (const fn of cleanupFns) fn();
	};
}

registerAttributeDirective('formControl', formControlDirective);

export { formControlDirective };
