import type { FormControlAdapter } from '../types/adapter.types';
import { registerAdapter } from './adapter-registry';

export const textAdapter: FormControlAdapter<string> = {
	inputEvent: 'input',
	blurEvent: 'focusout',
	getValue(element: Element): string {
		return (element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value ?? '';
	},
	setValue(element: Element, value: string): void {
		(element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value =
			value !== null && value !== undefined ? String(value) : '';
	},
	setDisabled(element: Element, disabled: boolean): void {
		if (disabled) element.setAttribute('disabled', '');
		else element.removeAttribute('disabled');
	}
};

export const checkboxAdapter: FormControlAdapter<boolean> = {
	inputEvent: 'change',
	blurEvent: 'focusout',
	getValue(element: Element): boolean {
		return (element as HTMLInputElement).checked;
	},
	setValue(element: Element, value: boolean): void {
		(element as HTMLInputElement).checked = Boolean(value);
	},
	setDisabled(element: Element, disabled: boolean): void {
		if (disabled) element.setAttribute('disabled', '');
		else element.removeAttribute('disabled');
	}
};

export const radioAdapter: FormControlAdapter<string> = {
	inputEvent: 'change',
	blurEvent: 'focusout',
	getValue(element: Element): string {
		const input = element as HTMLInputElement;
		return input.checked ? input.value : '';
	},
	setValue(element: Element, value: string): void {
		const input = element as HTMLInputElement;
		input.checked = input.value === value;
	},
	setDisabled(element: Element, disabled: boolean): void {
		if (disabled) element.setAttribute('disabled', '');
		else element.removeAttribute('disabled');
	}
};

export function registerNativeAdapters(): void {
	// Register from least-specific to most-specific. registerAdapter unshifts,
	// so the most recently registered (most specific) is checked first.
	registerAdapter(
		(el) => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT',
		textAdapter
	);
	registerAdapter(
		(el) => el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'radio',
		radioAdapter
	);
	registerAdapter(
		(el) => el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'checkbox',
		checkboxAdapter
	);
}

registerNativeAdapters();
