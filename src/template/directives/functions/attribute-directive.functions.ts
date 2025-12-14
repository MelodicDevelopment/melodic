import type { AttributeDirectiveFunction } from '../types/attribute-directive-function.type';

const directiveRegistry = new Map<string, AttributeDirectiveFunction>();

const findAttributeDirective = (name: string): AttributeDirectiveFunction | undefined => {
	if (directiveRegistry.has(name)) {
		return directiveRegistry.get(name);
	}

	const lowerName = name.toLowerCase();
	for (const [key, value] of directiveRegistry) {
		if (key.toLowerCase() === lowerName) {
			return value;
		}
	}

	return undefined;
};

export function registerAttributeDirective(name: string, directive: AttributeDirectiveFunction): void {
	directiveRegistry.set(name, directive);
}

export function getAttributeDirective(name: string): AttributeDirectiveFunction | undefined {
	return findAttributeDirective(name);
}

export function hasAttributeDirective(name: string): boolean {
	return findAttributeDirective(name) !== undefined;
}

export function unregisterAttributeDirective(name: string): boolean {
	return directiveRegistry.delete(name);
}

export function getRegisteredDirectives(): string[] {
	return Array.from(directiveRegistry.keys());
}
