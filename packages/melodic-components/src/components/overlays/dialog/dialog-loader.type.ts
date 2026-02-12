export type DialogComponentLoader<T = unknown> = (new (...args: unknown[]) => T) & { selector: string };
