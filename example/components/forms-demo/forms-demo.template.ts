import { html, when } from '../../../src/template';
import type { FormsDemoComponent } from './forms-demo.component';

export function formsDemoTemplate(component: FormsDemoComponent) {
	const { form } = component;

	return html`
		<div class="forms-demo">
			<h2>Forms Demo</h2>
			<p class="description">Demonstrating the reactive forms system with validation, async validation, and form groups.</p>

			<form @submit=${(e: Event) => component.onSubmit(e)}>
				<!-- Username -->
				<div class="form-field">
					<label for="username">Username</label>
					<input
						type="text"
						id="username"
						placeholder="Enter username"
						.value=${form.get('username').value()}
						@input=${component.updateUsername}
						@blur=${() => component.markTouched('username')}
						class=${form.get('username').touched() && form.get('username').invalid() ? 'invalid' : ''}
					/>
					${when(
						form.get('username').touched() && form.get('username').invalid(),
						() => html`
							<div class="errors">
								${when(form.get('username').hasError('required'), () => html`<span class="error">Username is required</span>`)}
								${when(form.get('username').hasError('minLength'), () => html`<span class="error">Username must be at least 3 characters</span>`)}
								${when(form.get('username').hasError('maxLength'), () => html`<span class="error">Username cannot exceed 20 characters</span>`)}
							</div>
						`
					)}
				</div>

				<!-- Email -->
				<div class="form-field">
					<label for="email">Email</label>
					<input
						type="email"
						id="email"
						placeholder="Enter email (try 'taken@example.com')"
						.value=${form.get('email').value()}
						@input=${component.updateEmail}
						@blur=${() => component.markTouched('email')}
						class=${form.get('email').touched() && form.get('email').invalid() ? 'invalid' : ''}
					/>
					${when(form.get('email').pending(), () => html`<span class="pending">Checking availability...</span>`)}
					${when(
						form.get('email').touched() && form.get('email').invalid(),
						() => html`
							<div class="errors">
								${when(form.get('email').hasError('required'), () => html`<span class="error">Email is required</span>`)}
								${when(form.get('email').hasError('email'), () => html`<span class="error">Please enter a valid email</span>`)}
								${when(form.get('email').hasError('emailAvailable'), () => html`<span class="error">This email is already registered</span>`)}
							</div>
						`
					)}
				</div>

				<!-- Password -->
				<div class="form-field">
					<label for="password">Password</label>
					<input
						type="password"
						id="password"
						placeholder="Enter password"
						.value=${form.get('password').value()}
						@input=${component.updatePassword}
						@blur=${() => component.markTouched('password')}
						class=${form.get('password').touched() && form.get('password').invalid() ? 'invalid' : ''}
					/>
					${when(
						form.get('password').touched() && form.get('password').invalid(),
						() => html`
							<div class="errors">
								${when(form.get('password').hasError('required'), () => html`<span class="error">Password is required</span>`)}
								${when(form.get('password').hasError('minLength'), () => html`<span class="error">Password must be at least 8 characters</span>`)}
							</div>
						`
					)}
				</div>

				<!-- Confirm Password -->
				<div class="form-field">
					<label for="confirmPassword">Confirm Password</label>
					<input
						type="password"
						id="confirmPassword"
						placeholder="Confirm password"
						.value=${form.get('confirmPassword').value()}
						@input=${component.updateConfirmPassword}
						@blur=${() => component.markTouched('confirmPassword')}
						class=${(form.get('confirmPassword').touched() && form.get('confirmPassword').invalid()) || form.hasError('passwordMismatch')
							? 'invalid'
							: ''}
					/>
					${when(
						form.get('confirmPassword').touched() && form.get('confirmPassword').invalid(),
						() => html`
							<div class="errors">
								${when(form.get('confirmPassword').hasError('required'), () => html`<span class="error">Please confirm your password</span>`)}
							</div>
						`
					)}
					${when(form.hasError('passwordMismatch'), () => html`<div class="errors"><span class="error">Passwords do not match</span></div>`)}
				</div>

				<!-- Age -->
				<div class="form-field">
					<label for="age">Age</label>
					<input
						type="number"
						id="age"
						min="18"
						max="120"
						.value=${String(form.get('age').value())}
						@input=${component.updateAge}
						@blur=${() => component.markTouched('age')}
						class=${form.get('age').touched() && form.get('age').invalid() ? 'invalid' : ''}
					/>
					${when(
						form.get('age').touched() && form.get('age').invalid(),
						() => html`
							<div class="errors">
								${when(form.get('age').hasError('required'), () => html`<span class="error">Age is required</span>`)}
								${when(form.get('age').hasError('min'), () => html`<span class="error">You must be at least 18 years old</span>`)}
								${when(form.get('age').hasError('max'), () => html`<span class="error">Please enter a valid age</span>`)}
							</div>
						`
					)}
				</div>

				<!-- Accept Terms -->
				<div class="form-field checkbox">
					<label>
						<input type="checkbox" .checked=${form.get('acceptTerms').value()} @change=${component.updateAcceptTerms} />
						I accept the terms and conditions
					</label>
					${when(
						form.get('acceptTerms').touched() && form.get('acceptTerms').hasError('mustBeTrue'),
						() => html`<div class="errors"><span class="error">You must accept the terms</span></div>`
					)}
				</div>

				<!-- Submit Result -->
				${when(
					component.submitResult !== null,
					() => html`
						<div class="submit-result ${form.valid() ? 'success' : 'error'}">${component.submitResult}</div>
					`
				)}

				<!-- Actions -->
				<div class="form-actions">
					<button type="submit" .disabled=${form.invalid() || form.pending() || component.submitting}>
						${component.submitting ? 'Submitting...' : 'Register'}
					</button>
					<button type="button" @click=${() => component.onReset()}>Reset</button>
				</div>

				<!-- Debug Info -->
				<details class="debug-info">
					<summary>Form State Debug</summary>
					<div class="debug-content">
						<p><strong>Valid:</strong> ${form.valid()}</p>
						<p><strong>Invalid:</strong> ${form.invalid()}</p>
						<p><strong>Dirty:</strong> ${form.dirty()}</p>
						<p><strong>Touched:</strong> ${form.touched()}</p>
						<p><strong>Pending:</strong> ${form.pending()}</p>
						<p><strong>Value:</strong></p>
						<pre>${JSON.stringify(form.value(), null, 2)}</pre>
					</div>
				</details>
			</form>
		</div>
	`;
}
