# @melodicdev/components

Themeable UI components built on the Melodic Framework.

## Install

```sh
npm install @melodicdev/components @melodicdev/core
```

`@melodicdev/core` is a peer dependency.

## Usage

Import component modules to register the custom elements.

```ts
import '@melodicdev/components/button';

document.body.innerHTML = `<ml-button>Click me</ml-button>`;
```

## Naming Conventions

### Elements

All components use kebab-case with `ml-` prefix (required by the HTML custom element spec):

```
ml-button, ml-input, ml-select, ml-checkbox, ml-toggle, etc.
```

### Events

All custom events use `ml:` namespace prefix to distinguish them from native DOM events:

```
ml:click, ml:change, ml:input, ml:focus, ml:blur, ml:open, ml:close, ml:dismiss
```

### Listening to Events

```html
<ml-button @ml:click=${this.handleClick}>Click me</ml-button>
<ml-input @ml:change=${this.handleChange}></ml-input>
<ml-select @ml:open=${this.handleOpen} @ml:close=${this.handleClose}></ml-select>
```

This naming convention provides clear visual distinction between Melodic component events (`ml:click`) and native DOM events (`click`).

---

## Icons

The `ml-icon` component displays icons using [Phosphor Icons](https://phosphoricons.com/) via font ligatures.

### Setup

1. Copy the font assets to your public directory. With Vite, use `vite-plugin-static-copy`:

```bash
npm install -D vite-plugin-static-copy
```

```ts
// vite.config.ts
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@melodicdev/components/assets/*',
          dest: 'public'
        }
      ]
    })
  ]
});
```

2. Add the font stylesheet to your HTML:

```html
<link rel="stylesheet" href="/public/fonts/phosphor/phosphor.css" />
```

### Usage

```ts
import '@melodicdev/components/icon';
```

```html
<ml-icon icon="house"></ml-icon>
<ml-icon icon="gear" size="lg"></ml-icon>
<ml-icon icon="heart" format="fill"></ml-icon>
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `icon` | `string` | `''` | Icon name (ligature). Browse icons at [phosphoricons.com](https://phosphoricons.com/) |
| `format` | `'regular'` \| `'bold'` \| `'fill'` \| `'light'` \| `'thin'` | `'regular'` | Icon weight/style |

> **Note:** Duotone icons are not available. The Phosphor duotone font does not support ligatures.

### Sizes

Set via the `size` attribute:

| Size | Value |
|------|-------|
| `xs` | 12px |
| `sm` | 16px |
| `md` | 24px (default) |
| `lg` | 32px |
| `xl` | 48px |

### Custom Color

Icons inherit `currentColor` by default. Override with CSS:

```css
ml-icon {
  --ml-icon-color: var(--ml-color-primary);
}
```

### Finding Icon Names

Visit [phosphoricons.com](https://phosphoricons.com/) to browse all available icons. The icon name shown on the site is the ligature value you pass to the `icon` property.

---

## Common Types

These types are shared across many components:

```ts
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Orientation = 'horizontal' | 'vertical';
type Placement = 'top' | 'top-start' | 'top-end'
               | 'bottom' | 'bottom-start' | 'bottom-end'
               | 'left' | 'left-start' | 'left-end'
               | 'right' | 'right-start' | 'right-end';
type ThemeMode = 'light' | 'dark' | 'system';
```

---

## Components

### Forms

#### ml-button

```ts
import '@melodicdev/components/button';
```

```html
<ml-button variant="primary" @ml:click=${this.handleClick}>Save</ml-button>
<ml-button variant="outline" size="sm">Cancel</ml-button>
<ml-button variant="danger" loading>Deleting...</ml-button>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'primary'` \| `'secondary'` \| `'outline'` \| `'ghost'` \| `'danger'` \| `'link'` | `'primary'` | Visual style |
| `size` | `Size` | `'md'` | Button size |
| `type` | `'button'` \| `'submit'` \| `'reset'` | `'button'` | HTML button type |
| `disabled` | `boolean` | `false` | Disable button |
| `loading` | `boolean` | `false` | Show loading spinner |
| `fullWidth` | `boolean` | `false` | Full-width button |

**Slots:** `default` (label), `icon-start`, `icon-end`
**Events:** `ml:click`

---

#### ml-input

```ts
import '@melodicdev/components/input';
```

```html
<ml-input
  label="Email"
  type="email"
  placeholder="you@example.com"
  hint="We'll never share your email."
  @ml:change=${this.handleChange}
></ml-input>

<ml-input label="Search" error="No results found">
  <ml-icon slot="prefix" icon="magnifying-glass"></ml-icon>
</ml-input>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `'text'` \| `'email'` \| `'password'` \| `'number'` \| `'tel'` \| `'url'` \| `'search'` \| `'date'` \| `'time'` \| `'datetime-local'` | `'text'` | Input type |
| `value` | `string` | `''` | Current value |
| `placeholder` | `string` | `''` | Placeholder text |
| `label` | `string` | `''` | Label text |
| `hint` | `string` | `''` | Hint text below input |
| `error` | `string` | `''` | Error message (shows error state) |
| `size` | `Size` | `'md'` | Input size |
| `disabled` | `boolean` | `false` | Disable input |
| `readonly` | `boolean` | `false` | Read-only input |
| `required` | `boolean` | `false` | Required field |
| `autocomplete` | `string` | `'off'` | Autocomplete attribute |

**Slots:** `prefix`, `suffix`
**Events:** `ml:input` `{ value }`, `ml:change` `{ value }`, `ml:focus`, `ml:blur`

---

#### ml-textarea

```ts
import '@melodicdev/components/textarea';
```

```html
<ml-textarea
  label="Message"
  placeholder="Type your message..."
  rows="5"
  maxLength="500"
  @ml:change=${this.handleChange}
></ml-textarea>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Current value |
| `placeholder` | `string` | `''` | Placeholder text |
| `label` | `string` | `''` | Label text |
| `hint` | `string` | `''` | Hint text |
| `error` | `string` | `''` | Error message |
| `size` | `Size` | `'md'` | Size variant |
| `rows` | `number` | `3` | Visible text lines |
| `maxLength` | `number` | `0` | Max characters (0 = unlimited) |
| `disabled` | `boolean` | `false` | Disable textarea |
| `readonly` | `boolean` | `false` | Read-only |
| `required` | `boolean` | `false` | Required field |
| `resize` | `boolean` | `false` | Allow vertical resize |

**Events:** `ml:input` `{ value }`, `ml:change` `{ value }`, `ml:focus`, `ml:blur`

Shows a character counter when `maxLength` is set.

---

#### ml-checkbox

```ts
import '@melodicdev/components/checkbox';
```

```html
<ml-checkbox
  label="Accept terms"
  hint="You must agree to continue"
  @ml:change=${this.handleChange}
></ml-checkbox>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Label text |
| `hint` | `string` | `''` | Hint text |
| `size` | `Size` | `'md'` | Checkbox size |
| `checked` | `boolean` | `false` | Checked state |
| `indeterminate` | `boolean` | `false` | Indeterminate state |
| `disabled` | `boolean` | `false` | Disabled state |

**Events:** `ml:change` `{ checked }`

---

#### ml-radio / ml-radio-group

```ts
import '@melodicdev/components/radio';
```

```html
<ml-radio-group
  label="Preferred contact"
  name="contact"
  value="email"
  @ml:change=${this.handleChange}
>
  <ml-radio value="email" label="Email"></ml-radio>
  <ml-radio value="phone" label="Phone"></ml-radio>
  <ml-radio value="mail" label="Mail" disabled></ml-radio>
</ml-radio-group>
```

**ml-radio-group:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Group label |
| `name` | `string` | `''` | Form field name |
| `value` | `string` | `''` | Selected value |
| `hint` | `string` | `''` | Hint text |
| `error` | `string` | `''` | Error message |
| `orientation` | `'horizontal'` \| `'vertical'` | `'vertical'` | Layout direction |
| `disabled` | `boolean` | `false` | Disable all radios |
| `required` | `boolean` | `false` | Required indicator |

**Events:** `ml:change` `{ value }`

**ml-radio:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | `''` | Radio group name |
| `value` | `string` | `''` | Radio value |
| `label` | `string` | `''` | Label text |
| `hint` | `string` | `''` | Hint text |
| `size` | `Size` | `'md'` | Size variant |
| `checked` | `boolean` | `false` | Checked state |
| `disabled` | `boolean` | `false` | Disabled state |

**Events:** `ml:change` `{ value, checked }`

---

#### ml-toggle

```ts
import '@melodicdev/components/toggle';
```

```html
<ml-toggle
  label="Dark mode"
  hint="Toggle dark theme"
  @ml:change=${this.handleToggle}
></ml-toggle>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Label text |
| `hint` | `string` | `''` | Hint text |
| `size` | `Size` | `'md'` | Toggle size |
| `checked` | `boolean` | `false` | Checked state |
| `disabled` | `boolean` | `false` | Disabled state |

**Events:** `ml:change` `{ checked }`

---

#### ml-select

```ts
import '@melodicdev/components/select';
```

```html
<!-- Single select -->
<ml-select
  label="Country"
  placeholder="Choose a country"
  .options=${this.countryOptions}
  @ml:change=${this.handleChange}
></ml-select>

<!-- Multi-select -->
<ml-select
  label="Tags"
  multiple
  .options=${this.tagOptions}
  .values=${this.selectedTags}
  @ml:change=${this.handleMultiChange}
></ml-select>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Label text |
| `placeholder` | `string` | `'Select an option'` | Placeholder text |
| `hint` | `string` | `''` | Hint text |
| `error` | `string` | `''` | Error message |
| `size` | `Size` | `'md'` | Size variant |
| `disabled` | `boolean` | `false` | Disable select |
| `required` | `boolean` | `false` | Required field |
| `multiple` | `boolean` | `false` | Multi-select mode |
| `value` | `string` | `''` | Selected value (single mode) |
| `values` | `string[]` | `[]` | Selected values (multi mode) |
| `options` | `SelectOption[]` | `[]` | Available options |

**SelectOption interface:**

```ts
interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  avatarUrl?: string;
  avatarAlt?: string;
}
```

**Events:**
- `ml:change` — single: `{ value, option }`, multi: `{ values, options, option }`
- `ml:open`, `ml:close`

Supports keyboard navigation (Arrow keys, Home, End, Enter, Space, Escape). Multi-select shows tags with inline search filtering.

---

#### ml-form-field

```ts
import '@melodicdev/components/form-field';
```

```html
<ml-form-field label="Username" hint="Choose a unique name" required>
  <ml-input placeholder="Enter username"></ml-input>
</ml-form-field>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Label text |
| `hint` | `string` | `''` | Hint text |
| `error` | `string` | `''` | Error message |
| `size` | `Size` | `'md'` | Field size |
| `orientation` | `'vertical'` \| `'horizontal'` | `'vertical'` | Layout direction |
| `disabled` | `boolean` | `false` | Disabled state |
| `required` | `boolean` | `false` | Required indicator |

**Slots:** `default` (form control)

Wrapper that adds label, hint, and error to any form control with automatic aria attribute connection.

---

#### ml-slider

```ts
import '@melodicdev/components/slider';
```

```html
<ml-slider
  label="Volume"
  value="75"
  min="0"
  max="100"
  showValue
  @ml:change=${this.handleChange}
></ml-slider>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Label text |
| `value` | `number` | `50` | Current value |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Step increment |
| `size` | `Size` | `'md'` | Slider size |
| `disabled` | `boolean` | `false` | Disable slider |
| `showValue` | `boolean` | `false` | Show current value |
| `hint` | `string` | `''` | Hint text |
| `error` | `string` | `''` | Error message |

**Events:** `ml:input` `{ value }`, `ml:change` `{ value }`

---

### Feedback

#### ml-spinner

```ts
import '@melodicdev/components/spinner';
```

```html
<ml-spinner></ml-spinner>
<ml-spinner size="lg" label="Loading data..."></ml-spinner>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `Size` | `'md'` | Spinner size |
| `label` | `string` | `'Loading'` | Screen reader label |

---

#### ml-alert

```ts
import '@melodicdev/components/alert';
```

```html
<ml-alert variant="success" title="Saved!" dismissible>
  Your changes have been saved successfully.
</ml-alert>

<ml-alert variant="error" title="Error">
  Something went wrong. Please try again.
</ml-alert>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'info'` \| `'success'` \| `'warning'` \| `'error'` | `'info'` | Alert variant |
| `title` | `string` | `''` | Optional title |
| `dismissible` | `boolean` | `false` | Show dismiss button |

**Slots:** `default` (message content), `icon` (custom icon)
**Events:** `ml:dismiss`

Default icons per variant: info → `info`, success → `check-circle`, warning → `warning`, error → `x-circle`.

---

#### ml-progress

```ts
import '@melodicdev/components/progress';
```

```html
<ml-progress value="65" label="Upload progress" showValue></ml-progress>
<ml-progress value="100" variant="success" size="lg"></ml-progress>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `number` | `0` | Current value (0–max) |
| `max` | `number` | `100` | Maximum value |
| `variant` | `'primary'` \| `'success'` \| `'warning'` \| `'error'` | `'primary'` | Color variant |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Bar height |
| `label` | `string` | `''` | Optional label above bar |
| `showValue` | `boolean` | `false` | Show percentage text |

---

#### ml-toast (via ToastService)

Toasts are displayed via the injectable `ToastService`. You do not need to place any toast elements in your templates — the service manages everything automatically.

```ts
import '@melodicdev/components/toast';
import { ToastService } from '@melodicdev/components';
```

```ts
@Service(ToastService)
private readonly _toastService!: ToastService;

// Shorthand methods
this._toastService.success('Saved', 'Your changes have been saved.');
this._toastService.error('Error', 'Something went wrong.');
this._toastService.warning('Warning', 'This action cannot be undone.');
this._toastService.info('Info', 'New updates available.');

// Full config
this._toastService.show({
  variant: 'success',
  title: 'Uploaded',
  message: 'File uploaded successfully.',
  duration: 8000,
  dismissible: true
});

// Change position (default: 'top-right')
this._toastService.setPosition('bottom-center');
```

**ToastService methods:**

| Method | Description |
|--------|-------------|
| `show(config: IToastConfig)` | Show toast with full configuration |
| `info(title, message?)` | Show info toast |
| `success(title, message?)` | Show success toast |
| `warning(title, message?)` | Show warning toast |
| `error(title, message?)` | Show error toast |
| `setPosition(position)` | Set container position |

**IToastConfig:**

```ts
interface IToastConfig {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message?: string;
  duration?: number;    // ms, 0 = no auto-dismiss (default: 5000)
  dismissible?: boolean; // default: true
}
```

**ToastPosition:** `'top-right'` | `'top-left'` | `'top-center'` | `'bottom-right'` | `'bottom-left'` | `'bottom-center'`

---

### Foundation

#### ml-card

```ts
import '@melodicdev/components/card';
```

```html
<ml-card>
  <div slot="header">Card Title</div>
  <p>Card content goes here.</p>
  <div slot="footer">
    <ml-button variant="outline" size="sm">Cancel</ml-button>
    <ml-button size="sm">Save</ml-button>
  </div>
</ml-card>

<ml-card variant="outlined" hoverable clickable @ml:click=${this.handleClick}>
  <p>Clickable card</p>
</ml-card>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default'` \| `'outlined'` \| `'elevated'` \| `'filled'` | `'default'` | Visual style |
| `hoverable` | `boolean` | `false` | Hover effect |
| `clickable` | `boolean` | `false` | Clickable card |

**Slots:** `header`, `default` (body), `footer`
**Events:** `ml:click` `{ originalEvent }` (when clickable)

---

#### ml-divider

```ts
import '@melodicdev/components/divider';
```

```html
<ml-divider></ml-divider>
<ml-divider>OR</ml-divider>
<ml-divider orientation="vertical"></ml-divider>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `orientation` | `'horizontal'` \| `'vertical'` | `'horizontal'` | Direction |

**Slots:** `default` (optional label text in the divider)

---

#### ml-stack

```ts
import '@melodicdev/components/stack';
```

```html
<ml-stack direction="horizontal" gap="4" align="center">
  <ml-button>One</ml-button>
  <ml-button>Two</ml-button>
  <ml-button>Three</ml-button>
</ml-stack>

<ml-stack gap="6" justify="between">
  <div>Top</div>
  <div>Bottom</div>
</ml-stack>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `direction` | `'horizontal'` \| `'vertical'` | `'vertical'` | Stack direction |
| `gap` | `string` | `'4'` | Gap using spacing scale (1–12) |
| `align` | `'start'` \| `'center'` \| `'end'` \| `'stretch'` \| `'baseline'` | `'stretch'` | Cross-axis alignment |
| `justify` | `'start'` \| `'center'` \| `'end'` \| `'between'` \| `'around'` \| `'evenly'` | `'start'` | Main-axis justification |
| `wrap` | `boolean` | `false` | Allow wrapping |

**Slots:** `default` (stack items)

Gap maps to CSS variable `var(--ml-space-{gap})`.

---

#### ml-container

```ts
import '@melodicdev/components/container';
```

```html
<ml-container size="lg" padding="6">
  <h1>Page content</h1>
  <p>Centered with max-width constraint.</p>
</ml-container>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'sm'` \| `'md'` \| `'lg'` \| `'xl'` \| `'full'` | `'lg'` | Max-width preset |
| `padding` | `string` | `'4'` | Horizontal padding (spacing scale 1–12) |
| `centered` | `boolean` | `true` | Center with auto margins |

**Size presets:** sm = 640px, md = 768px, lg = 1024px, xl = 1280px, full = 100%

**Slots:** `default` (content)

---

### Data Display

#### ml-avatar

```ts
import '@melodicdev/components/avatar';
```

```html
<ml-avatar src="https://example.com/photo.jpg" alt="Jane Doe" size="lg"></ml-avatar>
<ml-avatar initials="JD" size="md"></ml-avatar>
<ml-avatar rounded>
  <ml-icon icon="user"></ml-icon>
</ml-avatar>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string` | `''` | Image URL |
| `alt` | `string` | `''` | Alt text |
| `initials` | `string` | `''` | Initials fallback (max 2 chars, uppercased) |
| `size` | `Size` | `'md'` | Avatar size |
| `rounded` | `boolean` | `false` | Rounded square instead of circle |

**Slots:** `default` (custom fallback icon)

Fallback order: image → initials → slot content → default user icon.

---

#### ml-badge

```ts
import '@melodicdev/components/badge';
```

```html
<ml-badge variant="success">Active</ml-badge>
<ml-badge variant="error" dot pill>3 errors</ml-badge>
<ml-badge variant="warning" size="sm">Pending</ml-badge>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default'` \| `'primary'` \| `'success'` \| `'warning'` \| `'error'` | `'default'` | Color variant |
| `size` | `Size` | `'md'` | Badge size |
| `dot` | `boolean` | `false` | Show dot indicator |
| `pill` | `boolean` | `false` | Pill (rounded) shape |

**Slots:** `default` (label)

---

### Navigation

#### ml-tabs / ml-tab / ml-tab-panel

```ts
import '@melodicdev/components/tabs';
```

```html
<ml-tabs value="general" @ml:change=${this.handleTabChange}>
  <ml-tab slot="tab" value="general" label="General" icon="gear"></ml-tab>
  <ml-tab slot="tab" value="security" label="Security" icon="lock"></ml-tab>
  <ml-tab slot="tab" value="billing" label="Billing" icon="credit-card"></ml-tab>

  <ml-tab-panel value="general">General settings content</ml-tab-panel>
  <ml-tab-panel value="security">Security settings content</ml-tab-panel>
  <ml-tab-panel value="billing">Billing settings content</ml-tab-panel>
</ml-tabs>
```

**ml-tabs:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Active tab value |
| `variant` | `'line'` \| `'enclosed'` \| `'pills'` | `'line'` | Visual variant |
| `size` | `Size` | `'md'` | Size variant |
| `orientation` | `'horizontal'` \| `'vertical'` | `'horizontal'` | Tab layout |
| `routed` | `boolean` | `false` | Router integration |
| `tabs` | `TabConfig[]` | `[]` | Tab configs (alternative to slots) |

**Events:** `ml:change` `{ value }`

**ml-tab:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Tab identifier |
| `label` | `string` | `''` | Tab label |
| `icon` | `string` | `''` | Optional icon |
| `disabled` | `boolean` | `false` | Disable tab |
| `href` | `string` | `''` | URL for routed tabs |

**ml-tab-panel:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Panel identifier (must match tab value) |

Supports keyboard navigation (Arrow keys, Home, End).

---

#### ml-breadcrumb / ml-breadcrumb-item

```ts
import '@melodicdev/components/breadcrumb';
```

```html
<ml-breadcrumb separator="chevron">
  <ml-breadcrumb-item href="/" icon="house">Home</ml-breadcrumb-item>
  <ml-breadcrumb-item href="/settings">Settings</ml-breadcrumb-item>
  <ml-breadcrumb-item current>Profile</ml-breadcrumb-item>
</ml-breadcrumb>
```

**ml-breadcrumb:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `separator` | `'chevron'` \| `'slash'` | `'chevron'` | Separator style |

**ml-breadcrumb-item:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `href` | `string` | `''` | Link URL (omit for current page) |
| `icon` | `string` | `''` | Optional left icon |
| `current` | `boolean` | `false` | Marks as current/active page |

Items automatically inherit the separator style from their parent.

---

#### ml-pagination

```ts
import '@melodicdev/components/pagination';
```

```html
<ml-pagination
  page="1"
  totalPages="20"
  siblings="1"
  @ml:page-change=${this.handlePageChange}
></ml-pagination>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `page` | `number` | `1` | Current page (1-based) |
| `totalPages` | `number` | `1` | Total number of pages |
| `siblings` | `number` | `1` | Pages shown around current |

**Events:** `ml:page-change` `{ page }`

Intelligently shows ellipsis for large page ranges. Always shows first and last page. Provides previous/next buttons.

---

### Overlays

#### ml-popover

```ts
import '@melodicdev/components/popover';
```

```html
<ml-popover placement="bottom" offset="8" arrow>
  <ml-button slot="trigger">Open Popover</ml-button>
  <div>
    <h3>Popover Title</h3>
    <p>Popover content goes here.</p>
  </div>
</ml-popover>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placement` | `Placement` | `'bottom'` | Position relative to trigger |
| `offset` | `number` | `8` | Gap in pixels |
| `manual` | `boolean` | `false` | Disable light-dismiss |
| `arrow` | `boolean` | `false` | Show arrow |

**Slots:** `trigger` (toggle element), `default` (content)
**Methods:** `open()`, `close()`, `toggle()`

Uses Popover API with `autoUpdate` for scroll/resize handling.

---

#### ml-tooltip

```ts
import '@melodicdev/components/tooltip';
```

```html
<ml-tooltip content="Save your changes" placement="top">
  <ml-button>Save</ml-button>
</ml-tooltip>
```

Or use the `tooltip` directive for inline usage:

```html
<ml-button ${tooltip('Save your changes', 'top')}>Save</ml-button>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `content` | `string` | `''` | Tooltip text |
| `placement` | `Placement` | `'top'` | Tooltip position |
| `delay` | `number` | `200` | Show delay in ms |

**Slots:** `default` (trigger element)

Shows on hover and focus. Uses `computePosition` with `flip`, `shift`, and `offset` middleware.

---

#### ml-dropdown

```ts
import '@melodicdev/components/dropdown';
```

```html
<ml-dropdown placement="bottom-start" @ml:select=${this.handleSelect}>
  <ml-button slot="trigger">
    Actions <ml-icon icon="caret-down"></ml-icon>
  </ml-button>

  <ml-dropdown-item value="edit" icon="pencil-simple">Edit</ml-dropdown-item>
  <ml-dropdown-item value="duplicate" icon="copy">Duplicate</ml-dropdown-item>
  <ml-dropdown-separator></ml-dropdown-separator>
  <ml-dropdown-item value="delete" icon="trash" destructive>Delete</ml-dropdown-item>
</ml-dropdown>
```

**With groups and addons:**

```html
<ml-dropdown>
  <ml-button slot="trigger">Menu</ml-button>

  <ml-dropdown-group label="Edit">
    <ml-dropdown-item value="cut" icon="scissors" addon="⌘X">Cut</ml-dropdown-item>
    <ml-dropdown-item value="copy" icon="copy" addon="⌘C">Copy</ml-dropdown-item>
    <ml-dropdown-item value="paste" icon="clipboard" addon="⌘V">Paste</ml-dropdown-item>
  </ml-dropdown-group>

  <ml-dropdown-separator></ml-dropdown-separator>

  <ml-dropdown-group label="Account">
    <ml-dropdown-item value="settings" icon="gear">Settings</ml-dropdown-item>
    <ml-dropdown-item value="signout" icon="sign-out" destructive>Sign Out</ml-dropdown-item>
  </ml-dropdown-group>
</ml-dropdown>
```

**ml-dropdown:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `placement` | `Placement` | `'bottom-start'` | Menu position |
| `offset` | `number` | `4` | Gap in pixels |
| `arrow` | `boolean` | `false` | Show arrow |

**Events:** `ml:select` `{ value }`, `ml:open`, `ml:close`
**Methods:** `open()`, `close()`, `toggle()`

**ml-dropdown-item:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Selection value |
| `icon` | `string` | `''` | Left icon (Phosphor) |
| `addon` | `string` | `''` | Right text (shortcuts, etc.) |
| `disabled` | `boolean` | `false` | Non-interactive |
| `destructive` | `boolean` | `false` | Red/danger styling |

**ml-dropdown-separator:** No properties. Renders a divider line.

**ml-dropdown-group:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Uppercase section header |

Supports full keyboard navigation (Arrow keys, Home, End, Enter, Space, Escape). Uses Popover API for light-dismiss.

---

#### ml-dialog

```ts
import '@melodicdev/components/dialog';
import { DialogService } from '@melodicdev/components';
```

**Declarative usage:**

```html
<ml-dialog #confirmDialog>
  <div slot="dialog-header">Confirm Action</div>
  <p>Are you sure you want to proceed?</p>
  <div slot="dialog-footer">
    <ml-button variant="outline" @ml:click=${() => this.closeDialog('confirmDialog')}>Cancel</ml-button>
    <ml-button @ml:click=${() => this.closeDialog('confirmDialog')}>Confirm</ml-button>
  </div>
</ml-dialog>

<ml-button @ml:click=${() => this.openDialog('confirmDialog')}>Open Dialog</ml-button>
```

**Dynamic (component-based) usage:**

```ts
@Service(DialogService)
private readonly _dialogService!: DialogService;

openConfirmDialog(): void {
  const ref = this._dialogService.open(ConfirmDialog, {
    data: { message: 'Are you sure?' },
    size: 'sm'
  });

  ref.afterClosed((result) => {
    if (result) {
      // User confirmed
    }
  });
}
```

**DialogService methods:**

| Method | Description |
|--------|-------------|
| `open(idOrComponent, config?)` | Open dialog by ID or component loader |
| `close(id, result?)` | Close dialog by ID with optional result |

**IDialogConfig:**

```ts
interface IDialogConfig<T = unknown> {
  data?: T;
  disableClose?: boolean;
  panelClass?: string | string[];
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'auto' | 'custom';
  width?: string;
}
```

**DialogRef:**

| Method | Description |
|--------|-------------|
| `open()` | Open the dialog |
| `close(result?)` | Close with optional result |
| `afterOpened(callback)` | Callback after open |
| `afterClosed(callback)` | Callback with result after close |

**Slots:** `dialog-header`, `default` (body), `dialog-footer`

Uses native `<dialog>` element. Closes on backdrop click (unless `disableClose` is set). Dynamic dialogs are auto-mounted to `document.body` and cleaned up on close.

---

#### ml-drawer

```ts
import '@melodicdev/components/drawer';
```

```html
<ml-drawer id="settingsDrawer" side="right" size="md">
  <span slot="drawer-header">Settings</span>
  <div>
    <p>Drawer content goes here.</p>
  </div>
  <div slot="drawer-footer">
    <ml-button variant="outline">Cancel</ml-button>
    <ml-button>Save</ml-button>
  </div>
</ml-drawer>

<ml-button @ml:click=${() => this.openDrawer('settingsDrawer')}>
  Open Drawer
</ml-button>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `side` | `'left'` \| `'right'` | `'right'` | Slide-in direction |
| `size` | `'sm'` \| `'md'` \| `'lg'` \| `'xl'` | `'md'` | Width preset |
| `showClose` | `boolean` | `true` | Show close button |

**Size presets:** sm = 320px, md = 448px, lg = 672px, xl = 896px

**Slots:** `drawer-header`, `default` (body), `drawer-footer`
**Events:** `ml:open`, `ml:close`
**Methods:** `open()`, `close()`

Uses native `<dialog>` element. Closes on backdrop click.

---

## Theme System (Tokens + CSS)

Components use CSS custom property tokens (`--ml-*`) for consistent theming. Tokens are grouped by domain (colors, spacing, typography, shadows, borders, transitions, breakpoints). Component styles reference semantic tokens like `--ml-color-text` or `--ml-space-3` instead of raw values.

### Token Structure

Tokens are grouped by domain:
- Colors (primitive + semantic)
- Spacing
- Typography
- Shadows
- Borders
- Transitions
- Breakpoints

Source of truth:
- `packages/melodic-components/src/theme/tokens/colors.tokens.ts`
- `packages/melodic-components/src/theme/tokens/spacing.tokens.ts`
- `packages/melodic-components/src/theme/tokens/typography.tokens.ts`
- `packages/melodic-components/src/theme/tokens/shadows.tokens.ts`
- `packages/melodic-components/src/theme/tokens/borders.tokens.ts`
- `packages/melodic-components/src/theme/tokens/transitions.tokens.ts`
- `packages/melodic-components/src/theme/tokens/breakpoints.tokens.ts`

Tokens are combined in `packages/melodic-components/src/theme/tokens/all-tokens.ts`.

### Theme Presets

The preset CSS strings live here:
- Base (all tokens applied to `:root`): `packages/melodic-components/src/theme/presets/base.preset.ts`
- Light overrides: `packages/melodic-components/src/theme/presets/light.preset.ts`
- Dark overrides: `packages/melodic-components/src/theme/presets/dark.preset.ts`

The dark preset also supports `prefers-color-scheme: dark` when `data-theme="light"` is not set.

### Load Base + Presets

```ts
import { baseThemeCss, lightThemeCss, darkThemeCss } from '@melodicdev/components/theme';

const style = document.createElement('style');
style.textContent = `${baseThemeCss}\n${lightThemeCss}\n${darkThemeCss}`;
document.head.appendChild(style);
```

### Switch Themes

```ts
import { applyTheme } from '@melodicdev/components/theme';

applyTheme('dark'); // 'light' | 'dark' | 'system'
```

`system` follows the OS preference and updates on changes.

### Theme API

```ts
import {
  applyTheme,
  getTheme,
  getResolvedTheme,
  toggleTheme,
  onThemeChange,
  createTheme,
  injectTheme,
  createBrandTheme
} from '@melodicdev/components/theme';
```

| Function | Description |
|----------|-------------|
| `applyTheme(mode)` | Apply `'light'`, `'dark'`, or `'system'` theme |
| `getTheme()` | Get current theme mode |
| `getResolvedTheme()` | Get resolved `'light'` or `'dark'` value |
| `toggleTheme()` | Toggle between light and dark |
| `onThemeChange(callback)` | Subscribe to changes (returns unsubscribe fn) |
| `createTheme(name, overrides)` | Create custom theme CSS string |
| `injectTheme(name, overrides)` | Create and inject custom theme into document |
| `createBrandTheme(name, colors)` | Create brand theme with color overrides |

### Custom Themes

```ts
import { createTheme } from '@melodicdev/components/theme';

const brandCss = createTheme('brand', {
	'--ml-color-primary': '#4a6cff',
	'--ml-radius': '10px'
});

const style = document.createElement('style');
style.textContent = brandCss;
document.head.appendChild(style);

document.documentElement.setAttribute('data-theme', 'brand');
```

### Brand Theme Helper

`createBrandTheme` is a convenience helper for overriding semantic brand colors.

```ts
import { createBrandTheme } from '@melodicdev/components/theme';

const brandCss = createBrandTheme('brand', {
	primary: '#4a6cff',
	secondary: '#6b7280'
});
```

### Token Usage in CSS

```css
.ml-card {
	background: var(--ml-color-surface);
	color: var(--ml-color-text);
	border-radius: var(--ml-radius);
	box-shadow: var(--ml-shadow-sm);
	padding: var(--ml-space-4);
}
```

### Breakpoints

```ts
import { breakpoints } from '@melodicdev/components/theme';

if (window.innerWidth >= breakpoints.lg) {
	// Large screen logic
}
```

In CSS:

```css
@media (min-width: var(--ml-screen-lg)) {
	.ml-layout {
		padding: var(--ml-space-8);
	}
}
```
