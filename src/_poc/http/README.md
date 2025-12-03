# HTTP Client

A lightweight, feature-rich HTTP client built on the Fetch API with TypeScript support.

## Features

✅ **Request Deduplication** - Automatically shares responses for identical concurrent requests
✅ **Progress Tracking** - Track upload and download progress
✅ **Smart Caching** - Memory and localStorage caching with TTL and cache busting
✅ **Interceptors** - Transform requests and responses (Axios-style API)
✅ **Retry Logic** - Automatic retry with exponential backoff
✅ **Timeout Management** - Per-request and global timeout configuration
✅ **ETag Support** - Automatic conditional requests with 304 Not Modified handling
✅ **TypeScript** - Full type safety with TypeScript
✅ **Tiny Size** - Minimal footprint, zero dependencies
✅ **Async/Await** - Modern async API built on native fetch()

## Installation

```typescript
import { HttpClient } from './http';
```

## Quick Start

```typescript
// Create a client
const client = new HttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Authorization': 'Bearer token'
  }
});

// Make requests
const response = await client.get('/users');
console.log(response.data);
```

## Usage Examples

### Basic Requests

```typescript
// GET request
const users = await client.get('/users');

// POST request with body
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT, PATCH, DELETE
await client.put('/users/1', { name: 'Jane' });
await client.patch('/users/1', { email: 'jane@example.com' });
await client.delete('/users/1');
```

### Query Parameters

```typescript
const response = await client.get('/users', {
  params: {
    page: 1,
    limit: 10,
    sort: 'name'
  }
});
// Requests: /users?page=1&limit=10&sort=name
```

### Progress Tracking

```typescript
await client.post('/upload', formData, {
  onProgress: (progress) => {
    console.log(`${progress.phase}: ${progress.percentage}%`);
    console.log(`${progress.loaded} / ${progress.total} bytes`);
  }
});
```

### Caching

```typescript
// Enable caching for a request
const response = await client.get('/users', {
  cache: {
    enabled: true,
    ttl: 60000, // Cache for 1 minute
    storage: 'memory' // or 'localStorage'
  }
});

// Cache busting
const freshData = await client.get('/users', {
  cache: {
    enabled: true,
    bustCache: true // Ignore cache and fetch fresh data
  }
});

// Clear all cache
client.clearCache();
```

### Request Deduplication

Identical concurrent requests automatically share the same response:

```typescript
// These three requests will only make ONE network call
const [users1, users2, users3] = await Promise.all([
  client.get('/users'),
  client.get('/users'),
  client.get('/users')
]);

// Disable deduplication for a specific request
await client.get('/users', { deduplicate: false });
```

### Interceptors

```typescript
// Request interceptor
client.request.use(
  (config) => {
    // Add authentication token
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${getToken()}`
    };
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    throw error;
  }
);

// Response interceptor
client.response.use(
  (response) => {
    // Transform response data
    response.data = transformData(response.data);
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error instanceof HTTPError && error.response.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    throw error;
  }
);
```

### Retry Logic

```typescript
const response = await client.get('/unstable-endpoint', {
  retry: {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential', // or 'linear'
    retryOn: [500, 502, 503, 504], // Retry on these status codes
    shouldRetry: (error, attempt) => {
      // Custom retry logic
      return attempt < 3 && error instanceof NetworkError;
    }
  }
});
```

### Timeout

```typescript
// Per-request timeout
const response = await client.get('/slow-endpoint', {
  timeout: 5000 // 5 seconds
});

// Global timeout (in constructor)
const client = new HttpClient({
  timeout: 30000 // 30 seconds for all requests
});
```

### ETag Support

Automatic conditional requests with ETag:

```typescript
// First request: Server returns ETag
const response1 = await client.get('/data', {
  cache: { enabled: true }
});
// Response cached with ETag

// Second request: Sends If-None-Match header
const response2 = await client.get('/data', {
  cache: { enabled: true }
});
// If data unchanged, server returns 304 and cached data is used
```

### Error Handling

```typescript
import { HTTPError, NetworkError, TimeoutError, AbortError } from './http';

try {
  const response = await client.get('/users');
} catch (error) {
  if (error instanceof HTTPError) {
    console.error('HTTP Error:', error.response.status, error.response.data);
  } else if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else if (error instanceof TimeoutError) {
    console.error('Request timeout after', error.timeout, 'ms');
  } else if (error instanceof AbortError) {
    console.error('Request aborted');
  }
}
```

### Request Cancellation

```typescript
// Cancel all pending requests
client.cancelAll('User navigated away');
```

## Configuration Options

### HttpClientConfig

```typescript
interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  cache?: CacheStrategy;
  retry?: RetryConfig;
  credentials?: RequestCredentials;
  mode?: RequestMode;
}
```

### RequestConfig

```typescript
interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: BodyInit | null;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  cache?: CacheStrategy;
  cacheTTL?: number;
  retry?: RetryConfig;
  onProgress?: (progress: ProgressEvent) => void;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  deduplicate?: boolean;
}
```

### CacheStrategy

```typescript
interface CacheStrategy {
  enabled: boolean;
  ttl?: number; // Time to live in milliseconds
  storage?: 'memory' | 'localStorage';
  key?: string; // Custom cache key
  bustCache?: boolean; // Bypass cache
}
```

### RetryConfig

```typescript
interface RetryConfig {
  maxAttempts?: number;
  delay?: number; // Base delay in milliseconds
  backoff?: 'linear' | 'exponential';
  retryOn?: number[]; // HTTP status codes to retry
  shouldRetry?: (error: Error, attempt: number) => boolean;
}
```

## Response Structure

```typescript
interface HttpResponse<T = any> {
  data: T; // Response body
  status: number; // HTTP status code
  statusText: string; // HTTP status text
  headers: Headers; // Response headers
  config: RequestConfig; // Request configuration
  timing?: ResponseTiming; // Request timing information
}

interface ResponseTiming {
  start: number;
  end: number;
  duration: number; // in milliseconds
}
```

## Best Practices

### 1. Create a Singleton Instance

```typescript
// api.ts
export const api = new HttpClient({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add global interceptors
api.request.use((config) => {
  config.headers = {
    ...config.headers,
    'X-Request-ID': generateRequestId()
  };
  return config;
});
```

### 2. Type Your Responses

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const response = await client.get<User[]>('/users');
// response.data is typed as User[]
```

### 3. Handle Errors Consistently

```typescript
async function fetchWithErrorHandling<T>(
  fn: () => Promise<HttpResponse<T>>
): Promise<T | null> {
  try {
    const response = await fn();
    return response.data;
  } catch (error) {
    if (error instanceof HTTPError) {
      showNotification(`Error: ${error.response.status}`);
    } else if (error instanceof NetworkError) {
      showNotification('Network error. Please check your connection.');
    }
    return null;
  }
}

const users = await fetchWithErrorHandling(() => client.get<User[]>('/users'));
```

### 4. Use Cache for Read-Heavy Operations

```typescript
// Cache expensive queries
const dashboard = await client.get('/dashboard', {
  cache: {
    enabled: true,
    ttl: 300000, // 5 minutes
    storage: 'localStorage'
  }
});
```

### 5. Enable Retry for Critical Requests

```typescript
const result = await client.post('/payment', paymentData, {
  retry: {
    maxAttempts: 3,
    delay: 2000,
    backoff: 'exponential',
    retryOn: [500, 502, 503]
  }
});
```

## Size Comparison

This HTTP client is designed to be minimal:

- **Unminified:** ~15KB
- **Minified:** ~6KB
- **Gzipped:** ~2KB

Compare to alternatives:
- Axios: ~13KB gzipped
- Fetch (native): 0KB (but no features)

## Browser Support

Works in all modern browsers that support:
- Fetch API
- Promises
- AbortController

For older browsers, you may need polyfills.

## License

MIT
