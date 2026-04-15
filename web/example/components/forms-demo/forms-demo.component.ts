import { MelodicComponent } from '../../../../src/components';
import type { OnInit, OnDestroy } from '../../../../src/components/interfaces/ilife-cycle-hooks.interface';
import { formsDemoTemplate } from './forms-demo.template';
import { formsDemoStyles } from './forms-demo.styles';
import {
	createFormControl,
	createFormGroup,
	Validators,
	createAsyncValidator,
	createValidator,
	FormGroup
} from '../../../../src/forms';

const mustBeTrue = createValidator<boolean>(
	'mustBeTrue',
	(value) => value === true,
	'You must accept the terms'
);

const emailAvailable = createAsyncValidator<string>(
	'emailAvailable',
	async (email) => {
		await new Promise((r) => setTimeout(r, 800));
		return !email.toLowerCase().includes('taken');
	},
	'This email is already registered'
);

interface RegistrationForm {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
	age: number;
	acceptTerms: boolean;
}

const passwordsMatch = (value: RegistrationForm) => {
	if (value.password && value.confirmPassword && value.password !== value.confirmPassword) {
		return {
			passwordMismatch: { code: 'passwordMismatch' }
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
	form: FormGroup<RegistrationForm> = createFormGroup<RegistrationForm>(
		{
			username: createFormControl<string>('', {
				validators: [Validators.required, Validators.minLength(3), Validators.maxLength(20)]
			}),
			email: createFormControl<string>('', {
				validators: [Validators.required, Validators.email],
				asyncValidators: [emailAvailable]
			}),
			password: createFormControl<string>('', {
				validators: [Validators.required, Validators.minLength(8)]
			}),
			confirmPassword: createFormControl<string>('', {
				validators: [Validators.required],
				messages: { required: 'Please confirm your password' }
			}),
			age: createFormControl<number>(18, {
				validators: [Validators.required, Validators.min(18), Validators.max(120)]
			}),
			acceptTerms: createFormControl<boolean>(false, {
				validators: [mustBeTrue]
			})
		},
		{
			validators: [passwordsMatch],
			messages: { passwordMismatch: 'Passwords do not match' }
		}
	);

	submitting = false;
	submitResult: string | null = null;

	onInit(): void {
		console.log('FormsDemoComponent initialized');
	}

	onDestroy(): void {
		this.form.destroy();
	}

	async onSubmit(e: Event): Promise<void> {
		e.preventDefault();

		this.form.markAllAsTouched();
		await this.form.validate();

		if (this.form.invalid()) {
			this.submitResult = 'Please fix the validation errors above.';
			return;
		}

		this.submitting = true;
		this.submitResult = null;

		await new Promise((r) => setTimeout(r, 1500));

		this.submitting = false;
		this.submitResult = `Registration successful! Welcome, ${this.form.get('username').value()}!`;

		console.log('Form submitted:', this.form.value());
	}

	onReset(): void {
		this.form.reset();
		this.submitResult = null;
	}
}
