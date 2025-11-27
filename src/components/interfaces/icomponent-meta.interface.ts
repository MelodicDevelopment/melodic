export interface IComponentMeta {
	selector: string;
	template?: () => string;
	styles?: () => string;
	attributes?: string[];
}
