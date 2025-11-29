import type { TemplateResult } from '../../template/template';

export type ComponentMeta = {
	selector: string;
	template?: (component: any, attributes?: Record<string, string>) => string | TemplateResult;
	styles?: (component: any) => string;
	attributes?: string[];
};

export type TypedComponentMeta<T> = Omit<ComponentMeta, 'template' | 'styles'> & {
	template?: (component: T, attributes?: Record<string, string>) => string | TemplateResult;
	styles?: (component: T) => string;
};
