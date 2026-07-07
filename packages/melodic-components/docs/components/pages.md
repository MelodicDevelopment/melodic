# Page Components

Full-page composite components: ready-made auth pages and a dashboard layout that compose the section components (`ml-app-shell`, `ml-page-header`) into complete screens.

- [ml-login-page](#ml-login-page)
- [ml-signup-page](#ml-signup-page)
- [ml-dashboard-page](#ml-dashboard-page)

---

## ml-login-page

Full-page login screen with a centered card or split (form + brand panel) layout.

```ts
import '@melodicdev/components/login-page';
```

```html
<!-- Centered (default) -->
<ml-login-page>
  <div slot="logo"><img src="logo.svg" alt="Acme" /></div>
  <form slot="form">
    <ml-input label="Email" type="email"></ml-input>
    <ml-input label="Password" type="password"></ml-input>
    <ml-button variant="primary" full-width>Log in</ml-button>
  </form>
  <div slot="footer">
    <a href="/forgot">Forgot password?</a>
    <a href="/signup">Sign up</a>
  </div>
</ml-login-page>

<!-- Split variant with brand panel -->
<ml-login-page variant="split" page-title="Welcome back">
  <form slot="form">...</form>
  <div slot="brand">Welcome back to our platform</div>
</ml-login-page>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'centered'` \| `'split'` | `'centered'` | Layout variant |
| `pageTitle` | `string` | `'Log in to your account'` | Page heading (attribute: `page-title`) |
| `description` | `string` | `'Welcome back! Please enter your details.'` | Supporting text below the heading |

> **Deprecated:** the `title` attribute/property still works as an alias for `page-title` but logs a
> one-time warning — it collides with the global HTML `title` attribute (native browser tooltip).
> The alias will be removed in the next major release.

**Slots:**

| Slot | Description |
|------|-------------|
| `logo` | Brand logo area above the heading |
| `header` | Custom header content (replaces the `page-title`/`description` heading) |
| `form` | The login form |
| `social` | Social login buttons |
| `footer` | Links like "Forgot password?", "Sign up" |
| `brand` | Content for the brand side (split variant only) |

---

## ml-signup-page

Full-page signup/registration screen. Identical structure to `ml-login-page`.

```ts
import '@melodicdev/components/signup-page';
```

```html
<ml-signup-page page-title="Create your account">
  <div slot="logo"><img src="logo.svg" alt="Acme" /></div>
  <form slot="form">...</form>
  <div slot="footer">
    <a href="/login">Already have an account? Log in</a>
  </div>
</ml-signup-page>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'centered'` \| `'split'` | `'centered'` | Layout variant |
| `pageTitle` | `string` | `'Create an account'` | Page heading (attribute: `page-title`) |
| `description` | `string` | `'Start your journey today.'` | Supporting text below the heading |

> **Deprecated:** the `title` alias behaves exactly as documented for `ml-login-page` above.

**Slots:** same as `ml-login-page` (`logo`, `header`, `form`, `social`, `footer`, `brand`).

---

## ml-dashboard-page

Composite dashboard layout. Composes `ml-app-shell` with `ml-page-header` to provide a complete page with sidebar, header, metrics row, main content, and an optional aside column.

```ts
import '@melodicdev/components/dashboard-page';
```

```html
<ml-dashboard-page page-title="Dashboard" description="Overview of your account">
  <ml-sidebar slot="sidebar">...</ml-sidebar>
  <ml-button slot="header-actions" variant="primary">Create</ml-button>

  <ml-stat-card slot="metrics" label="Revenue" value="$12,400"></ml-stat-card>
  <ml-stat-card slot="metrics" label="Users" value="1,289"></ml-stat-card>

  <div slot="main">
    <ml-table .rows=${rows} .columns=${cols}></ml-table>
  </div>

  <div slot="aside">
    <ml-activity-feed>...</ml-activity-feed>
  </div>
</ml-dashboard-page>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `pageTitle` | `string` | `''` | Page heading, forwarded to the composed `ml-page-header` (attribute: `page-title`) |
| `description` | `string` | `''` | Supporting text, forwarded to the header |
| `layout` | `'default'` \| `'wide'` \| `'full'` | `'default'` | Content layout variant (`default` shows the aside column when provided) |

> **Deprecated:** the `title` alias behaves exactly as documented for `ml-login-page` above.

**Slots:**

| Slot | Description |
|------|-------------|
| `sidebar` | Sidebar content (passed through to the app shell) |
| `header-actions` | Action buttons for the page header |
| `metrics` | Stat/metric cards row |
| `main` | Primary content area (tables, charts) |
| `aside` | Secondary content column (activity feed, notifications) — `default` layout only |
