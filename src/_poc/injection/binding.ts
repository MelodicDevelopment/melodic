/**
 * Binding - Represents a registered dependency
 *
 * Supports three binding types:
 * - class: Instantiated via constructor
 * - value: Literal value returned as-is
 * - factory: Function called to produce value
 */

import type { BindingType, INewable, Token } from './types';
import { tokenToKey } from './types';

export class Binding<T> {
	private _key: string;
	private _token: Token<T>;
	private _type: BindingType;
	private _singleton: boolean;
	private _instance: T | undefined;

	// Class binding
	private _class?: INewable<T>;
	private _dependencies: string[] = [];
	private _args: unknown[] = [];

	// Value binding (stored in _instance for values)

	// Factory binding
	private _factory?: () => T;

	private constructor(token: Token<T>, type: BindingType) {
		this._token = token;
		this._key = tokenToKey(token);
		this._type = type;
		this._singleton = true; // Default to singleton
	}

	/**
	 * Create a class binding
	 */
	static forClass<T>(token: Token<T>, cls: INewable<T>): Binding<T> {
		const binding = new Binding<T>(token, 'class');
		binding._class = cls;
		return binding;
	}

	/**
	 * Create a value binding
	 */
	static forValue<T>(token: Token<T>, value: T): Binding<T> {
		const binding = new Binding<T>(token, 'value');
		binding._instance = value; // Values are always "resolved"
		return binding;
	}

	/**
	 * Create a factory binding
	 */
	static forFactory<T>(token: Token<T>, factory: () => T): Binding<T> {
		const binding = new Binding<T>(token, 'factory');
		binding._factory = factory;
		return binding;
	}

	// Getters
	get key(): string {
		return this._key;
	}

	get token(): Token<T> {
		return this._token;
	}

	get type(): BindingType {
		return this._type;
	}

	get isSingleton(): boolean {
		return this._singleton;
	}

	get isResolved(): boolean {
		return this._instance !== undefined;
	}

	get classRef(): INewable<T> | undefined {
		return this._class;
	}

	get dependencies(): string[] {
		return this._dependencies;
	}

	get args(): unknown[] {
		return this._args;
	}

	get factory(): (() => T) | undefined {
		return this._factory;
	}

	// Setters / Configuration

	/**
	 * Set whether this binding is a singleton
	 */
	setSingleton(value: boolean): this {
		this._singleton = value;
		return this;
	}

	/**
	 * Add dependency tokens (for class bindings)
	 */
	withDependencies(deps: string[]): this {
		this._dependencies = deps;
		return this;
	}

	/**
	 * Add constructor arguments (for class bindings)
	 */
	withArgs(args: unknown[]): this {
		this._args = args;
		return this;
	}

	// Instance management

	/**
	 * Get the cached instance (if singleton and resolved)
	 */
	getInstance(): T | undefined {
		return this._instance;
	}

	/**
	 * Cache an instance (for singletons)
	 */
	setInstance(instance: T): void {
		this._instance = instance;
	}

	/**
	 * Clear the cached instance
	 */
	clearInstance(): void {
		if (this._type !== 'value') {
			this._instance = undefined;
		}
	}
}
