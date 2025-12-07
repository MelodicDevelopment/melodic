import type { INewable } from '../../interfaces';
import type { IInjectionToken } from '../interfaces/iinjection-token.interface';

export type Token<T> = string | symbol | INewable<T> | IInjectionToken<T>;
