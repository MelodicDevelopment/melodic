import type { INewable } from '../../interfaces';
import type { BindingType } from '../types/binding-type.type';
import type { Token } from '../types/token.type';
import { getTokenKey } from '../function/get-token-key.function';

export class Binding<T> {
	public readonly key: string;
	public readonly token: Token<T>;
	public readonly type: BindingType;

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

	public get isSingleton(): boolean {
		return this._singleton;
	}

	public get isResolved(): boolean {
		return this._resolved;
	}

	public get dependencies(): string[] {
		return this._dependencies;
	}

	public get args(): unknown[] {
		return this._args;
	}

	public get targetClass(): INewable<T> | undefined {
		return this._class;
	}

	public get factory(): (() => T) | undefined {
		return this._factory;
	}

	public setClass(cls: INewable<T>): this {
		this._class = cls;
		return this;
	}

	public setFactory(factory: () => T): this {
		this._factory = factory;
		return this;
	}

	public setSingleton(value: boolean): this {
		this._singleton = value;
		return this;
	}

	public withDependencies(deps: Token<unknown>[]): this {
		this._dependencies = deps.map((dep) => getTokenKey(dep));
		return this;
	}

	public withArgs(args: unknown[]): this {
		this._args = args;
		return this;
	}

	public getInstance(): T | undefined {
		return this._instance;
	}

	public setInstance(instance: T): this {
		this._instance = instance;
		this._resolved = true;
		return this;
	}

	public clearInstance(): this {
		this._instance = undefined;
		this._resolved = false;
		return this;
	}
}
