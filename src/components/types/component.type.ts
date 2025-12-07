import type { IElementRef } from '../interfaces/ielement-ref.interface';
import type { ILifeCycleHooks } from '../interfaces/ilife-cycle-hooks.interface';

export type Component = Partial<ILifeCycleHooks> & Partial<IElementRef>;
