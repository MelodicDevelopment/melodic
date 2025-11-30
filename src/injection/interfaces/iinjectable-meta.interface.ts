export interface IInjectableMeta {
	token: string;
	dependencies?: string[];
	args?: unknown[];
	singleton?: boolean;
}
