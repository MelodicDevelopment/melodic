import type { TemplateResult } from '../../template/template';

export type ComponentMeta = {
	selector: string;
	template?: (component: any, attributes?: Record<string, string>) => TemplateResult;
	styles?: () => TemplateResult;
	attributes?: string[];
};

export type TypedComponentMeta<T> = Omit<ComponentMeta, 'template'> & {
	template?: (component: T, attributes?: Record<string, string>) => TemplateResult;
};
