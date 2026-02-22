# Feedback Components

- [ml-spinner](#ml-spinner)
- [ml-alert](#ml-alert)
- [ml-progress](#ml-progress)
- [ml-toast (ToastService)](#ml-toast-via-toastservice)

---

## ml-spinner

```ts
import '@melodicdev/components/spinner';
```

```html
<ml-spinner></ml-spinner>
<ml-spinner size="lg" label="Loading data..."></ml-spinner>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'xs'` \| `'sm'` \| `'md'` \| `'lg'` \| `'xl'` | `'md'` | Spinner size |
| `label` | `string` | `'Loading'` | Screen reader label (`aria-label`) |

---

## ml-alert

```ts
import '@melodicdev/components/alert';
```

```html
<ml-alert variant="success" title="Saved!">
  Your changes have been saved.
</ml-alert>

<ml-alert variant="error" title="Error" dismissible @ml:dismiss=${this.handleDismiss}>
  Something went wrong. Please try again.
</ml-alert>

<!-- Custom icon -->
<ml-alert variant="warning">
  <ml-icon slot="icon" icon="lightning"></ml-icon>
  High CPU usage detected.
</ml-alert>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'info'` \| `'success'` \| `'warning'` \| `'error'` | `'info'` | Alert variant |
| `title` | `string` | `''` | Optional bold title |
| `dismissible` | `boolean` | `false` | Show an × dismiss button |

**Slots:** `default` (message content), `icon` (custom icon override)

**Events:** `ml:dismiss` (emitted when dismiss button is clicked)

Default icons per variant: `info` → info, `success` → check-circle, `warning` → warning, `error` → x-circle.

---

## ml-progress

```ts
import '@melodicdev/components/progress';
```

```html
<ml-progress value="65" label="Upload progress" showValue></ml-progress>
<ml-progress value="100" variant="success" size="lg"></ml-progress>
<ml-progress value="30" variant="warning"></ml-progress>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | `0` | Current value (0 to `max`) |
| `max` | `number` | `100` | Maximum value |
| `variant` | `'primary'` \| `'success'` \| `'warning'` \| `'error'` | `'primary'` | Color variant |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Bar height |
| `label` | `string` | `''` | Optional text label above the bar |
| `showValue` | `boolean` | `false` | Display percentage text |

---

## ml-toast (via ToastService)

Toasts are displayed through the injectable `ToastService`. You do not place any HTML in your template — the service manages its own container.

```ts
import '@melodicdev/components/toast';
import { ToastService } from '@melodicdev/components';
```

```ts
// Inject via @Service decorator
@Service(ToastService)
private readonly _toasts!: ToastService;

// Shorthand methods
this._toasts.success('Saved', 'Your changes have been saved.');
this._toasts.error('Error', 'Something went wrong.');
this._toasts.warning('Warning', 'This action cannot be undone.');
this._toasts.info('Info', 'New updates are available.');

// Full config
this._toasts.show({
  variant: 'success',
  title: 'Uploaded',
  message: 'File uploaded successfully.',
  duration: 8000,
  dismissible: true,
});

// Change container position
this._toasts.setPosition('bottom-center');
```

**ToastService methods:**

| Method | Description |
|--------|-------------|
| `show(config)` | Show a toast with full configuration |
| `info(title, message?)` | Info toast |
| `success(title, message?)` | Success toast |
| `warning(title, message?)` | Warning toast |
| `error(title, message?)` | Error toast |
| `setPosition(position)` | Move the toast container |

**IToastConfig:**

```ts
interface IToastConfig {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message?: string;
  duration?: number;    // milliseconds; 0 = no auto-dismiss (default: 5000)
  dismissible?: boolean; // default: true
}
```

**ToastPosition values:** `'top-right'` | `'top-left'` | `'top-center'` | `'bottom-right'` | `'bottom-left'` | `'bottom-center'`
