# Foundation Components

Layout building blocks and structural primitives.

- [ml-card](#ml-card)
- [ml-divider](#ml-divider)
- [ml-stack](#ml-stack)
- [ml-container](#ml-container)

---

## ml-card

```ts
import '@melodicdev/components/card';
```

```html
<!-- Basic card with header and footer slots -->
<ml-card>
  <div slot="header">Card Title</div>
  <p>Card content goes here.</p>
  <div slot="footer">
    <ml-button variant="outline" size="sm">Cancel</ml-button>
    <ml-button size="sm">Save</ml-button>
  </div>
</ml-card>

<!-- Clickable card -->
<ml-card variant="outlined" hoverable clickable @ml:click=${this.handleClick}>
  <p>Click me</p>
</ml-card>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default'` \| `'outlined'` \| `'elevated'` \| `'filled'` | `'default'` | Visual style |
| `hoverable` | `boolean` | `false` | Subtle background change on hover |
| `clickable` | `boolean` | `false` | Pointer cursor + click event |

**Slots:** `header`, `default` (body), `footer`

**Events:** `ml:click` `{ originalEvent }` (only when `clickable`)

---

## ml-divider

```ts
import '@melodicdev/components/divider';
```

```html
<ml-divider></ml-divider>

<!-- With centered label -->
<ml-divider>OR</ml-divider>

<!-- Vertical (inside a flex container) -->
<ml-divider orientation="vertical"></ml-divider>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `orientation` | `'horizontal'` \| `'vertical'` | `'horizontal'` | Divider direction |

**Slots:** `default` (optional label text rendered inside the divider line)

---

## ml-stack

Flexbox layout utility. Use it anywhere you'd write `display: flex` with a gap.

```ts
import '@melodicdev/components/stack';
```

```html
<!-- Horizontal row of buttons -->
<ml-stack direction="horizontal" gap="4" align="center">
  <ml-button>One</ml-button>
  <ml-button>Two</ml-button>
  <ml-button>Three</ml-button>
</ml-stack>

<!-- Vertical stack with space-between -->
<ml-stack gap="6" justify="between">
  <div>Top content</div>
  <div>Bottom content</div>
</ml-stack>

<!-- Wrapping grid-like layout -->
<ml-stack direction="horizontal" gap="4" wrap>
  ${items.map(item => html`<ml-card>${item.name}</ml-card>`)}
</ml-stack>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `direction` | `'horizontal'` \| `'vertical'` | `'vertical'` | Stack direction (`flex-direction`) |
| `gap` | `string` | `'4'` | Gap using spacing scale 1–96 (maps to `--ml-space-{gap}`) |
| `align` | `'start'` \| `'center'` \| `'end'` \| `'stretch'` \| `'baseline'` | `'stretch'` | Cross-axis alignment (`align-items`) |
| `justify` | `'start'` \| `'center'` \| `'end'` \| `'between'` \| `'around'` \| `'evenly'` | `'start'` | Main-axis justification (`justify-content`) |
| `wrap` | `boolean` | `false` | Allow items to wrap (`flex-wrap: wrap`) |

**Slots:** `default` (stack items)

---

## ml-container

Centered, max-width content wrapper.

```ts
import '@melodicdev/components/container';
```

```html
<ml-container size="lg" padding="6">
  <h1>Page content</h1>
  <p>Centered with a max-width constraint.</p>
</ml-container>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'sm'` \| `'md'` \| `'lg'` \| `'xl'` \| `'full'` | `'lg'` | Max-width preset |
| `padding` | `string` | `'4'` | Horizontal padding (spacing scale) |
| `centered` | `boolean` | `true` | Center with auto side margins |

**Size presets:**

| Size | Max-width |
|------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `full` | 100% |

**Slots:** `default` (content)
