export { isDevMode, setDevMode, devWarn, resetDevWarnings } from './dev-mode';
export { getHook, emitDevtools, devtoolsListening, resetHook } from './hook';
export { createConsoleApi, installConsoleApi } from './console-api';

export type { IHookEvent, HookEventType, IMelodicDevtoolsHook, IComponentRecord } from './hook';
export type { IMelodicConsoleApi, IComponentInspection } from './console-api';
