# Forms

Melodic forms are signal-based, reactive form controls. The system is built around a single `AbstractControl` base with three concrete classes (`FormControl`, `FormGroup`, `FormArray`), an adapter system for binding to any form-bearing element, and a message-resolution pipeline that decouples validators from display strings.

## Table of Contents

- [Overview](#overview)
- [AbstractControl](#abstractcontrol)
- [FormControl](#formcontrol)
- [FormGroup](#formgroup)
- [FormArray](#formarray)
- [Validators](#validators)
- [Messages](#messages)
- [The :formControl directive](#the-formcontrol-directive)
- [Adapter system](#adapter-system)
- [Putting it together](#putting-it-together)

## Overview

Importing `@melodicdev/core/forms` registers the `:formControl` directive and built-in adapters automatically.

```typescript
import { createFormControl, createFormGroup, Validators } from '@melodicdev/core/forms';

const form = createFormGroup({
    name: createFormControl('', { validators: [Validators.required] }),
    email: createFormControl('', { validators: [Validators.email] })
});
```

A component that holds an `AbstractControl` (FormControl, FormGroup, FormArray) as a property is **automatically subscribed** to its `state` signal — no manual `SignalEffect` wiring required. When any part of the form changes (value, dirty, touched, errors, child controls), the component re-renders.

## AbstractControl

All control types extend `AbstractControl<T>`. It exposes:

| Signal | Type | Notes |
|--------|------|-------|
| `value` | `Signal<T>` | Current value |
| `errors` | `Signal<ValidationErrors \| null>` | Sync + async validation errors at this level |
| `dirty`, `touched`, `pristine`, `untouched` | `Signal<boolean>` | Aggregated from children for groups/arrays |
| `valid`, `invalid`, `pending` | `Signal<boolean>` | `invalid` is true if this control's errors are non-null OR any child is invalid |
| `disabled`, `enabled` | `Signal<boolean>` | |
| `state` | `Signal<ControlState>` | Composite of all the above — recommended subscription point |

Common methods: `setValue`, `patchValue`, `reset`, `markAsTouched`, `markAsUntouched`, `markAsDirty`, `markAsPristine`, `markAllAsTouched`, `markAllAsUntouched`, `disable`, `enable`, `validate`, `setValidators`, `addValidators`, `removeValidators`, `setAsyncValidators`, `getError(code)`, `hasError(code)`, `getErrorMessage(code)`, `getFirstErrorMessage()`, `destroy`.

Each control has an optional `parent` reference. Adding a control to a group/array sets it; removing clears it. The parent chain is walked when resolving error messages.

## FormControl

```typescript
const username = createFormControl<string>('', {
    validators: [Validators.required, Validators.minLength(3)],
    updateOn: 'blur'
});

username.value();             // ''
username.setValue('melodic'); // marks dirty, runs validation if updateOn is 'change'
username.errors();            // ValidationErrors | null
username.markAsTouched();     // also runs validation if updateOn is 'blur'
```

`updateOn` controls when validation runs:

- `'change'` (default) — on every `setValue`
- `'blur'` — only on `markAsTouched`
- `'submit'` — only when `validate()` is called explicitly

## FormGroup

Form groups aggregate named controls.

```typescript
interface SignupForm {
    name: string;
    email: string;
}

const form = createFormGroup<SignupForm>({
    name: createFormControl<string>('', { validators: [Validators.required] }),
    email: createFormControl<string>('', { validators: [Validators.email] })
});

form.value();                  // { name: '', email: '' }
form.valid();                  // boolean
form.get('name').setValue('Ada');
form.addControl('age', createFormControl<number>(0));
form.removeControl('age');     // also destroys the removed control
```

`controls` is a signal — adding or removing a control automatically re-aggregates state across the group. No manual rewiring needed.

Group-level validators receive the aggregate value:

```typescript
const passwordsMatch = (value: { password: string; confirmPassword: string }) =>
    value.password !== value.confirmPassword
        ? { mismatch: { code: 'mismatch' } }
        : null;

createFormGroup(
    { password: createFormControl(''), confirmPassword: createFormControl('') },
    { validators: [passwordsMatch], messages: { mismatch: 'Passwords do not match' } }
);
```

## FormArray

Ordered lists of controls.

```typescript
const tags = createFormArray<string>([
    createFormControl<string>('hello'),
    createFormControl<string>('world')
]);

tags.length;                   // 2
tags.push(createFormControl<string>('!'));
tags.at(0)?.setValue('hi');
tags.removeAt(2);              // destroys the removed control
tags.value();                  // ['hi', 'world']
```

## Validators

Validators are pure functions that return `{ code, params? } | null`. The display message is resolved separately, allowing override and i18n.

Built-ins: `required`, `minLength(n)`, `maxLength(n)`, `pattern(regex)`, `email`, `min(n)`, `max(n)`, `range(min, max)`, `compose(...)`, `composeAsync(...)`.

```typescript
import { Validators, createValidator, createAsyncValidator } from '@melodicdev/core/forms';

const passwordStrength = createValidator<string>(
    'passwordStrength',
    (value) => /[A-Z]/.test(value) && /[0-9]/.test(value),
    'Password must include an uppercase letter and a number'
);

const emailAvailable = createAsyncValidator<string>(
    'emailAvailable',
    async (email) => {
        const res = await fetch(`/api/email-available?q=${email}`);
        return (await res.json()).available;
    },
    'This email is already registered'
);
```

The third argument to `createValidator`/`createAsyncValidator` is the default message — it is registered globally so any control using the validator will pick it up automatically. Pass a function `(params) => string` for parameterized messages.

## Messages

Messages live in three layers:

1. **Per-control overrides** via `messages: { code: string | (params) => string }` in `ControlOptions`.
2. **Parent chain** — message overrides on a parent group/array apply to its descendants.
3. **Global registry** — defaults registered via `registerDefaultMessages` or implicitly by `createValidator`.

Resolution order: per-control → walk parent chain → global → fallback to the code string.

```typescript
import { registerDefaultMessages } from '@melodicdev/core/forms';

registerDefaultMessages({
    required: 'This is required',
    minLength: ({ min }) => `Must be at least ${min} characters`
});

createFormControl('', {
    validators: [Validators.required],
    messages: { required: 'Name is required.' }   // overrides the default
});
```

Read messages off any control:

```typescript
control.getErrorMessage('required');   // resolved string for one code
control.getFirstErrorMessage();        // resolved string for the first error
```

## The :formControl directive

Bind any `AbstractControl` to a form element. The directive handles value sync, touched-on-blur (via `focusout` so it works on custom elements through shadow DOM), validation CSS classes, and the `error` attribute.

```typescript
html`
    <input :formControl=${form.get('name')} />
    <input type="checkbox" :formControl=${form.get('acceptTerms')} />
    <select :formControl=${form.get('country')}><option>...</option></select>
    <ml-input :formControl=${form.get('email')}></ml-input>
`;
```

CSS classes added to the bound element: `mf-valid`, `mf-invalid`, `mf-dirty`, `mf-pristine`, `mf-touched`, `mf-pending`, `mf-disabled`.

When the control is touched and invalid, the directive sets the `error` attribute on the host with the resolved message. For Melodic form components (`ml-input`, `ml-textarea`, `ml-select`, `ml-checkbox`, `ml-date-picker`, etc.) which observe the `error` attribute, this surfaces validation messages with zero additional template wiring.

## Adapter system

The directive uses an adapter to read/write the bound element's value and identify its input/blur events. Native adapters for `<input>`, `<input type="checkbox">`, `<input type="radio">`, `<select>`, `<textarea>` are pre-registered. Adapters for `ml-*` form components are registered when the component is imported.

To support a custom form element, register an adapter:

```typescript
import { registerAdapter } from '@melodicdev/core/forms';
import type { FormControlAdapter } from '@melodicdev/core/forms';

const myColorPickerAdapter: FormControlAdapter<string> = {
    inputEvent: 'color-change',
    blurEvent: 'focusout',
    getValue: (el) => (el as MyColorPicker).hex,
    setValue: (el, value) => { (el as MyColorPicker).hex = value; },
    setDisabled: (el, disabled) => { (el as MyColorPicker).disabled = disabled; }
};

registerAdapter((el) => el.tagName === 'MY-COLOR-PICKER', myColorPickerAdapter);
```

Predicates are checked in reverse registration order, so later-registered adapters take precedence.

## Putting it together

```typescript
@MelodicComponent({
    selector: 'signup-form',
    template: (self) => html`
        <form @submit=${(e: Event) => self.submit(e)}>
            <ml-input label="Name"  :formControl=${self.form.get('name')}></ml-input>
            <ml-input label="Email" :formControl=${self.form.get('email')}></ml-input>
            <ml-button type="submit" ?disabled=${self.form.invalid()}>Sign up</ml-button>
        </form>
    `
})
export class SignupFormComponent {
    readonly form = createFormGroup({
        name:  createFormControl<string>('', { validators: [Validators.required] }),
        email: createFormControl<string>('', { validators: [Validators.required, Validators.email] })
    });

    submit(event: Event): void {
        event.preventDefault();
        this.form.markAllAsTouched();
        if (this.form.invalid()) return;
        // submit ...
    }

    onDestroy(): void {
        this.form.destroy();
    }
}
```

The component re-renders automatically on any form state change. Errors appear under each `ml-input` because the directive populates the host's `error` attribute. No manual subscriptions, no per-field `error=${...}` bindings.

### Lifecycle

`AbstractControl.destroy()` cleans up internal signals and (for groups/arrays) destroys all child controls recursively. Call it from `onDestroy()` for components that own a form. Auto-destroy is intentionally not built into ComponentBase since a control may outlive the component (e.g., a shared form service).
