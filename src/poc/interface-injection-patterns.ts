/**
 * POC: Different patterns for interface-based injection
 * This allows swapping implementations without changing component code
 */

import { Injector } from '../injection';
import { Service } from '../injection/decorators/service.decorator';

// ============================================================================
// PATTERN 1: String Tokens with Interfaces
// ============================================================================

export interface ILogger {
	log(message: string): void;
	error(message: string): void;
}

// Define a constant string token
export const LOGGER_TOKEN = 'ILogger';

// Implementation 1: Console Logger
export class ConsoleLogger implements ILogger {
	log(message: string): void {
		console.log(`[LOG] ${message}`);
	}

	error(message: string): void {
		console.error(`[ERROR] ${message}`);
	}
}

// Implementation 2: Mock Logger (for testing)
export class MockLogger implements ILogger {
	logs: string[] = [];
	errors: string[] = [];

	log(message: string): void {
		this.logs.push(message);
	}

	error(message: string): void {
		this.errors.push(message);
	}
}

// Register the implementation
Injector.bind(LOGGER_TOKEN, ConsoleLogger).asSingleton();

// Usage in component
export class MyComponent1 {
	// TypeScript knows this is ILogger, but at runtime it uses the string token
	@Service(LOGGER_TOKEN) private logger!: ILogger;

	doSomething() {
		this.logger.log('Hello from component!');
	}
}

// Easy to swap implementations:
// Injector.bind(LOGGER_TOKEN, MockLogger).asSingleton();

// ============================================================================
// PATTERN 2: InjectionToken Class (Angular-style)
// ============================================================================

/**
 * Type-safe injection token that carries type information
 */
export class InjectionToken<T> {
	constructor(public readonly key: string) {}

	toString(): string {
		return this.key;
	}
}

// Define typed tokens
export const LOGGER = new InjectionToken<ILogger>('ILogger');
export const API_URL = new InjectionToken<string>('ApiUrl');

// Register with typed token
Injector.bind(LOGGER.toString(), ConsoleLogger).asSingleton();
Injector.bind(API_URL.toString(), { getInstance: () => 'https://api.example.com' } as any);

export class MyComponent2 {
	// Use the InjectionToken's string representation
	@Service(LOGGER.toString()) private logger!: ILogger;
	@Service(API_URL.toString()) private apiUrl!: string;

	doSomething() {
		this.logger.log(`API URL: ${this.apiUrl}`);
	}
}

// ============================================================================
// PATTERN 3: Abstract Classes (Runtime Alternative to Interfaces)
// ============================================================================

/**
 * Abstract classes exist at runtime, so they can be used as tokens directly
 * This is a good middle ground between interfaces and concrete classes
 */
export abstract class DataService {
	abstract getData(): Promise<string[]>;
	abstract saveData(data: string[]): Promise<void>;
}

// Implementation 1: API Data Service
export class ApiDataService extends DataService {
	async getData(): Promise<string[]> {
		// Fetch from API
		return ['api-item-1', 'api-item-2'];
	}

	async saveData(data: string[]): Promise<void> {
		console.log('Saving to API:', data);
	}
}

// Implementation 2: Local Storage Data Service
export class LocalStorageDataService extends DataService {
	async getData(): Promise<string[]> {
		const data = localStorage.getItem('data');
		return data ? JSON.parse(data) : [];
	}

	async saveData(data: string[]): Promise<void> {
		localStorage.setItem('data', JSON.stringify(data));
	}
}

// Register the implementation (abstract class as token!)
Injector.bind(DataService, ApiDataService).asSingleton();

export class MyComponent3 {
	// Abstract class can be used as a token directly!
	@Service(DataService) private dataService!: DataService;

	async loadData() {
		const data = await this.dataService.getData();
		console.log('Loaded:', data);
	}
}

// Easy to swap:
// Injector.bind(DataService, LocalStorageDataService).asSingleton();

// ============================================================================
// PATTERN 4: Symbol Tokens (Unique and Collision-Free)
// ============================================================================

/**
 * Symbols are guaranteed unique, preventing token collisions
 */
export const LOGGER_SYMBOL = Symbol.for('ILogger');
export const CONFIG_SYMBOL = Symbol.for('IConfig');

export interface IConfig {
	apiUrl: string;
	timeout: number;
}

export class ProductionConfig implements IConfig {
	apiUrl = 'https://api.production.com';
	timeout = 5000;
}

export class DevelopmentConfig implements IConfig {
	apiUrl = 'http://localhost:3000';
	timeout = 10000;
}

// Note: Symbols work as tokens, but need toString() for storage
Injector.bind(LOGGER_SYMBOL.toString(), ConsoleLogger).asSingleton();
Injector.bind(CONFIG_SYMBOL.toString(), DevelopmentConfig).asSingleton();

export class MyComponent4 {
	@Service(LOGGER_SYMBOL.toString()) private logger!: ILogger;
	@Service(CONFIG_SYMBOL.toString()) private config!: IConfig;

	doSomething() {
		this.logger.log(`API: ${this.config.apiUrl}`);
	}
}

// ============================================================================
// PATTERN 5: Factory Pattern with Interfaces
// ============================================================================

export interface INotificationService {
	notify(message: string): void;
}

export class EmailNotificationService implements INotificationService {
	notify(message: string): void {
		console.log(`Sending email: ${message}`);
	}
}

export class SmsNotificationService implements INotificationService {
	notify(message: string): void {
		console.log(`Sending SMS: ${message}`);
	}
}

export class PushNotificationService implements INotificationService {
	notify(message: string): void {
		console.log(`Sending push notification: ${message}`);
	}
}

// Factory that decides which implementation to use
export class NotificationServiceFactory {
	static create(): INotificationService {
		const env = process.env.NODE_ENV;
		switch (env) {
			case 'production':
				return new EmailNotificationService();
			case 'development':
				return new PushNotificationService();
			default:
				return new SmsNotificationService();
		}
	}
}

// Register the factory
const NOTIFICATION_TOKEN = 'INotificationService';
Injector.bind(NOTIFICATION_TOKEN, {
	getInstance: () => NotificationServiceFactory.create()
} as any).asSingleton();

export class MyComponent5 {
	@Service(NOTIFICATION_TOKEN) private notifications!: INotificationService;

	sendNotification() {
		this.notifications.notify('Hello!');
	}
}

// ============================================================================
// COMPARISON TABLE
// ============================================================================

/*
┌─────────────────────┬──────────────┬───────────────┬────────────────────┬──────────────────┐
│ Pattern             │ Type Safety  │ Collision-Free│ Easy to Swap       │ Recommendation   │
├─────────────────────┼──────────────┼───────────────┼────────────────────┼──────────────────┤
│ String Tokens       │ Manual       │ No            │ ✓ Very Easy        │ Simple projects  │
│ InjectionToken      │ ✓ Built-in   │ No            │ ✓ Very Easy        │ Medium projects  │
│ Abstract Classes    │ ✓ Built-in   │ ✓ Yes         │ ✓ Very Easy        │ ⭐ Recommended   │
│ Symbol Tokens       │ Manual       │ ✓ Yes         │ ✓ Very Easy        │ Large projects   │
│ Factory Pattern     │ ✓ Built-in   │ No            │ ✓ At factory level │ Complex logic    │
└─────────────────────┴──────────────┴───────────────┴────────────────────┴──────────────────┘
*/

// ============================================================================
// RECOMMENDED: Abstract Class Pattern
// ============================================================================

/**
 * Best practice for Melodic framework:
 * Use abstract classes as tokens when you need interface-based injection
 */

// Define your contract as an abstract class
export abstract class StateService {
	abstract getState<T>(key: string): T | undefined;
	abstract setState<T>(key: string, value: T): void;
	abstract clear(): void;
}

// Implementation 1: In-Memory
export class InMemoryStateService extends StateService {
	private state = new Map<string, any>();

	getState<T>(key: string): T | undefined {
		return this.state.get(key);
	}

	setState<T>(key: string, value: T): void {
		this.state.set(key, value);
	}

	clear(): void {
		this.state.clear();
	}
}

// Implementation 2: LocalStorage
export class LocalStorageStateService extends StateService {
	getState<T>(key: string): T | undefined {
		const value = localStorage.getItem(key);
		return value ? JSON.parse(value) : undefined;
	}

	setState<T>(key: string, value: T): void {
		localStorage.setItem(key, JSON.stringify(value));
	}

	clear(): void {
		localStorage.clear();
	}
}

// Register (easy to change!)
Injector.bind(StateService, InMemoryStateService).asSingleton();

// Usage - clean and type-safe!
export class UserPreferencesComponent {
	@Service(StateService) private state!: StateService;

	saveTheme(theme: string) {
		this.state.setState('theme', theme);
	}

	loadTheme(): string {
		return this.state.getState<string>('theme') ?? 'light';
	}
}

// To swap implementations, just change one line:
// Injector.bind(StateService, LocalStorageStateService).asSingleton();
