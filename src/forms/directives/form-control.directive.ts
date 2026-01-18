import { registerAttributeDirective } from '../../template/directives/functions/attribute-directive.functions';
import type { AttributeDirectiveCleanupFunction } from '../../template/directives/types/attribute-directive-cleanup-function.type';
import type { IFormControl } from '../types/form-control.types';
import { FORM_CONTROL_MARKER } from '../classes/form-control.class';

/**
 * Check if value is a FormControl
 */
function isFormControl(value: unknown): value is IFormControl {
	return value !== null && typeof value === 'object' && FORM_CONTROL_MARKER in value;
}

/**
 * Get input type for different form elements
 */
function getInputType(element: Element): 'text' | 'checkbox' | 'radio' | 'select' | 'textarea' {
	const tagName = element.tagName.toLowerCase();

	if (tagName === 'select') return 'select';
	if (tagName === 'textarea') return 'textarea';

	if (tagName === 'input') {
		const type = (element as HTMLInputElement).type.toLowerCase();
		if (type === 'checkbox') return 'checkbox';
		if (type === 'radio') return 'radio';
	}

	return 'text';
}

/**
 * formControl directive - Binds a FormControl to an input element
 *
 * Usage:
 * ```html
 * <input type="text" :formControl=${this.nameControl} />
 * <input type="checkbox" :formControl=${this.acceptedControl} />
 * <select :formControl=${this.countryControl}>...</select>
 * <textarea :formControl=${this.bioControl}></textarea>
 * ```
 */
function formControlDirective(element: Element, value: unknown, _: string): AttributeDirectiveCleanupFunction | void {
	if (!isFormControl(value)) {
		console.warn('formControl directive: value must be a FormControl');
		return;
	}

	const control = value as IFormControl<unknown>;
	const inputType = getInputType(element);

	// Cleanup functions storage
	const cleanupFns: (() => void)[] = [];

	// Set element value based on input type
	const setElementValue = (val: unknown): void => {
		if (inputType === 'checkbox') {
			(element as HTMLInputElement).checked = Boolean(val);
		} else if (inputType === 'radio') {
			(element as HTMLInputElement).checked = (element as HTMLInputElement).value === val;
		} else {
			(element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value =
				val !== null && val !== undefined ? String(val) : '';
		}
	};

	// Set element disabled state
	const setElementDisabled = (disabled: boolean): void => {
		if (disabled) {
			element.setAttribute('disabled', '');
		} else {
			element.removeAttribute('disabled');
		}
	};

	// Update validation CSS classes
	const updateValidationClasses = (): void => {
		element.classList.toggle('mf-valid', control.valid());
		element.classList.toggle('mf-invalid', control.invalid());
		element.classList.toggle('mf-dirty', control.dirty());
		element.classList.toggle('mf-pristine', control.pristine());
		element.classList.toggle('mf-touched', control.touched());
		element.classList.toggle('mf-pending', control.pending());
		element.classList.toggle('mf-disabled', control.disabled());
	};

	// Input event handler
	const handleInput = (e: Event): void => {
		const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

		if (inputType === 'checkbox') {
			control.setValue((target as HTMLInputElement).checked);
		} else if (inputType === 'radio') {
			if ((target as HTMLInputElement).checked) {
				control.setValue(target.value);
			}
		} else {
			control.setValue(target.value);
		}
	};

	// Blur event handler
	const handleBlur = (): void => {
		control.markAsTouched();
	};

	// Set initial value
	setElementValue(control.value());

	// Subscribe to value changes
	const unsubscribeValue = control.value.subscribe((newValue) => {
		setElementValue(newValue);
	});
	cleanupFns.push(unsubscribeValue);

	// Set initial disabled state
	setElementDisabled(control.disabled());

	// Subscribe to disabled state
	const unsubscribeDisabled = control.disabled.subscribe((disabled) => {
		setElementDisabled(disabled);
	});
	cleanupFns.push(unsubscribeDisabled);

	// Subscribe to state for CSS classes
	const unsubscribeState = control.state.subscribe(() => {
		updateValidationClasses();
	});
	cleanupFns.push(unsubscribeState);

	// Initial CSS classes
	updateValidationClasses();

	// Add event listeners
	const eventType = control.updateOn === 'blur' ? 'change' : 'input';
	element.addEventListener(eventType, handleInput);
	element.addEventListener('blur', handleBlur);

	// Mark as form control element
	element.setAttribute('data-form-control', '');

	// Return cleanup function
	return () => {
		element.removeEventListener(eventType, handleInput);
		element.removeEventListener('blur', handleBlur);
		element.removeAttribute('data-form-control');
		cleanupFns.forEach((fn) => fn());
	};
}

// Auto-register the directive
registerAttributeDirective('formControl', formControlDirective);

export { formControlDirective };
