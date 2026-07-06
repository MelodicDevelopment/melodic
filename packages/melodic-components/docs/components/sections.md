# Sections & Layout Patterns

High-level layout components for composing full app shells and page structures.

- [ml-app-shell](#ml-app-shell)
- [ml-page-header](#ml-page-header)
- [ml-page-section](#ml-page-section)
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

  <ml-page-header slot="header" header-title="Dashboard" description="Overview of your account">
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
<ml-page-header header-title="Team Members" description="Manage access for your organization">
  <ml-button slot="actions" variant="primary">
    <ml-icon slot="icon-start" icon="plus"></ml-icon>
    Invite member
  </ml-button>
</ml-page-header>

<!-- With breadcrumb, meta badges, and tabs -->
<ml-page-header header-title="Project Alpha">
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
<ml-page-header variant="centered" header-title="Our Features" description="Everything you need." divider="false">
</ml-page-header>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `headerTitle` | `string` | `''` | Page title (attribute: `header-title`; can also use `slot="title"` for rich content) |
| `description` | `string` | `''` | Supporting text (can also use `slot="description"`) |
| `variant` | `'default'` \| `'compact'` \| `'centered'` | `'default'` | Layout variant |
| `divider` | `boolean` | `true` | Show bottom border |

> **Deprecated:** the `title` attribute/property still works as an alias for `header-title` but logs a
> one-time warning — it collides with the global HTML `title` attribute (native browser tooltip).
> The alias will be removed in the next major release.

**Slots:**

| Slot | Description |
|------|-------------|
| `breadcrumb` | `ml-breadcrumb` placed above the title |
| `title` | Rich HTML title (overrides the `header-title` attribute) |
| `description` | Rich HTML description |
| `meta` | Badges, status indicators, etc. (placed next to the title) |
| `actions` | Action buttons (right-aligned) |
| `tabs` | `ml-tabs` placed at the bottom of the header |

**Key CSS Custom Properties:**

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-page-header-color` | `var(--ml-color-text)` | General text color |
| `--ml-page-header-title-color` | `var(--ml-color-text)` | Title text color |
| `--ml-page-header-description-color` | `var(--ml-color-text-secondary)` | Description text color |
| `--ml-page-header-border-color` | `var(--ml-color-border)` | Bottom divider border color |
| `--ml-page-header-padding` | `var(--ml-space-6) var(--ml-space-6) var(--ml-space-4)` | Container padding |

---

## ml-page-section

Titled content section for grouping related content within a page.

```ts
import '@melodicdev/components/page-section';
```

```html
<!-- Basic -->
<ml-page-section section-title="Recent Activity" subtitle="What your team has been up to">
  <ml-activity-feed>...</ml-activity-feed>
</ml-page-section>

<!-- With action button -->
<ml-page-section section-title="Team Members" action-label="View all" action-href="/team">
  <ml-list>...</ml-list>
</ml-page-section>

<!-- With custom action slot -->
<ml-page-section section-title="Analytics" padding="lg">
  <ml-button slot="action" variant="outline" size="sm">Export</ml-button>
  <div>Chart content here</div>
</ml-page-section>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `sectionTitle` | `string` | `''` | Section heading text (attribute: `section-title`) |
| `subtitle` | `string` | `''` | Supporting text below the title |
| `actionLabel` | `string` | `''` | Text for the default action link (attribute: `action-label`) |
| `actionHref` | `string` | `''` | URL for the default action link (attribute: `action-href`; only http(s), relative, and fragment URLs are rendered — other schemes are neutralized) |
| `padding` | `'none'` \| `'sm'` \| `'md'` \| `'lg'` | `'md'` | Content padding |

> **Deprecated:** the `title` attribute/property still works as an alias for `section-title` but logs a
> one-time warning — it collides with the global HTML `title` attribute (native browser tooltip).
> The alias will be removed in the next major release.

**Slots:**

| Slot | Description |
|------|-------------|
| `default` | Section content |
| `action` | Custom action element (overrides `action-label`/`action-href`) |

**CSS custom properties:**

| Property | Description |
|----------|-------------|
| `--ml-page-section-title-font` | Title font family |
| `--ml-page-section-title-size` | Title font size |
| `--ml-page-section-action-color` | Action link color |
| `--ml-page-section-gap` | Gap between title area and content |

---

## ml-hero-section

Full-width hero section for landing pages and marketing content.

```ts
import '@melodicdev/components/hero';
```

```html
<!-- Text + CTA -->
<ml-hero-section
  variant="centered"
  size="lg"
  hero-title="Build faster with Melodic"
  description="A lightweight web component framework with reactive signals, ultra-fast templates, and a complete UI library."
>
  <ml-button slot="actions" variant="primary" size="lg">Get started</ml-button>
  <ml-button slot="actions" variant="outline" size="lg">View docs</ml-button>
</ml-hero-section>

<!-- Split layout with eyebrow badge and media -->
<ml-hero-section variant="split" background="subtle">
  <ml-badge-group slot="eyebrow" label="New" variant="primary">Version 2.0 is here</ml-badge-group>

  <span slot="title">Ship production UI faster</span>
  <span slot="description">From zero to polished in minutes.</span>

  <ml-button slot="actions" size="lg">Start free</ml-button>

  <img slot="media" src="screenshot.png" alt="App screenshot" />
</ml-hero-section>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `heroTitle` | `string` | `''` | Headline text (attribute: `hero-title`; or use `slot="title"`) |
| `description` | `string` | `''` | Supporting body text (or use `slot="description"`) |
| `variant` | `'centered'` \| `'split'` \| `'split-reverse'` | `'centered'` | Layout variant |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'lg'` | Padding and font scale |
| `background` | `'none'` \| `'subtle'` \| `'gradient'` | `'none'` | Background style |

> **Deprecated:** the `title` attribute/property still works as an alias for `hero-title` but logs a
> one-time warning — it collides with the global HTML `title` attribute (native browser tooltip).
> The alias will be removed in the next major release.

**Slots:**

| Slot | Description |
|------|-------------|
| `eyebrow` | Small text/badge above the title (use `ml-badge-group` here) |
| `title` | Rich HTML headline (overrides the `hero-title` attribute) |
| `description` | Rich HTML supporting text |
| `actions` | CTA buttons |
| `media` | Image, video, or component displayed alongside/below the text |
| `social-proof` | Logos, testimonials, stats below the CTA |
