import { createResolver } from '../../src/routing';
import type { IResolverContext } from '../../src/routing';

/**
 * Mock user data - in a real app this would come from an API
 */
const mockUsers: Record<string, User> = {
	'1': { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
	'2': { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'User' },
	'3': { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'Editor' }
};

export interface User {
	id: string;
	name: string;
	email: string;
	role: string;
}

/**
 * Simulates fetching a user from an API
 */
async function fetchUser(userId: string): Promise<User> {
	console.log(`[UserResolver] Fetching user with ID: ${userId}`);

	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 500));

	const user = mockUsers[userId];
	if (!user) {
		throw new Error(`User with ID ${userId} not found`);
	}

	console.log(`[UserResolver] User found:`, user);
	return user;
}

/**
 * Simulates fetching all users from an API
 */
async function fetchAllUsers(): Promise<User[]> {
	console.log(`[UsersResolver] Fetching all users`);

	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 300));

	const users = Object.values(mockUsers);
	console.log(`[UsersResolver] Found ${users.length} users`);
	return users;
}

/**
 * User resolver - fetches a single user by ID from route params.
 * If the user is not found, it throws an error which blocks navigation.
 */
export const userResolver = createResolver<User>(async (context: IResolverContext) => {
	const userId = context.params['userId'];
	console.log(`[UserResolver] Resolving user for route: ${context.targetPath}`);
	return fetchUser(userId);
});

/**
 * Users list resolver - fetches all users.
 */
export const usersResolver = createResolver<User[]>(async (context: IResolverContext) => {
	console.log(`[UsersResolver] Resolving users list for route: ${context.targetPath}`);
	return fetchAllUsers();
});

/**
 * Dashboard stats resolver - fetches dashboard statistics
 */
export interface DashboardStats {
	totalUsers: number;
	activeUsers: number;
	newUsersToday: number;
}

export const dashboardStatsResolver = createResolver<DashboardStats>(async () => {
	console.log(`[DashboardResolver] Fetching dashboard stats`);

	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 200));

	return {
		totalUsers: Object.keys(mockUsers).length,
		activeUsers: 2,
		newUsersToday: 1
	};
});
