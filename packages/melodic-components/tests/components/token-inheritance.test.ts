import { describe, it, expect, afterEach } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import '../../src/components/forms/button/button.component';
import { flush } from '../helpers/component-test-utils';

/**
 * Component tokens used to be declared on the component's own `:host`
 * (`:host { --ml-button-font-weight: var(--ml-font-semibold) }`). A
 * declaration on the element beats any inherited value, so a wrapper element
 * that set `--ml-button-font-weight` on ITS `:host` had no effect — only a
 * rule targeting the element itself (`ml-button { … }`) worked. Rules now read
 * each token with its default as the `var()` fallback, so both paths work.
 */
describe('component tokens inherit from an ancestor', () => {
	const mounted: HTMLElement[] = [];
	let defined = false;

	function mountWrapper(hostCss: string, inner: string): HTMLElement {
		if (!defined) {
			customElements.define(
				'token-wrapper',
				class extends HTMLElement {
					constructor() {
						super();
						this.attachShadow({ mode: 'open' });
					}
				}
			);
			defined = true;
		}
		const wrapper = document.createElement('token-wrapper');
		wrapper.shadowRoot!.innerHTML = `<style>${hostCss}</style>${inner}`;
		document.body.appendChild(wrapper);
		mounted.push(wrapper);
		return wrapper;
	}

	function innerButton(wrapper: HTMLElement, id: string): Element {
		return wrapper.shadowRoot!.querySelector(`#${id}`)!.shadowRoot!.querySelector('.ml-button')!;
	}

	afterEach(() => {
		for (const el of mounted.splice(0)) {
			el.remove();
		}
		document.head.querySelector('style[data-token-test]')?.remove();
	});

	it('a token set on a wrapper’s :host changes the rendered button weight', async () => {
		const tokens = document.createElement('style');
		tokens.setAttribute('data-token-test', '');
		tokens.textContent = ':root { --ml-font-semibold: 600; }';
		document.head.appendChild(tokens);

		const wrapper = mountWrapper(
			':host { --ml-button-font-weight: 400; } ml-button.thin { --ml-button-font-weight: 300; }',
			'<ml-button id="inherited">Save</ml-button><ml-button id="targeted" class="thin">Cancel</ml-button>'
		);
		await flush();
		await flush();

		// Token-inheritance path: the wrapper's :host value reaches the button.
		expect(getComputedStyle(innerButton(wrapper, 'inherited')).fontWeight).toBe('400');
		// Element-selector path still wins over the inherited value.
		expect(getComputedStyle(innerButton(wrapper, 'targeted')).fontWeight).toBe('300');
	});

	it('an unset token falls back to the component default', async () => {
		const tokens = document.createElement('style');
		tokens.setAttribute('data-token-test', '');
		tokens.textContent = ':root { --ml-font-semibold: 600; }';
		document.head.appendChild(tokens);

		const wrapper = mountWrapper('', '<ml-button id="plain">Save</ml-button>');
		await flush();
		await flush();

		expect(getComputedStyle(innerButton(wrapper, 'plain')).fontWeight).toBe('600');
	});
});

/**
 * Guards the convention for every component: a token that a rule reads must
 * not also be declared on the plain `:host` block, or the declaration shadows
 * inherited values again. Tokens only JavaScript reads (drawer timing, the
 * app-shell breakpoint) are allowed to stay on `:host`.
 */
describe('no component declares a rule-read token on its own :host', () => {
	const root = join(__dirname, '../../src/components');

	function styleFiles(dir: string): string[] {
		return readdirSync(dir).flatMap((name) => {
			const full = join(dir, name);
			if (statSync(full).isDirectory()) {
				return styleFiles(full);
			}
			return name.endsWith('.styles.ts') ? [full] : [];
		});
	}

	function hostBlock(source: string): string | null {
		const open = source.match(/^\t:host\s*\{/m);
		if (!open || open.index === undefined) {
			return null;
		}
		let depth = 1;
		let i = open.index + open[0].length;
		while (depth > 0 && i < source.length) {
			if (source[i] === '{') {
				depth++;
			} else if (source[i] === '}') {
				depth--;
			}
			i++;
		}
		return source.slice(open.index + open[0].length, i - 1);
	}

	it('every rule-read token is read with a fallback, not declared on :host', () => {
		const offenders: string[] = [];

		for (const file of styleFiles(root)) {
			const source = readFileSync(file, 'utf-8');
			const block = hostBlock(source);
			if (!block) {
				continue;
			}
			const declared = [...block.matchAll(/(--ml-[\w-]+)\s*:/g)].map((m) => m[1]);
			for (const token of declared) {
				const bareRead = new RegExp(`var\\(${token}\\)`);
				if (bareRead.test(source)) {
					offenders.push(`${relative(root, file)}: ${token}`);
				}
			}
		}

		expect(offenders).toEqual([]);
	});
});
