import { createGuard, createDeactivateGuard } from '../../src/routing';
import type { IGuardContext } from '../../src/routing';

/**
 * Simulated auth state - in a real app this would come from an auth service
 */
let isAuthenticated = true;

export function setAuthenticated(value: boolean): void {
	isAuthenticated = value;
	console.log(`[Auth] User is now ${value ? 'authenticated' : 'logged out'}`);
}

export function getAuthenticated(): boolean {
	return isAuthenticated;
}

/**
 * Auth guard - protects routes that require authentication.
 * Returns true to allow, false to block, or a string to redirect.
 */
export const authGuard = createGuard((context: IGuardContext) => {
	console.log(`[AuthGuard] Checking access to: ${context.targetPath}`);
	console.log(`[AuthGuard] Route data:`, context.data);

	if (isAuthenticated) {
		console.log(`[AuthGuard] Access granted`);
		return true;
	}

	console.log(`[AuthGuard] Access denied - redirecting to /home`);
	return '/home'; // Redirect to home if not authenticated
});

/**
 * Admin guard - requires admin role (simulated)
 */
export const adminGuard = createGuard((context: IGuardContext) => {
	console.log(`[AdminGuard] Checking admin access to: ${context.targetPath}`);

	// Simulated role check - in real app would check user roles
	const hasAdminRole = isAuthenticated; // Simplified: if logged in, assume admin

	if (hasAdminRole) {
		console.log(`[AdminGuard] Admin access granted`);
		return true;
	}

	console.log(`[AdminGuard] Admin access denied`);
	return '/home';
});

/**
 * Unsaved changes guard - confirms before leaving a page with unsaved changes
 */
export const unsavedChangesGuard = createDeactivateGuard((context: IGuardContext) => {
	console.log(`[UnsavedChangesGuard] Leaving: ${context.currentPath} -> ${context.targetPath}`);

	// In a real app, you'd check if there are unsaved changes
	const hasUnsavedChanges = false;

	if (hasUnsavedChanges) {
		return window.confirm('You have unsaved changes. Are you sure you want to leave?');
	}

	return true;
});
