# Melodic Components Library — Complete Reference

> Reference for `@melodicdev/components`, checked against source. It reflects 4.0.1 plus the unreleased changes on the current branch. Covers every component, prop, event, slot and design token, plus the key CSS custom properties of each component — the complete token list for a component is the comment block at the top of its styles source file.

---

## Table of Contents

- [Component Registration & Import Pattern](#component-registration--import-pattern)
  - [Conventions shared by every component](#conventions-shared-by-every-component)
- [Global Design Tokens](#global-design-tokens)
  - [Primitive Color Palette](#primitive-color-palette)
  - [Semantic Color Tokens](#semantic-color-tokens)
  - [Spacing Tokens](#spacing-tokens)
  - [Typography Tokens](#typography-tokens)
  - [Shadow Tokens](#shadow-tokens)
  - [Border Tokens](#border-tokens)
  - [Transition Tokens](#transition-tokens)
  - [Breakpoint Tokens](#breakpoint-tokens)
- [Theme System](#theme-system)
  - [Theme Presets](#theme-presets)
  - [Theme API Functions](#theme-api-functions)
- [Component-Scoped CSS Custom Properties](#component-scoped-css-custom-properties)
- [Style Utilities](#style-utilities)
- [Shared Types](#shared-types)
- [Utilities, Functions & Directives](#utilities-functions--directives)
- [Form Components](#form-components)
  - [ml-button](#ml-button)
  - [ml-button-group / ml-button-group-item](#ml-button-group)
  - [ml-input](#ml-input)
  - [ml-textarea](#ml-textarea)
  - [ml-checkbox](#ml-checkbox)
  - [ml-radio / ml-radio-group](#ml-radio)
  - [ml-radio-card-group / ml-radio-card](#ml-radio-card-group)
  - [ml-toggle](#ml-toggle)
  - [ml-select](#ml-select)
  - [ml-autocomplete](#ml-autocomplete)
  - [ml-slider](#ml-slider)
  - [ml-date-picker](#ml-date-picker)
  - [ml-calendar](#ml-calendar)
  - [ml-time-picker](#ml-time-picker)
  - [ml-date-time-picker](#ml-date-time-picker)
  - [ml-form-field](#ml-form-field)
  - [ml-file-upload](#ml-file-upload)
  - [ml-file-upload-item](#ml-file-upload-item)
  - [ml-file-icon](#ml-file-icon)
- [Foundation Components](#foundation-components)
  - [ml-card](#ml-card)
  - [ml-divider](#ml-divider)
  - [ml-stack](#ml-stack)
  - [ml-container](#ml-container)
- [Feedback Components](#feedback-components)
  - [ml-spinner](#ml-spinner)
  - [ml-alert](#ml-alert)
  - [ml-progress](#ml-progress)
  - [ml-toast / ml-toast-container / ToastService](#ml-toast)
- [Data Display Components](#data-display-components)
  - [ml-avatar](#ml-avatar)
  - [ml-badge](#ml-badge)
  - [ml-badge-group](#ml-badge-group)
  - [ml-tag](#ml-tag)
  - [ml-list / ml-list-item](#ml-list)
  - [ml-activity-feed / ml-activity-feed-item](#ml-activity-feed)
  - [ml-table](#ml-table)
  - [ml-data-grid](#ml-data-grid)
  - [ml-calendar-view](#ml-calendar-view)
  - [ml-stat-card](#ml-stat-card)
  - [ml-profile-card](#ml-profile-card)
- [Navigation Components](#navigation-components)
  - [ml-tabs / ml-tab / ml-tab-panel](#ml-tabs)
  - [ml-breadcrumb / ml-breadcrumb-item](#ml-breadcrumb)
  - [ml-pagination](#ml-pagination)
  - [ml-sidebar / ml-sidebar-group / ml-sidebar-item](#ml-sidebar)
  - [ml-steps / ml-step / ml-step-panel](#ml-steps)
- [Overlay Components](#overlay-components)
  - [ml-dialog / DialogService](#ml-dialog)
  - [ml-drawer](#ml-drawer)
  - [ml-popover](#ml-popover)
  - [ml-dropdown / ml-dropdown-item / ml-dropdown-group / ml-dropdown-separator](#ml-dropdown)
  - [ml-tooltip / :tooltip directive](#ml-tooltip)
- [Section Components](#section-components)
  - [ml-app-shell](#ml-app-shell)
  - [ml-page-header](#ml-page-header)
  - [ml-hero-section](#ml-hero-section)
  - [ml-page-section](#ml-page-section)
- [General Components](#general-components)
  - [ml-icon](#ml-icon)
- [Page Components](#page-components)
  - [ml-login-page](#ml-login-page)
  - [ml-signup-page](#ml-signup-page)
  - [ml-dashboard-page](#ml-dashboard-page)
- [Token Count Summary](#token-count-summary)

---

## Component Registration & Import Pattern

Each component is a separate entry point in `package.json` exports. Importing the entry point causes the custom element to self-register via the `@MelodicComponent` decorator.

```typescript
// Each import registers the corresponding custom element
import '@melodicdev/components/button';     // registers <ml-button>
import '@melodicdev/components/table';      // registers <ml-table>
import '@melodicdev/components/dialog';     // registers <ml-dialog>
```

### Conventions shared by every component

- **Attributes and properties.** Each observed attribute maps to a camelCase property (`full-width` → `fullWidth`). Data properties and read-only getters are mirrored on the element, so `el.value = 'x'` and `.value=${x}` both work. Rows marked "(property)" have no attribute and must be set as properties.
- **Boolean attributes.** Presence means `true`; the literal string `"false"` means `false` (`<ml-data-grid virtual="false">`), which is how a boolean that defaults to `true` is turned off from markup. Numeric attributes are converted to numbers.
- **Methods live on the component instance.** `element.component.method()` always works: `drawerEl.component.open()`. Whether the same call works directly on the element depends on how the method is written: a method implemented as a function field (an arrow-function property) is also exposed on the element, a prototype method is not — `drawerEl.close()` works, `drawerEl.open()` fails. Each "Methods" entry below says which methods are reachable on the element; when in doubt, go through `.component`.
- **Events.** Every `ml:*` event is a `CustomEvent` dispatched with `bubbles: true` and `composed: true`; none is cancelable. "none" in a Detail column means the event carries no `detail`.
- **Reduced motion, forced colors, right-to-left.**
  - Under `prefers-reduced-motion: reduce` the base theme sets every `--ml-duration-*` token to `0ms`, which switches off the transitions and animations that take their duration from those tokens (`ml-drawer` also skips its slide). Keep your own overrides on the duration tokens rather than literal times.
  - Under `forced-colors: active`, components whose focus ring is a box-shadow fall back to a real `outline` in the system `Highlight` color.
  - Label, hint, tag, sidebar, tabs, steps, container and form-control spacing use logical properties and follow `dir="rtl"`. Still physical (left/right): the JavaScript-positioned overlays and their arrows (`ml-popover`, `ml-dropdown`, `ml-tooltip`), `ml-drawer` and `ml-app-shell` sides, toast positions, `ml-data-grid` pinned columns, `ml-slider`, `ml-toggle`, `ml-progress` and `ml-calendar-view`.
- **Managed attributes.** Props marked "(managed)" are written by a parent component (`ml-tabs` → `ml-tab[active]`); do not set them yourself.
- **Deprecated aliases still accepted in 4.x:**
  - The `title` attribute/property on `ml-alert`, `ml-toast`, `ml-page-header`, `ml-hero-section`, `ml-page-section`, `ml-login-page`, `ml-signup-page` and `ml-dashboard-page` — use `alert-title`, `toast-title`, `header-title`, `hero-title`, `section-title` or `page-title`. Warns once; removed in the next major release.
  - Quoted kebab-case **property** access such as `el['dot-color']` — use the camelCase property (`el.dotColor`); the kebab-case attribute is unaffected. Warns once on first write; removed in the next major release.
  - The `ml:remove` event of `ml-file-upload-item` and the `ml:close` event of `ml-tag` — listen for `ml:dismiss`. Removed in the next major release.
  - The `'danger'` value of `ml-button` `variant` and `ml-tag` `dot-color` — the canonical name is `'error'`; both render identically.

### Full Export Map

| Import Path | Custom Element(s) |
|-------------|-------------------|
| `@melodicdev/components/activity-feed` | `ml-activity-feed`, `ml-activity-feed-item` |
| `@melodicdev/components/alert` | `ml-alert` |
| `@melodicdev/components/app-shell` | `ml-app-shell` |
| `@melodicdev/components/autocomplete` | `ml-autocomplete` |
| `@melodicdev/components/avatar` | `ml-avatar` |
| `@melodicdev/components/badge` | `ml-badge` |
| `@melodicdev/components/badge-group` | `ml-badge-group` |
| `@melodicdev/components/breadcrumb` | `ml-breadcrumb`, `ml-breadcrumb-item` |
| `@melodicdev/components/button` | `ml-button` |
| `@melodicdev/components/button-group` | `ml-button-group`, `ml-button-group-item` |
| `@melodicdev/components/calendar-view` | `ml-calendar-view` |
| `@melodicdev/components/card` | `ml-card` |
| `@melodicdev/components/checkbox` | `ml-checkbox` |
| `@melodicdev/components/container` | `ml-container` |
| `@melodicdev/components/dashboard-page` | `ml-dashboard-page` |
| `@melodicdev/components/data-grid` | `ml-data-grid` |
| `@melodicdev/components/date-picker` | `ml-date-picker`, `ml-calendar` |
| `@melodicdev/components/date-time-picker` | `ml-date-time-picker` |
| `@melodicdev/components/dialog` | `ml-dialog` (+ `DialogService`, `DialogRef`) |
| `@melodicdev/components/divider` | `ml-divider` |
| `@melodicdev/components/drawer` | `ml-drawer` |
| `@melodicdev/components/dropdown` | `ml-dropdown`, `ml-dropdown-item`, `ml-dropdown-group`, `ml-dropdown-separator` |
| `@melodicdev/components/file-upload` | `ml-file-upload`, `ml-file-upload-item`, `ml-file-icon` |
| `@melodicdev/components/form-field` | `ml-form-field` |
| `@melodicdev/components/hero-section` | `ml-hero-section` |
| `@melodicdev/components/icon` | `ml-icon` |
| `@melodicdev/components/input` | `ml-input` |
| `@melodicdev/components/list` | `ml-list`, `ml-list-item` |
| `@melodicdev/components/login-page` | `ml-login-page`, `ml-signup-page` (same module as `signup-page`) |
| `@melodicdev/components/page-header` | `ml-page-header` |
| `@melodicdev/components/page-section` | `ml-page-section` |
| `@melodicdev/components/pagination` | `ml-pagination` |
| `@melodicdev/components/popover` | `ml-popover` |
| `@melodicdev/components/profile-card` | `ml-profile-card` |
| `@melodicdev/components/progress` | `ml-progress` |
| `@melodicdev/components/radio` | `ml-radio`, `ml-radio-group` |
| `@melodicdev/components/radio-card-group` | `ml-radio-card-group`, `ml-radio-card` |
| `@melodicdev/components/select` | `ml-select` |
| `@melodicdev/components/sidebar` | `ml-sidebar`, `ml-sidebar-group`, `ml-sidebar-item` |
| `@melodicdev/components/signup-page` | `ml-signup-page`, `ml-login-page` (same module as `login-page`) |
| `@melodicdev/components/slider` | `ml-slider` |
| `@melodicdev/components/spinner` | `ml-spinner` |
| `@melodicdev/components/stack` | `ml-stack` |
| `@melodicdev/components/stat-card` | `ml-stat-card` |
| `@melodicdev/components/steps` | `ml-steps`, `ml-step`, `ml-step-panel` |
| `@melodicdev/components/table` | `ml-table` |
| `@melodicdev/components/tabs` | `ml-tabs`, `ml-tab`, `ml-tab-panel` |
| `@melodicdev/components/tag` | `ml-tag` |
| `@melodicdev/components/textarea` | `ml-textarea` |
| `@melodicdev/components/time-picker` | `ml-time-picker` |
| `@melodicdev/components/toast` | `ml-toast`, `ml-toast-container` (+ `ToastService`) |
| `@melodicdev/components/toggle` | `ml-toggle` |
| `@melodicdev/components/tooltip` | `ml-tooltip` |

### Non-Component Entry Points

| Import Path | Purpose |
|-------------|---------|
| `@melodicdev/components` | Theme + utils + functions, and a subset of the components: button, input, textarea, checkbox, radio, toggle, select, autocomplete, slider, form-field, spinner, alert, toast, progress, card, divider, stack, container, avatar, badge, icon, tabs, breadcrumb, pagination, dialog, drawer, dropdown, tooltip, popover. Every other component is reachable only through its own entry point. |
| `@melodicdev/components/theme` | Theme tokens, presets, functions |
| `@melodicdev/components/utils` | Positioning, accessibility, styles, virtual scroll, `clickOutside`, `watchLightSlots` / `hasLightSlot` |
| `@melodicdev/components/functions` | `newID()`, `watchSlotPresence()`, `warnDeprecatedOnce()`, `warnDeprecatedTitleOnce()`, `defineLegacyAliases()` |
| `@melodicdev/components/package.json` | The package manifest (in the exports map so tooling can resolve it) |
| `@melodicdev/components/directives` | `tooltipDirective` — importing the entry point registers the `:tooltip` attribute directive (and `ml-tooltip`). Type: `TooltipDirectiveOptions` (`{ content: string; placement?: string }`) |

---

## Global Design Tokens

Source files: `packages/melodic-components/src/theme/tokens/`

### Primitive Color Palette

All primitives are set on `:root`. Each color ramp has 12 stops (25–950).

#### White & Black

| Token | Value |
|-------|-------|
| `--ml-white` | `#ffffff` |
| `--ml-black` | `#000000` |

#### Gray

| Token | Value |
|-------|-------|
| `--ml-gray-25` | `#fcfcfd` |
| `--ml-gray-50` | `#f9fafb` |
| `--ml-gray-100` | `#f2f4f7` |
| `--ml-gray-200` | `#eaecf0` |
| `--ml-gray-300` | `#d0d5dd` |
| `--ml-gray-400` | `#98a2b3` |
| `--ml-gray-500` | `#667085` |
| `--ml-gray-600` | `#475467` |
| `--ml-gray-700` | `#344054` |
| `--ml-gray-800` | `#182230` |
| `--ml-gray-900` | `#101828` |
| `--ml-gray-950` | `#0c111d` |

#### Blue (Primary)

| Token | Value |
|-------|-------|
| `--ml-blue-25` | `#f5f8ff` |
| `--ml-blue-50` | `#eff4ff` |
| `--ml-blue-100` | `#d1e0ff` |
| `--ml-blue-200` | `#b2ccff` |
| `--ml-blue-300` | `#84adff` |
| `--ml-blue-400` | `#528bff` |
| `--ml-blue-500` | `#2970ff` |
| `--ml-blue-600` | `#155eef` |
| `--ml-blue-700` | `#004eeb` |
| `--ml-blue-800` | `#0040c1` |
| `--ml-blue-900` | `#00359e` |
| `--ml-blue-950` | `#002266` |

#### Green (Success)

| Token | Value |
|-------|-------|
| `--ml-green-25` | `#f6fef9` |
| `--ml-green-50` | `#ecfdf3` |
| `--ml-green-100` | `#dcfae6` |
| `--ml-green-200` | `#abefc6` |
| `--ml-green-300` | `#75e0a7` |
| `--ml-green-400` | `#47cd89` |
| `--ml-green-500` | `#17b26a` |
| `--ml-green-600` | `#079455` |
| `--ml-green-700` | `#067647` |
| `--ml-green-800` | `#085d3a` |
| `--ml-green-900` | `#074d31` |
| `--ml-green-950` | `#053321` |

#### Red (Danger/Error)

| Token | Value |
|-------|-------|
| `--ml-red-25` | `#fffbfa` |
| `--ml-red-50` | `#fef3f2` |
| `--ml-red-100` | `#fee4e2` |
| `--ml-red-200` | `#fecdca` |
| `--ml-red-300` | `#fda29b` |
| `--ml-red-400` | `#f97066` |
| `--ml-red-500` | `#f04438` |
| `--ml-red-600` | `#d92d20` |
| `--ml-red-700` | `#b42318` |
| `--ml-red-800` | `#912018` |
| `--ml-red-900` | `#7a271a` |
| `--ml-red-950` | `#55160c` |

#### Amber (Warning)

| Token | Value |
|-------|-------|
| `--ml-amber-25` | `#fffcf5` |
| `--ml-amber-50` | `#fffaeb` |
| `--ml-amber-100` | `#fef0c7` |
| `--ml-amber-200` | `#fedf89` |
| `--ml-amber-300` | `#fec84b` |
| `--ml-amber-400` | `#fdb022` |
| `--ml-amber-500` | `#f79009` |
| `--ml-amber-600` | `#dc6803` |
| `--ml-amber-700` | `#b54708` |
| `--ml-amber-800` | `#93370d` |
| `--ml-amber-900` | `#7a2e0e` |
| `--ml-amber-950` | `#4e1d09` |

#### Cyan (Info)

| Token | Value |
|-------|-------|
| `--ml-cyan-25` | `#f5feff` |
| `--ml-cyan-50` | `#ecfdff` |
| `--ml-cyan-100` | `#cff9fe` |
| `--ml-cyan-200` | `#a5f0fc` |
| `--ml-cyan-300` | `#67e3f9` |
| `--ml-cyan-400` | `#22ccee` |
| `--ml-cyan-500` | `#06aed4` |
| `--ml-cyan-600` | `#088ab2` |
| `--ml-cyan-700` | `#0e7090` |
| `--ml-cyan-800` | `#155b75` |
| `--ml-cyan-900` | `#164c63` |
| `--ml-cyan-950` | `#0d2d3a` |

#### Purple (Accent)

| Token | Value |
|-------|-------|
| `--ml-purple-25` | `#fcfaff` |
| `--ml-purple-50` | `#f9f5ff` |
| `--ml-purple-100` | `#f4ebff` |
| `--ml-purple-200` | `#e9d7fe` |
| `--ml-purple-300` | `#d6bbfb` |
| `--ml-purple-400` | `#b692f6` |
| `--ml-purple-500` | `#9e77ed` |
| `--ml-purple-600` | `#7f56d9` |
| `--ml-purple-700` | `#6941c6` |
| `--ml-purple-800` | `#53389e` |
| `--ml-purple-900` | `#42307d` |
| `--ml-purple-950` | `#2c1c5f` |

---

### Semantic Color Tokens

Semantic tokens reference primitives via `var()` and change between light/dark themes.

#### Brand Colors

| Token | Light | Dark |
|-------|-------|------|
| `--ml-color-primary` | `var(--ml-blue-600)` | `var(--ml-blue-500)` |
| `--ml-color-primary-hover` | `var(--ml-blue-700)` | `var(--ml-blue-400)` |
| `--ml-color-primary-active` | `var(--ml-blue-800)` | `var(--ml-blue-300)` |
| `--ml-color-primary-subtle` | `var(--ml-blue-50)` | `var(--ml-blue-950)` |
| `--ml-color-secondary` | `var(--ml-gray-600)` | _(unchanged)_ |
| `--ml-color-secondary-hover` | `var(--ml-gray-700)` | _(unchanged)_ |
| `--ml-color-secondary-active` | `var(--ml-gray-800)` | _(unchanged)_ |
| `--ml-color-secondary-subtle` | `var(--ml-gray-100)` | _(unchanged)_ |

#### Status Colors

| Token | Light | Dark |
|-------|-------|------|
| `--ml-color-success` | `var(--ml-green-600)` | `var(--ml-green-500)` |
| `--ml-color-success-hover` | `var(--ml-green-700)` | _(unchanged)_ |
| `--ml-color-success-subtle` | `var(--ml-green-50)` | `var(--ml-green-950)` |
| `--ml-color-warning` | `var(--ml-amber-500)` | `var(--ml-amber-400)` |
| `--ml-color-warning-hover` | `var(--ml-amber-600)` | _(unchanged)_ |
| `--ml-color-warning-subtle` | `var(--ml-amber-50)` | `var(--ml-amber-950)` |
| `--ml-color-danger` | `var(--ml-red-600)` | `var(--ml-red-500)` |
| `--ml-color-danger-hover` | `var(--ml-red-700)` | _(unchanged)_ |
| `--ml-color-danger-subtle` | `var(--ml-red-50)` | `var(--ml-red-950)` |
| `--ml-color-info` | `var(--ml-cyan-600)` | `var(--ml-cyan-400)` |
| `--ml-color-info-hover` | `var(--ml-cyan-700)` | _(unchanged)_ |
| `--ml-color-info-subtle` | `var(--ml-cyan-50)` | `var(--ml-cyan-950)` |

#### Surface Colors

| Token | Light | Dark |
|-------|-------|------|
| `--ml-color-background` | `var(--ml-white)` | `var(--ml-gray-950)` |
| `--ml-color-surface` | `var(--ml-white)` | `var(--ml-gray-900)` |
| `--ml-color-surface-raised` | `var(--ml-gray-50)` | `var(--ml-gray-800)` |
| `--ml-color-surface-overlay` | `var(--ml-white)` | `var(--ml-gray-800)` |
| `--ml-color-surface-sunken` | `var(--ml-gray-100)` | `var(--ml-gray-950)` |

#### Text Colors

| Token | Light | Dark |
|-------|-------|------|
| `--ml-color-text` | `var(--ml-gray-900)` | `var(--ml-gray-50)` |
| `--ml-color-text-secondary` | `var(--ml-gray-700)` | `var(--ml-gray-300)` |
| `--ml-color-text-muted` | `var(--ml-gray-500)` | `var(--ml-gray-400)` |
| `--ml-color-text-subtle` | `var(--ml-gray-400)` | `var(--ml-gray-500)` |
| `--ml-color-text-inverse` | `var(--ml-white)` | `var(--ml-gray-900)` |
| `--ml-color-text-link` | `var(--ml-blue-600)` | _(unchanged)_ |
| `--ml-color-text-link-hover` | `var(--ml-blue-700)` | _(unchanged)_ |

#### Border Colors

| Token | Light | Dark |
|-------|-------|------|
| `--ml-color-border` | `var(--ml-gray-200)` | `var(--ml-gray-700)` |
| `--ml-color-border-strong` | `var(--ml-gray-300)` | `var(--ml-gray-600)` |
| `--ml-color-border-muted` | `var(--ml-gray-100)` | `var(--ml-gray-800)` |
| `--ml-color-border-focus` | `var(--ml-blue-500)` | _(unchanged)_ |

#### Focus Ring

| Token | Value |
|-------|-------|
| `--ml-color-focus-ring` | `var(--ml-blue-500)` |
| `--ml-focus-ring-width` | `4px` |
| `--ml-focus-ring-offset` | `1px` |

#### Component-Specific Input Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--ml-color-toggle-off` | `var(--ml-gray-200)` | `var(--ml-gray-600)` |
| `--ml-color-toggle-off-hover` | `var(--ml-gray-300)` | `var(--ml-gray-500)` |
| `--ml-color-input-bg` | `var(--ml-white)` | `var(--ml-gray-900)` |
| `--ml-color-input-disabled-bg` | `var(--ml-gray-50)` | `var(--ml-gray-800)` |

#### Badge Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--ml-badge-default-bg` | `var(--ml-gray-100)` | `var(--ml-gray-800)` |
| `--ml-badge-default-border` | `var(--ml-gray-200)` | `var(--ml-gray-700)` |
| `--ml-badge-default-text` | `var(--ml-gray-700)` | `var(--ml-gray-300)` |
| `--ml-badge-primary-bg` | `var(--ml-blue-50)` | `rgb(59 130 246 / 0.15)` |
| `--ml-badge-primary-border` | `var(--ml-blue-200)` | `rgb(59 130 246 / 0.3)` |
| `--ml-badge-primary-text` | `var(--ml-blue-700)` | `var(--ml-blue-400)` |
| `--ml-badge-success-bg` | `var(--ml-green-50)` | `rgb(34 197 94 / 0.15)` |
| `--ml-badge-success-border` | `var(--ml-green-200)` | `rgb(34 197 94 / 0.3)` |
| `--ml-badge-success-text` | `var(--ml-green-700)` | `var(--ml-green-400)` |
| `--ml-badge-warning-bg` | `var(--ml-amber-50)` | `rgb(245 158 11 / 0.15)` |
| `--ml-badge-warning-border` | `var(--ml-amber-200)` | `rgb(245 158 11 / 0.3)` |
| `--ml-badge-warning-text` | `var(--ml-amber-700)` | `var(--ml-amber-400)` |
| `--ml-badge-error-bg` | `var(--ml-red-50)` | `rgb(239 68 68 / 0.15)` |
| `--ml-badge-error-border` | `var(--ml-red-200)` | `rgb(239 68 68 / 0.3)` |
| `--ml-badge-error-text` | `var(--ml-red-700)` | `var(--ml-red-400)` |

#### Alert Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--ml-alert-info-bg` | `var(--ml-blue-50)` | `rgb(59 130 246 / 0.1)` |
| `--ml-alert-info-border` | `var(--ml-blue-200)` | `rgb(59 130 246 / 0.2)` |
| `--ml-alert-info-text` | `var(--ml-blue-700)` | `var(--ml-blue-300)` |
| `--ml-alert-info-icon` | `var(--ml-blue-600)` | `var(--ml-blue-400)` |
| `--ml-alert-success-bg` | `var(--ml-green-50)` | `rgb(34 197 94 / 0.1)` |
| `--ml-alert-success-border` | `var(--ml-green-200)` | `rgb(34 197 94 / 0.2)` |
| `--ml-alert-success-text` | `var(--ml-green-700)` | `var(--ml-green-300)` |
| `--ml-alert-success-icon` | `var(--ml-green-600)` | `var(--ml-green-400)` |
| `--ml-alert-warning-bg` | `var(--ml-amber-50)` | `rgb(245 158 11 / 0.1)` |
| `--ml-alert-warning-border` | `var(--ml-amber-200)` | `rgb(245 158 11 / 0.2)` |
| `--ml-alert-warning-text` | `var(--ml-amber-700)` | `var(--ml-amber-300)` |
| `--ml-alert-warning-icon` | `var(--ml-amber-600)` | `var(--ml-amber-400)` |
| `--ml-alert-error-bg` | `var(--ml-red-50)` | `rgb(239 68 68 / 0.1)` |
| `--ml-alert-error-border` | `var(--ml-red-200)` | `rgb(239 68 68 / 0.2)` |
| `--ml-alert-error-text` | `var(--ml-red-700)` | `var(--ml-red-300)` |
| `--ml-alert-error-icon` | `var(--ml-red-600)` | `var(--ml-red-400)` |

#### Tooltip & Card Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--ml-tooltip-bg` | `var(--ml-gray-900)` | `var(--ml-gray-100)` |
| `--ml-tooltip-text` | `var(--ml-white)` | `var(--ml-gray-900)` |
| `--ml-card-footer-bg` | `var(--ml-gray-50)` | `var(--ml-gray-800)` |

---

### Spacing Tokens

4px (0.25rem) scale on `:root`.

| Token | Value | px |
|-------|-------|----|
| `--ml-space-0` | `0` | 0 |
| `--ml-space-px` | `1px` | 1 |
| `--ml-space-0-5` | `0.125rem` | 2 |
| `--ml-space-1` | `0.25rem` | 4 |
| `--ml-space-1-5` | `0.375rem` | 6 |
| `--ml-space-2` | `0.5rem` | 8 |
| `--ml-space-2-5` | `0.625rem` | 10 |
| `--ml-space-3` | `0.75rem` | 12 |
| `--ml-space-3-5` | `0.875rem` | 14 |
| `--ml-space-4` | `1rem` | 16 |
| `--ml-space-5` | `1.25rem` | 20 |
| `--ml-space-6` | `1.5rem` | 24 |
| `--ml-space-7` | `1.75rem` | 28 |
| `--ml-space-8` | `2rem` | 32 |
| `--ml-space-9` | `2.25rem` | 36 |
| `--ml-space-10` | `2.5rem` | 40 |
| `--ml-space-11` | `2.75rem` | 44 |
| `--ml-space-12` | `3rem` | 48 |
| `--ml-space-14` | `3.5rem` | 56 |
| `--ml-space-16` | `4rem` | 64 |
| `--ml-space-20` | `5rem` | 80 |
| `--ml-space-24` | `6rem` | 96 |
| `--ml-space-28` | `7rem` | 112 |
| `--ml-space-32` | `8rem` | 128 |
| `--ml-space-36` | `9rem` | 144 |
| `--ml-space-40` | `10rem` | 160 |
| `--ml-space-44` | `11rem` | 176 |
| `--ml-space-48` | `12rem` | 192 |
| `--ml-space-52` | `13rem` | 208 |
| `--ml-space-56` | `14rem` | 224 |
| `--ml-space-60` | `15rem` | 240 |
| `--ml-space-64` | `16rem` | 256 |
| `--ml-space-72` | `18rem` | 288 |
| `--ml-space-80` | `20rem` | 320 |
| `--ml-space-96` | `24rem` | 384 |

---

### Typography Tokens

#### Font Families

| Token | Value |
|-------|-------|
| `--ml-font-sans` | `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'` |
| `--ml-font-serif` | `Georgia, Cambria, 'Times New Roman', Times, serif` |
| `--ml-font-mono` | `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace` |

#### Font Sizes

| Token | Value | px |
|-------|-------|----|
| `--ml-text-xs` | `0.75rem` | 12 |
| `--ml-text-sm` | `0.875rem` | 14 |
| `--ml-text-base` | `1rem` | 16 |
| `--ml-text-lg` | `1.125rem` | 18 |
| `--ml-text-xl` | `1.25rem` | 20 |
| `--ml-text-2xl` | `1.5rem` | 24 |
| `--ml-text-3xl` | `1.875rem` | 30 |
| `--ml-text-4xl` | `2.25rem` | 36 |
| `--ml-text-5xl` | `3rem` | 48 |
| `--ml-text-6xl` | `3.75rem` | 60 |
| `--ml-text-7xl` | `4.5rem` | 72 |
| `--ml-text-8xl` | `6rem` | 96 |
| `--ml-text-9xl` | `8rem` | 128 |

#### Font Weights

| Token | Value |
|-------|-------|
| `--ml-font-thin` | `100` |
| `--ml-font-extralight` | `200` |
| `--ml-font-light` | `300` |
| `--ml-font-normal` | `400` |
| `--ml-font-medium` | `500` |
| `--ml-font-semibold` | `600` |
| `--ml-font-bold` | `700` |
| `--ml-font-extrabold` | `800` |
| `--ml-font-black` | `900` |

#### Line Heights

| Token | Value |
|-------|-------|
| `--ml-leading-none` | `1` |
| `--ml-leading-tight` | `1.25` |
| `--ml-leading-snug` | `1.375` |
| `--ml-leading-normal` | `1.5` |
| `--ml-leading-relaxed` | `1.625` |
| `--ml-leading-loose` | `2` |

#### Letter Spacing

| Token | Value |
|-------|-------|
| `--ml-tracking-tighter` | `-0.05em` |
| `--ml-tracking-tight` | `-0.025em` |
| `--ml-tracking-normal` | `0em` |
| `--ml-tracking-wide` | `0.025em` |
| `--ml-tracking-wider` | `0.05em` |
| `--ml-tracking-widest` | `0.1em` |

---

### Shadow Tokens

#### Elevation Shadows

| Token | Value |
|-------|-------|
| `--ml-shadow-none` | `none` |
| `--ml-shadow-xs` | `0 1px 2px 0 rgb(16 24 40 / 0.05)` |
| `--ml-shadow-sm` | `0 1px 2px 0 rgb(16 24 40 / 0.06), 0 1px 3px 0 rgb(16 24 40 / 0.1)` |
| `--ml-shadow` | `0 1px 2px 0 rgb(16 24 40 / 0.06), 0 1px 3px 0 rgb(16 24 40 / 0.1)` |
| `--ml-shadow-md` | `0 2px 4px -2px rgb(16 24 40 / 0.06), 0 4px 8px -2px rgb(16 24 40 / 0.1)` |
| `--ml-shadow-lg` | `0 4px 6px -2px rgb(16 24 40 / 0.03), 0 12px 16px -4px rgb(16 24 40 / 0.08)` |
| `--ml-shadow-xl` | `0 8px 8px -4px rgb(16 24 40 / 0.03), 0 20px 24px -4px rgb(16 24 40 / 0.08)` |
| `--ml-shadow-2xl` | `0 24px 48px -12px rgb(16 24 40 / 0.18)` |
| `--ml-shadow-3xl` | `0 32px 64px -12px rgb(16 24 40 / 0.14)` |
| `--ml-shadow-inner` | `inset 0 2px 4px 0 rgb(16 24 40 / 0.05)` |

#### Focus Ring Shadows

| Token | Light | Dark |
|-------|-------|------|
| `--ml-shadow-ring-color` | `var(--ml-blue-100)` | `rgb(59 130 246 / 0.25)` |
| `--ml-shadow-ring-error-color` | `var(--ml-red-100)` | `rgb(239 68 68 / 0.25)` |
| `--ml-shadow-ring-success-color` | `var(--ml-green-100)` | `rgb(34 197 94 / 0.25)` |
| `--ml-shadow-ring-warning-color` | `var(--ml-amber-100)` | `rgb(245 158 11 / 0.25)` |
| `--ml-shadow-ring-gray-color` | `var(--ml-gray-100)` | `rgb(107 114 128 / 0.25)` |

| Token | Value |
|-------|-------|
| `--ml-shadow-ring` | `0 0 0 4px var(--ml-shadow-ring-color)` |
| `--ml-shadow-ring-error` | `0 0 0 4px var(--ml-shadow-ring-error-color)` |
| `--ml-shadow-ring-success` | `0 0 0 4px var(--ml-shadow-ring-success-color)` |
| `--ml-shadow-ring-warning` | `0 0 0 4px var(--ml-shadow-ring-warning-color)` |
| `--ml-shadow-ring-gray` | `0 0 0 4px var(--ml-shadow-ring-gray-color)` |
| `--ml-shadow-focus-ring` | `0 1px 2px 0 rgb(16 24 40 / 0.05), 0 0 0 4px var(--ml-shadow-ring-color)` |

#### Colored Shadows

| Token | Value |
|-------|-------|
| `--ml-shadow-primary` | `0 1px 2px 0 rgb(21 94 239 / 0.05)` |
| `--ml-shadow-success` | `0 1px 2px 0 rgb(7 148 85 / 0.05)` |
| `--ml-shadow-danger` | `0 1px 2px 0 rgb(217 45 32 / 0.05)` |

---

### Border Tokens

#### Border Radii

| Token | Value | px |
|-------|-------|----|
| `--ml-radius-none` | `0` | 0 |
| `--ml-radius-xxs` | `0.125rem` | 2 |
| `--ml-radius-xs` | `0.25rem` | 4 |
| `--ml-radius-sm` | `0.375rem` | 6 |
| `--ml-radius` | `0.5rem` | 8 |
| `--ml-radius-md` | `0.5rem` | 8 |
| `--ml-radius-lg` | `0.75rem` | 12 |
| `--ml-radius-xl` | `1rem` | 16 |
| `--ml-radius-2xl` | `1.25rem` | 20 |
| `--ml-radius-3xl` | `1.5rem` | 24 |
| `--ml-radius-4xl` | `2rem` | 32 |
| `--ml-radius-full` | `9999px` | pill/circle |

#### Border Widths

| Token | Value |
|-------|-------|
| `--ml-border-0` | `0` |
| `--ml-border` | `1px` |
| `--ml-border-2` | `2px` |
| `--ml-border-4` | `4px` |
| `--ml-border-8` | `8px` |

---

### Transition Tokens

#### Durations

| Token | Value |
|-------|-------|
| `--ml-duration-0` | `0ms` |
| `--ml-duration-75` | `75ms` |
| `--ml-duration-100` | `100ms` |
| `--ml-duration-150` | `150ms` |
| `--ml-duration-200` | `200ms` |
| `--ml-duration-300` | `300ms` |
| `--ml-duration-500` | `500ms` |
| `--ml-duration-700` | `700ms` |
| `--ml-duration-1000` | `1000ms` |

#### Easing Functions

| Token | Value |
|-------|-------|
| `--ml-ease-linear` | `linear` |
| `--ml-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` |
| `--ml-ease-out` | `cubic-bezier(0, 0, 0.2, 1)` |
| `--ml-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--ml-ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` |

#### Transition Presets

| Token | Value |
|-------|-------|
| `--ml-transition-none` | `none` |
| `--ml-transition-all` | `all var(--ml-duration-150) var(--ml-ease-in-out)` |
| `--ml-transition-colors` | `color var(--ml-duration-150) var(--ml-ease-in-out), background-color var(--ml-duration-150) var(--ml-ease-in-out), border-color var(--ml-duration-150) var(--ml-ease-in-out)` |
| `--ml-transition-opacity` | `opacity var(--ml-duration-150) var(--ml-ease-in-out)` |
| `--ml-transition-shadow` | `box-shadow var(--ml-duration-150) var(--ml-ease-in-out)` |
| `--ml-transition-transform` | `transform var(--ml-duration-150) var(--ml-ease-in-out)` |

---

### Breakpoint Tokens

#### CSS Custom Properties

| Token | Value |
|-------|-------|
| `--ml-screen-xs` | `320px` |
| `--ml-screen-sm` | `640px` |
| `--ml-screen-md` | `768px` |
| `--ml-screen-lg` | `1024px` |
| `--ml-screen-xl` | `1280px` |
| `--ml-screen-2xl` | `1536px` |

#### JavaScript `breakpoints` Object

```typescript
import { breakpoints } from '@melodicdev/components/theme';
// { xs: 320, sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }
```

No built-in CSS grid system. Breakpoints are reference values for media queries.

---

## Theme System

### Theme Presets

| Preset | Scope | Purpose |
|--------|-------|---------|
| Base (`baseThemeCss`) | `:root` | All tokens (primitives + semantics), `color-scheme: light`. Also redefines every non-zero `--ml-duration-*` token as `0ms` under `@media (prefers-reduced-motion: reduce)` |
| Light (`lightTheme`, `lightThemeCss`) | `:root, [data-theme="light"]` | Reaffirms the surface, text and border semantics, `color-scheme: light` |
| Dark (`darkTheme`, `darkThemeCss`) | `[data-theme="dark"]` + `@media (prefers-color-scheme: dark) { :root:not([data-theme]) }` | Overrides the semantic tokens listed in the Dark columns above, `color-scheme: dark` |

Dark mode applies automatically via OS preference only while the root element has no `data-theme` attribute at all. Any `data-theme` value — `"light"` or a custom theme name — turns the OS-preference rule off.

### Theme API Functions

All exported from `@melodicdev/components/theme`.

| Function | Signature | Description |
|----------|-----------|-------------|
| `applyTheme` | `(theme: ThemeMode) => void` | Sets `data-theme` on `documentElement`. `'system'` writes the resolved `'light'` / `'dark'` value and re-applies it when the OS preference changes. |
| `toggleTheme` | `() => void` | Applies the opposite of the resolved theme (light ↔ dark) |
| `getTheme` | `() => ThemeMode` | Returns the current mode. Before the first `applyTheme()` it adopts the document's own `data-theme` (`'light'` / `'dark'`, anything else reads as `'system'`) |
| `getResolvedTheme` | `() => 'light' \| 'dark'` | Resolves `'system'` to actual |
| `onThemeChange` | `(cb: (theme: ThemeMode, resolved: 'light' \| 'dark') => void) => () => void` | Subscribe; returns unsubscribe |
| `createTheme` | `(name: string, overrides: Partial<Record<string, string>>) => string` | Returns the CSS string `[data-theme="<name>"] { … }`. Throws on invalid input: `name` must match `^[a-z0-9-]+$`, keys must be custom properties (`--…`), values must not contain `;`, `{`, `}`, `<`, `>` or control characters |
| `injectTheme` | `(name: string, overrides: Partial<Record<string, string>>) => HTMLStyleElement` | Runs `createTheme` and injects `<style id="ml-theme-<name>">` into `<head>`, replacing an existing one with the same name |
| `createBrandTheme` | `(name: string, options: { primary?, secondary?, success?, warning?, danger?, mode?: BrandThemeMode }) => string` | Returns a CSS string (like `createTheme`); each color also emits its `-hover`, `-active` and `-subtle` variants via `color-mix()`. `mode` (`'light'` default, or `'dark'`) picks the mix direction |
| `tokensToCss` | `(tokens: Record<string, string>) => string` | Tokens object to CSS declarations |

Token objects exported from the same entry point: `primitiveColors`, `colorTokens`, `spacingTokens`, `typographyTokens`, `shadowTokens`, `borderTokens`, `transitionTokens`, `breakpointTokens`, `breakpoints`, `allTokens`.

`ThemeMode = 'light' | 'dark' | 'system'` · `BrandThemeMode = 'light' | 'dark'`

---

## Component-Scoped CSS Custom Properties

Every component exposes scoped CSS custom properties that default to global design tokens. This allows per-instance customization without affecting other components.

A component never declares these tokens on its own `:host`. Each rule reads its token with the default as the `var()` fallback (`font-weight: var(--ml-button-font-weight, var(--ml-font-semibold))`), so a value set anywhere above the component — on the element itself or inherited from any ancestor, including a wrapping custom element's `:host` — wins over the default.

### Naming Convention

`--ml-{component}-{state?}-{property}`

- **States:** `hover`, `active`, `focus`, `disabled`, `checked`, `expanded`, `open`
- **Properties:** `bg`, `color`, `border-color`, `border-width`, `radius`, `padding-x`, `padding-y`, `gap`, `font-size`, `font-weight`, `shadow`, `opacity`, `transition-duration`, `transition-easing`

### Usage Example

```css
/* Reshape a single button */
ml-button.cta {
    --ml-button-border-radius: 0;
    --ml-button-font-weight: var(--ml-font-bold);
}

/* Customize the sidebar for a specific theme */
ml-sidebar {
    --ml-sidebar-bg: #1a4a3a;
    --ml-sidebar-item-active-bg: transparent;
    --ml-sidebar-item-active-color: #c9a84c;
    --ml-sidebar-item-active-indicator-width: 3px;
    --ml-sidebar-item-active-indicator-color: #c9a84c;
    --ml-sidebar-item-active-icon-color: #c9a84c;
    --ml-sidebar-group-label-color: rgba(201, 168, 76, 0.5);
}

/* Style a card as a warm parchment surface */
ml-card.parchment {
    --ml-card-bg: #fdf9f0;
    --ml-card-border-color: #efe8d6;
    --ml-card-border-radius: 0;
}
```

### Restyling from a wrapper

A custom element that wraps `ml-*` components can restyle them in two ways. Both work from the wrapper's shadow tree.

**Token inheritance** — set the token on the wrapper's `:host` (or any ancestor). Custom properties inherit, and because the inner component reads the token with a fallback rather than declaring it, the inherited value is used:

```css
/* wrapper.styles.ts — every ml-button inside this wrapper */
:host {
    --ml-button-font-weight: 400;
    --ml-input-border-radius: 0;
}
```

**Element selector** — target the element itself from the wrapper's stylesheet. This sets the token on the element, so it also wins over a value inherited from further up:

```css
/* wrapper.styles.ts — only the buttons this rule matches */
ml-button.cta {
    --ml-button-font-weight: 700;
}
```

Two limits apply to both paths:

- Variant and size modifiers reassign tokens on the component's inner element (`.ml-button--secondary { --ml-button-bg: … }`), so those specific tokens cannot be overridden from outside. Where the default variant or size has a modifier class too, the token is never overridable: `ml-button` (colors, and height / padding / font size), `ml-badge` (background, border color, text color, padding, font size), `ml-progress` (fill colors), `ml-checkbox` / `ml-radio` / `ml-toggle` (box, circle and track sizes), `ml-spinner` (size). Use the global tokens the modifier references instead, scoped to the element — `ml-button.cta { --ml-color-primary: #c9a84c; }` — or the per-variant global tokens (`--ml-badge-primary-bg`, …).
- A few tokens are read by the component's JavaScript rather than by a rule and stay declared on `:host`: `--ml-drawer-transition-duration`, `--ml-drawer-transition-easing` and `--ml-app-shell-mobile-breakpoint`. Set those with an element selector.

Each component's available custom properties and their defaults are listed in the comment block at the top of its styles source file. See the individual component sections below for key properties.

---

## Style Utilities

Exported from `@melodicdev/components/utils` (and re-exported from the package root).

| Export | Description |
|--------|-------------|
| `resetStyles` | Shadow DOM CSS reset (box-sizing, margins, button/input font inheritance, `[hidden]`) |
| `componentBaseStyles` | Base `:host` styles for all `ml-*` components (font-family, box-sizing, focus ring, disabled, hidden) |
| `visuallyHiddenStyles` | `.visually-hidden` screen-reader-only class |

All three are plain CSS strings.

---

## Shared Types

```typescript
type ThemeMode = 'light' | 'dark' | 'system';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';        // button, spinner, avatar, file-icon
type ControlSize = 'sm' | 'md' | 'lg';               // most other controls
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'error' | 'link';  // 'danger' is a deprecated alias of 'error'
type AlertVariant = 'info' | 'success' | 'warning' | 'error';
type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
type Side = 'top' | 'right' | 'bottom' | 'left';
type Alignment = 'start' | 'center' | 'end';
type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end'
               | 'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end';
type Orientation = 'horizontal' | 'vertical';
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
```

Where each is exported: `ThemeMode` and `Breakpoint` from `@melodicdev/components/theme`; `Placement`, `Side` and `Alignment` from `@melodicdev/components/utils`; `ButtonVariant`, `AlertVariant` and `BadgeVariant` from their component entry points (`/button`, `/alert`, `/badge`). `Size`, `ControlSize` and `Orientation` are internal aliases with no public export — write the union inline.

---

## Utilities, Functions & Directives

### Utilities

Exported from `@melodicdev/components/utils` (and re-exported from the package root).

**Positioning** — a small synchronous positioning engine used by the overlay components.

| Export | Signature | Description |
|--------|-----------|-------------|
| `computePosition` | `(reference: Element, floating: HTMLElement, config?: ComputePositionConfig) => { x, y, placement, middlewareData }` | Computes viewport coordinates for `floating` next to `reference`. Synchronous. `config` is `{ placement?: Placement (default 'bottom'), middleware?: Middleware[] }` |
| `autoUpdate` | `(reference: Element, floating: HTMLElement, update: () => void, options?) => () => void` | Calls `update` on ancestor scroll / resize and element resize; returns a cleanup function. Options: `ancestorScroll`, `ancestorResize`, `elementResize` (default `true`), `animationFrame` (default `false`) |
| `offset` | `(options?: number \| { mainAxis?: number; crossAxis?: number }) => Middleware` | Distance between reference and floating element |
| `flip` | `(options?: { fallbackPlacements?: Placement[]; padding?: number }) => Middleware` | Flips to another side when the placement overflows |
| `shift` | `(options?: { padding?: number; mainAxis?: boolean; crossAxis?: boolean }) => Middleware` | Shifts along the cross axis to stay in view (`crossAxis` default `true`, `mainAxis` default `false`) |
| `arrow` | `(options: { element: HTMLElement; padding?: number }) => Middleware` | Positions an arrow element |

Types: `Placement`, `Side`, `Alignment`, `Middleware`, `MiddlewareState`, `Position`, `ComputePositionConfig`.

```typescript
import { computePosition, autoUpdate, offset, flip, shift } from '@melodicdev/components/utils';

const cleanup = autoUpdate(trigger, panel, () => {
  const { x, y } = computePosition(trigger, panel, {
    placement: 'bottom-start',
    middleware: [offset(8), flip(), shift({ padding: 8 })]
  });
  Object.assign(panel.style, { left: `${x}px`, top: `${y}px` });
});
```

**Accessibility**

| Export | Signature | Description |
|--------|-----------|-------------|
| `createFocusTrap` | `(container: HTMLElement, options?: FocusTrapOptions) => FocusTrap` | Returns `{ activate(), deactivate(options?: { returnFocus?: boolean }), isActive() }`. Options: `initialFocus`, `returnFocus` (elements), `autoFocus`. The trap follows slots and descends into nested shadow roots, so controls inside nested components (`ml-input`, `ml-button`, …) are trapped too |
| `focusTrap` | `(container: HTMLElement, options?: FocusTrapOptions) => () => void` | Activates a trap immediately; returns a function that deactivates it |
| `getDeepActiveElement` | `() => Element \| null` | The focused element, descending through nested shadow roots |
| `isDeepFocusWithin` | `(container: Node) => boolean` | Whether focus is inside `container`, across shadow roots |
| `getFocusableElements` | `(container: HTMLElement, options?: GetFocusableOptions) => HTMLElement[]` | Focusable descendants. `{ deep: true }` walks the composed tree — into the shadow roots of nested custom elements and through `<slot>`s — and returns elements in tab order; the default (`deep: false`) searches only the container's own tree |
| `getFirstFocusable` / `getLastFocusable` | `(container: HTMLElement) => HTMLElement \| null` | First / last focusable descendant |
| `focusFirst` / `focusLast` | `(container: HTMLElement) => boolean` | Focus the first / last focusable descendant; returns whether one was found |
| `isFocusVisible` | `() => boolean` | `true` when the last interaction was keyboard-based |
| `focusVisible` | `(element: HTMLElement, className = 'focus-visible') => () => void` | Adds `className` while the element is focused via keyboard; returns cleanup |
| `announce` | `(message: string, priority: 'polite' \| 'assertive' = 'polite') => void` | Announces a message through a shared live region; rapid calls are queued |
| `createLiveRegion` | `(options?: { id?: string; priority?: 'polite' \| 'assertive'; atomic?: boolean }) => HTMLElement` | Creates a custom live region |
| `setCrossRootDescription` | `(target: Element, describers: Element[]) => void` | Describes `target` with elements in another root. Uses `ariaDescribedByElements` when the browser supports it and every describer is referenceable from `target` (see `canReferenceElement`); otherwise copies their text onto `target` as `aria-description`. An empty array clears it |
| `setCrossRootLabel` | `(target: Element, labels: Element[]) => void` | Labels `target` across shadow roots |
| `setCrossRootActiveDescendant` | `(target: Element, active: Element \| null) => void` | Sets the active descendant across shadow roots |
| `clearCrossRootDescription` | `(target: Element) => void` | Removes a description set by `setCrossRootDescription` |
| `getFocusableControl` | `(element: Element) => HTMLElement` | The focusable control inside a host such as `ml-button` |
| `supportsAriaElementReferences` | `() => boolean` | Whether the browser supports ARIA element reflection |
| `canReferenceElement` | `(from: Element, to: Element) => boolean` | Whether an ARIA element reference from `from` to `to` will be honoured: `to` must be in `from`'s own tree or one of its shadow-including ancestor trees. A light-DOM element cannot reference into a shadow root |

Types: `FocusTrap`, `FocusTrapOptions`, `FocusTrapDeactivateOptions`, `GetFocusableOptions` (`{ deep?: boolean }`).

**Slot and click helpers**

| Export | Signature | Description |
|--------|-----------|-------------|
| `clickOutside` | `(element: HTMLElement, callback: (event: MouseEvent) => void) => () => void` | Calls `callback` for clicks outside `element` (shadow-DOM aware, capture phase); returns cleanup |
| `watchLightSlots` | `(host: HTMLElement, onChange: () => void) => () => void` | Calls `onChange` immediately and whenever the host's direct children or their `slot` attributes change; returns a disconnect function |
| `hasLightSlot` | `(host: HTMLElement, slotName: string) => boolean` | Whether `host` has a direct child assigned to `slotName` |

**Virtual scrolling**

```typescript
import { VirtualScroller } from '@melodicdev/components/utils';
import type { VirtualScrollOptions } from '@melodicdev/components/utils';

const scroller = new VirtualScroller();
scroller.attach(viewportEl, {
  rowHeight: () => 44,                         // px
  itemCount: () => this.rows.length,
  onUpdate: (start, end) => { this.startIndex = start; this.endIndex = end; },
  enabled: () => this.virtual,                 // optional; false renders every row
  buffer: 3                                    // optional overscan rows (default 3)
});
scroller.invalidate();   // after the item count or row height changes
scroller.detach();       // on destroy
```

**Styles** — see [Style Utilities](#style-utilities).

### Functions

Exported from `@melodicdev/components/functions` (and re-exported from the package root).

| Export | Signature | Description |
|--------|-----------|-------------|
| `newID` | `() => UniqueID` | Random UUID-shaped string (`UniqueID` is a branded `string`) |
| `watchSlotPresence` | `(shadow: ShadowRoot, onChange: (slotName: string, hasContent: boolean) => void) => void` | Reports, now and on every `slotchange`, whether each `<slot>` currently in `shadow` has content (`''` is the default slot; whitespace-only text does not count) |
| `warnDeprecatedOnce` | `(key: string, message: string) => void` | `console.warn` once per key |
| `warnDeprecatedTitleOnce` | `(tag: string, replacement: string) => void` | The shared deprecation warning for the `title` shim |
| `defineLegacyAliases` | `(proto: T, tag: string, aliases: Record<string, keyof T & string>) => void` | Defines deprecated quoted kebab-case property aliases that forward to camelCase properties |

### Directives

Exported from `@melodicdev/components/directives` (not re-exported from the package root).

| Export | Description |
|--------|-------------|
| `tooltipDirective` | Importing the entry point registers it as the `:tooltip` attribute directive and registers `ml-tooltip`. See [ml-tooltip](#ml-tooltip) for usage |

Type: `TooltipDirectiveOptions` — `{ content: string; placement?: string }`.

---

## Form Components

### ml-button

**Selector:** `ml-button` · **Import:** `import '@melodicdev/components/button'`
**Source:** `packages/melodic-components/src/components/forms/button/`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `variant` | `variant` | `ButtonVariant` | `'primary'` | `'primary'`, `'secondary'`, `'outline'`, `'ghost'`, `'error'`, `'link'`. `'danger'` is a deprecated alias of `'error'` and renders identically |
| `size` | `size` | `Size` | `'md'` | `'xs'`, `'sm'`, `'md'`, `'lg'`, `'xl'` |
| `type` | `type` | `ButtonType` | `'button'` | `'button'`, `'submit'`, `'reset'` |
| `disabled` | `disabled` | `boolean` | `false` | |
| `loading` | `loading` | `boolean` | `false` | Shows an `ml-spinner` and disables the button |
| `fullWidth` | `full-width` | `boolean` | `false` | |
| `href` | `href` | `string \| null` | `null` | When set, renders an `<a role="button">` instead of a `<button>` |
| `target` | `target` | `string \| null` | `null` | Link target (with `href`) |
| `rel` | `rel` | `string \| null` | `null` | Link rel (with `href`) |
| `download` | `download` | `string \| null` | `null` | Link download filename (with `href`) |

**Heights:** `xs` = 2rem, `sm` = 2.25rem, `md` = 2.5rem, `lg` = 2.75rem, `xl` = 3rem

**Form participation:** with `type="submit"` or `type="reset"` inside a `<form>` (found by walking ancestors, crossing shadow boundaries), a click calls `form.requestSubmit()` or `form.reset()` — unless `href` is set or a listener called `preventDefault()` on the click.

#### Slots

| Slot | Description |
|------|-------------|
| (default) | Button label content |
| `icon-start` | Icon before label |
| `icon-end` | Icon after label |

#### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `ml:click` | `{ originalEvent: MouseEvent }` | Click (not when disabled/loading) |

#### Usage

```html
<ml-button variant="error" size="lg" loading>Processing...</ml-button>
<ml-button variant="ghost">
  <ml-icon slot="icon-start" icon="plus"></ml-icon>
  Add Item
</ml-button>
<ml-button href="/reports/q3.pdf" download="q3.pdf" variant="outline">Download</ml-button>
```

#### Key CSS Custom Properties

Overridable from the element or any ancestor:

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-button-border-radius` | `var(--ml-radius)` | Border radius (`xs` / `sm` set their own) |
| `--ml-button-border-width` | `var(--ml-border)` | Border width |
| `--ml-button-font-family` | `var(--ml-font-sans)` | Font family |
| `--ml-button-font-weight` | `var(--ml-font-semibold)` | Font weight (`link` sets its own) |
| `--ml-button-line-height` | `var(--ml-leading-tight)` | Line height |
| `--ml-button-gap` | `var(--ml-space-2)` | Gap between icon and label |
| `--ml-button-shadow` | `var(--ml-shadow-xs)` | Box shadow (`outline` / `ghost` / `link` set their own) |
| `--ml-button-focus-shadow` | `var(--ml-shadow-focus-ring)` | Focus ring shadow (`secondary` / `error` set their own) |
| `--ml-button-hover-color` | `var(--ml-color-text-inverse)` | Hover text color (`primary` and `error` only; the other variants set their own) |
| `--ml-button-disabled-opacity` | `0.5` | Opacity when disabled |
| `--ml-button-transition-duration` | `var(--ml-duration-150)` | Transition duration |
| `--ml-button-transition-easing` | `var(--ml-ease-in-out)` | Transition easing |

**Not overridable from outside — owned by the variant and size classes.** Every variant class, including the default `primary`, reassigns the color tokens on the inner element, and every size class, including the default `md`, reassigns the sizing tokens. A value for one of these set on `ml-button` or an ancestor is shadowed and has no effect:

| Property | Default (`primary`, `md`) | Set by |
|----------|---------------------------|--------|
| `--ml-button-bg` | `var(--ml-color-primary)` | every variant |
| `--ml-button-border-color` | `var(--ml-color-primary)` | every variant |
| `--ml-button-color` | `var(--ml-color-text-inverse)` | every variant |
| `--ml-button-hover-bg` | `var(--ml-color-primary-hover)` | every variant |
| `--ml-button-hover-border-color` | `var(--ml-color-primary-hover)` | every variant |
| `--ml-button-active-bg` | `var(--ml-color-primary-active)` | every variant except `link` |
| `--ml-button-active-border-color` | `var(--ml-color-primary-active)` | `primary`, `error` |
| `--ml-button-height` | `2.5rem` | every size (and `link`) |
| `--ml-button-padding` | `0 var(--ml-space-3-5)` | every size (and `link`) |
| `--ml-button-font-size` | `var(--ml-text-sm)` | every size |

To recolor a button, override the global token its variant reads, scoped to the element:

```css
ml-button.cta {
    --ml-color-primary: #c9a84c;        /* primary: background + border */
    --ml-color-primary-hover: #d4b96a;
    --ml-color-primary-active: #b8963c;
}
```

---

### ml-button-group

**Selector:** `ml-button-group` · **Import:** `import '@melodicdev/components/button-group'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `value` | `value` | `string` | `''` | Single-select value |
| `variant` | `variant` | `'outline' \| 'solid'` | `'outline'` | `'outline'`, `'solid'` |
| `size` | `size` | `ControlSize` | `'md'` | `'sm'`, `'md'`, `'lg'` |
| `disabled` | `disabled` | `boolean` | `false` | |
| `multiple` | `multiple` | `boolean` | `false` | |
| `values` | (property) | `string[]` | `[]` | Multi-select values |
| `error` | `error` | `string` | `''` | Error message shown below the group |

**Slots:** (default) — `ml-button-group-item` children

Programmatic writes to `value` / `values` / `variant` / `size` / `disabled` are pushed to the slotted items on every render. Supports `:formControl` (the control value is a `string`, or a `string[]` when `multiple`).

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string }` (single) or `{ values: string[] }` (multiple) |

#### Child: `ml-button-group-item`

Props: `value`, `icon` (Phosphor icon name), `disabled`, `active` (managed), `groupDisabled` (`group-disabled`, managed), `groupSize` (`group-size`, managed)

**Slots:** (default) — item label

Renders a `<button aria-pressed>`. Dispatches an internal `ml:item-click` (`{ value }`) that the group consumes and re-emits as `ml:change`.

#### Usage

```html
<ml-button-group value="list" variant="solid" size="sm">
  <ml-button-group-item value="list" icon="list">List</ml-button-group-item>
  <ml-button-group-item value="grid" icon="grid-four">Grid</ml-button-group-item>
</ml-button-group>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-button-group-disabled-opacity` | `0.5` | Opacity when disabled |
| `--ml-button-group-item-offset` | `-1px` | Overlap between adjacent items |
| `--ml-button-group-error-color` | `var(--ml-color-danger)` | Error message color |
| `--ml-button-group-error-font-size` | `var(--ml-text-sm)` | Error message font size |

---

### ml-input

**Selector:** `ml-input` · **Import:** `import '@melodicdev/components/input'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `type` | `type` | `InputType` | `'text'` | `'text'`, `'email'`, `'password'`, `'number'`, `'tel'`, `'url'`, `'search'` |
| `value` | `value` | `string` | `''` | |
| `placeholder` | `placeholder` | `string` | `''` | |
| `label` | `label` | `string` | `''` | |
| `hint` | `hint` | `string` | `''` | |
| `error` | `error` | `string` | `''` | Shown instead of `hint`; sets the error state |
| `size` | `size` | `ControlSize` | `'md'` | `'sm'`, `'md'`, `'lg'` |
| `disabled` | `disabled` | `boolean` | `false` | |
| `readonly` | `readonly` | `boolean` | `false` | |
| `required` | `required` | `boolean` | `false` | |
| `autocomplete` | `autocomplete` | `string` | `'off'` | |
| `name` | `name` | `string` | `''` | |
| `maxlength` | `maxlength` | `number \| null` | `null` | |
| `minlength` | `minlength` | `number \| null` | `null` | |
| `min` | `min` | `string` | `''` | |
| `max` | `max` | `string` | `''` | |
| `step` | `step` | `string` | `''` | |
| `pattern` | `pattern` | `string` | `''` | |
| `inputmode` | `inputmode` | `string` | `''` | |

The last eight are passed straight through to the inner `<input>`.

#### Slots

`prefix`, `suffix`

#### Events

| Event | Detail |
|-------|--------|
| `ml:input` | `{ value: string }` |
| `ml:change` | `{ value: string }` |
| `ml:focus` | none |
| `ml:blur` | none |

#### Usage

```html
<ml-input label="Email" type="email" placeholder="Enter email" required>
  <ml-icon slot="prefix" icon="magnifying-glass"></ml-icon>
</ml-input>
```

**Accessible name:** without a `label`, the inner `<input>` is named by the host's `aria-label`, falling back to `placeholder`.

#### Form Integration

Bind a `FormControl` with the `:formControl` directive — the `error` attribute is populated automatically from the validator's resolved message when the control is touched and invalid:

```typescript
html`<ml-input label="Email" :formControl=${this.form.get('email')}></ml-input>`;
```

`error="..."` set manually still takes precedence at the attribute level when no `:formControl` is bound. The same binding and auto-error behavior applies to the other form components that register a forms adapter and observe the `error` attribute: `ml-textarea`, `ml-select`, `ml-autocomplete`, `ml-checkbox`, `ml-toggle`, `ml-radio-group`, `ml-radio-card-group`, `ml-button-group`, `ml-slider`, `ml-date-picker`, `ml-time-picker`, `ml-date-time-picker`, `ml-file-upload`.

The form controls are not form-associated custom elements: none of them calls `setFormValue`, so their values are not part of a native `<form>` submission or `FormData`. Read values through `:formControl` or the `ml:*` events.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-input-bg` | `var(--ml-color-input-bg)` | Input background |
| `--ml-input-color` | `var(--ml-color-text)` | Text color |
| `--ml-input-border-color` | `var(--ml-color-border)` | Border color |
| `--ml-input-border-width` | `var(--ml-border)` | Border width |
| `--ml-input-border-radius` | `var(--ml-radius)` | Border radius |
| `--ml-input-hover-border-color` | `var(--ml-color-border)` | Hover border color |
| `--ml-input-padding` | `var(--ml-space-2-5) var(--ml-space-3-5)` | Wrapper padding |
| `--ml-input-focus-border-color` | `var(--ml-color-primary)` | Focus border color |
| `--ml-input-focus-shadow` | `var(--ml-shadow-focus-ring)` | Focus ring shadow |
| `--ml-input-focus-inset-shadow` | `none` | Additional inset shadow on focus (composited with focus-shadow) |
| `--ml-input-error-border-color` | `var(--ml-color-danger)` | Border color in the error state |
| `--ml-input-error-color` | `var(--ml-color-danger)` | Error message color |
| `--ml-input-disabled-bg` | `var(--ml-color-input-disabled-bg)` | Disabled background |
| `--ml-input-label-color` | `var(--ml-color-text-secondary)` | Label text color |
| `--ml-input-placeholder-color` | `var(--ml-color-text-muted)` | Placeholder color |
| `--ml-input-hint-color` | `var(--ml-color-text-muted)` | Hint text color |
| `--ml-input-addon-color` | `var(--ml-color-text-muted)` | Prefix / suffix color |

---

### ml-textarea

**Selector:** `ml-textarea` · **Import:** `import '@melodicdev/components/textarea'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `value` | `value` | `string` | `''` |
| `placeholder` | `placeholder` | `string` | `''` |
| `label` | `label` | `string` | `''` |
| `hint` | `hint` | `string` | `''` |
| `error` | `error` | `string` | `''` |
| `size` | `size` | `ControlSize` | `'md'` (`'sm'`, `'md'`, `'lg'`) |
| `rows` | `rows` | `number` | `3` |
| `maxLength` | `max-length` | `number` | `0` (no limit; >0 shows counter) |
| `disabled` | `disabled` | `boolean` | `false` |
| `readonly` | `readonly` | `boolean` | `false` |
| `required` | `required` | `boolean` | `false` |
| `resize` | `resize` | `boolean` | `false` (when set, the field is vertically resizable) |
| `name` | `name` | `string` | `''` |

#### Events

`ml:input`, `ml:change`, `ml:focus`, `ml:blur` — same as `ml-input`.

#### Usage

```html
<ml-textarea label="Bio" rows="5" max-length="500" resize></ml-textarea>
```

#### Key CSS Custom Properties

Same token names as `ml-input` with the `--ml-textarea-` prefix (`-bg`, `-color`, `-border-color`, `-border-width`, `-border-radius`, `-hover-border-color`, `-padding`, `-focus-border-color`, `-focus-shadow`, `-focus-inset-shadow`, `-error-border-color`, `-error-color`, `-disabled-bg`, `-label-color`, `-placeholder-color`, `-hint-color`) and the same defaults, except `--ml-textarea-padding` (`var(--ml-space-3) var(--ml-space-3-5)`). Textarea-only tokens:

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-textarea-min-height` | `80px` | Minimum field height |
| `--ml-textarea-counter-color` | `var(--ml-color-text-muted)` | Character counter color |
| `--ml-textarea-counter-font-size` | `var(--ml-text-xs)` | Character counter font size |

---

### ml-checkbox

**Selector:** `ml-checkbox` · **Import:** `import '@melodicdev/components/checkbox'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `label` | `label` | `string` | `''` |
| `hint` | `hint` | `string` | `''` |
| `error` | `error` | `string` | `''` |
| `size` | `size` | `ControlSize` | `'md'` |
| `checked` | `checked` | `boolean` | `false` |
| `indeterminate` | `indeterminate` | `boolean` | `false` |
| `disabled` | `disabled` | `boolean` | `false` |
| `name` | `name` | `string` | `''` |
| `value` | `value` | `string` | `'on'` |

**Sizes:** `sm` = 1rem, `md` = 1.25rem, `lg` = 1.5rem

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ checked: boolean }` |

#### Usage

```html
<ml-checkbox label="Accept terms" checked></ml-checkbox>
<ml-checkbox label="Select all" indeterminate></ml-checkbox>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-checkbox-box-bg` | `var(--ml-color-input-bg)` | Unchecked background |
| `--ml-checkbox-box-border-color` | `var(--ml-color-border-strong)` | Unchecked border color |
| `--ml-checkbox-box-border-radius` | `var(--ml-radius-xs)` | Box radius |
| `--ml-checkbox-box-color` | `var(--ml-color-text-inverse)` | Check mark color |
| `--ml-checkbox-checked-bg` | `var(--ml-color-primary)` | Checked background |
| `--ml-checkbox-checked-border-color` | `var(--ml-color-primary)` | Checked border color |
| `--ml-checkbox-focus-shadow` | `var(--ml-shadow-focus-ring)` | Focus ring shadow |
| `--ml-checkbox-label-color` | `var(--ml-color-text-secondary)` | Label color |
| `--ml-checkbox-error-color` | `var(--ml-color-danger)` | Error message color |

---

### ml-radio

**Selector:** `ml-radio` · **Import:** `import '@melodicdev/components/radio'`

#### Props / Attributes

`name`, `value`, `label`, `hint`, `size` (`'sm'` | `'md'` | `'lg'`, default `'md'`), `checked`, `disabled`

**Sizes:** `sm` = 1rem circle, `md` = 1.25rem, `lg` = 1.5rem

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string, checked: true }` |

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-radio-circle-bg` | `var(--ml-color-input-bg)` | Unchecked background |
| `--ml-radio-circle-border-color` | `var(--ml-color-border-strong)` | Unchecked border color |
| `--ml-radio-dot-color` | `var(--ml-color-primary)` | Dot color |
| `--ml-radio-checked-border-color` | `var(--ml-color-primary)` | Checked border color |
| `--ml-radio-checked-bg` | `var(--ml-color-primary-subtle)` | Checked background |
| `--ml-radio-focus-shadow` | `var(--ml-shadow-focus-ring)` | Focus ring shadow |
| `--ml-radio-label-color` | `var(--ml-color-text-secondary)` | Label color |

### ml-radio-group

**Selector:** `ml-radio-group` · **Import:** `import '@melodicdev/components/radio'` (same entry point as `ml-radio`)

#### Props / Attributes

`label`, `name`, `value`, `hint`, `error`, `orientation` (`'vertical'` | `'horizontal'`, default `'vertical'`), `disabled`, `required`

**Slots:** (default) — `ml-radio` children

**Keyboard:** ArrowRight/ArrowDown and ArrowLeft/ArrowUp move focus and selection (wrapping, skipping disabled radios).

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string }` |

#### Usage

```html
<ml-radio-group label="Plan" name="plan" orientation="horizontal">
  <ml-radio value="basic" label="Basic"></ml-radio>
  <ml-radio value="pro" label="Pro"></ml-radio>
</ml-radio-group>
```

---

### ml-radio-card-group

**Selector:** `ml-radio-card-group` · **Import:** `import '@melodicdev/components/radio-card-group'`

#### Props / Attributes

`value`, `label`, `hint`, `error`, `orientation` (`'vertical'` | `'horizontal'`, default `'vertical'`), `disabled`, `required`

**Slots:** (default) — `ml-radio-card` children

**Keyboard:** the group is a single tab stop; arrow keys move focus and selection between enabled cards (wrapping).

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string }` |

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-radio-card-group-gap` | `var(--ml-space-3)` | Gap between cards |
| `--ml-radio-card-group-legend-color` | `var(--ml-color-text-secondary)` | Group label color |
| `--ml-radio-card-group-hint-color` | `var(--ml-color-text-muted)` | Hint color |
| `--ml-radio-card-group-error-color` | `var(--ml-color-danger)` | Error color |
| `--ml-radio-card-group-disabled-opacity` | `0.5` | Opacity when disabled |

### ml-radio-card

**Selector:** `ml-radio-card` · registered by `import '@melodicdev/components/radio-card-group'`

Props: `value`, `label`, `description`, `detail`, `icon`, `selected` (managed), `disabled`, `groupDisabled` (`group-disabled`, managed), `tabStop` (`tab-stop`, managed)

**Slots:** (default) — Additional content below label/description

Dispatches an internal `ml:card-select` (`{ value }`) that the group consumes and re-emits as `ml:change`.

#### Usage

```html
<ml-radio-card-group value="basic" label="Select a plan" orientation="horizontal">
  <ml-radio-card value="basic" label="Basic" description="Up to 5 users" detail="$10/mo" icon="user"></ml-radio-card>
  <ml-radio-card value="pro" label="Business" description="Up to 50 users" detail="$25/mo" icon="buildings"></ml-radio-card>
</ml-radio-card-group>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-radio-card-bg` | `var(--ml-color-surface)` | Card background |
| `--ml-radio-card-border-color` | `var(--ml-color-border)` | Card border color |
| `--ml-radio-card-border-radius` | `var(--ml-radius-lg)` | Card radius |
| `--ml-radio-card-padding` | `var(--ml-space-4)` | Card padding |
| `--ml-radio-card-hover-bg` | `var(--ml-color-surface-raised)` | Hover background |
| `--ml-radio-card-hover-border-color` | `var(--ml-color-border-strong)` | Hover border color |
| `--ml-radio-card-selected-bg` | `var(--ml-color-primary-subtle)` | Selected background |
| `--ml-radio-card-selected-border-color` | `var(--ml-color-primary)` | Selected border color |
| `--ml-radio-card-selected-ring` | `0 0 0 1px var(--ml-color-primary)` | Selected ring (box-shadow) |
| `--ml-radio-card-focus-shadow` | `var(--ml-shadow-focus-ring)` | Focus ring shadow |
| `--ml-radio-card-label-color` | `var(--ml-color-text)` | Label color |
| `--ml-radio-card-description-color` | `var(--ml-color-text-muted)` | Description color |
| `--ml-radio-card-icon-color` | `var(--ml-color-text-muted)` | Icon color |

---

### ml-toggle

**Selector:** `ml-toggle` · **Import:** `import '@melodicdev/components/toggle'`

#### Props / Attributes

`label`, `hint`, `error`, `size` (`'sm'` | `'md'` | `'lg'`, default `'md'`), `checked`, `disabled`

**Sizes:** `sm` = 2.25rem x 1.25rem, `md` = 2.75rem x 1.5rem, `lg` = 3rem x 1.75rem

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ checked: boolean }` |

#### Usage

```html
<ml-toggle label="Enable notifications" checked></ml-toggle>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-toggle-track-bg` | `var(--ml-color-toggle-off)` | Track background (off) |
| `--ml-toggle-track-hover-bg` | `var(--ml-color-toggle-off-hover)` | Track hover background (off) |
| `--ml-toggle-track-checked-bg` | `var(--ml-color-primary)` | Track background (on) |
| `--ml-toggle-track-checked-hover-bg` | `var(--ml-color-primary-hover)` | Track hover background (on) |
| `--ml-toggle-thumb-bg` | `var(--ml-white)` | Thumb background |
| `--ml-toggle-thumb-shadow` | `var(--ml-shadow-sm)` | Thumb shadow |
| `--ml-toggle-focus-shadow` | `var(--ml-shadow-focus-ring)` | Focus ring shadow |
| `--ml-toggle-label-color` | `var(--ml-color-text-secondary)` | Label color |
| `--ml-toggle-error-color` | `var(--ml-color-danger)` | Error message color |
| `--ml-toggle-transition-duration` | `var(--ml-duration-200)` | Transition duration |

---

### ml-select

**Selector:** `ml-select` · **Import:** `import '@melodicdev/components/select'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `label` | `label` | `string` | `''` |
| `placeholder` | `placeholder` | `string` | `'Select an option'` |
| `hint` | `hint` | `string` | `''` |
| `error` | `error` | `string` | `''` |
| `size` | `size` | `Size` | `'md'` (styled sizes: `'sm'`, `'md'`, `'lg'`) |
| `disabled` | `disabled` | `boolean` | `false` |
| `required` | `required` | `boolean` | `false` |
| `multiple` | `multiple` | `boolean` | `false` |
| `value` | `value` | `string` | `''` |
| `values` | (property) | `string[]` | `[]` |
| `options` | (property) | `SelectOption[]` | `[]` |

```typescript
interface SelectOption {
  value: string;
  label: string;
  avatarUrl?: string;
  avatarAlt?: string;
  icon?: string;
  disabled?: boolean;
}
```

In `multiple` mode the trigger shows the selected options as removable tags plus a search input that filters the list. The search input is the combobox and the control's only tab stop; in single mode the trigger is.

`value`, `values` and `multiple` are kept consistent:

- Turning `multiple` on carries a set `value` into `values` (when `values` is empty). Turning it off keeps `values[0]` as `value` and empties `values`.
- In multiple mode, writing `value` adds it to `values`.
- In single mode, writing a non-empty `values` mirrors its first entry onto `value`; `values = []` leaves `value` alone.
- `values` also accepts a comma-separated string; duplicates and non-strings are dropped.

**Methods:** `open()`, `close()`, `toggle()` — function fields, callable on the element (`selectEl.open()`) or on `el.component`

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | Single: `{ value: string, option: SelectOption }`. Multiple: `{ values: string[], options: SelectOption[], option?: SelectOption }` (`option` is the toggled option; absent when a tag is removed) |
| `ml:open` | none |
| `ml:close` | none |

#### Keyboard

Enter/Space (open/select), Escape (close — only handled while open), ArrowDown/Up (open/navigate), Home/End, Tab (close), printable characters (type-ahead to the matching option)

#### Usage

```html
<ml-select label="Country" .options=${[
  { value: 'us', label: 'United States', icon: 'flag' },
  { value: 'ca', label: 'Canada' }
]}></ml-select>

<ml-select label="Countries" multiple .values=${['us', 'ca']} .options=${countryOptions}></ml-select>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-select-bg` | `var(--ml-color-input-bg)` | Trigger background |
| `--ml-select-color` | `var(--ml-color-text)` | Trigger text color |
| `--ml-select-border-color` | `var(--ml-color-border)` | Trigger border color |
| `--ml-select-border-radius` | `var(--ml-radius)` | Trigger radius |
| `--ml-select-hover-border-color` | `var(--ml-color-border-strong)` | Trigger hover border color |
| `--ml-select-focus-border-color` | `var(--ml-color-primary)` | Focus border color |
| `--ml-select-focus-shadow` | `var(--ml-shadow-focus-ring)` | Focus ring shadow |
| `--ml-select-error-border-color` | `var(--ml-color-danger)` | Border color in the error state |
| `--ml-select-placeholder-color` | `var(--ml-color-text-muted)` | Placeholder color |
| `--ml-select-dropdown-bg` | `var(--ml-color-surface)` | Dropdown background |
| `--ml-select-dropdown-border-color` | `var(--ml-color-border)` | Dropdown border color |
| `--ml-select-dropdown-shadow` | `var(--ml-shadow-lg)` | Dropdown shadow |
| `--ml-select-dropdown-max-height` | `280px` | Dropdown max height |
| `--ml-select-option-color` | `var(--ml-color-text)` | Option text color |
| `--ml-select-option-hover-bg` | `var(--ml-color-surface-raised)` | Option hover / focused background |
| `--ml-select-option-selected-bg` | `var(--ml-color-primary-subtle)` | Selected option background |
| `--ml-select-option-check-color` | `var(--ml-color-primary)` | Selected check icon color |
| `--ml-select-tag-bg` | `var(--ml-color-surface)` | Tag background (multiple) |
| `--ml-select-tag-border-color` | `var(--ml-color-border)` | Tag border color (multiple) |

---

### ml-autocomplete

**Selector:** `ml-autocomplete` · **Import:** `import '@melodicdev/components/autocomplete'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `label` | `label` | `string` | `''` |
| `placeholder` | `placeholder` | `string` | `'Search'` |
| `hint` | `hint` | `string` | `''` |
| `error` | `error` | `string` | `''` |
| `size` | `size` | `Size` | `'md'` (styled sizes: `'sm'`, `'md'`, `'lg'`) |
| `disabled` | `disabled` | `boolean` | `false` |
| `required` | `required` | `boolean` | `false` |
| `multiple` | `multiple` | `boolean` | `false` |
| `value` | `value` | `string` | `''` |
| `openOnFocus` | `open-on-focus` | `boolean` | `true` (`open-on-focus="false"` turns it off) |
| `values` | (property) | `string[]` | `[]` |
| `options` | (property) | `AutocompleteOption[]` | `[]` |
| `searchFn` | (property) | `AutocompleteSearchFn \| null` | `null` |
| `debounce` | (property) | `number` | `300` |
| `minChars` | (property) | `number` | `0` |
| `showIcon` | (property) | `boolean` | `true` |
| `initialOption` | (property) | `AutocompleteOption \| null` | `null` (label for a pre-set `value` when using `searchFn`) |
| `initialOptions` | (property) | `AutocompleteOption[]` | `[]` (labels for pre-set `values` when using `searchFn`) |

```typescript
interface AutocompleteOption {
  value: string;
  label: string;
  subtitle?: string;
  avatarUrl?: string;
  avatarAlt?: string;
  icon?: string;
  disabled?: boolean;
}

type AutocompleteSearchFn = (query: string) => Promise<AutocompleteOption[]>;
```

Without `searchFn`, `options` are filtered client-side against `label`, `value` and `subtitle`. With `searchFn`, results come from the function (debounced by `debounce` ms); a slow earlier response never overwrites a newer one.

The `value` / `values` / `multiple` rules are the same as for `ml-select` (shared implementation).

**Methods:** `open()`, `close()` — function fields, callable on the element or on `el.component`

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | Single: `{ value: string, option: AutocompleteOption }`, or `{ value: '', option: null }` when cleared. Multiple: `{ values: string[], options: AutocompleteOption[], option?: AutocompleteOption, removedValue?: string }` (`removedValue` when Backspace removes the last tag) |
| `ml:search` | `{ query: string }` |
| `ml:search-error` | `{ query: string, error: unknown }` — `searchFn` rejected |
| `ml:open` | none |
| `ml:close` | none |

**Keyboard:** Enter (select focused option), Escape (close — only handled while open), ArrowDown/Up (open/navigate), Backspace (multiple: remove last tag when the search is empty), Tab (close)

#### Usage

```html
<ml-autocomplete label="Search users"
  .searchFn=${async (q) => fetch(`/api/search?q=${q}`).then(r => r.json())}
  .debounce=${300} .minChars=${2}
></ml-autocomplete>
```

#### Key CSS Custom Properties

Same token names as `ml-select` with the `--ml-autocomplete-` prefix and the same defaults (`-bg`, `-color`, `-border-color`, `-border-radius`, `-hover-border-color`, `-focus-border-color`, `-focus-shadow`, `-error-border-color`, `-placeholder-color`, `-dropdown-*`, `-option-*`, `-tag-*`). Autocomplete-only tokens:

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-autocomplete-icon-color` | `var(--ml-color-text-muted)` | Search icon color |
| `--ml-autocomplete-clear-color` | `var(--ml-color-text-muted)` | Clear button color |
| `--ml-autocomplete-clear-hover-color` | `var(--ml-color-text)` | Clear button hover color |
| `--ml-autocomplete-option-subtitle-color` | `var(--ml-color-text-muted)` | Option subtitle color |
| `--ml-autocomplete-option-subtitle-font-size` | `var(--ml-text-xs)` | Option subtitle font size |

---

### ml-slider

**Selector:** `ml-slider` · **Import:** `import '@melodicdev/components/slider'`

#### Props / Attributes

`label`, `value` (number, default 50), `min` (0), `max` (100), `step` (1), `size` (`'sm'` | `'md'` | `'lg'`, default `'md'`), `disabled`, `showValue` (`show-value`), `hint`, `error`

**Track heights:** `sm` = 4px, `md` = 6px, `lg` = 8px. Thumb: 20px.

#### Events

| Event | Detail |
|-------|--------|
| `ml:input` | `{ value: number }` (dragging) |
| `ml:change` | `{ value: number }` (final) |

#### Usage

```html
<ml-slider label="Volume" value="75" show-value></ml-slider>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-slider-fill-color` | `var(--ml-color-primary)` | Filled track color |
| `--ml-slider-track-border-radius` | `var(--ml-radius-full)` | Track radius |
| `--ml-slider-thumb-size` | `20px` | Thumb size |
| `--ml-slider-thumb-bg` | `var(--ml-color-surface)` | Thumb background |
| `--ml-slider-thumb-border-color` | `var(--ml-color-primary)` | Thumb border color |
| `--ml-slider-thumb-shadow` | `var(--ml-shadow-sm)` | Thumb shadow |
| `--ml-slider-label-color` | `var(--ml-color-text)` | Label / value color |
| `--ml-slider-error-fill-color` | `var(--ml-color-danger)` | Fill color in the error state |
| `--ml-slider-error-color` | `var(--ml-color-danger)` | Error message color |
| `--ml-slider-disabled-opacity` | `0.5` | Opacity when disabled |

---

### ml-date-picker

**Selector:** `ml-date-picker` · **Import:** `import '@melodicdev/components/date-picker'`

#### Props / Attributes

`value` (ISO `YYYY-MM-DD`), `placeholder` (`'Select date'`), `label`, `hint`, `error`, `size` (`'sm'`|`'md'`|`'lg'`), `disabled`, `required`, `min`, `max`, `min-year`, `max-year`, `locale`

`value`, `min` and `max` are always ISO dates. The field is a plain text input: the user can type a date (ISO `YYYY-MM-DD`, or the locale's own short numeric date — whatever the field itself displays parses back, including separators such as `2001. 02. 03.`, trailing literals and non-ASCII digits) or pick from the calendar popover. Typed input that is invalid or outside `min` / `max` reverts to the last committed value; clearing the field commits `''`.

`locale` is a BCP 47 tag for the displayed and accepted date format. It defaults to the browser's locale (not the document's `lang`); an unknown tag also falls back to the browser's.

The calendar header shows clickable month and year labels. Clicking the month swaps the day grid for a month picker; clicking the year swaps it for a year grid paged 12 years at a time. `min-year` / `max-year` bound how far the year picker can reach (defaults: current year − 120 to current year + 10) — handy for birthday inputs.

**Keyboard:** F4 or Alt+ArrowDown opens the calendar, Escape closes it and returns focus to the input. Inside the calendar each grid is one tab stop — see [ml-calendar](#ml-calendar) for its keys.

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string }` (ISO date, `''` when cleared) |

#### Usage

```html
<ml-date-picker label="Start date" value="2026-02-08" min="2026-01-01" max="2026-12-31"></ml-date-picker>

<!-- Birthday picker: reach back to 1900 without clicking ‹ hundreds of times -->
<ml-date-picker label="Date of birth" min-year="1900" max-year="2026"></ml-date-picker>

<ml-date-picker label="Datum" locale="de-DE"></ml-date-picker>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-date-picker-bg` | `var(--ml-color-input-bg)` | Field background |
| `--ml-date-picker-color` | `var(--ml-color-text)` | Field text color |
| `--ml-date-picker-border-color` | `var(--ml-color-border)` | Field border color |
| `--ml-date-picker-border-radius` | `var(--ml-radius)` | Field radius |
| `--ml-date-picker-hover-border-color` | `var(--ml-color-border-strong)` | Hover border color |
| `--ml-date-picker-focus-border-color` | `var(--ml-trigger-focus-border, var(--ml-color-primary))` | Focus border color |
| `--ml-date-picker-focus-shadow` | `var(--ml-shadow-focus-ring)` | Focus ring shadow |
| `--ml-date-picker-error-border-color` | `var(--ml-color-danger)` | Border color in the error state |
| `--ml-date-picker-icon-color` | `var(--ml-color-text-muted)` | Calendar icon color |
| `--ml-date-picker-popover-bg` | `var(--ml-color-surface)` | Popover background |
| `--ml-date-picker-popover-border-color` | `var(--ml-color-border)` | Popover border color |
| `--ml-date-picker-popover-border-radius` | `var(--ml-radius-lg)` | Popover radius |
| `--ml-date-picker-popover-shadow` | `var(--ml-shadow-lg)` | Popover shadow |

The calendar inside the popover is an `ml-calendar` and is styled with the `--ml-calendar-*` tokens below.

---

### ml-calendar

**Selector:** `ml-calendar` · registered by `import '@melodicdev/components/date-picker'`

Standalone calendar grid — the same calendar `ml-date-picker` shows in its popover.

#### Props / Attributes

`value` (ISO `YYYY-MM-DD`), `min`, `max`, `min-year`, `max-year` — same meaning as on `ml-date-picker`.

#### Events

| Event | Detail |
|-------|--------|
| `ml:select` | `{ value: string }` (ISO date) — a day was picked, or the Today button was used |

**Keyboard:** each grid is one tab stop. In the day grid, ArrowLeft/Right move by a day and ArrowUp/Down by a week, crossing month boundaries; Home / End go to the start / end of the week; PageUp / PageDown move by a month, with Shift by a year. Disabled dates are not focused. In the month and year grids, arrow keys move between cells and Home / End go to the first / last cell.

#### Usage

```html
<ml-calendar value="2026-02-08" min="2026-01-01" max="2026-12-31"></ml-calendar>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-calendar-width` | `280px` | Calendar width |
| `--ml-calendar-day-color` | `var(--ml-color-text)` | Day text color |
| `--ml-calendar-day-hover-bg` | `var(--ml-color-surface-raised)` | Day hover background |
| `--ml-calendar-day-border-radius` | `var(--ml-radius-full)` | Day cell radius |
| `--ml-calendar-selected-bg` | `var(--ml-color-primary)` | Selected day background |
| `--ml-calendar-selected-color` | `var(--ml-color-text-inverse)` | Selected day text color |
| `--ml-calendar-today-dot-color` | `var(--ml-color-primary)` | Today marker color |
| `--ml-calendar-weekday-color` | `var(--ml-color-text-muted)` | Weekday header color |
| `--ml-calendar-cell-selected-bg` | `var(--ml-color-primary)` | Selected month / year cell background |
| `--ml-calendar-nav-color` | `var(--ml-color-text-muted)` | Prev / next button color |
| `--ml-calendar-disabled-opacity` | `0.3` | Opacity of disabled days |

---

### ml-time-picker

**Selector:** `ml-time-picker` · **Import:** `import '@melodicdev/components/time-picker'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `value` | `value` | `string` | `''` (`HH:mm` or `HH:mm:ss`, 24-hour) |
| `placeholder` | `placeholder` | `string` | `'Select time'` |
| `label` | `label` | `string` | `''` |
| `hint`, `error` | `hint`, `error` | `string` | `''` |
| `size` | `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` |
| `disabled`, `required` | `disabled`, `required` | `boolean` | `false` |
| `min` | `min` | `string` | `''` (`HH:mm`) |
| `max` | `max` | `string` | `''` (`HH:mm`) |
| `step` | `step` | `number` | `15` (set to `1` to show the seconds field and emit `HH:mm:ss`) |
| `twelveHour` | `twelve-hour` | `boolean` | `true` (`twelve-hour="false"` for 24-hour display) |

The popover has hour / minute (/ second) steppers, an AM/PM toggle in 12-hour mode, a Now button and a confirm button. The steppers and Now respect `min` / `max`.

**Keyboard:** Space, F4 or Alt+ArrowDown opens the popover; Escape closes it.

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string }` (`HH:mm` or `HH:mm:ss`) |

#### Usage

```html
<ml-time-picker label="Start time" value="09:30"></ml-time-picker>
<ml-time-picker label="Precise" step="1" twelve-hour="false"></ml-time-picker>
```

#### Key CSS Custom Properties

The field and popover tokens mirror `ml-date-picker` with the `--ml-time-picker-` prefix and the same defaults (`-bg`, `-color`, `-border-color`, `-border-radius`, `-hover-border-color`, `-focus-border-color`, `-focus-shadow`, `-error-border-color`, `-icon-color`, `-popover-bg`, `-popover-border-color`, `-popover-border-radius`, `-popover-shadow`). Time-picker-only tokens:

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-time-picker-spin-input-bg` | `var(--ml-color-surface-sunken)` | Hour / minute field background |
| `--ml-time-picker-spin-input-color` | `var(--ml-color-text)` | Hour / minute field text color |
| `--ml-time-picker-spin-input-focus-border-color` | `var(--ml-color-primary)` | Hour / minute field focus border |
| `--ml-time-picker-spin-btn-color` | `var(--ml-color-text-muted)` | Stepper button color |
| `--ml-time-picker-period-bg` | `var(--ml-color-surface)` | AM/PM button background |
| `--ml-time-picker-confirm-bg` | `var(--ml-color-primary)` | Confirm button background |
| `--ml-time-picker-confirm-color` | `var(--ml-color-text-inverse)` | Confirm button text color |

---

### ml-date-time-picker

**Selector:** `ml-date-time-picker` · **Import:** `import '@melodicdev/components/date-time-picker'`

Composes `ml-date-picker` + `ml-time-picker` side-by-side.

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `value` | `value` | `string` | `''` (naive `YYYY-MM-DDTHH:mm`; with `timezone`, a UTC ISO string is also accepted) |
| `placeholder` | `placeholder` | `string` | `'Select date and time'` |
| `label`, `hint`, `error` | `label`, `hint`, `error` | `string` | `''` |
| `size` | `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` |
| `disabled`, `required` | `disabled`, `required` | `boolean` | `false` |
| `minDate` | `min-date` | `string` | `''` (`YYYY-MM-DD`) |
| `maxDate` | `max-date` | `string` | `''` (`YYYY-MM-DD`) |
| `minTime` | `min-time` | `string` | `''` (`HH:mm`) |
| `maxTime` | `max-time` | `string` | `''` (`HH:mm`) |
| `step` | `step` | `number` | `15` |
| `twelveHour` | `twelve-hour` | `boolean` | `true` |
| `timezone` | `timezone` | `string` | `''` (IANA name, e.g. `America/Detroit`) |
| `timezoneLabel` | `timezone-label` | `'short'` \| `'long'` \| `'offset'` \| `'none'` | `'short'` (`EDT` / `Eastern Daylight Time` / `GMT-4` / no label) |
| `viewerHint` | `viewer-hint` | `boolean` | `false` |

**Without `timezone`** (default) `value` is a naive wall-clock string and no UTC conversion happens.

**With `timezone`** the wall-clock the user sees is anchored to that zone. An incoming `value` that is a UTC ISO string (`…Z` or a `±HH:MM` offset) is parsed as an instant and shown as the equivalent wall-clock in `timezone`; a naive value is treated as wall-clock in `timezone`. A trailing zone label is rendered per `timezone-label`. With `viewer-hint`, a subdued line below the input shows the equivalent time in the viewer's own zone whenever the browser's UTC offset differs from `timezone` at that instant.

Read-only property: `valueUtc` — the UTC ISO string for the current value (`''` without `timezone`).

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string, date: string, time: string, valueUtc?: string, timezone?: string }` — `value` is the naive wall-clock; `timezone` and `valueUtc` are present only when `timezone` is set (`valueUtc` only once both date and time are chosen) |

#### Usage

```html
<ml-date-time-picker label="Event start" value="2026-02-08T09:30"></ml-date-time-picker>

<!-- Timezone-anchored: store e.detail.valueUtc -->
<ml-date-time-picker
  label="Event start"
  timezone="America/Detroit"
  value="2026-04-27T13:00:00Z"
  timezone-label="short"
  viewer-hint
></ml-date-time-picker>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-date-time-picker-bg` | `var(--ml-color-input-bg)` | Row background |
| `--ml-date-time-picker-border-color` | `var(--ml-color-border)` | Row border color |
| `--ml-date-time-picker-border-radius` | `var(--ml-radius-md)` | Row radius |
| `--ml-date-time-picker-focus-border-color` | `var(--ml-color-primary)` | Focus border color |
| `--ml-date-time-picker-focus-shadow` | `var(--ml-shadow-focus-ring)` | Focus ring shadow |
| `--ml-date-time-picker-error-border-color` | `var(--ml-color-danger)` | Border color in the error state |
| `--ml-date-time-picker-divider-color` | `var(--ml-color-border)` | Divider between date and time |
| `--ml-date-time-picker-tz-label-color` | `var(--ml-color-text-muted)` | Timezone label color |
| `--ml-date-time-picker-viewer-hint-color` | `var(--ml-color-text-muted)` | Viewer hint color |

---

### ml-form-field

**Selector:** `ml-form-field` · **Import:** `import '@melodicdev/components/form-field'`

Wrapper that connects labels, hints, errors, and ARIA attributes to any slotted form control.

#### Props / Attributes

`label`, `hint`, `error`, `size` (`'sm'` | `'md'` | `'lg'`, default `'md'`), `orientation` (`'vertical'` | `'horizontal'`, default `'vertical'`), `disabled`, `required`

#### Slots

(default) — The form control (native `<input>` / `<select>` / `<textarea>`, an element with a form-control `role`, or an `ml-*` component)

#### Behavior

- Sets an `id` on the slotted control when it has none
- Describes the control with the hint and error text by copying it onto the control as `aria-description` (neither an `aria-describedby` IDREF nor an element reference from the light-DOM control can reach into the field's shadow root). For a slotted `ml-*` control, the description, `aria-invalid` and `aria-required` are also put on the focusable control inside it
- Syncs `aria-invalid` (while `error` is set) and `aria-required` on every render, and mirrors `disabled` onto the control in both directions (`aria-disabled` when the control has no `disabled` property)
- Clicking the label focuses the control
- Styles native slotted inputs with proper token-based focus rings, error states, size variants

#### Usage

```html
<ml-form-field label="Username" hint="Choose a unique username" required>
  <input type="text" />
</ml-form-field>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-form-field-label-color` | `var(--ml-color-text-secondary)` | Label color |
| `--ml-form-field-hint-color` | `var(--ml-color-text-muted)` | Hint color |
| `--ml-form-field-error-color` | `var(--ml-color-danger)` | Error color |
| `--ml-form-field-required-color` | `var(--ml-color-danger)` | Required indicator color |
| `--ml-form-field-input-bg` | `var(--ml-color-input-bg)` | Slotted native input background |
| `--ml-form-field-input-color` | `var(--ml-color-text)` | Slotted native input text color |
| `--ml-form-field-input-border-color` | `var(--ml-color-border-strong)` | Slotted native input border color |
| `--ml-form-field-input-border-radius` | `var(--ml-radius)` | Slotted native input radius |
| `--ml-form-field-input-focus-border-color` | `var(--ml-color-primary)` | Slotted native input focus border |
| `--ml-form-field-input-focus-shadow` | `var(--ml-shadow-focus-ring)` | Slotted native input focus ring |
| `--ml-form-field-horizontal-gap` | `var(--ml-space-4)` | Label / control gap in horizontal orientation |

---

### ml-file-upload

**Selector:** `ml-file-upload` · **Import:** `import '@melodicdev/components/file-upload'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `accept` | `accept` | `string` | `''` (e.g. `.pdf,.docx,image/*`) |
| `multiple` | `multiple` | `boolean` | `false` |
| `maxSize` | `max-size` | `number` | `0` (bytes, 0=no limit) |
| `maxFiles` | `max-files` | `number` | `0` (0=no limit; counted across the whole selection) |
| `disabled` | `disabled` | `boolean` | `false` |
| `label` | `label` | `string` | `'Click to upload'` |
| `sublabel` | `sublabel` | `string` | `'or drag and drop'` |
| `hint`, `error` | `hint`, `error` | `string` | `''` |
| `icon` | `icon` | `string` | `'cloud-arrow-up'` |
| `files` | (property) | `File[]` | `[]` — the current valid selection; accumulates in `multiple` mode, otherwise holds the latest file. Settable (e.g. `[]` to reset) |

**Methods:** `removeFile(file: File)` — removes a selected file and emits `ml:change`; a function field, callable on the element or on `el.component`. `processFiles(files: File[])` — validates and adds files as if the user had selected them; a prototype method, `el.component` only.

With `:formControl`, the control value is the `File[]` in `multiple` mode, or a single `File | null` otherwise.

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ files: File[], added: File[] }` after a selection, `{ files: File[], removed: File[] }` after `removeFile()`. `files` is always the full current selection |
| `ml:error` | `{ errors: FileValidationError[] }` |

```typescript
interface FileValidationError {
  type: 'accept' | 'max-size' | 'max-files';
  file?: File;
  message: string;
}
```

#### Usage

```html
<ml-file-upload accept=".pdf,image/*" multiple max-size="5242880" max-files="3"
  hint="PDF or images up to 5MB"
></ml-file-upload>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-file-upload-dropzone-bg` | `var(--ml-color-surface)` | Dropzone background |
| `--ml-file-upload-dropzone-border-color` | `var(--ml-color-border)` | Dropzone border color |
| `--ml-file-upload-dropzone-border-width` | `2px` | Dropzone border width |
| `--ml-file-upload-dropzone-border-radius` | `var(--ml-radius-md)` | Dropzone radius |
| `--ml-file-upload-dropzone-padding` | `var(--ml-space-6)` | Dropzone padding |
| `--ml-file-upload-dropzone-hover-border-color` | `var(--ml-color-primary)` | Hover / drag-over border color |
| `--ml-file-upload-dropzone-hover-bg` | `var(--ml-color-surface-sunken)` | Hover / drag-over background |
| `--ml-file-upload-icon-bg` | `var(--ml-color-surface-sunken)` | Icon circle background |
| `--ml-file-upload-icon-color` | `var(--ml-color-text-muted)` | Icon color |
| `--ml-file-upload-label-color` | `var(--ml-color-primary)` | Label color |
| `--ml-file-upload-sublabel-color` | `var(--ml-color-text-muted)` | Sublabel color |
| `--ml-file-upload-error-color` | `var(--ml-color-danger)` | Error message color |

---

### ml-file-upload-item

**Selector:** `ml-file-upload-item` · registered by `import '@melodicdev/components/file-upload'`

#### Props / Attributes

`name`, `size` (display string), `status` (`'idle'` | `'uploading'` | `'complete'` | `'error'`, default `'idle'`), `progress` (0–100), `error`, `file` (File | null, property only)

#### Events

| Event | Detail |
|-------|--------|
| `ml:dismiss` | `{ name, file }` — the remove button was clicked |
| `ml:remove` | `{ name, file }` — deprecated alias of `ml:dismiss`, fired alongside it |
| `ml:retry` | `{ name, file }` — "Try again" was clicked (shown when `status="error"`) |

---

### ml-file-icon

**Selector:** `ml-file-icon` · registered by `import '@melodicdev/components/file-upload'`

#### Props / Attributes

`extension`, `color` (`'red'` | `'green'` | `'blue'` | `'purple'` | `'amber'` | `'gray'`; default `''` = pick from the extension), `size` (`'xs'` | `'sm'` | `'md'` | `'lg'` | `'xl'`, default `'md'`)

Auto-color mapping: `pdf/html/xml` → red, `doc/docx/css/ts/mp4/mov/avi/webm` → blue, `xls/xlsx/csv/jpg/jpeg/png/gif/svg/webp` → green, `ppt/pptx/zip/rar/7z/tar/gz/js/json` → amber, `mp3/wav/flac/ogg` → purple, others → gray. The same mapping is exported as `getColorForExtension(ext)`.

---

## Foundation Components

### ml-card

**Selector:** `ml-card` · **Import:** `import '@melodicdev/components/card'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `variant` | `variant` | `CardVariant` | `'default'` | `'default'`, `'outlined'`, `'elevated'`, `'filled'` |
| `hoverable` | `hoverable` | `boolean` | `false` | |
| `clickable` | `clickable` | `boolean` | `false` | |

#### Variants

- **default** — border + `--ml-shadow-xs`
- **outlined** — border only, no shadow
- **elevated** — muted border (`--ml-color-border-muted`) + `--ml-shadow-md`
- **filled** — `--ml-color-surface-raised` background, transparent border, no shadow

#### Slots

`header`, (default), `footer` — the header and footer wrappers are hidden while their slot is empty, and appear when content is slotted later.

#### Events

| Event | Detail | Condition |
|-------|--------|-----------|
| `ml:click` | `{ originalEvent: MouseEvent }` | Only when `clickable` |

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-card-bg` | `var(--ml-color-surface)` | Card background (not used by the `filled` variant) |
| `--ml-card-border-color` | `var(--ml-color-border)` | Border and header/footer divider color (the outer border of `elevated` and `filled` is fixed) |
| `--ml-card-border-width` | `var(--ml-border)` | Border width |
| `--ml-card-border-radius` | `var(--ml-radius-lg)` | Border radius |
| `--ml-card-body-padding` | `var(--ml-space-5)` | Body padding |
| `--ml-card-header-padding-y` / `-x` | `var(--ml-space-4)` / `var(--ml-space-5)` | Header padding |
| `--ml-card-footer-padding-y` / `-x` | `var(--ml-space-4)` / `var(--ml-space-5)` | Footer padding |
| `--ml-card-hover-border-color` | `var(--ml-color-border-strong)` | Hover border color (when hoverable) |
| `--ml-card-hover-shadow` | `var(--ml-shadow-md)` | Hover shadow (when hoverable) |
| `--ml-card-focus-shadow` | `var(--ml-shadow-focus-ring)` | Focus ring (when clickable) |
| `--ml-card-footer-bg` | `transparent` | Footer background. The base theme also sets this token globally (`var(--ml-gray-50)` light, `var(--ml-gray-800)` dark — see [Tooltip & Card Tokens](#tooltip--card-tokens)), so that value applies unless overridden |

The resting box shadow is not a token: it comes from the variant (`--ml-shadow-xs` for `default`, `--ml-shadow-md` for `elevated`, none otherwise). Use `variant="outlined"` for a card without a shadow.

---

### ml-divider

**Selector:** `ml-divider` · **Import:** `import '@melodicdev/components/divider'`

#### Props

`orientation` (`'horizontal'` | `'vertical'`, default `'horizontal'`)

**Slots:** (default) — Optional centered label text

**ARIA:** `role="separator"`, `aria-orientation`

#### Usage

```html
<ml-divider></ml-divider>
<ml-divider>OR</ml-divider>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-divider-color` | `var(--ml-color-border)` | Line color |
| `--ml-divider-label-color` | `var(--ml-color-text-muted)` | Label color |
| `--ml-divider-label-font-size` | `var(--ml-text-sm)` | Label font size |
| `--ml-divider-label-padding` | `var(--ml-space-4)` | Space around the label |

---

### ml-stack

**Selector:** `ml-stack` · **Import:** `import '@melodicdev/components/stack'`

#### Props

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `direction` | `direction` | `Orientation` | `'vertical'` | `'horizontal'`, `'vertical'` |
| `gap` | `gap` | `string` | `'4'` | Spacing scale (`'0'`–`'12'`, `'0-5'`, etc.) → `var(--ml-space-{gap})` |
| `align` | `align` | `Alignment` | `'stretch'` | `'start'`, `'center'`, `'end'`, `'stretch'`, `'baseline'` |
| `justify` | `justify` | `Justify` | `'start'` | `'start'`, `'center'`, `'end'`, `'between'`, `'around'`, `'evenly'` |
| `wrap` | `wrap` | `boolean` | `false` | |

**Slots:** (default)

The component writes its props to `--ml-stack-direction`, `--ml-stack-gap`, `--ml-stack-align`, `--ml-stack-justify` and `--ml-stack-wrap` on its inner element, so layout is driven by the attributes, not by setting those tokens from outside.

---

### ml-container

**Selector:** `ml-container` · **Import:** `import '@melodicdev/components/container'`

#### Props

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `size` | `size` | `ContainerSize` | `'lg'` | `'sm'` (640px), `'md'` (768px), `'lg'` (1024px), `'xl'` (1280px), `'full'` (100%) |
| `padding` | `padding` | `string` | `'4'` | Spacing scale → horizontal padding `var(--ml-space-{padding})` |
| `centered` | `centered` | `boolean` | `true` | `centered="false"` removes the auto side margins |

**Slots:** (default)

The component writes its props to `--ml-container-max-width`, `--ml-container-padding-x` and `--ml-container-margin-x` on its inner element.

---

## Feedback Components

### ml-spinner

**Selector:** `ml-spinner` · **Import:** `import '@melodicdev/components/spinner'`

#### Props

`size` (`'xs'`=16px, `'sm'`=20px, `'md'`=24px, `'lg'`=32px, `'xl'`=40px; default `'md'`), `label` (`'Loading'`)

Uses `currentColor` for stroke — set `color` on the element (or an ancestor) to recolor it. ARIA: `role="status"`, `aria-label`.

**CSS Custom Properties:** `--ml-spinner-track-opacity` (`0.25`), `--ml-spinner-animation-duration` (`0.75s`). `--ml-spinner-size` is reassigned by the size class, so use the `size` attribute.

---

### ml-alert

**Selector:** `ml-alert` · **Import:** `import '@melodicdev/components/alert'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `variant` | `variant` | `AlertVariant` | `'info'` | `'info'`, `'success'`, `'warning'`, `'error'` |
| `alertTitle` | `alert-title` | `string` | `''` | |
| `dismissible` | `dismissible` | `boolean` | `false` | |

The `title` attribute / property is a deprecated alias of `alert-title` (it collides with the native tooltip attribute, warns once, and will be removed in the next major release).

**Default icons:** info → `info`, success → `check-circle`, warning → `warning`, error → `x-circle`

**ARIA:** `role="alert"`

#### Slots

`icon` (custom icon override), (default) — message body

#### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `ml:dismiss` | none | Dismiss button clicked; the alert also sets the `hidden` attribute on itself |

#### Usage

```html
<ml-alert variant="warning" alert-title="Storage almost full" dismissible>
  You have used 92% of your quota.
</ml-alert>
```

#### Key CSS Custom Properties

Variant colors come from the global `--ml-alert-{info|success|warning|error}-{bg|border|text|icon}` tokens (see [Alert Tokens](#alert-tokens)); override those on the element or an ancestor to recolor a variant.

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-alert-padding` | `var(--ml-space-4)` | Padding |
| `--ml-alert-gap` | `var(--ml-space-3)` | Gap between icon and content |
| `--ml-alert-border-radius` | `var(--ml-radius-lg)` | Border radius |
| `--ml-alert-title-font-size` | `var(--ml-text-sm)` | Title font size |
| `--ml-alert-title-font-weight` | `var(--ml-font-semibold)` | Title font weight |
| `--ml-alert-message-font-size` | `var(--ml-text-sm)` | Message font size |
| `--ml-alert-icon-size` | `1.25rem` | Icon size |

---

### ml-progress

**Selector:** `ml-progress` · **Import:** `import '@melodicdev/components/progress'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `value` | `value` | `number` | `0` | |
| `max` | `max` | `number` | `100` | |
| `variant` | `variant` | `ProgressVariant` | `'primary'` | `'primary'`, `'success'`, `'warning'`, `'error'` |
| `size` | `size` | `ProgressSize` | `'md'` | `'sm'`, `'md'`, `'lg'` |
| `label` | `label` | `string` | `''` | |
| `showValue` | `show-value` | `boolean` | `false` | |
| `shape` | `shape` | `ProgressShape` | `'linear'` | `'linear'`, `'circle'`, `'half-circle'` |
| `labelPosition` | `label-position` | `ProgressLabelPosition` | `'top'` | `'top'`, `'right'`, `'bottom'`, `'floating-top'`, `'floating-bottom'`, `'none'` (linear shape) |

**Linear heights:** sm=4px, md=8px, lg=12px

**ARIA:** `role="progressbar"` with `aria-valuenow` / `aria-valuemin` / `aria-valuemax`; `aria-label` is the `label`, or `'Progress'`.

#### Usage

```html
<ml-progress value="72" shape="circle" show-value label="Score" size="lg"></ml-progress>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-progress-track-color` | `var(--ml-color-surface-sunken)` | Linear track color |
| `--ml-progress-track-radius` | `var(--ml-radius-full)` | Linear track radius |
| `--ml-progress-sm-height` / `-md-height` / `-lg-height` | `4px` / `8px` / `12px` | Linear track height per size |
| `--ml-progress-label-color` | `var(--ml-color-text)` | Label / value color |
| `--ml-progress-floating-bg` | `var(--ml-color-text)` | Floating value bubble background |
| `--ml-progress-floating-color` | `var(--ml-color-text-inverse)` | Floating value bubble text color |
| `--ml-progress-circle-track-color` | `var(--ml-color-surface-sunken)` | Circle track color |
| `--ml-progress-half-track-color` | `var(--ml-color-surface-sunken)` | Half-circle track color |
| `--ml-progress-transition-duration` | `var(--ml-duration-300)` | Fill transition duration |

The fill color tokens (`--ml-progress-fill-color`, `--ml-progress-circle-fill-color`, `--ml-progress-half-fill-color`) are reassigned by every variant class, so choose the fill color with `variant` (or override the global color that variant reads, e.g. `--ml-color-primary`).

---

### ml-toast

**Selector:** `ml-toast` · **Import:** `import '@melodicdev/components/toast'`

#### Props

`variant` (`'info'`|`'success'`|`'warning'`|`'error'`, default `'info'`), `toastTitle` (`toast-title`), `message`, `duration` (ms, default 5000, 0=no auto-dismiss), `dismissible` (default true; `dismissible="false"` hides the dismiss button)

The `title` attribute / property is a deprecated alias of `toast-title`.

**Methods:** `dismiss()` — a function field, callable on the element or on `el.component`

The auto-dismiss timer pauses while the toast is hovered or has focus inside it, and resumes with the time that was left.

**ARIA:** `role="alert"` for `error`, `role="status"` otherwise.

#### Events

| Event | Detail |
|-------|--------|
| `ml:dismiss` | none (also removes element from DOM) |

Toasts are normally created through `ToastService`, which appends them to an `ml-toast-container` that it creates on `document.body`.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-toast-bg` | `var(--ml-color-surface)` | Background |
| `--ml-toast-border-color` | `var(--ml-color-border)` | Border color |
| `--ml-toast-border-radius` | `var(--ml-radius-lg)` | Border radius |
| `--ml-toast-shadow` | `var(--ml-shadow-lg)` | Box shadow |
| `--ml-toast-min-width` / `--ml-toast-max-width` | `320px` / `420px` | Width limits |
| `--ml-toast-title-color` | `var(--ml-color-text)` | Title color |
| `--ml-toast-message-color` | `var(--ml-color-text-secondary)` | Message color |
| `--ml-toast-info-icon-color` | `var(--ml-color-primary)` | Icon color, `info` |
| `--ml-toast-success-icon-color` | `var(--ml-color-success)` | Icon color, `success` |
| `--ml-toast-warning-icon-color` | `var(--ml-color-warning)` | Icon color, `warning` |
| `--ml-toast-error-icon-color` | `var(--ml-color-danger)` | Icon color, `error` |

### ml-toast-container

**Selector:** `ml-toast-container` · registered by `import '@melodicdev/components/toast'`

Fixed-position stack that holds toasts. `ToastService` creates one on `document.body` on first use; you rarely place it yourself. Where the Popover API is available the service shows it as `popover="manual"` and re-shows it for each new toast, so it sits in the top layer above open `ml-dialog` / `ml-drawer` modals. A toast raised over a modal is visible, but the platform keeps it inert (its dismiss button is not clickable) until the modal closes.

Props: `position` (`ToastPosition`, default `'top-right'`)

**Slots:** (default) — `ml-toast` elements

**ARIA:** `role="region"`, `aria-label="Notifications"`, `aria-live="polite"`

### ToastService

`@Injectable()` singleton. Import: `import { ToastService } from '@melodicdev/components/toast'`

| Method | Signature |
|--------|-----------|
| `show` | `(config: IToastConfig) => IToastRef` |
| `info` | `(title: string, message?: string) => IToastRef` |
| `success` | `(title: string, message?: string) => IToastRef` |
| `warning` | `(title: string, message?: string) => IToastRef` |
| `error` | `(title: string, message?: string) => IToastRef` |
| `dismissAll` | `() => void` — removes every toast on screen |
| `setPosition` | `(position: ToastPosition) => void` |
| `setMaxVisible` | `(max: number) => void` — cap on simultaneous toasts (default 5, `0` = unlimited); the oldest are removed first |

```typescript
interface IToastConfig {
  variant?: ToastVariant;   // 'info' | 'success' | 'warning' | 'error'
  title?: string;
  message?: string;
  duration?: number;        // ms; 0 = no auto-dismiss; default 5000
  dismissible?: boolean;    // default true
}

// Returned by show/info/success/warning/error
interface IToastRef {
  dismiss(): void;               // remove the toast now; safe to call more than once
  readonly element: HTMLElement; // the <ml-toast> element
}
```

`ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'`

```typescript
@Service(ToastService) private readonly _toast!: ToastService;

this._toast.success('Saved', 'Your changes have been saved.');
const ref = this._toast.show({ variant: 'warning', title: 'Reconnecting…', duration: 0 });
ref.dismiss();
```

---

## Data Display Components

### ml-avatar

**Selector:** `ml-avatar` · **Import:** `import '@melodicdev/components/avatar'`

#### Props

`src`, `alt`, `initials` (truncated to 2 uppercase), `size` (`'xs'`=24px, `'sm'`=32px, `'md'`=40px, `'lg'`=48px, `'xl'`=64px; default `'md'`), `rounded` (rounded square vs circle)

Renders the image when `src` loads, otherwise the `initials`, otherwise the fallback slot. ARIA: `role="img"`, `aria-label` = `alt`, then `initials`, then `'Avatar'`.

**Slots:** (default) — Custom fallback (defaults to user icon)

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-avatar-bg` | `var(--ml-color-surface-raised)` | Avatar background |
| `--ml-avatar-color` | `var(--ml-color-text-muted)` | Initials text color |
| `--ml-avatar-border-color` | `var(--ml-color-surface)` | Avatar ring border color |
| `--ml-avatar-shadow` | `var(--ml-shadow-xs)` | Avatar shadow |
| `--ml-avatar-radius` | `var(--ml-radius-full)` | Border radius |
| `--ml-avatar-font-weight` | `var(--ml-font-semibold)` | Initials font weight |
| `--ml-avatar-fallback-color` | `var(--ml-color-text-subtle)` | Fallback icon color |

---

### ml-badge

**Selector:** `ml-badge` · **Import:** `import '@melodicdev/components/badge'`

#### Props

`variant` (`'default'`|`'primary'`|`'secondary'`|`'success'`|`'warning'`|`'error'`, default `'default'`), `size` (`'xs'`|`'sm'`|`'md'`|`'lg'`, default `'md'`), `dot`, `pill`, `color` (`string`, `''` — custom background color, any CSS color; overrides variant)

**Slots:** (default) — badge text

#### Key CSS Custom Properties

Variant colors come from the global `--ml-badge-{default|primary|success|warning|error}-{bg|border|text}` tokens (see [Badge Tokens](#badge-tokens)); `secondary` uses the default background and border with `--ml-badge-secondary-color` as its text color. Override those to recolor a variant — the internal `--ml-badge-background`, `--ml-badge-border-color` and `--ml-badge-text` are reassigned by every variant class, and `--ml-badge-padding` / `--ml-badge-font-size` by every size class.

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-badge-radius` | `var(--ml-radius-md)` | Border radius |
| `--ml-badge-pill-radius` | `var(--ml-radius-full)` | Border radius with `pill` |
| `--ml-badge-border-width` | `var(--ml-border)` | Border width |
| `--ml-badge-font-weight` | `var(--ml-font-medium)` | Font weight |
| `--ml-badge-gap` | `var(--ml-space-1-5)` | Gap between dot and text |
| `--ml-badge-dot-size` | `0.375rem` | Dot size (`--ml-badge-dot-size-xs` `0.3125rem`, `--ml-badge-dot-size-lg` `0.5rem`) |
| `--ml-badge-secondary-color` | `var(--ml-color-text-secondary)` | Text color of the `secondary` variant |
| `--ml-badge-custom-color` | `var(--ml-badge-color, #fff)` | Text color when `color` is set |

When `color` is set, the component writes `--ml-badge-bg` (the color) and `--ml-badge-color` (`#fff`) inline on its inner element; use `--ml-badge-custom-color` to change the text color.

---

### ml-badge-group

**Selector:** `ml-badge-group` · **Import:** `import '@melodicdev/components/badge-group'`

#### Props

`label` (text of the inner badge), `variant` (styled: `'default'`|`'primary'`|`'success'`|`'warning'`|`'error'`; default `'default'`), `theme` (`'pill'`|`'modern'`, default `'pill'`), `size` (`'sm'`|`'md'`|`'lg'`, default `'md'`), `badgePosition` (`badge-position`: `'leading'`|`'trailing'`, default `'leading'`), `icon` (Phosphor icon name, rendered at the end)

**Slots:** (default) — message text

```html
<ml-badge-group label="New" variant="primary" icon="arrow-right">We just shipped dark mode</ml-badge-group>
```

---

### ml-tag

**Selector:** `ml-tag` · **Import:** `import '@melodicdev/components/tag'`

#### Props

`size` (`'sm'`|`'md'`|`'lg'`, default `'md'`), `dot`, `dotColor` (`dot-color`: `'success'`|`'warning'`|`'error'`|`'info'`|`'primary'`|`'secondary'`, default `'success'`; `'danger'` is a deprecated alias of `'error'`), `closable`, `avatarSrc` (`avatar-src`), `icon`, `count`, `checkable`, `checked`, `disabled`

**Slots:** (default) — tag text

#### Events

| Event | Detail |
|-------|--------|
| `ml:dismiss` | none — the close button was clicked (`closable`) |
| `ml:close` | none — deprecated alias of `ml:dismiss`, fired alongside it |
| `ml:change` | `{ checked: boolean }` — the checkbox was toggled (`checkable`) |

The tag does not remove itself on dismiss; remove it in the handler.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-tag-bg` | `var(--ml-color-surface)` | Background |
| `--ml-tag-color` | `var(--ml-color-text)` | Text color |
| `--ml-tag-border-color` | `var(--ml-color-border)` | Border color |
| `--ml-tag-border-width` | `var(--ml-border)` | Border width |
| `--ml-tag-radius` | `var(--ml-radius-md)` | Border radius |
| `--ml-tag-font-weight` | `var(--ml-font-medium)` | Font weight |
| `--ml-tag-count-color` | `var(--ml-color-text-secondary)` | Count color |
| `--ml-tag-close-color` | `var(--ml-color-text-muted)` | Close button color |
| `--ml-tag-checkbox-checked-bg` | `var(--ml-color-primary)` | Checked checkbox background |
| `--ml-tag-dot-{success\|warning\|danger\|info\|primary\|secondary}` | `var(--ml-color-{name})` | Dot color per `dot-color` (`error` uses `--ml-tag-dot-danger`) |

---

### ml-list

**Selector:** `ml-list` · **Import:** `import '@melodicdev/components/list'`

#### Props

`variant` (`'default'`|`'plain'`, default `'default'`), `size` (`'sm'`|`'md'`|`'lg'`, default `'md'`)

**Slots:** (default) — `ml-list-item` children. ARIA: `role="list"`.

**CSS Custom Properties:** `--ml-list-divider-width` (`var(--ml-border)`), `--ml-list-divider-color` (`var(--ml-color-border)`)

### ml-list-item

**Props:** `primary`, `secondary`, `disabled`, `interactive`

**Slots:** `leading`, (default), `trailing`

With `interactive`, the host gets `role="button"` and `tabindex="0"` (no tab stop and `aria-disabled="true"` while `disabled`), hover/focus styling, and Enter/Space trigger a `click` on the host — listen for the native `click` event. Otherwise the host is `role="listitem"`.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-list-item-gap` | `var(--ml-space-3)` | Gap between leading, content and trailing |
| `--ml-list-item-primary-color` | `var(--ml-color-text)` | Primary text color |
| `--ml-list-item-primary-weight` | `var(--ml-font-semibold)` | Primary text weight |
| `--ml-list-item-secondary-color` | `var(--ml-color-text-secondary)` | Secondary text color |
| `--ml-list-item-focus-color` | `var(--ml-color-primary)` | Focus outline color (interactive) |
| `--ml-list-item-disabled-opacity` | `0.5` | Opacity when disabled |

---

### ml-activity-feed

**Selector:** `ml-activity-feed` · **Import:** `import '@melodicdev/components/activity-feed'`

#### Props

`variant` (`'list'`|`'timeline'`, default `'list'`)

**Slots:** (default) — `ml-activity-feed-item` children. ARIA: `role="feed"`.

**CSS Custom Properties:** `--ml-activity-feed-divider-width` (`var(--ml-border)`), `--ml-activity-feed-divider-color` (`var(--ml-color-border)`)

### ml-activity-feed-item

**Props:** `name`, `timestamp`, `avatarSrc` (`avatar-src`), `avatarInitials` (`avatar-initials`), `avatarSize` (`avatar-size`, `Size`, default `'sm'`), `subtitle`, `indicator` (boolean), `indicatorColor` (`indicator-color`: `string`, default `'gray'` — a preset name `'success'`|`'warning'`|`'error'`|`'primary'`|`'gray'`, or any CSS color value)

**Slots:** (default) — description text, `avatar` — replaces the default `ml-avatar`, `content` — extra content below the description

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-activity-feed-item-padding` | `var(--ml-space-4) 0` | Item padding |
| `--ml-activity-feed-item-gap` | `var(--ml-space-3)` | Gap between avatar and body |
| `--ml-activity-feed-item-name-color` | `var(--ml-color-text)` | Name color |
| `--ml-activity-feed-item-subtitle-color` | `var(--ml-color-text-secondary)` | Subtitle color |
| `--ml-activity-feed-item-description-color` | `var(--ml-color-text-secondary)` | Description color |
| `--ml-activity-feed-item-link-color` | `var(--ml-color-primary)` | Color of links in the description |
| `--ml-activity-feed-item-connector-color` | `var(--ml-color-border)` | Timeline connector color |
| `--ml-activity-feed-item-indicator-size` | `8px` | Indicator dot size |

---

### ml-table

**Selector:** `ml-table` · **Import:** `import '@melodicdev/components/table'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `selectable` | `selectable` | `boolean` | `false` |
| `striped` | `striped` | `boolean` | `false` |
| `hoverable` | `hoverable` | `boolean` | `true` |
| `size` | `size` | `'sm'` \| `'md'` | `'md'` |
| `tableTitle` | `table-title` | `string` | `''` |
| `description` | `description` | `string` | `''` |
| `stickyHeader` | `sticky-header` | `boolean` | `false` |
| `virtual` | `virtual` | `boolean` | `false` |
| `manualSort` | `manual-sort` | `boolean` | `false` — skip client-side sorting; `rows` render in the order given while header clicks still update `sortKey` / `sortDirection` and fire `ml:sort` (server-side sorting) |
| `clickableRows` | `clickable-rows` | `boolean` | `false` — pointer cursor + hover affordance for rows, and makes each row a tab stop that fires `ml:row-click` on Enter/Space; set it when listening for `ml:row-click` |
| `rowKey` | `row-key` | `string \| ((row, index) => unknown) \| null` | `null` — row identity: a property name (`row-key="id"`) or, via the property, a function. When set, a rendered row's DOM follows its record across sorting instead of being reused by position |
| `columns` | (property) | `TableColumn[]` | `[]` |
| `rows` | (property) | `Record<string, unknown>[]` | `[]` |
| `sortKey` | (property) | `string` | `''` — currently sorted column key |
| `sortDirection` | (property) | `'asc'` \| `'desc'` | `'asc'` |

```typescript
interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (value: unknown, row: Record<string, unknown>, index: number) => unknown;
}
```

**Slots:** `footer`, `header-actions`

**CSS parts:** `header-cell`, `row`, `cell`

#### Events

| Event | Detail |
|-------|--------|
| `ml:sort` | `{ key: string, direction: 'asc' \| 'desc' }` |
| `ml:select` | `{ selectedRows: Record<string, unknown>[], selectedIndices: number[], allSelected: boolean }` — `selectedRows` are the selected row objects, `selectedIndices` their indices in the original `rows` array. Also fired when sorting clears a non-empty selection; replacing `rows` clears the selection without an event |
| `ml:row-click` | `{ row, index }` — `index` is the row's position in the rendered (sorted) order |

**Keyboard:** sortable column headers are focusable; Enter/Space sorts. With `clickable-rows`, rows are focusable and Enter/Space fires `ml:row-click` (keys pressed inside a cell's own controls are left to them).

**Sorting:** numbers sort numerically, `Date` values chronologically, everything else as text in natural order (`item 2` before `item 10`); `null` / `undefined` sort last in either direction.

**ARIA:** a native `<table>` with no `role` override; `aria-sort` is set on sortable headers only.

**Virtual scroll row heights:** sm=36px, md=44px. Parent must have defined height.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-table-bg` | `var(--ml-color-surface)` | Table background |
| `--ml-table-container-border-width` | `var(--ml-table-border-width, var(--ml-border))` | Outer container border width (set to `0` to remove) |
| `--ml-table-container-border-color` | `var(--ml-table-border-color, var(--ml-color-border))` | Outer container border color |
| `--ml-table-container-radius` | `var(--ml-table-radius, var(--ml-radius-lg))` | Outer container corner radius |
| `--ml-table-divider-width` | `var(--ml-table-border-width, var(--ml-border))` | Internal header/row/footer separator width |
| `--ml-table-divider-color` | `var(--ml-table-border-color, var(--ml-color-border))` | Internal header/row/footer separator color |
| `--ml-table-header-bg` | `var(--ml-color-surface-sunken)` | Column header background |
| `--ml-table-header-color` | `var(--ml-color-text-muted)` | Column header text color |
| `--ml-table-row-hover-bg` | `var(--ml-color-surface-sunken)` | Row hover background |
| `--ml-table-row-hover-border-left-width` | `0` | Left border width on row hover (bookmark accent) |
| `--ml-table-row-hover-border-left-color` | `transparent` | Left border color on row hover |
| `--ml-table-row-focus-outline-color` | `var(--ml-color-primary)` | Focus outline color of a clickable row |
| `--ml-table-row-selected-bg` | `var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04))` | Selected row background |
| `--ml-table-row-striped-bg` | `var(--ml-color-surface-sunken)` | Striped row background |
| `--ml-table-cell-color` | `var(--ml-color-text)` | Cell text color |
| `--ml-table-cell-padding-y` / `-x` | `var(--ml-space-4)` / `var(--ml-space-6)` | Cell padding (`-y-sm` / `-x-sm` for `size="sm"`) |
| `--ml-table-sort-active-color` | `var(--ml-color-primary)` | Active sort icon color |

`--ml-table-border-width`, `--ml-table-border-color` and `--ml-table-radius` are deprecated aliases — prefer the `container-*` and `divider-*` tokens.

---

### ml-data-grid

**Selector:** `ml-data-grid` · **Import:** `import '@melodicdev/components/data-grid'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `selectable` | `selectable` | `boolean` | `false` |
| `striped` | `striped` | `boolean` | `false` |
| `hoverable` | `hoverable` | `boolean` | `true` |
| `size` | `size` | `'sm'` \| `'md'` | `'md'` |
| `gridTitle` | `grid-title` | `string` | `''` |
| `description` | `description` | `string` | `''` |
| `serverSide` | `server-side` | `boolean` | `false` |
| `pageSize` | `page-size` | `number` | `50` |
| `virtual` | `virtual` | `boolean` | `true` (`virtual="false"` renders every row of the page) |
| `showFilterRow` | `show-filter-row` | `boolean` | `false` |
| `clickableRows` | `clickable-rows` | `boolean` | `false` — makes each row a tab stop that fires `ml:row-click` on Enter/Space (a click always fires it); set it when listening for `ml:row-click` |
| `rowKey` | `row-key` | `string \| ((row, index) => unknown) \| null` | `null` — row identity: a property name (`row-key="id"`) or, via the property, a function. When set, a rendered row's DOM follows its record across sorting, filtering and paging instead of being reused by position |
| `columns` | (property) | `DataGridColumn[]` | `[]` |
| `rows` | (property) | `Record<string, unknown>[]` | `[]` |

Public state properties: `sortKey` (`''`), `sortDirection` (`'asc'`), `filters` (`Record<string, string>`, `{}`), `currentPage` (`1`), `colWidths` (`Record<string, number>`), `colOrder` (`string[]`).

**Methods:** `goToPage(page: number)`, `moveColumn(key: string, delta: number)`, `resizeColumnBy(key: string, delta: number)` (delta in px; respects `minWidth` and `resizable: false`; fires `ml:column-resize`) — function fields, callable on the element or on `el.component`

```typescript
interface DataGridColumn {
  key: string;
  label: string;
  width?: number;        // px, default 150
  minWidth?: number;     // default 80
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;   // default true
  reorderable?: boolean; // default true
  pinned?: 'left' | 'right' | false;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: Record<string, unknown>, index: number) => unknown;
}
```

**Slots:** `toolbar-actions`

#### Events

| Event | Detail |
|-------|--------|
| `ml:sort` | `{ key: string, direction: 'asc' \| 'desc' }` |
| `ml:filter` | `{ filters: Record<string, string> }` |
| `ml:select` | `{ selectedRows: Record<string, unknown>[], selectedIndices: number[], allSelected: boolean }` — row objects plus their indices in the original `rows` array. Also fired when sorting, filtering or paging clears a non-empty selection; replacing `rows` clears the selection without an event |
| `ml:row-click` | `{ row, index }` — `index` is the row's position on the current page |
| `ml:column-resize` | `{ key: string, width: number }` |
| `ml:column-reorder` | `{ order: string[] }` |
| `ml:page-change` | `{ page: number, pageSize: number }` |

**Keyboard:** on a column header, Enter/Space sorts, Ctrl/Cmd+ArrowLeft/Right moves the column and Shift+ArrowLeft/Right resizes it in 16px steps. With `clickable-rows`, rows are focusable and Enter/Space fires `ml:row-click`.

**Sorting** (client-side): numbers numerically, `Date` values chronologically, everything else as text in natural order; `null` / `undefined` last.

Features: column resizing (drag or keyboard), column reordering (drag-and-drop or keyboard), pinned columns, client-side filter→sort→paginate pipeline. With `server-side`, `rows` are rendered as given (no client-side filtering, sorting or paging) and the events tell the consumer what to fetch. Filters match case-insensitively on substring. Sorting and filtering return to page 1. The footer shows the row count (or the selected count) and, when there is more than one page, first/previous/next/last controls.

**Virtual scroll row heights:** sm=36px, md=44px. Parent must have defined height.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-data-grid-bg` | `var(--ml-color-surface)` | Grid background |
| `--ml-data-grid-border-width` | `var(--ml-border)` | Border width |
| `--ml-data-grid-border-color` | `var(--ml-color-border)` | Border color |
| `--ml-data-grid-radius` | `var(--ml-radius-lg)` | Corner radius |
| `--ml-data-grid-header-bg` | `var(--ml-color-surface-sunken)` | Column header background |
| `--ml-data-grid-header-color` | `var(--ml-color-text-muted)` | Column header text color |
| `--ml-data-grid-row-hover-bg` | `var(--ml-color-surface-sunken)` | Row hover background |
| `--ml-data-grid-row-focus-outline-color` | `var(--ml-color-primary)` | Focus outline color of a clickable row |
| `--ml-data-grid-row-selected-bg` | `var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04))` | Selected row background |
| `--ml-data-grid-row-striped-bg` | `var(--ml-color-surface-sunken)` | Striped row background |
| `--ml-data-grid-cell-color` | `var(--ml-color-text)` | Cell text color |
| `--ml-data-grid-sort-active-color` | `var(--ml-color-primary)` | Active sort icon color |
| `--ml-data-grid-filter-bg` | `var(--ml-color-surface-sunken)` | Filter input background |
| `--ml-data-grid-footer-bg` | `var(--ml-color-surface)` | Footer background |
| `--ml-data-grid-footer-color` | `var(--ml-color-text-muted)` | Footer text color |

---

### ml-calendar-view

**Selector:** `ml-calendar-view` · **Import:** `import '@melodicdev/components/calendar-view'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `view` | `view` | `CalendarViewMode` | `'month'` (`'month'`\|`'week'`\|`'day'`) |
| `date` | `date` | `string` | today (ISO `YYYY-MM-DD`) |
| `locale` | `locale` | `string` | `''` — BCP 47 tag for month and weekday names; defaults to the document's `lang`, then the browser's |
| `weekStartsOn` | `week-starts-on` | `number` | `0` (Sunday; `1` = Monday) |
| `maxVisibleEvents` | `max-visible-events` | `number` | `3` (per day cell in month view; the rest collapse into a "more" link that opens the day view) |
| `addButtonText` | `add-button-text` | `string` | `'Add event'` |
| `hideNav`, `hideTodayButton`, `hideViewSelector`, `hideAddButton` | `hide-nav`, `hide-today-button`, `hide-view-selector`, `hide-add-button` | `boolean` | `false` |
| `events` | (property) | `CalendarEvent[]` | `[]` |

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: string;  // ISO datetime
  end: string;
  color?: 'gray' | 'blue' | 'purple' | 'green' | 'pink' | 'orange' | 'yellow';
  allDay?: boolean;
  description?: string;
}
```

**Slots:** `header-left`, `header-actions` — each replaces the default header content on its side when used

#### Events

| Event | Detail |
|-------|--------|
| `ml:view-change` | `{ view: CalendarViewMode }` |
| `ml:date-change` | `{ date: string }` — prev / next / today navigation, or a mini-calendar pick |
| `ml:event-click` | `{ event: CalendarEvent }` |
| `ml:date-click` | `{ date: string }` — a month-view day cell was clicked or activated |
| `ml:add-event` | `{}` from the header add button, `{ date: string }` from a day cell's add button |

**Keyboard (month view):** day cells are one tab stop; arrow keys move between days, Enter/Space fires `ml:date-click`. Event pills are focusable and activate on Enter/Space.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-calendar-view-bg` | `var(--ml-color-surface)` | Background |
| `--ml-calendar-view-border-color` | `var(--ml-color-border)` | Border and grid line color |
| `--ml-calendar-view-radius` | `var(--ml-radius-lg)` | Corner radius |
| `--ml-calendar-view-title-color` | `var(--ml-color-text)` | Header title color |
| `--ml-calendar-view-cell-min-height` | `120px` | Month day cell minimum height |
| `--ml-calendar-view-cell-hover-bg` | `var(--ml-color-surface-sunken)` | Day cell hover background |
| `--ml-calendar-view-today-bg` | `var(--ml-color-primary)` | Today indicator background |
| `--ml-calendar-view-today-color` | `var(--ml-color-text-inverse)` | Today indicator text color |
| `--ml-calendar-view-add-bg` | `var(--ml-color-primary)` | Add button background |
| `--ml-calendar-view-add-color` | `var(--ml-color-text-inverse)` | Add button text color |
| `--ml-calendar-view-event-radius` | `var(--ml-radius-sm)` | Event pill radius |

---

### ml-stat-card

**Selector:** `ml-stat-card` · **Import:** `import '@melodicdev/components/stat-card'`

Dashboard metric card with label, value, optional trend indicator, and icon.

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | `string` | `''` | Metric label (displayed uppercase) |
| `value` | `string \| number` | `''` | Display value |
| `trend` | `string` | `''` | Trend text (e.g. "+6 this month") |
| `trend-direction` | `'up' \| 'down' \| 'neutral'` | `'neutral'` | Trend direction for color styling |
| `icon` | `string` | `''` | Phosphor icon name |
| `icon-color` | `string` | `''` | CSS color for the icon |
| `value-font` | `'serif' \| 'sans'` | `'serif'` | Value font family |

Property names are the camelCase forms: `trendDirection`, `iconColor`, `valueFont`.

**Key CSS Custom Properties:**

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-stat-card-bg` | `var(--ml-color-surface)` | Card background |
| `--ml-stat-card-border-color` | `var(--ml-color-border)` | Border color |
| `--ml-stat-card-radius` | `var(--ml-radius-lg)` | Border radius |
| `--ml-stat-card-padding` | `var(--ml-space-5) var(--ml-space-6)` | Card padding |
| `--ml-stat-card-shadow` | `var(--ml-shadow-xs)` | Box shadow |
| `--ml-stat-card-icon-bg` | `var(--ml-color-surface-raised, var(--ml-color-surface-sunken))` | Icon container background |
| `--ml-stat-card-icon-color` | `var(--ml-color-text-tertiary)` | Icon color (the `icon-color` attribute sets this) |
| `--ml-stat-card-value-font` | `'Cormorant Garamond', 'Georgia', serif` | Value font family (`value-font="serif"`) |
| `--ml-stat-card-value-size` | `2.5rem` | Value font size (`--ml-stat-card-value-sans-size`, `2rem`, for `value-font="sans"`) |
| `--ml-stat-card-value-weight` | `300` | Value font weight |
| `--ml-stat-card-trend-up-color` | `var(--ml-color-success)` | Upward trend color |
| `--ml-stat-card-trend-down-color` | `var(--ml-color-error)` | Downward trend color |

**Example:**

```html
<ml-stat-card
  label="Total Members"
  value="1,247"
  trend="+6 this month"
  trend-direction="up"
  icon="users"
></ml-stat-card>
```

---

### ml-profile-card

**Selector:** `ml-profile-card` · **Import:** `import '@melodicdev/components/profile-card'`

Identity card for person/entity detail pages with banner, avatar, and slotted sections.

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | `''` | Person name (rendered as a heading; its initials are the avatar fallback) |
| `subtitle` | `string` | `''` | Subtitle text (e.g. "Member · Choir") |
| `avatar` | `string` | `''` | Avatar image URL (falls back to initials) |
| `avatar-size` | `Size` | `'lg'` | Avatar size (property: `avatarSize`) |

**Slots:**

| Slot | Description |
|------|-------------|
| `actions` | Action buttons (slotted directly, centered with gap) |
| `details` | Contact info rows (each slotted element gets flex + gap); section labelled "Contact" |
| `tags` | Tags/badges (flex-wrap layout); section labelled "Involvement" |
| `meta` | Detail fields (vertical stack); section labelled "Details" |

A section is hidden while its slot is empty.

**Key CSS Custom Properties:**

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-profile-card-bg` | `var(--ml-color-surface)` | Card background |
| `--ml-profile-card-border-color` | `var(--ml-color-border)` | Border color |
| `--ml-profile-card-radius` | `var(--ml-radius-lg)` | Border radius |
| `--ml-profile-card-banner-from` | `var(--ml-color-primary)` | Banner gradient start |
| `--ml-profile-card-banner-to` | `var(--ml-color-primary-hover, var(--ml-color-primary))` | Banner gradient end |
| `--ml-profile-card-banner-height` | `80px` | Banner height |
| `--ml-profile-card-banner-opacity` | `0.85` | Banner opacity |
| `--ml-profile-card-name-font` | `'Cormorant Garamond', 'Georgia', serif` | Name font family |
| `--ml-profile-card-name-color` | `var(--ml-color-text)` | Name color |
| `--ml-profile-card-subtitle-color` | `var(--ml-color-text-muted)` | Subtitle color |
| `--ml-profile-card-avatar-ring-color` | `var(--ml-color-border)` | Avatar ring border |

**Example:**

```html
<ml-profile-card name="Sarah Mitchell" subtitle="Member · Women's Ministry">
  <ml-button slot="actions" variant="primary" size="sm">Message</ml-button>
  <ml-button slot="actions" variant="outline" size="sm">Edit</ml-button>
  <div slot="details"><ml-icon icon="envelope" size="sm"></ml-icon> sarah@example.com</div>
  <div slot="details"><ml-icon icon="phone" size="sm"></ml-icon> (555) 123-4567</div>
  <ml-badge slot="tags" variant="primary" pill>Women's Ministry</ml-badge>
  <ml-badge slot="tags" pill>Choir</ml-badge>
  <div slot="meta">Member since: January 2019</div>
  <div slot="meta">Birthday: March 15</div>
</ml-profile-card>
```

---

## Navigation Components

### ml-tabs

**Selector:** `ml-tabs` · **Import:** `import '@melodicdev/components/tabs'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `value` | `value` | `string` | `''` | Active tab value (defaults to the first enabled slotted tab) |
| `variant` | `variant` | `TabsVariant` | `'line'` | `'line'`, `'enclosed'`, `'pills'` |
| `size` | `size` | `ControlSize` | `'md'` | `'sm'`, `'md'`, `'lg'` |
| `orientation` | `orientation` | `TabsOrientation` | `'horizontal'` | `'horizontal'`, `'vertical'` |
| `routed` | `routed` | `boolean` | `false` | Router integration (see below) |
| `tabs` | (property) | `TabConfig[]` | `[]` | `{ value, label, icon?, disabled?, href? }` — alternative to slotted `ml-tab` elements |

**Slots:** `tab` (ml-tab elements; ignored when `tabs` is set), (default) (ml-tab-panel elements, or a `<router-outlet>` in routed mode)

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string }` |

**Keyboard:** ArrowLeft/Right/Up/Down (wrapping, skipping disabled tabs), Home, End

A programmatic `value` write updates both the slotted tabs and the panels. Inactive panels are hidden with the `hidden` attribute.

**Routed mode:** with `routed`, clicking a tab that has an `href` calls `RouterService.navigate(href)` and activates the tab only if the navigation commits (a guard can block it). The active tab follows the URL: an exact `href` match wins, otherwise the longest `href` that is a path-segment prefix of the current path. Panels are not toggled in routed mode.

```html
<ml-tabs routed .tabs=${[
  { value: 'users', label: 'Users', href: '/admin/users' },
  { value: 'settings', label: 'Settings', href: '/admin/settings' }
]}>
  <router-outlet></router-outlet>
</ml-tabs>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-tabs-tab-color` | `var(--ml-color-text-secondary)` | Inactive tab text color |
| `--ml-tabs-tab-active-color` | `var(--ml-color-primary)` | Active tab text color |
| `--ml-tabs-tab-hover-color` | `var(--ml-color-text)` | Hover tab text color |
| `--ml-tabs-line-indicator-color` | `var(--ml-color-primary)` | Line variant indicator color |
| `--ml-tabs-line-indicator-height` | `2px` | Line variant indicator thickness |
| `--ml-tabs-pills-active-bg` | `var(--ml-color-primary-subtle)` | Pills variant active background |
| `--ml-tabs-pills-active-color` | `var(--ml-color-primary)` | Pills variant active text color |
| `--ml-tabs-enclosed-active-bg` | `var(--ml-color-surface)` | Enclosed variant active background |
| `--ml-tabs-list-border-color` | `var(--ml-color-border)` | Tab list border color |
| `--ml-tabs-panels-padding-top` | `var(--ml-space-4)` | Space between the tab list and the panels |

### ml-tab

Props: `value`, `label`, `icon`, `disabled`, `active` (managed), `href`

**Slots:** (default)

Dispatches an internal `ml:tab-click` (`{ value, href }`) that `ml-tabs` consumes and re-emits as `ml:change`. Its own text colors read `--ml-tab-color`, `--ml-tab-hover-color`, `--ml-tab-active-color` and `--ml-tab-disabled-color` (same defaults as the `--ml-tabs-tab-*` tokens).

### ml-tab-panel

Props: `value` (must match the tab's `value`)

**Slots:** (default) — panel content

#### Usage

```html
<ml-tabs value="tab1" variant="pills">
  <ml-tab slot="tab" value="tab1" label="First"></ml-tab>
  <ml-tab slot="tab" value="tab2" label="Second"></ml-tab>
  <ml-tab-panel value="tab1">Content 1</ml-tab-panel>
  <ml-tab-panel value="tab2">Content 2</ml-tab-panel>
</ml-tabs>
```

---

### ml-breadcrumb

**Selector:** `ml-breadcrumb` · **Import:** `import '@melodicdev/components/breadcrumb'`

#### Props

`separator` (`'chevron'` | `'slash'`, default `'chevron'`)

**Slots:** (default) — `ml-breadcrumb-item` children

**CSS Custom Properties:** `--ml-breadcrumb-gap` (`var(--ml-space-1)`)

### ml-breadcrumb-item

Props: `href`, `icon`, `current` (renders `aria-current="page"` and no link), `separator` (read from the parent `ml-breadcrumb` when the item is created)

**Slots:** (default) — item label

An item with `href` renders an `<a>`. A plain primary-button click on a same-origin link is routed through `RouterService.navigate()` when a router is registered; modifier clicks, other origins and apps without a router keep native link behavior.

#### Usage

```html
<ml-breadcrumb>
  <ml-breadcrumb-item href="/">Home</ml-breadcrumb-item>
  <ml-breadcrumb-item current>Dashboard</ml-breadcrumb-item>
</ml-breadcrumb>
```

---

### ml-pagination

**Selector:** `ml-pagination` · **Import:** `import '@melodicdev/components/pagination'`

#### Props

`page` (1), `totalPages` (`total-pages`, 1), `siblings` (1) — all numbers. A `page` outside `1…totalPages` is clamped for display.

#### Events

| Event | Detail |
|-------|--------|
| `ml:page-change` | `{ page: number }` |

**Methods:** `goToPage(n)`, `previous()`, `next()` — function fields, callable on the element or on `el.component`

#### Usage

```html
<ml-pagination page="3" total-pages="12" @ml:page-change=${(e) => this.load(e.detail.page)}></ml-pagination>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-pagination-btn-color` | `var(--ml-color-text-secondary)` | Button text color |
| `--ml-pagination-btn-bg` | `transparent` | Button background |
| `--ml-pagination-btn-radius` | `var(--ml-radius-md)` | Button radius |
| `--ml-pagination-btn-hover-color` | `var(--ml-color-text)` | Button hover text color |
| `--ml-pagination-btn-page-size` | `40px` | Page button size |
| `--ml-pagination-active-bg` | `var(--ml-color-primary)` | Active page background |
| `--ml-pagination-active-color` | `var(--ml-color-text-inverse)` | Active page text color |
| `--ml-pagination-focus-color` | `var(--ml-color-primary)` | Focus ring color |
| `--ml-pagination-disabled-opacity` | `0.5` | Opacity of disabled buttons |

---

### ml-sidebar

**Selector:** `ml-sidebar` · **Import:** `import '@melodicdev/components/sidebar'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `variant` | `variant` | `SidebarVariant` | `'default'` | `'default'`, `'slim'` |
| `active` | `active` | `string` | `''` | `value` of the active item |
| `navigation` | (property) | `SidebarNavGroup[]` | `[]` | Config alternative to slotted groups / items |
| `footerNavigation` | (property) | `SidebarNavItem[]` | `[]` | Config alternative to the `footer-nav` slot |

```typescript
interface SidebarNavGroup { label?: string; items: SidebarNavItem[] }
interface SidebarNavItem {
  value: string; label: string; icon?: string; href?: string;
  badge?: string; badgeColor?: 'default'|'primary'|'success'|'warning'|'error';
  external?: boolean; disabled?: boolean; children?: SidebarNavItem[];
}
```

**Slots:** `header`, `search`, (default), `footer-nav`, `feature`, `user`. The default slot is replaced by `navigation` and `footer-nav` by `footerNavigation` when those are set. `search`, `feature` and `user` are picked up when slotted after mount; `search` and `feature` are hidden while a slim sidebar is collapsed.

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value }` |
| `ml:item-click` | `{ value, href? }` — fired right after `ml:change` |

**Keyboard:** ArrowUp/ArrowDown (wrapping), Home, End move between items.

**Slim variant:** 64px collapsed → 280px on hover with shadow.

Item links with an `href` are routed through `RouterService.navigate()` when a router is registered (plain same-origin clicks only; modifier clicks keep native behavior). An `external` item is never routed: its link opens in a new tab (`target="_blank"`, `rel="noopener noreferrer"`) and shows an external-link icon.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-sidebar-width` | `280px` | Sidebar width (the `slim` variant sets it itself) |
| `--ml-sidebar-bg` | `var(--ml-color-surface)` | Sidebar background |
| `--ml-sidebar-border-color` | `var(--ml-color-border)` | Border color |
| `--ml-sidebar-item-color` | `var(--ml-color-text-secondary)` | Item text color |
| `--ml-sidebar-item-hover-bg` | `var(--ml-gray-100)` | Item hover background |
| `--ml-sidebar-item-hover-color` | `var(--ml-color-text)` | Item hover text color |
| `--ml-sidebar-item-active-bg` | `var(--ml-color-primary)` | Active item background |
| `--ml-sidebar-item-active-color` | `var(--ml-color-text-inverse)` | Active item text color |
| `--ml-sidebar-item-active-hover-bg` | `var(--ml-color-primary-hover)` | Active item hover background |
| `--ml-sidebar-item-active-indicator-width` | `0px` | Left border accent width on active item |
| `--ml-sidebar-item-active-indicator-color` | `transparent` | Left border accent color on active item |
| `--ml-sidebar-item-icon-color` | `inherit` | Icon color (separate from text) |
| `--ml-sidebar-item-active-icon-color` | `inherit` | Icon color when item is active |
| `--ml-sidebar-item-hover-icon-color` | `inherit` | Icon color on hover |
| `--ml-sidebar-item-active-badge-bg` | `var(--ml-sidebar-badge-bg)` | Badge background when item is active (slotted `ml-sidebar-item`: `var(--ml-sidebar-item-badge-bg)`) |
| `--ml-sidebar-item-active-badge-color` | `var(--ml-sidebar-badge-color)` | Badge text color when item is active (slotted `ml-sidebar-item`: `var(--ml-sidebar-item-badge-color)`) |
| `--ml-sidebar-group-label-color` | `var(--ml-color-text-muted)` | Group label text color |

The `--ml-sidebar-item-*` and `--ml-sidebar-group-label-*` tokens are read both by config-rendered items and by slotted `ml-sidebar-item` / `ml-sidebar-group` elements, so setting them on `ml-sidebar` covers both.

### ml-sidebar-group

Props: `label`, `collapsed` (managed)

**Slots:** (default) — `ml-sidebar-item` children

### ml-sidebar-item

Props: `icon`, `label`, `value`, `href`, `active` (managed), `disabled`, `badge`, `badgeColor` (`badge-color`: `'default'`|`'primary'`|`'success'`|`'warning'`|`'error'`, default `'default'`), `external`, `expanded`, `collapsed` (managed), `level` (default `'0'`), `iconFormat` (`icon-format`: `'fill'`|`'thin'`|`'light'`|`'regular'`|`'bold'`, default `''` — icon format passed through to ml-icon)

**Slots:** `leading`, `trailing`, (default) — sub-items for expandable menus

An item with nested `ml-sidebar-item` children toggles `expanded` on click instead of activating. Otherwise it dispatches an internal `ml:sidebar-item-click` (`{ value, href }`) that `ml-sidebar` consumes and re-emits as `ml:change` + `ml:item-click`.

---

### ml-steps

**Selector:** `ml-steps` · **Import:** `import '@melodicdev/components/steps'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `active` | `active` | `string` | `''` | `value` of the current step (defaults to the first enabled slotted step) |
| `variant` | `variant` | `StepsVariant` | `'numbered'` | `'numbered'`, `'circles'`, `'icons'`, `'bar'` |
| `orientation` | `orientation` | `StepsOrientation` | `'horizontal'` | `'horizontal'`, `'vertical'` |
| `connector` | `connector` | `StepsConnector` | `'solid'` | `'solid'`, `'dotted'` |
| `color` | `color` | `StepsColor` | `'primary'` | `'primary'`, `'success'` |
| `compact` | `compact` | `boolean` | `false` | Dots + "Step X of Y" |
| `routed` | `routed` | `boolean` | `false` | Router integration — same behavior as `ml-tabs` routed mode |
| `steps` | (property) | `StepConfig[]` | `[]` | `{ value, label, description?, icon?, disabled?, href? }` — alternative to slotted `ml-step` elements |

**Slots:** `step` (ml-step elements; ignored when `steps` is set), (default) (ml-step-panel elements, or a `<router-outlet>` in routed mode)

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value }` |

**Keyboard:** ArrowLeft/Right (horizontal) or ArrowUp/Down (vertical), wrapping and skipping disabled steps; Home, End. Steps activate on Enter/Space as well as click.

Steps before the active one are `completed`, the active one is `current`, the rest `upcoming`. Programmatic writes to `active`, `variant`, `color`, `connector`, `orientation` and `compact` are pushed to slotted steps on every render. Inactive panels are hidden with the `hidden` attribute.

#### Usage

```html
<ml-steps active="details" variant="numbered">
  <ml-step slot="step" value="account" label="Account"></ml-step>
  <ml-step slot="step" value="details" label="Details" description="About you"></ml-step>
  <ml-step slot="step" value="confirm" label="Confirm"></ml-step>
  <ml-step-panel value="account">…</ml-step-panel>
  <ml-step-panel value="details">…</ml-step-panel>
  <ml-step-panel value="confirm">…</ml-step-panel>
</ml-steps>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-steps-connector-color` | `var(--ml-color-border)` | Connector line color (upcoming) |
| `--ml-steps-connector-thickness` | `2px` | Connector line thickness |
| `--ml-steps-indicator-size` | `32px` | Indicator size (numbered / circles) |
| `--ml-steps-upcoming-bg` | `var(--ml-color-surface)` | Upcoming indicator background |
| `--ml-steps-upcoming-border-color` | `var(--ml-color-border)` | Upcoming indicator border |
| `--ml-steps-upcoming-color` | `var(--ml-color-text-secondary)` | Upcoming indicator text color |
| `--ml-steps-completed-indicator-text` | `#fff` | Completed indicator text / check color |
| `--ml-steps-label-color` | `var(--ml-color-text)` | Step label color |
| `--ml-steps-label-upcoming-color` | `var(--ml-color-text-secondary)` | Upcoming step label color |
| `--ml-steps-desc-color` | `var(--ml-color-text-muted)` | Step description color |
| `--ml-steps-bar-color` | `var(--ml-color-border)` | Bar variant track color |
| `--ml-steps-panels-padding-top` | `var(--ml-space-6)` | Space between the steps and the panels |

### ml-step

Props: `value`, `label`, `description`, `icon`, `href`, `disabled`, `status` (managed: `'completed'`|`'current'`|`'upcoming'`)

Also managed by the parent `ml-steps` (do not set by hand): `variant`, `connector`, `color`, `orientation`, `stepNumber` (`step-number`), `first`, `last`, `compact`.

Dispatches an internal `ml:step-click` (`{ value, href }`) that `ml-steps` consumes and re-emits as `ml:change`.

### ml-step-panel

Props: `value` (must match the step's `value`)

**Slots:** (default) — panel content

---

## Overlay Components

### ml-dialog

**Selector:** `ml-dialog` · **Import:** `import '@melodicdev/components/dialog'`

Modal dialog built on the native `<dialog>` element (`showModal()`), configured via `DialogService`.

#### Props

`label` — accessible name for the dialog (`aria-label`). Optional: without it the dialog is named by whatever is slotted into `dialog-header`.

#### Slots

`dialog-header`, (default), `dialog-footer`

#### Methods

`open()`, `close(result?)` — prototype methods, reachable on the component instance only (`dialogEl.component.open()`).

#### Events

Dispatched from the inner `<dialog>`; they bubble and are composed, so they can be heard on `ml-dialog` and its ancestors.

| Event | Detail |
|-------|--------|
| `ml:open` | none |
| `ml:close` | `{ result }` — the value passed to `close(result)`, `undefined` for Escape / backdrop dismissal |

Escape and a backdrop click close the dialog unless `disableClose` is set.

#### DialogService API

`@Injectable()` singleton. Import: `import { DialogService, DialogRef } from '@melodicdev/components/dialog'`

| Method | Signature |
|--------|-----------|
| `open` | `(component: ComponentClass, config?: IDialogConfig<TData>) => DialogRef<TResult, TData> \| undefined` |
| `open` | `(dialogID: string) => DialogRef<TResult, TData> \| undefined` |
| `close` | `(dialogID: string, result?: T) => void` |

`open()` returns `undefined` (and logs a warning) when the id is not registered or the component did not render an `<ml-dialog>`.

```typescript
import { DialogService } from '@melodicdev/components/dialog';

@Service(DialogService) private readonly _dialogService!: DialogService;

// Open by component class. The class must be a @MelodicComponent whose template
// renders an <ml-dialog>; an element is appended to document.body and removed on close.
const ref = this._dialogService.open(MyDialogComponent, {
  data: { message: 'Confirm?' },
  size: 'sm',           // 'sm'(400) | 'md'(500) | 'lg'(640) | 'xl'(800) | 'full' | 'auto' | 'custom'
  disableClose: true,   // Escape / backdrop click do not close
  panelClass: 'my-class', // string | string[], added to the <dialog>
  width: '700px'        // sets max-width on the <dialog>, overriding size
});

const off = ref?.afterClosed((result) => { /* ... */ });

// Open an inline dialog by id: <ml-dialog #confirmDialog>…</ml-dialog>
// The id parameter is the branded UniqueID type (from '@melodicdev/components/functions').
this._dialogService.open('confirmDialog' as UniqueID);
this._dialogService.close('confirmDialog' as UniqueID, result);
```

The inline id is the name of the `#`-prefixed attribute on `<ml-dialog>` **without** the `#`; a dialog without one gets a generated id.

Inside a dialog component, implement `onDialogRefSet` to receive the ref:

```typescript
import type { DialogRef, IDialogRef } from '@melodicdev/components/dialog';

export class MyDialogComponent implements IDialogRef {
  private _dialogRef!: DialogRef;

  onDialogRefSet(dialogRef: DialogRef): void {
    this._dialogRef = dialogRef;      // dialogRef.data is config.data
  }

  confirm(): void {
    this._dialogRef.close(true);
  }
}
```

**DialogRef**

| Member | Description |
|--------|-------------|
| `dialogID` | The dialog's id |
| `data` | `config.data` (`TData \| undefined`) |
| `disableClose` | `boolean` |
| `open()` | Open the dialog |
| `close(result?)` | Close; `result` reaches `afterClosed` callbacks and the `ml:close` event |
| `afterOpened(cb)` | Runs `cb` after **every** open. Returns an unsubscribe function |
| `afterClosed(cb)` | Runs `cb(result)` after **every** close, including Escape / backdrop dismissal. Returns an unsubscribe function |

An inline `<ml-dialog>` reuses one `DialogRef` across opens, so register callbacks once (or call the returned unsubscribe) rather than before each `open()`.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-dialog-bg` | `var(--ml-color-surface)` | Dialog background |
| `--ml-dialog-radius` | `var(--ml-radius-xl)` | Border radius |
| `--ml-dialog-shadow` | `var(--ml-shadow-xl)` | Box shadow |
| `--ml-dialog-backdrop-color` | `rgba(0, 0, 0, 0.5)` | Backdrop overlay color |
| `--ml-dialog-max-width` | `500px` | Default max width |
| `--ml-dialog-sm-max-width` / `-md-` / `-lg-` / `-xl-` | `400px` / `500px` / `640px` / `800px` | Max width per `size` |
| `--ml-dialog-header-padding` | `var(--ml-space-6)` | Header padding |
| `--ml-dialog-body-padding` | `var(--ml-space-6)` | Body padding |
| `--ml-dialog-body-color` | `var(--ml-color-text-secondary)` | Body text color |
| `--ml-dialog-footer-border-color` | `var(--ml-color-border)` | Footer top border color |
| `--ml-dialog-footer-bg` | `var(--ml-color-surface)` | Footer background |

---

### ml-drawer

**Selector:** `ml-drawer` · **Import:** `import '@melodicdev/components/drawer'`

Slide-out panel built on the native `<dialog>` element (modal). The panel slides with a `transform` animation; with `prefers-reduced-motion: reduce` it opens and closes without the slide.

#### Props

`side` (`'left'`|`'right'`, default `'right'`), `size` (`'sm'`=320|`'md'`=480|`'lg'`=640|`'xl'`=800, default `'md'`), `showClose` (`show-close`, default true; `show-close="false"` hides the close button), `label` (accessible name, `aria-label`; without it the drawer is named by the content of the `drawer-header` slot)

**Slots:** `drawer-header`, (default), `drawer-footer`

**Methods:** `open()` is a prototype method, reachable on the component instance only; `close()` is a function field, callable on the element (`drawerEl.close()`) or on the instance. Going through `.component` works for both:

```typescript
const drawer = this.elementRef.shadowRoot?.querySelector('#settings') as HTMLElement & { component: { open(): void; close(): void } };
drawer.component.open();
```

Escape and a backdrop click close the drawer.

#### Events

| Event | Detail | When |
|-------|--------|------|
| `ml:open` | none | Opening starts |
| `ml:opened` | none | Slide-in animation finished |
| `ml:close` | none | Closing starts |
| `ml:closed` | none | Slide-out animation finished and the dialog is closed |

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-drawer-bg` | `var(--ml-color-surface)` | Panel background |
| `--ml-drawer-shadow` | `var(--ml-shadow-xl)` | Panel shadow |
| `--ml-drawer-backdrop-color` | `rgba(0, 0, 0, 0.5)` | Backdrop color |
| `--ml-drawer-sm-width` / `-md-` / `-lg-` / `-xl-` | `320px` / `480px` / `640px` / `800px` | Panel width per `size` |
| `--ml-drawer-header-padding` | `var(--ml-space-6)` | Header padding |
| `--ml-drawer-body-padding` | `var(--ml-space-6)` | Body padding |
| `--ml-drawer-footer-border-color` | `var(--ml-color-border)` | Footer top border color |
| `--ml-drawer-transition-duration` | `var(--ml-duration-300)` | Slide duration — read by JavaScript, declared on `:host`; set it with an element selector |
| `--ml-drawer-transition-easing` | `cubic-bezier(0.16, 1, 0.3, 1)` | Slide easing — read by JavaScript, declared on `:host`; set it with an element selector |

---

### ml-popover

**Selector:** `ml-popover` · **Import:** `import '@melodicdev/components/popover'`

#### Props

`placement` (Placement, default `'bottom'`), `offset` (number, 8), `manual` (boolean), `arrow` (boolean), `label` (accessible name for the panel, `aria-label`)

State property: `isOpen` (read it; change it through the methods).

**Slots:** `trigger` (clicking it toggles the popover), (default) — popover content

**Methods:** `open()` and `close()` are prototype methods, reachable on the component instance only (`popoverEl.component.open()`); `toggle()` is a function field, callable on the element too

#### Events

| Event | Detail |
|-------|--------|
| `ml:open` | none |
| `ml:close` | none |

**ARIA:** the content panel is `role="dialog"`, named by `label`; `aria-haspopup="dialog"` (unless the trigger already sets `aria-haspopup`) and `aria-expanded` are put on the slotted trigger's focusable control.

Uses Popover API (`popover="auto"` or `"manual"`) + `computePosition`/`autoUpdate`. Focus is trapped inside the content while open, including controls inside nested components. `auto` popovers light-dismiss (outside click, Escape); `manual` popovers stay open on outside clicks and close on Escape or `close()`.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-popover-bg` | `var(--ml-color-surface)` | Panel background |
| `--ml-popover-color` | `var(--ml-color-text)` | Panel text color |
| `--ml-popover-border-color` | `var(--ml-color-border)` | Panel border color |
| `--ml-popover-radius` | `var(--ml-radius-lg)` | Panel border radius |
| `--ml-popover-shadow` | `var(--ml-shadow-lg)` | Panel box shadow |
| `--ml-popover-padding-y` / `-x` | `var(--ml-space-3)` / `var(--ml-space-4)` | Panel padding |
| `--ml-popover-content-overflow` | `visible` | Content overflow (set to `auto` for scroll) |
| `--ml-popover-arrow-bg` | `var(--ml-color-surface)` | Arrow background |

---

### ml-dropdown

**Selector:** `ml-dropdown` · **Import:** `import '@melodicdev/components/dropdown'`

#### Props

`placement` (Placement, default `'bottom-start'`), `offset` (4), `arrow`

State property: `isOpen` (read it; change it through the methods).

**Slots:** `trigger` (clicking it toggles the menu), (default) — items/groups/separators

**Methods:** `open()` and `close()` are prototype methods, reachable on the component instance only (`dropdownEl.component.close()`); `toggle()` is a function field, callable on the element too

#### Events

| Event | Detail |
|-------|--------|
| `ml:select` | `{ value }` — an item was chosen; the menu then closes |
| `ml:open` | none |
| `ml:close` | none |

**Keyboard:** ArrowDown/Enter/Space open the menu from the trigger; ArrowDown/Up, Home/End move between items, Enter/Space select, Escape and Tab close.

**ARIA:** the menu is `role="menu"`; `aria-haspopup`, `aria-expanded` and `aria-activedescendant` are set on the trigger's focusable control.

#### Usage

```html
<ml-dropdown @ml:select=${(e) => this.onAction(e.detail.value)}>
  <ml-button slot="trigger" variant="outline">Actions</ml-button>
  <ml-dropdown-group label="Edit">
    <ml-dropdown-item value="rename" icon="pencil" addon="⌘R">Rename</ml-dropdown-item>
    <ml-dropdown-item value="duplicate" icon="copy">Duplicate</ml-dropdown-item>
  </ml-dropdown-group>
  <ml-dropdown-separator></ml-dropdown-separator>
  <ml-dropdown-item value="delete" icon="trash" destructive>Delete</ml-dropdown-item>
</ml-dropdown>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-dropdown-bg` | `var(--ml-color-surface)` | Menu background |
| `--ml-dropdown-color` | `var(--ml-color-text)` | Menu text color |
| `--ml-dropdown-border-color` | `var(--ml-color-border)` | Menu border color |
| `--ml-dropdown-radius` | `var(--ml-radius-lg)` | Menu radius |
| `--ml-dropdown-shadow` | `var(--ml-shadow-lg)` | Menu shadow |
| `--ml-dropdown-padding` | `var(--ml-space-1)` | Menu padding |
| `--ml-dropdown-min-width` | `180px` | Menu minimum width |

### ml-dropdown-item

Props: `value`, `icon`, `addon` (shortcut text), `disabled`, `destructive`

**Slots:** (default) — item label

The host is `role="menuitem"`. Dispatches an internal `ml:item-select` (`{ value }`) that `ml-dropdown` consumes and re-emits as `ml:select`.

**CSS Custom Properties:** `--ml-dropdown-item-color` (`var(--ml-color-text)`), `--ml-dropdown-item-hover-bg` (`var(--ml-color-surface-hover)`), `--ml-dropdown-item-padding` (`var(--ml-space-2)`), `--ml-dropdown-item-radius` (`var(--ml-radius-md)`), `--ml-dropdown-item-icon-color` (`var(--ml-color-text-secondary)`), `--ml-dropdown-item-destructive-color` (`var(--ml-color-error)`), `--ml-dropdown-item-destructive-hover-bg` (`var(--ml-color-error-subtle)`), `--ml-dropdown-item-disabled-opacity` (`0.5`)

### ml-dropdown-group

Props: `label`

**Slots:** (default) — `ml-dropdown-item` children

### ml-dropdown-separator

No props.

---

### ml-tooltip

**Selector:** `ml-tooltip` · **Import:** `import '@melodicdev/components/tooltip'`

#### Props

`content` (string), `placement` (Placement, default `'top'`), `delay` (ms before showing, default 200)

**Slots:** (default) — trigger element

Shows on hover + focus, hides on mouse leave / focus out, and Escape dismisses it while visible. The tooltip text is copied onto the slotted trigger as `aria-description` so assistive technology announces it (skipped when the trigger already has `aria-describedby`); the `:tooltip` directive does the same for its element. `max-width: 320px`, `z-index: 9999`.

**Methods:** `show()`, `hide()` — function fields, callable on the element or on `el.component`

```html
<ml-tooltip content="Copy to clipboard" placement="bottom">
  <ml-button variant="ghost"><ml-icon icon="copy"></ml-icon></ml-button>
</ml-tooltip>
```

#### `:tooltip` directive

`import '@melodicdev/components/directives'` registers a `:tooltip` attribute directive that attaches an `ml-tooltip` to any element without wrapping it (the tooltip is inserted as a sibling and anchored to the element):

```html
<ml-button :tooltip="Helpful tip">Hover me</ml-button>
<ml-button :tooltip=${this.helpText}>Help</ml-button>
<span :tooltip=${{ content: 'Info', placement: 'bottom' }}>Info</span>
```

The value is a string or `{ content: string; placement?: string }` (placement defaults to `'top'`). A falsy value or empty content attaches nothing.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-tooltip-bg` | `var(--ml-gray-900)` | Background (the base theme sets this globally — see [Tooltip & Card Tokens](#tooltip--card-tokens)) |
| `--ml-tooltip-color` | `var(--ml-tooltip-text, var(--ml-white))` | Text color (`--ml-tooltip-text` is the global token) |
| `--ml-tooltip-max-width` | `320px` | Maximum width |
| `--ml-tooltip-radius` | `var(--ml-radius)` | Border radius |
| `--ml-tooltip-shadow` | `var(--ml-shadow-lg)` | Box shadow |
| `--ml-tooltip-font-size` | `var(--ml-text-xs)` | Font size |
| `--ml-tooltip-z-index` | `9999` | Stacking order |

---

## Section Components

### ml-app-shell

**Selector:** `ml-app-shell` · **Import:** `import '@melodicdev/components/app-shell'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `sidebarPosition` | `sidebar-position` | `'left'` \| `'right'` | `'left'` |
| `sidebarCollapsed` | `sidebar-collapsed` | `boolean` | `false` — narrows the sidebar column to the collapsed width (64px) |
| `headerFixed` | `header-fixed` | `boolean` | `false` — makes the header sticky |

State properties: `mobile` (viewport is below the breakpoint), `mobileOpen` (mobile drawer is open).

**Slots:** `sidebar`, `header`, (default)

**Responsive:** < 768px: sidebar becomes off-screen drawer with hamburger menu. The menu button carries `aria-expanded` / `aria-controls`; opening moves focus into the drawer, and Escape or a backdrop click closes it and returns focus to the button.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-app-shell-sidebar-width` | `var(--ml-sidebar-width, 280px)` | Mobile drawer width (on desktop the sidebar column sizes to its content) |
| `--ml-app-shell-sidebar-collapsed-width` | `var(--ml-sidebar-collapsed-width, 64px)` | Sidebar width with `sidebar-collapsed` |
| `--ml-app-shell-sidebar-bg` | `var(--ml-color-surface)` | Mobile drawer background |
| `--ml-app-shell-header-bg` | `var(--ml-color-surface)` | Header background |
| `--ml-app-shell-border-color` | `var(--ml-color-border)` | Sidebar / header border color |
| `--ml-app-shell-backdrop-bg` | `rgba(0, 0, 0, 0.4)` | Mobile drawer backdrop |
| `--ml-app-shell-menu-btn-color` | `var(--ml-color-text-secondary)` | Hamburger button color |
| `--ml-app-shell-mobile-breakpoint` | `768px` | Viewport width below which the component's JavaScript switches to the mobile drawer. Declared on `:host`; set it with an element selector. The stylesheet's own media query is fixed at `max-width: 767px` |

---

### ml-page-header

**Selector:** `ml-page-header` · **Import:** `import '@melodicdev/components/page-header'`

#### Props

`headerTitle` (`header-title`), `description`, `variant` (`'default'`|`'compact'`|`'centered'`, default `'default'`), `divider` (boolean, default true; `divider="false"` removes the bottom border)

The `title` attribute / property is a deprecated alias of `header-title`.

**Slots:** `breadcrumb`, `title` (replaces the `header-title` heading), `description` (replaces the `description` text), `actions`, `tabs`, `meta`

**Responsive:** <= 640px: stacks vertically, actions stretch full width.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-page-header-color` | `var(--ml-color-text)` | General text color |
| `--ml-page-header-title-color` | `var(--ml-color-text)` | Title text color |
| `--ml-page-header-title-size` | `var(--ml-text-2xl)` | Title font size (`--ml-page-header-compact-title-size`, `var(--ml-text-lg)`, for `compact`) |
| `--ml-page-header-description-color` | `var(--ml-color-text-secondary)` | Description text color |
| `--ml-page-header-border-color` | `var(--ml-color-border)` | Bottom divider border color |
| `--ml-page-header-padding` | `var(--ml-space-6) var(--ml-space-6) var(--ml-space-4)` | Container padding (`--ml-page-header-compact-padding` for `compact`, `--ml-page-header-mobile-padding` <= 640px) |

---

### ml-hero-section

**Selector:** `ml-hero-section` · **Import:** `import '@melodicdev/components/hero-section'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `variant` | `variant` | `HeroVariant` | `'centered'` | `'centered'`, `'split'`, `'split-reverse'` |
| `size` | `size` | `HeroSize` | `'lg'` | `'sm'`, `'md'`, `'lg'` |
| `background` | `background` | `HeroBackground` | `'none'` | `'none'`, `'subtle'`, `'gradient'` |
| `heroTitle` | `hero-title` | `string` | `''` | Headline (alternative to the `title` slot) |
| `description` | `description` | `string` | `''` | Supporting text (alternative to the `description` slot) |

The `title` attribute / property is a deprecated alias of `hero-title`.

**Slots:** `eyebrow`, `title`, `description`, `actions`, `media`, `social-proof`

**Title sizes:** sm=`text-3xl`, md=`text-4xl`, lg=`text-5xl`

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-hero-title-color` | `var(--ml-color-text)` | Title color |
| `--ml-hero-title-font-weight` | `var(--ml-font-bold)` | Title font weight |
| `--ml-hero-description-color` | `var(--ml-color-text-secondary)` | Description color |
| `--ml-hero-eyebrow-color` | `var(--ml-color-primary)` | Eyebrow color |
| `--ml-hero-bg-subtle` | `var(--ml-color-surface-secondary)` | Background for `background="subtle"` |
| `--ml-hero-bg-gradient` | `linear-gradient(135deg, var(--ml-color-primary-subtle) 0%, var(--ml-color-surface) 50%, var(--ml-color-success-subtle, var(--ml-color-surface-secondary)) 100%)` | Background for `background="gradient"` |
| `--ml-hero-container-max-width` | `var(--ml-container-xl, 1280px)` | Container max width |
| `--ml-hero-content-max-width` | `800px` | Content column max width |
| `--ml-hero-sm-padding` / `-md-padding` / `-lg-padding` | `var(--ml-space-12) var(--ml-space-6)` / `var(--ml-space-20) var(--ml-space-6)` / `calc(var(--ml-space-20) + var(--ml-space-10)) var(--ml-space-6)` | Section padding per size |
| `--ml-hero-sm-title-size` / `-md-title-size` / `-lg-title-size` | `var(--ml-text-3xl)` / `var(--ml-text-4xl)` / `var(--ml-text-5xl)` | Title size per size |

---

### ml-page-section

**Selector:** `ml-page-section` · **Import:** `import '@melodicdev/components/page-section'`

Titled content section with consistent heading typography and optional action link.

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `section-title` | `string` | `''` | Section title (rendered in serif font). Property: `sectionTitle` |
| `subtitle` | `string` | `''` | Subtitle text |
| `action-label` | `string` | `''` | Action link text. Property: `actionLabel` |
| `action-href` | `string` | `''` | Action link URL. Property: `actionHref`. Only relative, fragment and http(s) URLs are rendered as-is; any other scheme is neutralized with an `unsafe:` prefix |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Content area padding |

The `title` attribute / property is a deprecated alias of `section-title`.

The action link is routed through `RouterService.navigate()` when a router is registered (plain same-origin clicks only).

**Slots:**

| Slot | Description |
|------|-------------|
| `default` | Section content |
| `action` | Override for complex action content (replaces action-label link) |

**Key CSS Custom Properties:**

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-page-section-title-font` | `'Cormorant Garamond', 'Georgia', serif` | Title font family |
| `--ml-page-section-title-size` | `var(--ml-text-2xl)` | Title font size |
| `--ml-page-section-title-color` | `var(--ml-color-text)` | Title color |
| `--ml-page-section-subtitle-color` | `var(--ml-color-text-muted)` | Subtitle color |
| `--ml-page-section-action-color` | `var(--ml-color-primary)` | Action link color |
| `--ml-page-section-action-hover-color` | `var(--ml-color-primary-hover)` | Action link hover color |
| `--ml-page-section-gap` | `var(--ml-space-4)` | Gap between header and content |
| `--ml-page-section-pad-sm` / `-pad-md` / `-pad-lg` | `var(--ml-space-2) 0` / `var(--ml-space-4) 0` / `var(--ml-space-6) 0` | Content padding per `padding` value |

**Example:**

```html
<ml-page-section section-title="Recent Activity" subtitle="Last 7 days" action-label="View All" action-href="/activity">
  <ml-activity-feed>...</ml-activity-feed>
</ml-page-section>
```

---

## General Components

### ml-icon

**Selector:** `ml-icon` · **Import:** `import '@melodicdev/components/icon'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `icon` | `icon` | `string` | `''` | Phosphor icon name in kebab-case (e.g. `'house'`, `'gear'`, `'caret-right'`) |
| `format` | `format` | `string` | `'regular'` | `'bold'`, `'fill'`, `'light'`, `'regular'`, `'thin'` |
| — | `size` | (attribute only, styled via `:host([size])`) | — | `'xs'`=12px, `'sm'`=16px, `'md'`=24px, `'lg'`=32px, `'xl'`=48px; 24px without the attribute |

An unknown `icon` name renders nothing and logs a dev-mode warning. The glyph is `aria-hidden`; give the surrounding control its own accessible name.

**CSS Custom Properties:**
- `--ml-icon-color` — override icon color (default: `currentColor`)
- `--ml-icon-size` — override icon size (default: `24px`)

Requires the Phosphor icon fonts (font families `Phosphor`, `Phosphor-Bold`, `Phosphor-Fill`, `Phosphor-Light`, `Phosphor-Thin`) loaded in the page. The package ships them as `.woff2` only (`assets/fonts/phosphor/`); `.woff`, `.ttf` and `.svg` are no longer published.

---

## Page Components

### ml-login-page

**Selector:** `ml-login-page` · **Import:** `import '@melodicdev/components/login-page'`

#### Props

`variant` (`'centered'`|`'split'`, default `'centered'`), `pageTitle` (`page-title`, default `'Log in to your account'`), `description` (`'Welcome back! Please enter your details.'`)

The `title` attribute / property is a deprecated alias of `page-title`.

**Slots:** `logo`, `header` (replaces the default title + description), `social`, `form`, `footer`, `brand` (split only)

**Centered:** Full-page centered card (max-width 440px). **Split:** Two-column; brand side hides <= 768px.

#### Key CSS Custom Properties

Shared by `ml-login-page` and `ml-signup-page` (`auth-layout.styles.ts`):

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-auth-bg` | `var(--ml-color-surface-secondary)` | Page background |
| `--ml-auth-card-max-width` | `440px` | Card max width |
| `--ml-auth-card-bg` | `var(--ml-color-surface)` | Card background |
| `--ml-auth-card-border-color` | `var(--ml-color-border)` | Card border color |
| `--ml-auth-card-radius` | `var(--ml-radius-xl)` | Card radius |
| `--ml-auth-card-shadow` | `var(--ml-shadow-lg)` | Card shadow |
| `--ml-auth-card-padding` | `var(--ml-space-10)` | Card padding |
| `--ml-auth-title-color` | `var(--ml-color-text)` | Title color |
| `--ml-auth-description-color` | `var(--ml-color-text-muted)` | Description color |
| `--ml-auth-split-form-bg` | `var(--ml-color-surface)` | Form side background (split) |
| `--ml-auth-split-brand-bg` | `var(--ml-color-primary)` | Brand side background (split) |
| `--ml-auth-split-brand-color` | `var(--ml-color-text-inverse)` | Brand side text color (split) |

---

### ml-signup-page

**Selector:** `ml-signup-page` · **Import:** `import '@melodicdev/components/signup-page'`

#### Props

`variant` (`'centered'`|`'split'`, default `'centered'`), `pageTitle` (`page-title`, default `'Create an account'`), `description` (`'Start your journey today.'`)

The `title` attribute / property is a deprecated alias of `page-title`.

**Slots:** `logo`, `header` (replaces the default title + description), `social`, `form`, `footer`, `brand` (split only)

Same layout and `--ml-auth-*` tokens as `ml-login-page`; shares `auth-layout.styles.ts`.

---

### ml-dashboard-page

**Selector:** `ml-dashboard-page` · **Import:** `import '@melodicdev/components/dashboard-page'`

#### Props

`pageTitle` (`page-title`), `description`, `layout` (`'default'`|`'wide'`|`'full'`, default `'default'`)

The `title` attribute / property is a deprecated alias of `page-title`.

**Slots:** `sidebar`, `header-actions`, `metrics`, `main`, `aside` (default layout only). `metrics`, `aside` and `header-actions` are detected from the element's direct children, including content slotted after mount.

**Layouts:** `default` = `2fr 1fr` (collapses <= 1024px), `wide`/`full` = single column.

Composes `ml-app-shell` + `ml-page-header` internally.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-dashboard-padding` | `var(--ml-space-6)` | Content padding (`--ml-dashboard-mobile-padding`, `var(--ml-space-4)`, on small screens) |
| `--ml-dashboard-metrics-min-width` | `200px` | Minimum width of a metrics grid column |
| `--ml-dashboard-metrics-gap` | `var(--ml-space-4)` | Metrics grid gap |
| `--ml-dashboard-body-gap` | `var(--ml-space-6)` | Gap between main and aside |
| `--ml-dashboard-main-gap` | `var(--ml-space-6)` | Gap between items in `main` |
| `--ml-dashboard-aside-gap` | `var(--ml-space-6)` | Gap between items in `aside` |

---

## Token Count Summary

| Category | Count |
|----------|-------|
| Primitive colors (7 ramps × 12 + white/black) | 86 |
| Semantic color tokens (incl. focus ring, badge, alert, tooltip, card footer) | 77 |
| Spacing tokens | 35 |
| Typography tokens | 37 |
| Shadow tokens | 24 |
| Border tokens | 17 |
| Transition tokens | 20 |
| Breakpoint tokens | 6 |
| **Total design tokens** | **302** |

| Category | Custom Elements |
|----------|----------------|
| Form components | 22 |
| Foundation components | 4 |
| Feedback components | 5 (+ `ToastService`) |
| Data display components | 13 |
| Navigation components | 12 |
| Overlay components | 8 (+ `DialogService`) |
| Section components | 4 |
| General components | 1 |
| Page components | 3 |
| **Total custom elements** | **72** |
