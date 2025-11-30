import type { IDependency } from '../interfaces';

export type Token<T = any> = string | IDependency<T>;
