import { html, when } from '../../../../src/template';
import '../../../../src/forms';
import type { FormsDemoComponent } from './forms-demo.component';

export function formsDemoTemplate(component: FormsDemoComponent) {
	const { form } = component;

	return html`
		<div class="forms-demo">
			<h2>Forms Demo</h2>
			<p class="description">Demonstrating the reactive forms system with auto-subscribe, validation, async validation, and form groups.</p>

			<form @submit=${(e: Event) => component.onSubmit(e)}>
				<!-- Username -->
				<div class="form-field">
					<label for="username">Username</label>
					<input
						type="text"
						id="username"
						placeholder="Enter username"
						:formControl=${form.get('username')}
					/>
					${when(
						form.get('username').touched() && form.get('username').invalid(),
						() => html`<div class="errors"><span class="error">${form.get('username').getFirstErrorMessage()}</span></div>`
					)}
				</div>

				<!-- Email -->
				<div class="form-field">
					<label for="email">Email</label>
					<input
						type="email"
						id="email"
						placeholder="Enter email (try 'taken@example.com')"
						:formControl=${form.get('email')}
					/>
					${when(form.get('email').pending(), () => html`<span class="pending">Checking availability...</span>`)}
					${when(
						form.get('email').touched() && form.get('email').invalid(),
						() => html`<div class="errors"><span class="error">${form.get('email').getFirstErrorMessage()}</span></div>`
					)}
				</div>

				<!-- Password -->
				<div class="form-field">
					<label for="password">Password</label>
					<input
						type="password"
						id="password"
						placeholder="Enter password"
						:formControl=${form.get('password')}
					/>
					${when(
						form.get('password').touched() && form.get('password').invalid(),
						() => html`<div class="errors"><span class="error">${form.get('password').getFirstErrorMessage()}</span></div>`
					)}
				</div>

				<!-- Confirm Password -->
				<div class="form-field">
					<label for="confirmPassword">Confirm Password</label>
					<input
						type="password"
						id="confirmPassword"
						placeholder="Confirm password"
						:formControl=${form.get('confirmPassword')}
					/>
					${when(
						form.get('confirmPassword').touched() && form.get('confirmPassword').invalid(),
						() => html`<div class="errors"><span class="error">${form.get('confirmPassword').getFirstErrorMessage()}</span></div>`
					)}
					${when(form.hasError('passwordMismatch'), () => html`<div class="errors"><span class="error">${form.getFirstErrorMessage()}</span></div>`)}
				</div>

				<!-- Age -->
				<div class="form-field">
					<label for="age">Age</label>
					<input
						type="number"
						id="age"
						min="18"
						max="120"
						:formControl=${form.get('age')}
					/>
					${when(
						form.get('age').touched() && form.get('age').invalid(),
						() => html`<div class="errors"><span class="error">${form.get('age').getFirstErrorMessage()}</span></div>`
					)}
				</div>

				<!-- Accept Terms -->
				<div class="form-field checkbox">
					<label>
						<input type="checkbox" :formControl=${form.get('acceptTerms')} />
						I accept the terms and conditions
					</label>
					${when(
						form.get('acceptTerms').touched() && form.get('acceptTerms').invalid(),
						() => html`<div class="errors"><span class="error">${form.get('acceptTerms').getFirstErrorMessage()}</span></div>`
					)}
				</div>

				<!-- Submit Result -->
				${when(
					component.submitResult !== null,
					() => html`<div class="submit-result ${form.valid() ? 'success' : 'error'}">${component.submitResult}</div>`
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
