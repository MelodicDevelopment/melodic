/**
 * HTTP Cache System
 */

import type { CacheEntry } from './types';

export class HttpCache {
	private memoryCache = new Map<string, CacheEntry>();
	private readonly storageKey = 'http_cache';

	set<T = any>(key: string, data: T, ttl: number, storage: 'memory' | 'localStorage' = 'memory', etag?: string, headers?: Record<string, string>): void {
		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			ttl,
			etag,
			headers: headers || {}
		};

		this.memoryCache.set(key, entry);

		if (storage === 'localStorage' && this.isLocalStorageAvailable()) {
			try {
				const cache = this.getLocalStorageCache();
				cache[key] = entry;
				localStorage.setItem(this.storageKey, JSON.stringify(cache));
			} catch (e) {
				// localStorage full or unavailable, silently fail
			}
		}
	}

	get<T = any>(key: string): CacheEntry<T> | null {
		// Check memory cache first
		let entry = this.memoryCache.get(key);

		// Fallback to localStorage if not in memory
		if (!entry && this.isLocalStorageAvailable()) {
			const cache = this.getLocalStorageCache();
			entry = cache[key];

			// Promote to memory cache
			if (entry) {
				this.memoryCache.set(key, entry);
			}
		}

		if (!entry) return null;

		// Check if expired
		if (this.isExpired(entry)) {
			this.delete(key);
			return null;
		}

		return entry as CacheEntry<T>;
	}

	has(key: string): boolean {
		return this.get(key) !== null;
	}

	delete(key: string): void {
		this.memoryCache.delete(key);

		if (this.isLocalStorageAvailable()) {
			try {
				const cache = this.getLocalStorageCache();
				delete cache[key];
				localStorage.setItem(this.storageKey, JSON.stringify(cache));
			} catch (e) {
				// Silently fail
			}
		}
	}

	clear(): void {
		this.memoryCache.clear();

		if (this.isLocalStorageAvailable()) {
			try {
				localStorage.removeItem(this.storageKey);
			} catch (e) {
				// Silently fail
			}
		}
	}

	generateKey(method: string, url: string, body?: BodyInit | null): string {
		let key = `${method}:${url}`;

		if (body) {
			// Hash the body for the cache key
			key += `:${this.hashCode(this.stringifyBody(body))}`;
		}

		return key;
	}

	private isExpired(entry: CacheEntry): boolean {
		return Date.now() - entry.timestamp > entry.ttl;
	}

	private isLocalStorageAvailable(): boolean {
		try {
			const test = '__test__';
			localStorage.setItem(test, test);
			localStorage.removeItem(test);
			return true;
		} catch (e) {
			return false;
		}
	}

	private getLocalStorageCache(): Record<string, CacheEntry> {
		try {
			const data = localStorage.getItem(this.storageKey);
			return data ? JSON.parse(data) : {};
		} catch (e) {
			return {};
		}
	}

	private stringifyBody(body: BodyInit): string {
		if (typeof body === 'string') return body;
		if (body instanceof FormData) {
			// FormData is not easily stringifiable, use a simple representation
			return '[FormData]';
		}
		if (body instanceof Blob) {
			return `[Blob:${body.size}]`;
		}
		if (body instanceof ArrayBuffer) {
			return `[ArrayBuffer:${body.byteLength}]`;
		}
		if (body instanceof URLSearchParams) {
			return body.toString();
		}
		return String(body);
	}

	private hashCode(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	}
}
