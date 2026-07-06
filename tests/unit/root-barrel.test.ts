import { describe, it, expect } from 'vitest';
import * as root from '../../src';
import * as forms from '../../src/forms';

describe('root barrel (@melodicdev/core)', () => {
	it('re-exports the forms module', () => {
		expect(root.createFormControl).toBeTypeOf('function');
		expect(root.createFormGroup).toBeTypeOf('function');
		expect(root.createFormArray).toBeTypeOf('function');
		expect(root.Validators).toBeDefined();
		expect(root.FormControl).toBeTypeOf('function');
		expect(root.FormGroup).toBeTypeOf('function');
		expect(root.FormArray).toBeTypeOf('function');
		expect(root.AbstractControl).toBeTypeOf('function');
	});

	it('has no star-export collisions that silently drop forms symbols', () => {
		// `export *` does not error on ambiguity — colliding names are silently
		// OMITTED from the barrel. Assert every runtime export of the forms
		// module survives on the root barrel and is the same binding.
		for (const [name, value] of Object.entries(forms)) {
			expect(root, `forms export '${name}' missing from root barrel`).toHaveProperty(name);
			expect((root as Record<string, unknown>)[name], `forms export '${name}' shadowed on root barrel`).toBe(value);
		}
	});

	it('still exposes the other modules', () => {
		expect(root.signal).toBeTypeOf('function');
		expect(root.computed).toBeTypeOf('function');
		expect(root.html).toBeTypeOf('function');
		expect(root.HttpClient).toBeTypeOf('function');
		expect(root.defineConfig).toBeTypeOf('function');
	});
});
