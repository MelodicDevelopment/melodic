import type { Plugin } from 'vite';

export function minifyEsLibPlugin(options?: { target?: string }): Plugin;
export function minifyCssLiteralsPlugin(): Plugin;
export function minifyCssChunk(text: string, edges: { atStart: boolean; atEnd: boolean }): string | null;
export function minifyCssLiterals(source: string): string;
