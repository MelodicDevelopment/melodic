import { MelodicComponent } from '../../../../src/components';
import type { OnInit, OnDestroy } from '../../../../src/components/interfaces/ilife-cycle-hooks.interface';
import { formsDemoTemplate } from './forms-demo.template';
import { formsDemoStyles } from './forms-demo.styles';
import { createFormControl, createFormGroup, Validators, createAsyncValidator, createValidator } from '../../../../src/forms';
import type { IFormGroup } from '../../../../src/forms';
import { SignalEffect } from '../../../../src/signals';

// Custom validator for checkbox that must be checked
const mustBeTrue = createValidator<boolean>(
	'mustBeTrue',
	(value) => value === true,
	'You must accept the terms'
);

// Simulate async email validation
const emailAvailable = createAsyncValidator<string>(
	'emailAvailable',
	async (email) => {
		await new Promise((r) => setTimeout(r, 800));
		// Simulate "taken@example.com" being unavailable
		return !email.toLowerCase().includes('taken');
	},
	'This email is already registered'
);

interface RegistrationForm extends Record<string, unknown> {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
	age: number;
	acceptTerms: boolean;
}

// Group-level validator for password confirmation
const passwordsMatch = (value: RegistrationForm) => {
	if (value.password && value.confirmPassword && value.password !== value.confirmPassword) {
		return {
			passwordMismatch: {
				code: 'passwordMismatch',
				message: 'Passwords do not match'
			}
		};
	}
	return null;
};

@MelodicComponent({
	selector: 'forms-demo',
	template: formsDemoTemplate,
	styles: formsDemoStyles
})
export class FormsDemoComponent implements OnInit, OnDestroy {
	form: IFormGroup<RegistrationForm> = createFormGroup<RegistrationForm>(
		{
			username: createFormControl('', {
				validators: [Validators.required, Validators.minLength(3), Validators.maxLength(20)]
			}),
			email: createFormControl('', {
				validators: [Validators.required, Validators.email],
				asyncValidators: [emailAvailable]
			}),
			password: createFormControl('', {
				validators: [Validators.required, Validators.minLength(8)]
			}),
			confirmPassword: createFormControl('', {
				validators: [Validators.required]
			}),
			age: createFormControl(18, {
				validators: [Validators.required, Validators.min(18), Validators.max(120)]
			}),
			acceptTerms: createFormControl(false, {
				validators: [mustBeTrue]
			})
		},
		{
			validators: [passwordsMatch]
		}
	);

	submitting = false;
	submitResult: string | null = null;

	// Used to trigger re-renders when form state changes
	formVersion = 0;
	private _formEffect: SignalEffect | null = null;

	onInit(): void {
		console.log('FormsDemoComponent initialized');

		// Create a SignalEffect that subscribes to all form state signals
		// and triggers re-renders when they change
		this._formEffect = new SignalEffect(() => {
			// Read all form control values and states to subscribe to them
			this.form.value();
			this.form.valid();
			this.form.invalid();
			this.form.dirty();
			this.form.touched();
			this.form.pending();
			this.form.errors();

			// Read individual control states
			for (const key of ['username', 'email', 'password', 'confirmPassword', 'age', 'acceptTerms'] as const) {
				const control = this.form.get(key);
				control.value();
				control.errors();
				control.touched();
				control.dirty();
				control.pending();
			}

			// Increment version to trigger re-render
			this.formVersion++;
		});

		// Run the effect initially to set up subscriptions
		this._formEffect.run();
	}

	onDestroy(): void {
		this._formEffect?.destroy();
		this.form.destroy();
	}

	async onSubmit(e: Event): Promise<void> {
		e.preventDefault();

		// Touch all fields to show validation errors
		this.form.markAllAsTouched();

		// Wait for async validation to complete
		await this.form.validate();

		if (this.form.invalid()) {
			this.submitResult = 'Please fix the validation errors above.';
			return;
		}

		this.submitting = true;
		this.submitResult = null;

		// Simulate API call
		await new Promise((r) => setTimeout(r, 1500));

		this.submitting = false;
		this.submitResult = `Registration successful! Welcome, ${this.form.get('username').value()}!`;

		console.log('Form submitted:', this.form.value());
	}

	onReset(): void {
		this.form.reset();
		this.submitResult = null;
	}

	// Event handlers for manual binding (alternative to :formControl directive)
	updateUsername = (e: Event) => {
		this.form.get('username').setValue((e.target as HTMLInputElement).value);
	};

	updateEmail = (e: Event) => {
		this.form.get('email').setValue((e.target as HTMLInputElement).value);
	};

	updatePassword = (e: Event) => {
		this.form.get('password').setValue((e.target as HTMLInputElement).value);
	};

	updateConfirmPassword = (e: Event) => {
		this.form.get('confirmPassword').setValue((e.target as HTMLInputElement).value);
	};

	updateAge = (e: Event) => {
		this.form.get('age').setValue(parseInt((e.target as HTMLInputElement).value) || 0);
	};

	updateAcceptTerms = (e: Event) => {
		this.form.get('acceptTerms').setValue((e.target as HTMLInputElement).checked);
	};

	markTouched = (field: keyof RegistrationForm) => {
		this.form.get(field).markAsTouched();
	};
}
