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
		if (control.destroyed) return;
		adapter.setValue(element, val);
	};

	const syncDisabled = (disabled: boolean): void => {
		if (control.destroyed) return;
		adapter.setDisabled?.(element, disabled);
	};

	const syncClasses = (): void => {
		if (control.destroyed) return;
		element.classList.toggle('mf-valid', control.valid());
		element.classList.toggle('mf-invalid', control.invalid());
		element.classList.toggle('mf-dirty', control.dirty());
		element.classList.toggle('mf-pristine', control.pristine());
		element.classList.toggle('mf-touched', control.touched());
		element.classList.toggle('mf-pending', control.pending());
		element.classList.toggle('mf-disabled', control.disabled());
	};

	const syncError = (): void => {
		if (control.destroyed) return;
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

	/** Push the element's current value into the model. */
	const writeToModel = (onlyIfChanged: boolean = false): void => {
		if (control.destroyed) return;

		const next = adapter.getValue(element);

		// Deferred writes (blur / submit) fire whether or not the user typed
		// anything: tabbing through a field must not dirty it.
		if (onlyIfChanged && Object.is(next, control.value())) {
			return;
		}

		// User input dirties the control; setValue itself no longer auto-dirties.
		control.setValue(next);
		control.markAsDirty();
	};

	const handleInput = (event: Event): void => {
		const target = event.target as Element;
		if (target !== element && !element.contains(target)) {
			return;
		}

		// `updateOn` decides when the view writes to the model. Previously the
		// model was written on every keystroke regardless, so 'blur' and
		// 'submit' only changed when validation ran, not when the value moved.
		if (control.updateOn === 'change') {
			writeToModel();
		}
	};

	const handleBlur = (): void => {
		if (control.updateOn === 'blur') {
			writeToModel(true);
		}
		control.markAsTouched();
	};

	const handleSubmit = (): void => {
		if (control.updateOn === 'submit') {
			writeToModel(true);
			control.markAsTouched();
			void control.validate();
		}
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

	// `updateOn: 'submit'` needs the enclosing form; listening on the element
	// itself would never see the submit event (it targets the <form>).
	// The directive runs while the element is still in the detached template
	// clone, where `closest('form')` only sees a <form> from the same template.
	// Look again once the clone is in the document.
	let form: HTMLFormElement | null = null;
	let disposed = false;
	if (control.updateOn === 'submit') {
		form = element.closest('form');
		if (form) {
			form.addEventListener('submit', handleSubmit);
		} else {
			queueMicrotask(() => {
				if (disposed) {
					return;
				}
				form = element.closest('form');
				form?.addEventListener('submit', handleSubmit);
			});
		}
	}

	element.setAttribute('data-form-control', '');

	return () => {
		disposed = true;
		element.removeEventListener(adapter.inputEvent, handleInput);
		element.removeEventListener(adapter.blurEvent, handleBlur);
		form?.removeEventListener('submit', handleSubmit);
		element.removeAttribute('data-form-control');
		for (const fn of cleanupFns) fn();
	};
}

registerAttributeDirective('formControl', formControlDirective);

export { formControlDirective };
