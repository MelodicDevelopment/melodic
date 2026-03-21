# Navigation Components

- [ml-tabs / ml-tab / ml-tab-panel](#ml-tabs--ml-tab--ml-tab-panel)
- [ml-breadcrumb / ml-breadcrumb-item](#ml-breadcrumb--ml-breadcrumb-item)
- [ml-pagination](#ml-pagination)
- [ml-sidebar / ml-sidebar-group / ml-sidebar-item](#ml-sidebar--ml-sidebar-group--ml-sidebar-item)
- [ml-steps / ml-step / ml-step-panel](#ml-steps--ml-step--ml-step-panel)

---

## ml-tabs / ml-tab / ml-tab-panel

```ts
import '@melodicdev/components/tabs';
```

```html
<!-- Slotted tabs -->
<ml-tabs value="general" @ml:change=${e => this.tab = e.detail.value}>
  <ml-tab slot="tab" value="general" label="General" icon="gear"></ml-tab>
  <ml-tab slot="tab" value="security" label="Security" icon="lock"></ml-tab>
  <ml-tab slot="tab" value="billing" label="Billing" icon="credit-card" disabled></ml-tab>

  <ml-tab-panel value="general">General settings content</ml-tab-panel>
  <ml-tab-panel value="security">Security settings content</ml-tab-panel>
  <ml-tab-panel value="billing">Billing content</ml-tab-panel>
</ml-tabs>

<!-- Config-driven tabs -->
<ml-tabs value="general" .tabs=${tabConfigs} variant="pills">
  <ml-tab-panel value="general">...</ml-tab-panel>
</ml-tabs>
```

**ml-tabs:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Active tab value |
| `variant` | `'line'` \| `'enclosed'` \| `'pills'` | `'line'` | Visual style |
| `size` | `Size` | `'md'` | Size |
| `orientation` | `'horizontal'` \| `'vertical'` | `'horizontal'` | Tab header layout |
| `routed` | `boolean` | `false` | Sync active tab with URL pathname |
| `tabs` | `TabConfig[]` | `[]` | Config array (alternative to slotted ml-tab elements) |

**Events:** `ml:change` `{ value: string }`

**ml-tab:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Tab identifier |
| `label` | `string` | `''` | Tab label text |
| `icon` | `string` | `''` | Optional Phosphor icon |
| `disabled` | `boolean` | `false` | Disable this tab |
| `href` | `string` | `''` | URL for routed tabs |

**ml-tab-panel:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Panel identifier — must match a tab's `value` |

**Keyboard navigation:** Arrow keys, Home, End.

---

## ml-breadcrumb / ml-breadcrumb-item

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
| `separator` | `'chevron'` \| `'slash'` | `'chevron'` | Separator style between items |

**ml-breadcrumb-item:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `href` | `string` | `''` | Link URL (omit for the current page item) |
| `icon` | `string` | `''` | Optional left Phosphor icon |
| `current` | `boolean` | `false` | Marks item as the current page (no link rendered) |

Items automatically inherit the separator style from their parent `ml-breadcrumb`.

---

## ml-pagination

```ts
import '@melodicdev/components/pagination';
```

```html
<ml-pagination
  page="1"
  totalPages="20"
  siblings="1"
  @ml:page-change=${e => this.page = e.detail.page}
></ml-pagination>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `page` | `number` | `1` | Current page (1-based) |
| `totalPages` | `number` | `1` | Total number of pages |
| `siblings` | `number` | `1` | Number of page numbers shown on each side of the current page |

**Events:** `ml:page-change` `{ page: number }`

Renders first + last pages always. Adds ellipsis (`…`) for large page ranges. Prev/Next buttons included.

---

## ml-sidebar / ml-sidebar-group / ml-sidebar-item

App-level sidebar navigation with slotted or config-driven usage. Supports nested submenus, badges, and a "slim" collapsible variant.

```ts
import '@melodicdev/components/sidebar';
```

### Slotted usage

```html
<ml-sidebar active="home" @ml:change=${e => this.active = e.detail.value}>
  <!-- Branding -->
  <div slot="header">
    <img src="logo.svg" alt="Logo" />
  </div>

  <!-- Search -->
  <ml-input slot="search" placeholder="Search..." size="sm">
    <ml-icon slot="prefix" icon="magnifying-glass"></ml-icon>
  </ml-input>

  <!-- Navigation groups -->
  <ml-sidebar-group label="MAIN">
    <ml-sidebar-item icon="house" label="Home" value="home"></ml-sidebar-item>
    <ml-sidebar-item icon="chart-bar" label="Analytics" value="analytics" badge="3" badge-color="primary"></ml-sidebar-item>
  </ml-sidebar-group>

  <ml-sidebar-group label="SETTINGS">
    <!-- Expandable submenu -->
    <ml-sidebar-item icon="gear" label="Settings" value="settings">
      <ml-sidebar-item label="Profile" value="profile" level="1"></ml-sidebar-item>
      <ml-sidebar-item label="Security" value="security" level="1"></ml-sidebar-item>
    </ml-sidebar-item>
  </ml-sidebar-group>

  <!-- Footer slot -->
  <ml-sidebar-item slot="footer-nav" icon="sign-out" label="Sign out" value="signout"></ml-sidebar-item>

  <!-- User profile -->
  <div slot="user">
    <ml-avatar initials="JD" size="sm"></ml-avatar>
    <span>Jane Doe</span>
  </div>
</ml-sidebar>
```

### Config-driven usage

```ts
const navGroups: SidebarNavGroup[] = [
  {
    label: 'MAIN',
    items: [
      { value: 'home',      label: 'Home',      icon: 'house' },
      { value: 'analytics', label: 'Analytics', icon: 'chart-bar', badge: '3' },
    ]
  },
  {
    label: 'SETTINGS',
    items: [
      {
        value: 'settings',
        label: 'Settings',
        icon: 'gear',
        children: [
          { value: 'profile',  label: 'Profile' },
          { value: 'security', label: 'Security' },
        ]
      }
    ]
  }
];
```

```html
<ml-sidebar active="home" .navigation=${navGroups}></ml-sidebar>
```

**ml-sidebar:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `active` | `string` | `''` | Value of the currently active item |
| `variant` | `'default'` \| `'slim'` | `'default'` | `slim` collapses to icon-only and expands on hover |
| `navigation` | `SidebarNavGroup[]` | `[]` | Config array (alternative to slotted content) |
| `footerNavigation` | `SidebarNavItem[]` | `[]` | Footer nav items when using config mode |

**Slots:** `header`, `search`, `default` (nav groups/items), `footer-nav`, `feature`, `user`

**Events:**
- `ml:change` `{ value }` — emitted when active item changes
- `ml:item-click` `{ value, href? }` — emitted on every click

**ml-sidebar-group:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Uppercase section heading |

**Slots:** `default` (sidebar items)

**ml-sidebar-item:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | `''` | Unique identifier |
| `label` | `string` | `''` | Display label |
| `icon` | `string` | `''` | Phosphor icon |
| `icon-format` | `'regular'` \| `'fill'` \| `'bold'` \| `'duotone'` | `'regular'` | Phosphor icon weight/format |
| `href` | `string` | `''` | Navigation URL |
| `badge` | `string` | `''` | Badge text (counts, labels) |
| `badge-color` | `'default'` \| `'primary'` \| `'success'` \| `'warning'` \| `'error'` | `'default'` | Badge color |
| `external` | `boolean` | `false` | Opens `href` in a new tab |
| `disabled` | `boolean` | `false` | Disabled state |
| `level` | `string` | `'0'` | Indentation level for nested items (`'1'`, `'2'`) |

**Slots:** `leading` (icon override), `trailing` (custom right content), `default` (sub-items for expandable menus)

Items with slotted `ml-sidebar-item` children become expandable submenus automatically.

**Key CSS Custom Properties (sidebar, sidebar-item & sidebar-group):**

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-sidebar-width` | `280px` | Sidebar width |
| `--ml-sidebar-bg` | `var(--ml-color-surface)` | Sidebar background |
| `--ml-sidebar-border-color` | `var(--ml-color-border)` | Border color |
| `--ml-sidebar-item-color` | `var(--ml-color-text-secondary)` | Item text color |
| `--ml-sidebar-item-hover-bg` | `var(--ml-gray-100)` | Item hover background |
| `--ml-sidebar-item-active-bg` | `var(--ml-color-primary)` | Active item background |
| `--ml-sidebar-item-active-color` | `var(--ml-color-text-inverse)` | Active item text color |
| `--ml-sidebar-item-active-indicator-width` | `0px` | Left border accent width on active item |
| `--ml-sidebar-item-active-indicator-color` | `transparent` | Left border accent color on active item |
| `--ml-sidebar-item-icon-color` | `inherit` | Icon color (separate from text) |
| `--ml-sidebar-item-active-icon-color` | `inherit` | Icon color when item is active |
| `--ml-sidebar-item-hover-icon-color` | `inherit` | Icon color on hover |
| `--ml-sidebar-item-active-badge-bg` | `var(--ml-sidebar-item-badge-bg)` | Badge background when item is active |
| `--ml-sidebar-item-active-badge-color` | `var(--ml-sidebar-item-badge-color)` | Badge text color when item is active |
| `--ml-sidebar-group-padding-y` | `var(--ml-space-1)` | Vertical padding around the group |
| `--ml-sidebar-group-label-padding-y` | `var(--ml-space-2)` | Vertical padding on the group label |
| `--ml-sidebar-group-label-padding-x` | `var(--ml-space-4)` | Horizontal padding on the group label |
| `--ml-sidebar-group-label-font-size` | `var(--ml-text-xs)` | Group label font size |
| `--ml-sidebar-group-label-font-weight` | `var(--ml-font-semibold)` | Group label font weight |
| `--ml-sidebar-group-label-color` | `var(--ml-color-text-muted)` | Group label text color |
| `--ml-sidebar-group-label-letter-spacing` | `0.05em` | Group label letter spacing |
| `--ml-sidebar-group-items-gap` | `var(--ml-space-0-5)` | Gap between items in the group |
| `--ml-sidebar-group-items-padding-x` | `var(--ml-space-2)` | Horizontal padding around group items |

**Bookmark-style active indicator example:**

```css
ml-sidebar {
    --ml-sidebar-item-active-bg: transparent;
    --ml-sidebar-item-active-color: #c9a84c;
    --ml-sidebar-item-active-indicator-width: 3px;
    --ml-sidebar-item-active-indicator-color: #c9a84c;
    --ml-sidebar-item-active-icon-color: #c9a84c;
    --ml-sidebar-item-active-badge-bg: #c9a84c;
    --ml-sidebar-item-active-badge-color: #fff;
}
```

---

## ml-steps / ml-step / ml-step-panel

Multi-step wizard / progress indicator.

```ts
import '@melodicdev/components/steps';
```

### Slotted usage

```html
<ml-steps active="company" variant="circles" @ml:change=${e => this.step = e.detail.value}>
  <ml-step slot="step" value="details"  label="Your details"  description="Name and email"></ml-step>
  <ml-step slot="step" value="company"  label="Company info"  description="Your organization"></ml-step>
  <ml-step slot="step" value="invite"   label="Invite team"   description="Get started" disabled></ml-step>

  <ml-step-panel value="details">Step 1 content</ml-step-panel>
  <ml-step-panel value="company">Step 2 content</ml-step-panel>
  <ml-step-panel value="invite">Step 3 content</ml-step-panel>
</ml-steps>
```

### Config-driven usage

```ts
const stepConfigs: StepConfig[] = [
  { value: 'details', label: 'Your details', description: 'Name and email' },
  { value: 'company', label: 'Company info' },
  { value: 'invite',  label: 'Invite team', disabled: true },
];
```

```html
<ml-steps active="company" .steps=${stepConfigs}>
  <ml-step-panel value="details">...</ml-step-panel>
  <ml-step-panel value="company">...</ml-step-panel>
</ml-steps>
```

**ml-steps:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `active` | `string` | `''` | Value of the active step |
| `variant` | `'numbered'` \| `'circles'` \| `'bullets'` \| `'simple'` | `'numbered'` | Visual style |
| `orientation` | `'horizontal'` \| `'vertical'` | `'horizontal'` | Layout direction |
| `connector` | `'solid'` \| `'dashed'` \| `'dotted'` | `'solid'` | Connector line style |
| `color` | `'primary'` \| `'success'` \| `'warning'` \| `'error'` | `'primary'` | Accent color |
| `compact` | `boolean` | `false` | Dots-only compact mode with "Step X of Y" label |
| `routed` | `boolean` | `false` | Sync with URL pathname |
| `steps` | `StepConfig[]` | `[]` | Config array (alternative to slotted ml-step) |

**Events:** `ml:change` `{ value: string }`

**Keyboard navigation:** Arrow keys (direction-aware), Home, End.

**StepConfig interface:**

```ts
interface StepConfig {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  href?: string;        // used when routed=true
}
```

**ml-step** (slotted header element — use `slot="step"`):

| Attribute | Type | Description |
|-----------|------|-------------|
| `value` | `string` | Step identifier |
| `label` | `string` | Step label |
| `description` | `string` | Optional subtitle |
| `icon` | `string` | Optional Phosphor icon (overrides number/bullet) |
| `disabled` | `boolean` | Disable this step |
| `href` | `string` | URL for routed mode |

**ml-step-panel:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `value` | `string` | Must match a step's `value` |
