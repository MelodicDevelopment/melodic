# Sections & Layout Patterns

High-level layout components for composing full app shells and page structures.

- [ml-app-shell](#ml-app-shell)
- [ml-page-header](#ml-page-header)
- [ml-hero-section](#ml-hero-section)

---

## ml-app-shell

CSS Grid–based application shell that arranges a sidebar, a top header, and a scrollable content area.

```ts
import '@melodicdev/components/app-shell';
```

### Basic usage

```html
<ml-app-shell>
  <ml-sidebar slot="sidebar" active="dashboard" .navigation=${nav}>
    <div slot="header">
      <img src="logo.svg" alt="Acme Inc" />
    </div>
  </ml-sidebar>

  <ml-page-header slot="header" title="Dashboard" description="Overview of your account">
    <ml-button slot="actions" variant="primary">New Report</ml-button>
  </ml-page-header>

  <main>
    <!-- Page content -->
  </main>
</ml-app-shell>
```

### Mobile-responsive

On small screens the sidebar becomes a drawer. Use the `toggleMobileSidebar` helper exposed on the element:

```html
<ml-app-shell>
  <ml-sidebar slot="sidebar">...</ml-sidebar>

  <div slot="header">
    <!-- Hamburger for mobile -->
    <ml-button variant="ghost" @ml:click=${() => this._shell.toggleMobileSidebar()}>
      <ml-icon icon="list"></ml-icon>
    </ml-button>
  </div>

  <main>...</main>
</ml-app-shell>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sidebar-position` | `'left'` \| `'right'` | `'left'` | Which side the sidebar appears on |
| `sidebar-collapsed` | `boolean` | `false` | Collapse sidebar to icon-only width |
| `header-fixed` | `boolean` | `false` | Make the header sticky while content scrolls |

**Slots:**

| Slot | Description |
|------|-------------|
| `sidebar` | The sidebar navigation (full height) |
| `header` | Top header bar in the main area |
| `default` | Main scrollable content area |

**Internal methods (accessed via element ref):**

| Method | Description |
|--------|-------------|
| `toggleMobileSidebar()` | Open/close the mobile sidebar drawer |
| `closeMobileSidebar()` | Close the mobile drawer |

The shell uses a `(min-width: 768px)` media query to automatically close the mobile drawer when transitioning to desktop.

---

## ml-page-header

Section-level header for page titles with optional breadcrumb, description, actions, meta, and tabs.

```ts
import '@melodicdev/components/page-header';
```

```html
<!-- Basic -->
<ml-page-header title="Team Members" description="Manage access for your organization">
  <ml-button slot="actions" variant="primary">
    <ml-icon slot="icon-start" icon="plus"></ml-icon>
    Invite member
  </ml-button>
</ml-page-header>

<!-- With breadcrumb, meta badges, and tabs -->
<ml-page-header title="Project Alpha">
  <ml-breadcrumb slot="breadcrumb">
    <ml-breadcrumb-item href="/">Home</ml-breadcrumb-item>
    <ml-breadcrumb-item href="/projects">Projects</ml-breadcrumb-item>
    <ml-breadcrumb-item current>Alpha</ml-breadcrumb-item>
  </ml-breadcrumb>

  <div slot="meta">
    <ml-badge variant="success">Active</ml-badge>
    <ml-badge variant="default">v2.1</ml-badge>
  </div>

  <ml-button slot="actions" variant="outline" size="sm">Settings</ml-button>
  <ml-button slot="actions" variant="primary" size="sm">Deploy</ml-button>

  <ml-tabs slot="tabs" value="overview">
    <ml-tab slot="tab" value="overview" label="Overview"></ml-tab>
    <ml-tab slot="tab" value="issues"   label="Issues"></ml-tab>
    <ml-tab slot="tab" value="settings" label="Settings"></ml-tab>
  </ml-tabs>
</ml-page-header>

<!-- Centered variant (marketing/landing style) -->
<ml-page-header variant="centered" title="Our Features" description="Everything you need." divider="false">
</ml-page-header>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | `''` | Page title (can also use `slot="title"` for rich content) |
| `description` | `string` | `''` | Supporting text (can also use `slot="description"`) |
| `variant` | `'default'` \| `'compact'` \| `'centered'` | `'default'` | Layout variant |
| `divider` | `boolean` | `true` | Show bottom border |

**Slots:**

| Slot | Description |
|------|-------------|
| `breadcrumb` | `ml-breadcrumb` placed above the title |
| `title` | Rich HTML title (overrides the `title` attribute) |
| `description` | Rich HTML description |
| `meta` | Badges, status indicators, etc. (placed next to the title) |
| `actions` | Action buttons (right-aligned) |
| `tabs` | `ml-tabs` placed at the bottom of the header |

---

## ml-hero-section

Full-width hero section for landing pages and marketing content.

```ts
import '@melodicdev/components/hero';
```

```html
<!-- Text + CTA -->
<ml-hero-section
  eyebrow="Now in Beta"
  headline="Build faster with Melodic"
  subheadline="A lightweight web component framework with reactive signals, ultra-fast templates, and a complete UI library."
>
  <ml-button slot="actions" variant="primary" size="lg">Get started</ml-button>
  <ml-button slot="actions" variant="outline" size="lg">View docs</ml-button>
</ml-hero-section>

<!-- With badge group and custom media -->
<ml-hero-section
  headline="Ship production UI faster"
  subheadline="From zero to polished in minutes."
  align="center"
>
  <ml-badge-group slot="eyebrow" label="New" variant="primary">Version 2.0 is here</ml-badge-group>

  <ml-button slot="actions" size="lg">Start free</ml-button>

  <img slot="media" src="screenshot.png" alt="App screenshot" />
</ml-hero-section>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `headline` | `string` | `''` | Primary heading text |
| `subheadline` | `string` | `''` | Supporting body text |
| `eyebrow` | `string` | `''` | Small text above the headline |
| `align` | `'left'` \| `'center'` | `'left'` | Text alignment |

**Slots:**

| Slot | Description |
|------|-------------|
| `eyebrow` | Rich content above headline (use `ml-badge-group` here) |
| `headline` | Rich HTML headline (overrides the `headline` attribute) |
| `subheadline` | Rich HTML subheadline |
| `actions` | CTA buttons |
| `media` | Image, video, or component displayed alongside/below the text |
