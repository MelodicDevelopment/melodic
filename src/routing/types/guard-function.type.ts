import type { IGuardContext } from '../interfaces/iguard-context.interface';
import type { AsyncGuardResult } from './guard-result.type';

export type GuardFunction = (context: IGuardContext) => AsyncGuardResult;
