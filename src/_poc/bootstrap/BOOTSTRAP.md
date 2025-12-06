# Melodic Bootstrap

The `bootstrap()` function handles global application configuration that can't be done via decorators - things that need runtime values or coordination across the app.

## What Bootstrap Does

| Feature | Why It Can't Be a Decorator |
|---------|----------------------------|
| HTTP client config | Needs runtime values (auth tokens, environment-specific URLs) |
| Global error handling | Must be set up before any code runs |
| Lifecycle hooks | Async initialization, coordinated startup |
| Root component mounting | Optional convenience, needs DOM ready |

## Quick Start

```typescript
// main.ts
import './services/todo.service';           // Self-registers via @Injectable
import './components/my-app/my-app.component';  // Self-registers via @MelodicComponent

import { bootstrap } from 'melodic/bootstrap';

await bootstrap({
  http: { baseURL: '/api' },
  rootComponent: 'my-app',
  target: '#app'
});
```

## Configuration Options

### http

Configure the global HTTP client:

```typescript
await bootstrap({
  http: {
    baseURL: 'https://api.example.com',
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    credentials: 'include',
    mode: 'cors'
  }
});
```

The HTTP client is then available via injection:

```typescript
@Injectable()
class UserService {
  constructor(@Inject(HttpClient) private http: HttpClient) {}

  getUsers() {
    return this.http.get('/users');
  }
}
```

### onBefore

Async hook that runs before bootstrap completes. Use for:
- Loading remote configuration
- Checking authentication
- Initializing third-party services

```typescript
await bootstrap({
  onBefore: async () => {
    // Load config from server
    const config = await fetch('/config.json').then(r => r.json());

    // Check if user is authenticated
    await authService.validateSession();

    // Initialize analytics
    analytics.init(config.analyticsKey);
  }
});
```

### onReady

Sync hook that runs after bootstrap completes:

```typescript
await bootstrap({
  onReady: () => {
    // Hide loading screen
    document.getElementById('loading')?.remove();

    // Start background tasks
    startPollingForUpdates();
  }
});
```

### onError

Global error handler for uncaught errors:

```typescript
await bootstrap({
  onError: (error, context) => {
    // context is 'error' or 'unhandledrejection'
    console.error(`[${context}]`, error);

    // Send to error tracking
    Sentry.captureException(error);

    // Show user notification
    showErrorToast('Something went wrong');
  }
});
```

### devMode

Enables development logging:

```typescript
await bootstrap({
  devMode: import.meta.env.DEV
});

// Console output:
// [Melodic] Bootstrap starting...
// [Melodic] Running onBefore hook...
// [Melodic] HTTP client configured { baseURL: '/api' }
// [Melodic] Mounted root component { component: 'my-app', target: '#app' }
// [Melodic] Bootstrap complete
```

### rootComponent & target

Optional root component mounting:

```typescript
await bootstrap({
  rootComponent: 'my-app',  // The custom element tag name
  target: '#app'            // CSS selector or HTMLElement
});
```

This is equivalent to:
```typescript
const el = document.createElement('my-app');
document.querySelector('#app').appendChild(el);
```

You can skip this and put the component directly in your HTML instead.

## Return Value

`bootstrap()` returns a `MelodicApp` instance:

```typescript
const app = await bootstrap({ ... });

// Access configured HTTP client
app.http?.get('/users');

// Get services from injector
const todoService = app.get(TodoService);

// Check dev mode
if (app.isDevMode) { ... }

// Access mounted root element
app.rootElement?.querySelector('.header');

// Cleanup (removes error handlers, unmounts root)
app.destroy();
```

## Slots and Root Components

When using `rootComponent`, you can pass content via slots by using the returned element:

```typescript
const app = await bootstrap({
  rootComponent: 'app-layout',
  target: '#app'
});

// Add slotted content after mounting
app.rootElement!.innerHTML = `
  <header slot="header">My App</header>
  <nav slot="sidebar">...</nav>
  <main slot="content">...</main>
`;
```

Or skip `rootComponent` and define everything in HTML:

```html
<div id="app">
  <app-layout>
    <header slot="header">My App</header>
    <nav slot="sidebar">...</nav>
    <main slot="content">...</main>
  </app-layout>
</div>
```

```typescript
// Just configure, don't mount
await bootstrap({
  http: { baseURL: '/api' },
  devMode: true
});
```

## Complete Example

```typescript
// main.ts
import './services/auth.service';
import './services/api.service';
import './components/app-shell/app-shell.component';

import { bootstrap } from 'melodic/bootstrap';

const app = await bootstrap({
  http: {
    baseURL: import.meta.env.VITE_API_URL,
    defaultHeaders: {
      'X-App-Version': __APP_VERSION__
    }
  },

  devMode: import.meta.env.DEV,

  onError: (error, context) => {
    console.error(`[${context}]`, error);
    if (import.meta.env.PROD) {
      Sentry.captureException(error);
    }
  },

  onBefore: async () => {
    // Restore session if token exists
    const token = localStorage.getItem('auth_token');
    if (token) {
      await app.get(AuthService).validateToken(token);
    }
  },

  onReady: () => {
    document.body.classList.remove('loading');
  },

  rootComponent: 'app-shell',
  target: '#app'
});
```

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body class="loading">
  <div id="app">
    <!-- app-shell will be mounted here -->
  </div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```
