import type { MessageMap, MessageValue } from '../types/validation.types';

const globalMessages: MessageMap = {};

export function registerDefaultMessages(messages: MessageMap): void {
	for (const code of Object.keys(messages)) {
		globalMessages[code] = messages[code];
	}
}

export function setDefaultMessage(code: string, message: MessageValue): void {
	globalMessages[code] = message;
}

export function getGlobalMessage(code: string): MessageValue | undefined {
	return globalMessages[code];
}

export function resolveMessage(message: MessageValue, params: Record<string, unknown> | undefined): string {
	if (typeof message === 'function') {
		return message(params ?? {});
	}
	return message;
}
