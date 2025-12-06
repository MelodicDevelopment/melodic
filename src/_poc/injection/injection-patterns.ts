/**
 * Injection Patterns - Examples of the flexible injection system
 *
 * Demonstrates:
 * - Token types: string, symbol, class
 * - Binding types: class, value, factory
 * - Interface injection with createToken()
 * - Abstract class patterns
 * - Testing patterns
 */

import { Injector, GlobalInjector } from './injector';
import { Injectable, Inject, Service, createToken } from './decorators';
import type { Token } from './types';

// ============================================================================
// PATTERN 1: Class Tokens (Simple)
// ============================================================================

/**
 * The simplest pattern - use a class as its own token
 */
@Injectable()
class UserService {
	private users = [
		{ id: 1, name: 'Alice' },
		{ id: 2, name: 'Bob' }
	];

	getUser(id: number) {
		return this.users.find((u) => u.id === id);
	}

	getAllUsers() {
		return this.users;
	}
}

// Usage
class UserComponent {
	@Service(UserService)
	private userService!: UserService;

	loadUser(id: number) {
		return this.userService.getUser(id);
	}
}

// ============================================================================
// PATTERN 2: Value Binding
// ============================================================================

/**
 * Bind literal values - config, URLs, feature flags, etc.
 */

// String values
GlobalInjector.bindValue('API_URL', 'https://api.example.com');
GlobalInjector.bindValue('MAX_RETRIES', 3);

// Object values
GlobalInjector.bindValue('APP_CONFIG', {
	debug: true,
	version: '1.0.0',
	features: {
		darkMode: true,
		notifications: false
	}
});

// Pre-created instances
class HttpClient {
	constructor(public baseURL: string) {}
	get(url: string) {
		return fetch(`${this.baseURL}${url}`);
	}
}

const httpClient = new HttpClient('/api');
GlobalInjector.bindValue(HttpClient, httpClient);

// Usage
class ApiService {
	@Service(HttpClient)
	private http!: HttpClient;

	@Service('API_URL')
	private apiUrl!: string;

	fetchData() {
		console.log(`Using API at: ${this.apiUrl}`);
		return this.http.get('/data');
	}
}

// ============================================================================
// PATTERN 3: Factory Binding
// ============================================================================

/**
 * Use factories for complex initialization or conditional creation
 */

interface DbConnection {
	query(sql: string): Promise<unknown[]>;
	close(): void;
}

class PostgresConnection implements DbConnection {
	constructor(private connectionString: string) {
		console.log(`Connected to Postgres: ${connectionString}`);
	}
	async query(sql: string) {
		console.log(`Executing: ${sql}`);
		return [];
	}
	close() {
		console.log('Connection closed');
	}
}

// Singleton factory - called once, result cached
GlobalInjector.bindFactory('DbConnection', () => {
	const connectionString = process.env.DATABASE_URL || 'postgres://localhost/dev';
	return new PostgresConnection(connectionString);
});

// Non-singleton factory - new value each time
GlobalInjector.bindFactory(
	'RequestId',
	() => {
		return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
	},
	{ singleton: false }
);

// Usage
class DataRepository {
	constructor(
		@Inject('DbConnection') private db: DbConnection,
		@Inject('RequestId') private requestId: string
	) {
		console.log(`Repository created for request: ${this.requestId}`);
	}

	async findAll() {
		return this.db.query('SELECT * FROM items');
	}
}

// ============================================================================
// PATTERN 4: Interface Tokens with createToken()
// ============================================================================

/**
 * For interfaces, use createToken<T>() to create typed symbols
 */

// Define interfaces
interface ILogger {
	log(message: string): void;
	error(message: string): void;
	warn(message: string): void;
}

interface ICache {
	get<T>(key: string): T | undefined;
	set<T>(key: string, value: T, ttl?: number): void;
	delete(key: string): void;
}

// Create typed tokens
const LOGGER = createToken<ILogger>('ILogger');
const CACHE = createToken<ICache>('ICache');

// Implementations
class ConsoleLogger implements ILogger {
	log(message: string) {
		console.log(`[LOG] ${message}`);
	}
	error(message: string) {
		console.error(`[ERROR] ${message}`);
	}
	warn(message: string) {
		console.warn(`[WARN] ${message}`);
	}
}

class MemoryCache implements ICache {
	private cache = new Map<string, { value: unknown; expires?: number }>();

	get<T>(key: string): T | undefined {
		const entry = this.cache.get(key);
		if (!entry) return undefined;
		if (entry.expires && Date.now() > entry.expires) {
			this.cache.delete(key);
			return undefined;
		}
		return entry.value as T;
	}

	set<T>(key: string, value: T, ttl?: number): void {
		this.cache.set(key, {
			value,
			expires: ttl ? Date.now() + ttl : undefined
		});
	}

	delete(key: string): void {
		this.cache.delete(key);
	}
}

// Register implementations
GlobalInjector.bind(LOGGER, ConsoleLogger);
GlobalInjector.bind(CACHE, MemoryCache);

// Usage - full type safety!
@Injectable()
class CachedApiService {
	constructor(
		@Inject(LOGGER) private logger: ILogger,
		@Inject(CACHE) private cache: ICache
	) {}

	async fetchWithCache<T>(url: string): Promise<T> {
		const cached = this.cache.get<T>(url);
		if (cached) {
			this.logger.log(`Cache hit: ${url}`);
			return cached;
		}

		this.logger.log(`Cache miss, fetching: ${url}`);
		const data = await fetch(url).then((r) => r.json());
		this.cache.set(url, data, 60000); // 1 minute TTL
		return data;
	}
}

// ============================================================================
// PATTERN 5: Abstract Classes as Tokens
// ============================================================================

/**
 * Abstract classes exist at runtime, so they can be tokens directly
 * Great for class hierarchies and when you want a contract + token in one
 */

abstract class Repository<T> {
	abstract findById(id: number): Promise<T | undefined>;
	abstract findAll(): Promise<T[]>;
	abstract save(item: T): Promise<T>;
	abstract delete(id: number): Promise<void>;
}

interface User {
	id: number;
	name: string;
	email: string;
}

class InMemoryUserRepository extends Repository<User> {
	private users: User[] = [
		{ id: 1, name: 'Alice', email: 'alice@example.com' },
		{ id: 2, name: 'Bob', email: 'bob@example.com' }
	];
	private nextId = 3;

	async findById(id: number) {
		return this.users.find((u) => u.id === id);
	}

	async findAll() {
		return [...this.users];
	}

	async save(user: User) {
		if (!user.id) {
			user.id = this.nextId++;
			this.users.push(user);
		} else {
			const index = this.users.findIndex((u) => u.id === user.id);
			if (index >= 0) this.users[index] = user;
			else this.users.push(user);
		}
		return user;
	}

	async delete(id: number) {
		this.users = this.users.filter((u) => u.id !== id);
	}
}

// Create a specific token for User repository
const USER_REPO = createToken<Repository<User>>('UserRepository');
GlobalInjector.bind(USER_REPO, InMemoryUserRepository);

// Usage
@Injectable()
class UserManagementService {
	constructor(@Inject(USER_REPO) private userRepo: Repository<User>) {}

	async getUser(id: number) {
		return this.userRepo.findById(id);
	}

	async listUsers() {
		return this.userRepo.findAll();
	}

	async createUser(name: string, email: string) {
		return this.userRepo.save({ id: 0, name, email });
	}
}

// ============================================================================
// PATTERN 6: Symbol Tokens (Unique)
// ============================================================================

/**
 * Symbols guarantee uniqueness - no collisions possible
 */

const CONFIG_TOKEN = Symbol('AppConfig');
const FEATURE_FLAGS = Symbol('FeatureFlags');

interface AppConfig {
	apiUrl: string;
	timeout: number;
	retries: number;
}

interface FeatureFlags {
	darkMode: boolean;
	betaFeatures: boolean;
	analytics: boolean;
}

GlobalInjector.bindValue(CONFIG_TOKEN, {
	apiUrl: 'https://api.example.com',
	timeout: 5000,
	retries: 3
} as AppConfig);

GlobalInjector.bindValue(FEATURE_FLAGS, {
	darkMode: true,
	betaFeatures: false,
	analytics: true
} as FeatureFlags);

// Usage
class FeatureService {
	constructor(
		@Inject(CONFIG_TOKEN) private config: AppConfig,
		@Inject(FEATURE_FLAGS) private features: FeatureFlags
	) {}

	isEnabled(feature: keyof FeatureFlags): boolean {
		return this.features[feature];
	}

	getApiUrl(): string {
		return this.config.apiUrl;
	}
}

// ============================================================================
// PATTERN 7: Testing with Mock Implementations
// ============================================================================

/**
 * Easy to swap implementations for testing
 */

// Mock implementations
class MockLogger implements ILogger {
	logs: string[] = [];
	errors: string[] = [];
	warnings: string[] = [];

	log(message: string) {
		this.logs.push(message);
	}
	error(message: string) {
		this.errors.push(message);
	}
	warn(message: string) {
		this.warnings.push(message);
	}

	clear() {
		this.logs = [];
		this.errors = [];
		this.warnings = [];
	}
}

class MockCache implements ICache {
	data = new Map<string, unknown>();

	get<T>(key: string): T | undefined {
		return this.data.get(key) as T;
	}
	set<T>(key: string, value: T): void {
		this.data.set(key, value);
	}
	delete(key: string): void {
		this.data.delete(key);
	}

	clear() {
		this.data.clear();
	}
}

// Test setup helper
function setupTestInjector(): Injector {
	const testInjector = new Injector();

	// Bind mock implementations
	testInjector.bind(LOGGER, MockLogger);
	testInjector.bind(CACHE, MockCache);
	testInjector.bindValue('API_URL', 'http://test.local');

	return testInjector;
}

// Example test
function exampleTest() {
	const injector = setupTestInjector();

	// Get the mock to verify calls
	const mockLogger = injector.get(LOGGER) as MockLogger;

	// Get service (would use the mock)
	const service = injector.get(CachedApiService);

	// After test, verify
	console.log('Logged messages:', mockLogger.logs);
}

// ============================================================================
// PATTERN 8: Provider Registration
// ============================================================================

/**
 * Declarative provider registration for bulk setup
 */

import type { Provider } from './types';

const providers: Provider[] = [
	// Class
	UserService,

	// Class with custom token
	{ provide: LOGGER, useClass: ConsoleLogger },
	{ provide: CACHE, useClass: MemoryCache },

	// Values
	{ provide: 'API_URL', useValue: 'https://api.example.com' },
	{
		provide: 'APP_CONFIG',
		useValue: {
			debug: false,
			version: '2.0.0'
		}
	},

	// Factories
	{
		provide: 'DbConnection',
		useFactory: () => new PostgresConnection('postgres://localhost/db')
	},
	{
		provide: 'Timestamp',
		useFactory: () => Date.now(),
		singleton: false
	}
];

// Register all at once
function registerProviders(injector: Injector, providers: Provider[]) {
	for (const provider of providers) {
		injector.register(provider);
	}
}

// ============================================================================
// COMPARISON TABLE
// ============================================================================

/*
┌─────────────────────┬──────────────┬───────────────┬────────────────┬──────────────────┐
│ Pattern             │ Type Safety  │ Token Type    │ Best For       │ Example          │
├─────────────────────┼──────────────┼───────────────┼────────────────┼──────────────────┤
│ Class Token         │ ✓ Full       │ Class         │ Concrete deps  │ UserService      │
│ Value Binding       │ ✓ Full       │ Any           │ Config, URLs   │ 'API_URL'        │
│ Factory Binding     │ ✓ Full       │ Any           │ Complex init   │ DbConnection     │
│ createToken<T>()    │ ✓ Full       │ Symbol        │ Interfaces     │ ILogger, ICache  │
│ Abstract Class      │ ✓ Full       │ Class         │ Class hierarchy│ Repository<T>    │
│ Symbol Token        │ Manual       │ Symbol        │ Unique keys    │ Symbol('Config') │
│ String Token        │ Manual       │ String        │ Simple cases   │ 'ApiUrl'         │
└─────────────────────┴──────────────┴───────────────┴────────────────┴──────────────────┘

RECOMMENDATIONS:
- Use class tokens for concrete services
- Use createToken<T>() for interface injection
- Use bindValue() for configuration
- Use bindFactory() for complex initialization
- Use abstract classes for class hierarchies
*/

// ============================================================================
// EXPORTS
// ============================================================================

export {
	// Services
	UserService,
	CachedApiService,
	UserManagementService,
	ApiService,
	DataRepository,
	FeatureService,
	// Tokens
	LOGGER,
	CACHE,
	USER_REPO,
	CONFIG_TOKEN,
	FEATURE_FLAGS,
	// Implementations
	ConsoleLogger,
	MemoryCache,
	InMemoryUserRepository,
	// Mocks
	MockLogger,
	MockCache,
	// Helpers
	setupTestInjector,
	registerProviders,
	providers
};
