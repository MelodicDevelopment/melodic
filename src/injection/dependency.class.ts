import type { IDependency } from './interfaces/idependency.interface';

export class Dependency<T> {
	token: string;
	item: IDependency<T>;
	dependencies: string[] = [];
	args: unknown[] = [];
	singleton: boolean = true;
	instance!: T;

	constructor(token: string, item: IDependency<T>) {
		this.token = token;
		this.item = item;
	}

	addDependency(token: string): Dependency<T> {
		this.dependencies.push(token);
		return this;
	}

	addDependencies(tokens: string[]): Dependency<T> {
		tokens.forEach((token) => this.addDependency(token));
		return this;
	}

	addArg(value: unknown): Dependency<T> {
		this.args.push(value);
		return this;
	}

	addArgs(values: unknown[]): Dependency<T> {
		values.forEach((value) => this.addArg(value));
		return this;
	}

	setSingleton(singleton: boolean): Dependency<T> {
		this.singleton = singleton;
		return this;
	}

	isSingleton(): boolean {
		return this.singleton;
	}

	setInstance(instance: T): void {
		this.instance = instance;
	}

	getInstance(): T {
		return this.instance;
	}
}
