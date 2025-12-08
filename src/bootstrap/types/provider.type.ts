import type { InjectionEngine } from '../../injection';

export type Provider = (injector: InjectionEngine) => void;
