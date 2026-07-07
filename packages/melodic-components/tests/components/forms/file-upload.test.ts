import { describe, it, expect, afterEach } from 'vitest';
import { html, render } from '@melodicdev/core';
import { createFormControl, getAdapter } from '@melodicdev/core/forms';
import '../../../src/components/forms/file-upload/file-upload.component';
import '../../../src/components/forms/file-upload/file-upload-item.component';
import { flush, createComponent, removeComponent } from '../../helpers/component-test-utils';

function makeFile(name: string): File {
	return new File(['content'], name, { type: 'text/plain' });
}

async function settle(): Promise<void> {
	await flush();
	await new Promise((r) => setTimeout(r, 0));
	await flush();
}

describe('ml-file-upload-item dismissal events', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
		el = null;
	});

	it('emits ml:dismiss AND the deprecated ml:remove with the same detail', async () => {
		el = createComponent('ml-file-upload-item', { attributes: { name: 'report.pdf' } });
		await flush();

		const received: Array<{ type: string; detail: any }> = [];
		el.addEventListener('ml:dismiss', (e: CustomEvent) => received.push({ type: 'ml:dismiss', detail: e.detail }));
		el.addEventListener('ml:remove', (e: CustomEvent) => received.push({ type: 'ml:remove', detail: e.detail }));

		el.component.handleRemove();

		expect(received.map((r) => r.type)).toEqual(['ml:dismiss', 'ml:remove']);
		expect(received[0].detail).toEqual({ name: 'report.pdf', file: null });
		expect(received[1].detail).toEqual(received[0].detail);
	});
});

describe('ml-file-upload file selection state', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
		el = null;
	});

	it('tracks the selected file (single mode replaces)', async () => {
		el = createComponent('ml-file-upload');
		await flush();

		const first = makeFile('a.txt');
		const second = makeFile('b.txt');

		el.component.processFiles([first]);
		expect(el.files).toEqual([first]);

		el.component.processFiles([second]);
		expect(el.files).toEqual([second]);
	});

	it('accumulates files in multiple mode and removeFile removes one', async () => {
		el = createComponent('ml-file-upload', { attributes: { multiple: '' } });
		await flush();

		const first = makeFile('a.txt');
		const second = makeFile('b.txt');

		el.component.processFiles([first]);
		el.component.processFiles([second]);
		expect(el.files).toEqual([first, second]);

		el.component.removeFile(first);
		expect(el.files).toEqual([second]);
	});

	it('emits ml:change when files are removed via removeFile', async () => {
		el = createComponent('ml-file-upload', { attributes: { multiple: '' } });
		await flush();

		const file = makeFile('a.txt');
		el.component.processFiles([file]);

		let detail: any = null;
		el.addEventListener('ml:change', (e: CustomEvent) => (detail = e.detail));
		el.component.removeFile(file);

		expect(detail).toEqual({ files: [] });
	});
});

describe('ml-file-upload :formControl binding', () => {
	let container: HTMLElement;

	afterEach(() => {
		container?.remove();
	});

	it('registers a forms adapter for ML-FILE-UPLOAD', () => {
		const el = document.createElement('ml-file-upload');
		expect(getAdapter(el)).toBeDefined();
	});

	it('updates the bound FormControl when files are selected (end-to-end)', async () => {
		const control = createFormControl<File[]>([]);

		container = document.createElement('div');
		document.body.appendChild(container);
		render(html`<ml-file-upload multiple :formControl=${control}></ml-file-upload>`, container);
		await settle();

		const el = container.querySelector('ml-file-upload') as any;
		expect(el).not.toBeNull();

		const file = makeFile('bound.txt');
		el.component.processFiles([file]);
		await settle();

		expect(control.value()).toEqual([file]);
		expect(control.dirty()).toBe(true);
	});

	it('single mode reports File | null and control.setValue resets the element', async () => {
		const control = createFormControl<File | null>(null);

		container = document.createElement('div');
		document.body.appendChild(container);
		render(html`<ml-file-upload :formControl=${control}></ml-file-upload>`, container);
		await settle();

		const el = container.querySelector('ml-file-upload') as any;
		const file = makeFile('single.txt');
		el.component.processFiles([file]);
		await settle();

		expect(control.value()).toBe(file);

		control.setValue(null);
		await settle();
		expect(el.files).toEqual([]);
	});

	it('propagates control disabled state to the element', async () => {
		const control = createFormControl<File[]>([]);

		container = document.createElement('div');
		document.body.appendChild(container);
		render(html`<ml-file-upload multiple :formControl=${control}></ml-file-upload>`, container);
		await settle();

		const el = container.querySelector('ml-file-upload') as any;
		control.disable();
		await settle();

		expect(el.disabled).toBe(true);
	});
});
