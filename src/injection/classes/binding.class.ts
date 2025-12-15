import type { INewable } from '../../interfaces';
import type { BindingType } from '../types/binding-type.type';
import type { Token } from '../types/token.type';
import { getTokenKey } from '../function/get-token-key.function';

export class Binding<T> {
	readonly key: string;
	readonly token: Token<T>;
	readonly type: BindingType;

	private _class?: INewable<T>;
	private _factory?: () => T;
	private _instance?: T;
	private _singleton: boolean = true;
	private _dependencies: string[] = [];
	private _args: unknown[] = [];
	private _resolved: boolean = false;

	constructor(key: string, token: Token<T>, type: BindingType) {
		this.key = key;
		this.token = token;
		this.type = type;
	}

	get isSingleton(): boolean {
		return this._singleton;
	}

	get isResolved(): boolean {
		return this._resolved;
	}

	get dependencies(): string[] {
		return this._dependencies;
	}

	get args(): unknown[] {
		return this._args;
	}

	get targetClass(): INewable<T> | undefined {
		return this._class;
	}

	get factory(): (() => T) | undefined {
		return this._factory;
	}

	setClass(cls: INewable<T>): this {
		this._class = cls;
		return this;
	}

	setFactory(factory: () => T): this {
		this._factory = factory;
		return this;
	}

	setSingleton(value: boolean): this {
		this._singleton = value;
		return this;
	}

	withDependencies(deps: Token<unknown>[]): this {
		this._dependencies = deps.map((dep) => getTokenKey(dep));
		return this;
	}

	withArgs(args: unknown[]): this {
		this._args = args;
		return this;
	}

	getInstance(): T | undefined {
		return this._instance;
	}

	setInstance(instance: T): this {
		this._instance = instance;
		this._resolved = true;
		return this;
	}

	clearInstance(): this {
		this._instance = undefined;
		this._resolved = false;
		return this;
	}
}
