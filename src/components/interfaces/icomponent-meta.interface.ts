import type { TemplateResult } from '../../template/template';

export interface IComponentMeta {
	selector: string;
	template?: (component: any, attributes?: Record<string, string>) => string | TemplateResult;
	styles?: (component: any) => string;
	attributes?: string[];
}
