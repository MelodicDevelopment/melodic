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
<ml-alert variant="success" alert-title="Saved!">
  Your changes have been saved.
</ml-alert>

<ml-alert variant="error" alert-title="Error" dismissible @ml:dismiss=${this.handleDismiss}>
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
| `alertTitle` | `string` | `''` | Optional bold title (attribute: `alert-title`) |
| `dismissible` | `boolean` | `false` | Show an × dismiss button |

> **Deprecated:** the `title` attribute/property still works as an alias for `alert-title` but logs a
> one-time warning — it collides with the global HTML `title` attribute (native browser tooltip).
> The alias will be removed in the next major release.

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
| `label` | `string` | `''` | Optional text label |
| `showValue` | `boolean` | `false` | Display percentage text |
| `shape` | `'linear'` \| `'circle'` \| `'half-circle'` | `'linear'` | Bar, ring, or gauge |
| `labelPosition` | `'top'` \| `'right'` \| `'bottom'` \| `'floating-top'` \| `'floating-bottom'` \| `'none'` | `'top'` | Where the label sits relative to the track |

```html
<ml-progress value="40" shape="circle" show-value></ml-progress>
<ml-progress value="60" shape="half-circle" show-value></ml-progress>
<ml-progress value="80" label="Upload" show-value label-position="right"></ml-progress>
```

---

## ml-toast (via ToastService)

Toasts are displayed through the injectable `ToastService`. You do not place any HTML in your template — the service manages its own container.

Every `show`/`info`/`success`/`warning`/`error` call returns a handle, so a toast can be
dismissed before its timer fires:

```ts
const saving = this._toastService.info('Saving…', undefined);
await save();
saving.dismiss();
```

`dismissAll()` clears everything on screen, and `setMaxVisible(n)` caps how many are shown
at once (default 5, `0` for unlimited) — the oldest is dropped when the cap is exceeded.

The container is an `aria-live="polite"` region. Only `error` toasts use `role="alert"`
(assertive), so a success message does not interrupt what the user is reading.

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

**Using `<ml-toast>` directly:** the toast element itself accepts `variant`, `toast-title`, `message`,
`duration`, and `dismissible` attributes. The deprecated `title` attribute still works as an alias for
`toast-title` (one-time console warning) but collides with the global HTML `title` attribute and will be
removed in the next major release. `ToastService` sets `toast-title`, so service-created toasts no longer
show a native browser tooltip.
