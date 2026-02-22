# Forms Components

- [ml-button](#ml-button)
- [ml-button-group](#ml-button-group)
- [ml-input](#ml-input)
- [ml-textarea](#ml-textarea)
- [ml-checkbox](#ml-checkbox)
- [ml-radio / ml-radio-group](#ml-radio--ml-radio-group)
- [ml-radio-card-group / ml-radio-card](#ml-radio-card-group--ml-radio-card)
- [ml-toggle](#ml-toggle)
- [ml-select](#ml-select)
- [ml-slider](#ml-slider)
- [ml-date-picker](#ml-date-picker)
- [ml-form-field](#ml-form-field)

---

## ml-button

```ts
import '@melodicdev/components/button';
```

```html
<ml-button variant="primary">Save</ml-button>
<ml-button variant="outline" size="sm">Cancel</ml-button>
<ml-button variant="danger" loading>Deleting...</ml-button>
<ml-button variant="ghost" fullWidth>
  <ml-icon slot="icon-start" icon="plus"></ml-icon>
  Add item
</ml-button>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'primary'` \| `'secondary'` \| `'outline'` \| `'ghost'` \| `'danger'` \| `'link'` | `'primary'` | Visual style |
| `size` | `'xs'` \| `'sm'` \| `'md'` \| `'lg'` \| `'xl'` | `'md'` | Button size |
| `type` | `'button'` \| `'submit'` \| `'reset'` | `'button'` | HTML button type |
| `disabled` | `boolean` | `false` | Disable the button |
| `loading` | `boolean` | `false` | Show loading spinner, disables click |
| `fullWidth` | `boolean` | `false` | Stretch to container width |

**Slots:** `default` (label text), `icon-start` (left icon), `icon-end` (right icon)

**Events:** `ml:click`

---

## ml-button-group

A group of connected toggle buttons for single or multiple selection.

```ts
import '@melodicdev/components/button-group';
```

```html
<!-- Single selection (toolbar view switcher) -->
<ml-button-group value="list" @ml:change=${e => this.view = e.detail.value}>
  <ml-button-group-item value="list" icon="list">List</ml-button-group-item>
  <ml-button-group-item value="grid" icon="grid-four">Grid</ml-button-group-item>
  <ml-button-group-item value="map" icon="map-pin">Map</ml-button-group-item>
</ml-button-group>

<!-- Multiple selection (text formatting) -->
<ml-button-group multiple variant="solid">
  <ml-button-group-item value="bold" icon="text-bolder"></ml-button-group-item>
  <ml-button-group-item value="italic" icon="text-italic"></ml-button-group-item>
  <ml-button-group-item value="underline" icon="text-underline"></ml-button-group-item>
</ml-button-group>
```

**ml-button-group:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Active value (single mode) |
| `values` | `string[]` | `[]` | Active values (multiple mode) |
| `variant` | `'outline'` \| `'solid'` | `'outline'` | Active item style — `outline` uses gray, `solid` uses primary color |
| `size` | `Size` | `'md'` | Group size |
| `disabled` | `boolean` | `false` | Disable entire group |
| `multiple` | `boolean` | `false` | Allow multiple selections |

**Events:** `ml:change` — single: `{ value: string }`, multiple: `{ values: string[] }`

**ml-button-group-item:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Item identifier |
| `icon` | `string` | `''` | Optional Phosphor icon |
| `disabled` | `boolean` | `false` | Disable this item |

**Slots:** `default` (label — can be omitted for icon-only items)

---

## ml-input

```ts
import '@melodicdev/components/input';
```

```html
<ml-input label="Email" type="email" placeholder="you@example.com" hint="We'll never share your email."></ml-input>

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
| `disabled` | `boolean` | `false` | Disable the input |
| `readonly` | `boolean` | `false` | Read-only |
| `required` | `boolean` | `false` | Required indicator |
| `autocomplete` | `string` | `'off'` | HTML autocomplete |

**Slots:** `prefix` (left decoration), `suffix` (right decoration)

**Events:** `ml:input` `{ value }`, `ml:change` `{ value }`, `ml:focus`, `ml:blur`

---

## ml-textarea

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
| `maxLength` | `number` | `0` | Character limit (0 = unlimited) |
| `disabled` | `boolean` | `false` | Disable textarea |
| `readonly` | `boolean` | `false` | Read-only |
| `required` | `boolean` | `false` | Required indicator |
| `resize` | `boolean` | `false` | Allow vertical resize handle |

**Events:** `ml:input` `{ value }`, `ml:change` `{ value }`, `ml:focus`, `ml:blur`

A character counter appears automatically when `maxLength` is set.

---

## ml-checkbox

```ts
import '@melodicdev/components/checkbox';
```

```html
<ml-checkbox label="Accept terms" hint="You must agree to continue"></ml-checkbox>

<!-- Indeterminate (e.g. select-all) -->
<ml-checkbox label="Select all" .indeterminate=${someSelected}></ml-checkbox>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Label text |
| `hint` | `string` | `''` | Hint text |
| `size` | `Size` | `'md'` | Checkbox size |
| `checked` | `boolean` | `false` | Checked state |
| `indeterminate` | `boolean` | `false` | Indeterminate state |
| `disabled` | `boolean` | `false` | Disabled state |

**Events:** `ml:change` `{ checked: boolean }`

---

## ml-radio / ml-radio-group

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

**Events:** `ml:change` `{ value: string }`

**ml-radio:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Radio value |
| `label` | `string` | `''` | Label text |
| `hint` | `string` | `''` | Hint text |
| `size` | `Size` | `'md'` | Size variant |
| `checked` | `boolean` | `false` | Checked state |
| `disabled` | `boolean` | `false` | Disabled state |

**Events:** `ml:change` `{ value, checked }`

---

## ml-radio-card-group / ml-radio-card

Card-style radio selection. Great for pricing plans, plan selection, or any scenario where you want visually prominent options.

```ts
import '@melodicdev/components/radio-card-group';
```

```html
<ml-radio-card-group value="basic" label="Select a plan" @ml:change=${e => this.plan = e.detail.value}>
  <ml-radio-card
    value="basic"
    label="Basic"
    description="Up to 5 users"
    detail="$10/mo"
    icon="user"
  ></ml-radio-card>
  <ml-radio-card
    value="pro"
    label="Business"
    description="Up to 50 users"
    detail="$25/mo"
    icon="users"
  ></ml-radio-card>
  <ml-radio-card
    value="enterprise"
    label="Enterprise"
    description="Unlimited users"
    detail="Custom"
    icon="buildings"
    disabled
  ></ml-radio-card>
</ml-radio-card-group>
```

**ml-radio-card-group:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Selected card value |
| `label` | `string` | `''` | Group label |
| `hint` | `string` | `''` | Hint text |
| `error` | `string` | `''` | Error message |
| `orientation` | `'vertical'` \| `'horizontal'` | `'vertical'` | Layout direction |
| `disabled` | `boolean` | `false` | Disable all cards |
| `required` | `boolean` | `false` | Required indicator |

**Events:** `ml:change` `{ value: string }`

**ml-radio-card:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Card value identifier |
| `label` | `string` | `''` | Primary label |
| `description` | `string` | `''` | Supporting text below label |
| `detail` | `string` | `''` | Right-aligned detail text (e.g. price) |
| `icon` | `string` | `''` | Optional Phosphor icon |
| `disabled` | `boolean` | `false` | Disable this card |

**Slots:** `default` (additional content below label/description)

---

## ml-toggle

```ts
import '@melodicdev/components/toggle';
```

```html
<ml-toggle label="Dark mode" hint="Toggle dark theme" @ml:change=${this.handleToggle}></ml-toggle>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Label text |
| `hint` | `string` | `''` | Hint text |
| `size` | `Size` | `'md'` | Toggle size |
| `checked` | `boolean` | `false` | On/off state |
| `disabled` | `boolean` | `false` | Disabled state |

**Events:** `ml:change` `{ checked: boolean }`

---

## ml-select

```ts
import '@melodicdev/components/select';
```

```html
<!-- Single select -->
<ml-select
  label="Country"
  placeholder="Choose a country"
  .options=${countryOptions}
  @ml:change=${this.handleChange}
></ml-select>

<!-- Multi-select -->
<ml-select
  label="Tags"
  multiple
  .options=${tagOptions}
  .values=${selectedTags}
  @ml:change=${this.handleMultiChange}
></ml-select>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Label text |
| `placeholder` | `string` | `'Select an option'` | Placeholder |
| `hint` | `string` | `''` | Hint text |
| `error` | `string` | `''` | Error message |
| `size` | `Size` | `'md'` | Size variant |
| `disabled` | `boolean` | `false` | Disable the select |
| `required` | `boolean` | `false` | Required indicator |
| `multiple` | `boolean` | `false` | Multi-select mode |
| `value` | `string` | `''` | Selected value (single mode) |
| `values` | `string[]` | `[]` | Selected values (multi mode) |
| `options` | `SelectOption[]` | `[]` | Available options |

**SelectOption interface:**

```ts
interface SelectOption {
  value: string;
  label: string;
  icon?: string;        // Phosphor icon name
  disabled?: boolean;
  avatarUrl?: string;
  avatarAlt?: string;
}
```

**Events:**
- Single: `ml:change` `{ value, option }`
- Multi: `ml:change` `{ values, options, option }` (last toggled option is in `option`)
- `ml:open`, `ml:close`

Supports full keyboard navigation. Multi-select shows selected items as inline tags with search filtering.

---

## ml-slider

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
| `showValue` | `boolean` | `false` | Show current value label |
| `hint` | `string` | `''` | Hint text |
| `error` | `string` | `''` | Error message |

**Events:** `ml:input` `{ value }` (while dragging), `ml:change` `{ value }` (on release)

---

## ml-date-picker

Date input with a calendar dropdown. Stores and emits ISO 8601 date strings (`YYYY-MM-DD`).

```ts
import '@melodicdev/components/date-picker';
```

```html
<ml-date-picker
  label="Start date"
  value="2026-02-08"
  @ml:change=${e => this.startDate = e.detail.value}
></ml-date-picker>

<ml-date-picker
  label="Expiry date"
  placeholder="Pick a date"
  min="2026-01-01"
  max="2026-12-31"
  required
></ml-date-picker>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Selected date (`YYYY-MM-DD`) |
| `placeholder` | `string` | `'Select date'` | Placeholder text |
| `label` | `string` | `''` | Field label |
| `hint` | `string` | `''` | Hint text |
| `error` | `string` | `''` | Error message |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Input size |
| `disabled` | `boolean` | `false` | Disabled state |
| `required` | `boolean` | `false` | Required indicator |
| `min` | `string` | `''` | Earliest selectable date (`YYYY-MM-DD`) |
| `max` | `string` | `''` | Latest selectable date (`YYYY-MM-DD`) |

**Events:** `ml:change` `{ value: string }` — emitted with the ISO date string when a date is selected

Keyboard support: `Enter` / `Space` / `ArrowDown` opens the calendar, `Escape` closes it.

---

## ml-form-field

Wrapper that adds a label, hint, error, and required indicator to any form control. Automatically links the label to the inner control via `aria-labelledby`.

```ts
import '@melodicdev/components/form-field';
```

```html
<!-- Wrap any control -->
<ml-form-field label="Username" hint="Choose a unique name" required>
  <ml-input placeholder="Enter username"></ml-input>
</ml-form-field>

<!-- Horizontal layout -->
<ml-form-field label="Notifications" orientation="horizontal">
  <ml-toggle></ml-toggle>
</ml-form-field>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Label text |
| `hint` | `string` | `''` | Hint text below the control |
| `error` | `string` | `''` | Error message (replaces hint) |
| `size` | `Size` | `'md'` | Field size |
| `orientation` | `'vertical'` \| `'horizontal'` | `'vertical'` | Layout direction |
| `disabled` | `boolean` | `false` | Disabled appearance |
| `required` | `boolean` | `false` | Required asterisk |

**Slots:** `default` (the wrapped form control)
