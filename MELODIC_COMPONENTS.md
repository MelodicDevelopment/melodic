# Melodic Components Library — Complete Reference

> Auto-generated from source code analysis. Covers every component, prop, event, slot, CSS custom property, and design token in `@melodicdev/components`.

---

## Table of Contents

- [Component Registration & Import Pattern](#component-registration--import-pattern)
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
- [Style Utilities](#style-utilities)
- [Shared Types](#shared-types)
- [Form Components](#form-components)
  - [ml-button](#ml-button)
  - [ml-button-group](#ml-button-group)
  - [ml-input](#ml-input)
  - [ml-textarea](#ml-textarea)
  - [ml-checkbox](#ml-checkbox)
  - [ml-radio / ml-radio-group](#ml-radio)
  - [ml-radio-card-group](#ml-radio-card-group)
  - [ml-toggle](#ml-toggle)
  - [ml-select](#ml-select)
  - [ml-autocomplete](#ml-autocomplete)
  - [ml-slider](#ml-slider)
  - [ml-date-picker](#ml-date-picker)
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
  - [ml-toast / ToastService](#ml-toast)
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
  - [ml-dropdown](#ml-dropdown)
  - [ml-tooltip](#ml-tooltip)
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

---

## Component Registration & Import Pattern

Each component is a separate entry point in `package.json` exports. Importing the entry point causes the custom element to self-register via the `@MelodicComponent` decorator.

```typescript
// Each import registers the corresponding custom element
import '@melodicdev/components/button';     // registers <ml-button>
import '@melodicdev/components/table';      // registers <ml-table>
import '@melodicdev/components/dialog';     // registers <ml-dialog>
```

### Full Export Map

| Import Path | Custom Element(s) |
|-------------|-------------------|
| `@melodicdev/components/activity-feed` | `ml-activity-feed`, `ml-activity-item` |
| `@melodicdev/components/alert` | `ml-alert` |
| `@melodicdev/components/app-shell` | `ml-app-shell` |
| `@melodicdev/components/autocomplete` | `ml-autocomplete` |
| `@melodicdev/components/avatar` | `ml-avatar` |
| `@melodicdev/components/badge` | `ml-badge` |
| `@melodicdev/components/badge-group` | `ml-badge-group` |
| `@melodicdev/components/breadcrumb` | `ml-breadcrumb`, `ml-breadcrumb-item` |
| `@melodicdev/components/button` | `ml-button` |
| `@melodicdev/components/button-group` | `ml-button-group` |
| `@melodicdev/components/calendar-view` | `ml-calendar-view` |
| `@melodicdev/components/card` | `ml-card` |
| `@melodicdev/components/checkbox` | `ml-checkbox` |
| `@melodicdev/components/container` | `ml-container` |
| `@melodicdev/components/dashboard-page` | `ml-dashboard-page` |
| `@melodicdev/components/data-grid` | `ml-data-grid` |
| `@melodicdev/components/date-picker` | `ml-date-picker` |
| `@melodicdev/components/date-time-picker` | `ml-date-time-picker` |
| `@melodicdev/components/dialog` | `ml-dialog` |
| `@melodicdev/components/divider` | `ml-divider` |
| `@melodicdev/components/drawer` | `ml-drawer` |
| `@melodicdev/components/dropdown` | `ml-dropdown`, `ml-dropdown-item`, `ml-dropdown-group`, `ml-dropdown-separator` |
| `@melodicdev/components/file-upload` | `ml-file-upload`, `ml-file-upload-item`, `ml-file-icon` |
| `@melodicdev/components/form-field` | `ml-form-field` |
| `@melodicdev/components/hero-section` | `ml-hero-section` |
| `@melodicdev/components/icon` | `ml-icon` |
| `@melodicdev/components/input` | `ml-input` |
| `@melodicdev/components/list` | `ml-list`, `ml-list-item` |
| `@melodicdev/components/login-page` | `ml-login-page` |
| `@melodicdev/components/page-header` | `ml-page-header` |
| `@melodicdev/components/page-section` | `ml-page-section` |
| `@melodicdev/components/pagination` | `ml-pagination` |
| `@melodicdev/components/popover` | `ml-popover` |
| `@melodicdev/components/profile-card` | `ml-profile-card` |
| `@melodicdev/components/progress` | `ml-progress` |
| `@melodicdev/components/radio` | `ml-radio`, `ml-radio-group` |
| `@melodicdev/components/radio-card-group` | `ml-radio-card-group` |
| `@melodicdev/components/select` | `ml-select` |
| `@melodicdev/components/sidebar` | `ml-sidebar`, `ml-sidebar-group`, `ml-sidebar-item` |
| `@melodicdev/components/signup-page` | `ml-signup-page` |
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
| `@melodicdev/components/toast` | `ml-toast` |
| `@melodicdev/components/toggle` | `ml-toggle` |
| `@melodicdev/components/tooltip` | `ml-tooltip` |

### Non-Component Entry Points

| Import Path | Purpose |
|-------------|---------|
| `@melodicdev/components` | Everything (theme + utils + all components) |
| `@melodicdev/components/theme` | Theme tokens, presets, functions |
| `@melodicdev/components/utils` | Positioning, accessibility, styles, virtual scroll, click-outside |
| `@melodicdev/components/functions` | `newID()` |
| `@melodicdev/components/directives` | `clickOutside` directive |

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
| `--ml-transition-colors` | `color, background-color, border-color — all 150ms ease-in-out` |
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
| Base | `:root` | All tokens (primitives + semantics), `color-scheme: light` |
| Light | `:root, [data-theme="light"]` | Reaffirms base semantics, `color-scheme: light` |
| Dark | `[data-theme="dark"]` + `@media (prefers-color-scheme: dark)` | Overrides all semantic tokens for dark, `color-scheme: dark` |

Dark mode applies automatically via OS preference unless `data-theme="light"` is explicitly set.

### Theme API Functions

All exported from `@melodicdev/components/theme`.

| Function | Signature | Description |
|----------|-----------|-------------|
| `applyTheme` | `(theme: ThemeMode) => void` | Sets `data-theme` on `documentElement`. `'system'` auto-tracks OS preference. |
| `toggleTheme` | `() => void` | Flips between light and dark |
| `getTheme` | `() => ThemeMode` | Returns current mode |
| `getResolvedTheme` | `() => 'light' \| 'dark'` | Resolves `'system'` to actual |
| `onThemeChange` | `(cb: (theme, resolved) => void) => () => void` | Subscribe; returns unsubscribe |
| `createTheme` | `(name: string, overrides: Record<string, string>) => string` | Returns CSS string |
| `injectTheme` | `(name: string, overrides: Record<string, string>) => HTMLStyleElement` | Injects `<style>` into `<head>` |
| `createBrandTheme` | `(name: string, { primary?, secondary?, ... }) => string` | Convenience wrapper |
| `tokensToCss` | `(tokens: Record<string, string>) => string` | Tokens object to CSS string |
| `generateTokensCss` | `() => string` | Full `:root { ... }` CSS |

`ThemeMode = 'light' | 'dark' | 'system'`

---

## Component-Scoped CSS Custom Properties

Every component defines scoped CSS custom properties on `:host` that default to global design tokens. This allows per-instance customization without affecting other components.

### Naming Convention

`--ml-{component}-{state?}-{property}`

- **States:** `hover`, `active`, `focus`, `disabled`, `checked`, `expanded`, `open`
- **Properties:** `bg`, `color`, `border-color`, `border-width`, `radius`, `padding-x`, `padding-y`, `gap`, `font-size`, `font-weight`, `shadow`, `opacity`, `transition-duration`, `transition-easing`

### Usage Example

```css
/* Override a single button's colors without changing the global palette */
ml-button.cta {
    --ml-button-bg: #c9a84c;
    --ml-button-hover-bg: #d4b96a;
    --ml-button-radius: 0;
}

/* Customize the sidebar for a specific theme */
ml-sidebar {
    --ml-sidebar-bg: #1a4a3a;
    --ml-sidebar-item-active-bg: transparent;
    --ml-sidebar-item-active-color: #c9a84c;
    --ml-sidebar-group-label-color: rgba(201, 168, 76, 0.5);
}

/* Style a card as a warm parchment surface */
ml-card.parchment {
    --ml-card-bg: #fdf9f0;
    --ml-card-border-color: #efe8d6;
    --ml-card-shadow: none;
}
```

Each component's available custom properties are documented in its `:host` block in the styles source file. See the individual component sections below for key properties.

---

## Style Utilities

Exported from `@melodicdev/components/utils`.

| Export | Description |
|--------|-------------|
| `resetStyles` | Shadow DOM CSS reset (box-sizing, margins, fonts) |
| `componentBaseStyles` | Base `:host` styles for all `ml-*` components (font-family, focus ring, disabled, hidden) |
| `focusRingStyles` | Mixin for interactive elements (focus-visible outline) |
| `interactiveStyles` | Mixin: cursor, user-select, tap-highlight, disabled |
| `visuallyHiddenStyles` | `.visually-hidden` screen-reader-only class |

---

## Shared Types

```typescript
type ThemeMode = 'light' | 'dark' | 'system';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
type AlertVariant = 'info' | 'success' | 'warning' | 'error';
type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';
type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end'
               | 'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end';
type Orientation = 'horizontal' | 'vertical';
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
```

---

## Form Components

### ml-button

**Selector:** `ml-button` · **Import:** `import '@melodicdev/components/button'`
**Source:** `packages/melodic-components/src/components/forms/button/`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `variant` | `variant` | `ButtonVariant` | `'primary'` | `'primary'`, `'secondary'`, `'outline'`, `'ghost'`, `'danger'`, `'link'` |
| `size` | `size` | `Size` | `'md'` | `'xs'`, `'sm'`, `'md'`, `'lg'`, `'xl'` |
| `type` | `type` | `ButtonType` | `'button'` | `'button'`, `'submit'`, `'reset'` |
| `disabled` | `disabled` | `boolean` | `false` | |
| `loading` | `loading` | `boolean` | `false` | |
| `fullWidth` | `full-width` | `boolean` | `false` | |

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
<ml-button variant="danger" size="lg" loading>Processing...</ml-button>
<ml-button variant="ghost">
  <ml-icon slot="icon-start" icon="plus"></ml-icon>
  Add Item
</ml-button>
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-button-bg` | `var(--ml-color-primary)` | Background color |
| `--ml-button-color` | `var(--ml-color-text-inverse)` | Text color |
| `--ml-button-border-color` | `var(--ml-color-primary)` | Border color |
| `--ml-button-hover-bg` | `var(--ml-color-primary-hover)` | Hover background |
| `--ml-button-hover-color` | `var(--ml-color-text-inverse)` | Hover text color |
| `--ml-button-border-radius` | `var(--ml-radius)` | Border radius |
| `--ml-button-font-size` | `var(--ml-text-sm)` | Font size |
| `--ml-button-shadow` | `var(--ml-shadow-xs)` | Box shadow |

---

### ml-button-group

**Selector:** `ml-button-group` · **Import:** `import '@melodicdev/components/button-group'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `value` | `value` | `string` | `''` | Single-select value |
| `variant` | `variant` | `string` | `'outline'` | `'outline'`, `'solid'` |
| `size` | `size` | `Size` | `'md'` | `'xs'`–`'xl'` |
| `disabled` | `disabled` | `boolean` | `false` | |
| `multiple` | `multiple` | `boolean` | `false` | |
| `values` | (property) | `string[]` | `[]` | Multi-select values |

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string }` (single) or `{ values: string[] }` (multiple) |

#### Child: `ml-button-group-item`

Props: `value`, `icon`, `disabled`, `active` (managed), `groupDisabled`, `groupSize`

#### Usage

```html
<ml-button-group value="list" variant="solid" size="sm">
  <ml-button-group-item value="list" icon="list">List</ml-button-group-item>
  <ml-button-group-item value="grid" icon="grid-four">Grid</ml-button-group-item>
</ml-button-group>
```

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
| `error` | `error` | `string` | `''` | |
| `size` | `size` | `Size` | `'md'` | `'sm'`, `'md'`, `'lg'` |
| `disabled` | `disabled` | `boolean` | `false` | |
| `readonly` | `readonly` | `boolean` | `false` | |
| `required` | `required` | `boolean` | `false` | |
| `autocomplete` | `autocomplete` | `string` | `'off'` | |

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

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-input-bg` | `var(--ml-color-input-bg)` | Input background |
| `--ml-input-color` | `var(--ml-color-text)` | Text color |
| `--ml-input-border-color` | `var(--ml-color-border-strong)` | Border color |
| `--ml-input-border-radius` | `var(--ml-radius)` | Border radius |
| `--ml-input-focus-border-color` | `var(--ml-color-primary)` | Focus border color |
| `--ml-input-focus-shadow` | `var(--ml-shadow-focus-ring)` | Focus ring shadow |
| `--ml-input-label-color` | `var(--ml-color-text-secondary)` | Label text color |
| `--ml-input-placeholder-color` | `var(--ml-color-text-muted)` | Placeholder color |

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
| `size` | `size` | `Size` | `'md'` |
| `rows` | `rows` | `number` | `3` |
| `maxLength` | `max-length` | `number` | `0` (no limit; >0 shows counter) |
| `disabled` | `disabled` | `boolean` | `false` |
| `readonly` | `readonly` | `boolean` | `false` |
| `required` | `required` | `boolean` | `false` |
| `resize` | `resize` | `boolean` | `false` |

#### Events

`ml:input`, `ml:change`, `ml:focus`, `ml:blur` — same as `ml-input`.

#### Usage

```html
<ml-textarea label="Bio" rows="5" max-length="500" resize></ml-textarea>
```

---

### ml-checkbox

**Selector:** `ml-checkbox` · **Import:** `import '@melodicdev/components/checkbox'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `label` | `label` | `string` | `''` |
| `hint` | `hint` | `string` | `''` |
| `size` | `size` | `Size` | `'md'` |
| `checked` | `checked` | `boolean` | `false` |
| `indeterminate` | `indeterminate` | `boolean` | `false` |
| `disabled` | `disabled` | `boolean` | `false` |

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

---

### ml-radio

**Selector:** `ml-radio` · **Import:** `import '@melodicdev/components/radio'`

#### Props / Attributes

`name`, `value`, `label`, `hint`, `size`, `checked`, `disabled`

**Sizes:** `sm` = 1rem circle, `md` = 1.25rem, `lg` = 1.5rem

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string, checked: true }` |

### ml-radio-group

**Selector:** `ml-radio-group`

#### Props / Attributes

`label`, `name`, `value`, `hint`, `error`, `orientation` (`'vertical'` | `'horizontal'`), `disabled`, `required`

**Slots:** (default) — `ml-radio` children

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

`value`, `label`, `hint`, `error`, `orientation` (`'vertical'` | `'horizontal'`), `disabled`, `required`

**Slots:** (default) — `ml-radio-card` children

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string }` |

### ml-radio-card

Props: `value`, `label`, `description`, `detail`, `icon`, `selected` (managed), `disabled`

**Slots:** (default) — Additional content below label/description

#### Usage

```html
<ml-radio-card-group value="basic" label="Select a plan" orientation="horizontal">
  <ml-radio-card value="basic" label="Basic" description="Up to 5 users" detail="$10/mo" icon="user"></ml-radio-card>
  <ml-radio-card value="pro" label="Business" description="Up to 50 users" detail="$25/mo" icon="buildings"></ml-radio-card>
</ml-radio-card-group>
```

---

### ml-toggle

**Selector:** `ml-toggle` · **Import:** `import '@melodicdev/components/toggle'`

#### Props / Attributes

`label`, `hint`, `size` (`'sm'` | `'md'` | `'lg'`), `checked`, `disabled`

**Sizes:** `sm` = 2.25rem x 1.25rem, `md` = 2.75rem x 1.5rem, `lg` = 3rem x 1.75rem

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ checked: boolean }` |

#### Usage

```html
<ml-toggle label="Enable notifications" checked></ml-toggle>
```

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
| `size` | `size` | `Size` | `'md'` |
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

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value, option }` (single) or `{ values, options }` (multi) |
| `ml:open` | none |
| `ml:close` | none |

#### Keyboard

Enter/Space (open/select), Escape (close), ArrowDown/Up (navigate), Home/End, Tab (close)

#### Usage

```html
<ml-select label="Country" .options=${[
  { value: 'us', label: 'United States', icon: 'flag' },
  { value: 'ca', label: 'Canada' }
]}></ml-select>
```

---

### ml-autocomplete

**Selector:** `ml-autocomplete` · **Import:** `import '@melodicdev/components/autocomplete'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `label` | `label` | `string` | `''` |
| `placeholder` | `placeholder` | `string` | `'Search'` |
| `hint`, `error`, `size`, `disabled`, `required`, `multiple` | — | — | — |
| `value` | `value` | `string` | `''` |
| `values` | (property) | `string[]` | `[]` |
| `options` | (property) | `AutocompleteOption[]` | `[]` |
| `searchFn` | (property) | `(query: string) => Promise<AutocompleteOption[]>` | `null` |
| `debounce` | (property) | `number` | `300` |
| `minChars` | (property) | `number` | `0` |
| `showIcon` | (property) | `boolean` | `true` |

```typescript
interface AutocompleteOption {
  value: string;
  label: string;
  subtitle?: string;
  avatarUrl?: string;
  icon?: string;
  disabled?: boolean;
}
```

#### Events

`ml:change`, `ml:search` (`{ query }`), `ml:open`, `ml:close`

#### Usage

```html
<ml-autocomplete label="Search users"
  .searchFn=${async (q) => fetch(`/api/search?q=${q}`).then(r => r.json())}
  .debounce=${300} .minChars=${2}
></ml-autocomplete>
```

---

### ml-slider

**Selector:** `ml-slider` · **Import:** `import '@melodicdev/components/slider'`

#### Props / Attributes

`label`, `value` (number, default 50), `min` (0), `max` (100), `step` (1), `size`, `disabled`, `showValue` (`show-value`), `hint`, `error`

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

---

### ml-date-picker

**Selector:** `ml-date-picker` · **Import:** `import '@melodicdev/components/date-picker'`

#### Props / Attributes

`value` (ISO `YYYY-MM-DD`), `placeholder` (`'Select date'`), `label`, `hint`, `error`, `size` (`'sm'`|`'md'`|`'lg'`), `disabled`, `required`, `min`, `max`

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string }` (ISO date) |

#### Usage

```html
<ml-date-picker label="Start date" value="2026-02-08" min="2026-01-01" max="2026-12-31"></ml-date-picker>
```

---

### ml-time-picker

**Selector:** `ml-time-picker` · **Import:** `import '@melodicdev/components/time-picker'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `value` | `value` | `string` | `''` (`HH:mm` or `HH:mm:ss`) |
| `placeholder` | `placeholder` | `string` | `'Select time'` |
| `label` | `label` | `string` | `''` |
| `hint`, `error` | — | `string` | `''` |
| `size` | `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` |
| `disabled`, `required` | — | `boolean` | `false` |
| `min` | `min` | `string` | `''` (`HH:mm`) |
| `max` | `max` | `string` | `''` (`HH:mm`) |
| `step` | `step` | `number` | `15` (set to 1 for seconds) |
| `twelveHour` | `twelve-hour` | `boolean` | `true` |

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string }` (`HH:mm` or `HH:mm:ss`) |

#### Usage

```html
<ml-time-picker label="Start time" value="09:30"></ml-time-picker>
<ml-time-picker label="Precise" step="1" twelve-hour="false"></ml-time-picker>
```

---

### ml-date-time-picker

**Selector:** `ml-date-time-picker` · **Import:** `import '@melodicdev/components/date-time-picker'`

Composes `ml-date-picker` + `ml-time-picker` side-by-side.

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `value` | `value` | `string` | `''` (ISO `YYYY-MM-DDTHH:mm`) |
| `placeholder` | `placeholder` | `string` | `'Select date and time'` |
| `label`, `hint`, `error` | — | `string` | `''` |
| `size` | `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` |
| `disabled`, `required` | — | `boolean` | `false` |
| `minDate` | `min-date` | `string` | `''` |
| `maxDate` | `max-date` | `string` | `''` |
| `minTime` | `min-time` | `string` | `''` |
| `maxTime` | `max-time` | `string` | `''` |
| `step` | `step` | `number` | `15` |
| `twelveHour` | `twelve-hour` | `boolean` | `true` |

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string, date: string, time: string }` |

#### Usage

```html
<ml-date-time-picker label="Event start" value="2026-02-08T09:30"></ml-date-time-picker>
```

---

### ml-form-field

**Selector:** `ml-form-field` · **Import:** `import '@melodicdev/components/form-field'`

Wrapper that connects labels, hints, errors, and ARIA attributes to any slotted form control.

#### Props / Attributes

`label`, `hint`, `error`, `size`, `orientation` (`'vertical'` | `'horizontal'`), `disabled`, `required`

#### Slots

(default) — The form control (native `<input>` or `ml-*` component)

#### Behavior

- Auto-sets `id`, `aria-describedby`, `aria-invalid`, `aria-required` on slotted controls
- Styles native slotted inputs with proper token-based focus rings, error states, size variants

#### Usage

```html
<ml-form-field label="Username" hint="Choose a unique username" required>
  <input type="text" />
</ml-form-field>
```

---

### ml-file-upload

**Selector:** `ml-file-upload` · **Import:** `import '@melodicdev/components/file-upload'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `accept` | `accept` | `string` | `''` (e.g. `.pdf,.docx,image/*`) |
| `multiple` | `multiple` | `boolean` | `false` |
| `maxSize` | `max-size` | `number` | `0` (bytes, 0=no limit) |
| `maxFiles` | `max-files` | `number` | `0` |
| `disabled` | `disabled` | `boolean` | `false` |
| `label` | `label` | `string` | `'Click to upload'` |
| `sublabel` | `sublabel` | `string` | `'or drag and drop'` |
| `hint`, `error` | — | `string` | `''` |
| `icon` | `icon` | `string` | `'cloud-arrow-up'` |

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ files: File[] }` |
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

---

### ml-file-upload-item

**Selector:** `ml-file-upload-item`

#### Props / Attributes

`name`, `size` (display string), `status` (`'idle'` | `'uploading'` | `'complete'` | `'error'`), `progress` (0–100), `error`, `file` (File | null)

#### Events

| Event | Detail |
|-------|--------|
| `ml:remove` | `{ name, file }` |
| `ml:retry` | `{ name, file }` |

---

### ml-file-icon

**Selector:** `ml-file-icon`

#### Props / Attributes

`extension`, `color` (`'red'` | `'green'` | `'blue'` | `'purple'` | `'amber'` | `'gray'`), `size`

Auto-color mapping: `pdf/html/xml` → red, `doc/docx/css/ts/mp4` → blue, `xls/xlsx/csv/jpg/png` → green, `ppt/zip/js/json` → amber, `mp3/wav` → purple, others → gray

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
- **elevated** — muted border + `--ml-shadow-md`
- **filled** — `--ml-color-surface-raised` background, no shadow

#### Slots

`header`, (default), `footer`

#### Events

| Event | Detail | Condition |
|-------|--------|-----------|
| `ml:click` | `{ originalEvent: MouseEvent }` | Only when `clickable` |

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-card-bg` | `var(--ml-color-surface)` | Card background |
| `--ml-card-border-color` | `var(--ml-color-border)` | Border color |
| `--ml-card-border-radius` | `var(--ml-radius-lg)` | Border radius |
| `--ml-card-shadow` | `none` | Box shadow |
| `--ml-card-body-padding` | `var(--ml-space-5)` | Body padding |
| `--ml-card-hover-shadow` | `var(--ml-shadow-md)` | Hover shadow (when hoverable) |
| `--ml-card-footer-bg` | `transparent` | Footer background |

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

---

### ml-container

**Selector:** `ml-container` · **Import:** `import '@melodicdev/components/container'`

#### Props

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `size` | `size` | `ContainerSize` | `'lg'` | `'sm'` (640px), `'md'` (768px), `'lg'` (1024px), `'xl'` (1280px), `'full'` (100%) |
| `padding` | `padding` | `string` | `'4'` | Spacing scale |
| `centered` | `centered` | `boolean` | `true` | |

---

## Feedback Components

### ml-spinner

**Selector:** `ml-spinner` · **Import:** `import '@melodicdev/components/spinner'`

#### Props

`size` (`'xs'`=16px, `'sm'`=20px, `'md'`=24px, `'lg'`=32px, `'xl'`=40px), `label` (`'Loading'`)

Uses `currentColor` for stroke. ARIA: `role="status"`, `aria-label`.

---

### ml-alert

**Selector:** `ml-alert` · **Import:** `import '@melodicdev/components/alert'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `variant` | `variant` | `AlertVariant` | `'info'` | `'info'`, `'success'`, `'warning'`, `'error'` |
| `title` | `title` | `string` | `''` | |
| `dismissible` | `dismissible` | `boolean` | `false` | |

**Default icons:** info → `info`, success → `check-circle`, warning → `warning`, error → `x-circle`

#### Slots

`icon` (custom icon override), (default) — message body

#### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `ml:dismiss` | none | Sets `hidden` attribute on self |

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
| `labelPosition` | `label-position` | `ProgressLabelPosition` | `'top'` | `'top'`, `'right'`, `'bottom'`, `'floating-top'`, `'floating-bottom'`, `'none'` |

**Linear heights:** sm=4px, md=8px, lg=12px

#### Usage

```html
<ml-progress value="72" shape="circle" show-value label="Score" size="lg"></ml-progress>
```

---

### ml-toast

**Selector:** `ml-toast` · **Import:** `import '@melodicdev/components/toast'`

#### Props

`variant` (`'info'`|`'success'`|`'warning'`|`'error'`), `title`, `message`, `duration` (ms, default 5000, 0=no auto-dismiss), `dismissible` (default true)

#### Events

| Event | Detail |
|-------|--------|
| `ml:dismiss` | none (also removes element from DOM) |

### ToastService

`@Injectable()` singleton. Import: `import { ToastService } from '@melodicdev/components/toast'`

| Method | Signature |
|--------|-----------|
| `show` | `(config: IToastConfig) => void` |
| `info` | `(title, message?) => void` |
| `success` | `(title, message?) => void` |
| `warning` | `(title, message?) => void` |
| `error` | `(title, message?) => void` |
| `setPosition` | `(position: ToastPosition) => void` |

`ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'`

---

## Data Display Components

### ml-avatar

**Selector:** `ml-avatar` · **Import:** `import '@melodicdev/components/avatar'`

#### Props

`src`, `alt`, `initials` (truncated to 2 uppercase), `size` (`'xs'`=24px, `'sm'`=32px, `'md'`=40px, `'lg'`=48px, `'xl'`=64px), `rounded` (rounded square vs circle)

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

---

### ml-badge

**Selector:** `ml-badge` · **Import:** `import '@melodicdev/components/badge'`

#### Props

`variant` (`'default'`|`'primary'`|`'secondary'`|`'success'`|`'warning'`|`'error'`), `size` (`'sm'`|`'md'`|`'lg'`), `dot`, `pill`, `color` (`string`, `''` — custom background color, any CSS color; overrides variant)

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-badge-bg` | — | Custom background (set via `color` prop) |
| `--ml-badge-color` | `#fff` | Custom text color (used with `color` prop) |

---

### ml-badge-group

**Selector:** `ml-badge-group` · **Import:** `import '@melodicdev/components/badge-group'`

#### Props

`label`, `variant`, `theme` (`'pill'`|`'modern'`), `size`, `badgePosition` (`'leading'`|`'trailing'`), `icon`

---

### ml-tag

**Selector:** `ml-tag` · **Import:** `import '@melodicdev/components/tag'`

#### Props

`size`, `dot`, `dot-color` (`'success'`|`'warning'`|`'danger'`|`'info'`|`'primary'`|`'secondary'`), `closable`, `avatar-src`, `icon`, `count`, `checkable`, `checked`, `disabled`

#### Events

`ml:close` (`{}`), `ml:change` (`{ checked: boolean }`)

---

### ml-list

**Selector:** `ml-list` · **Import:** `import '@melodicdev/components/list'`

#### Props

`variant` (`'default'`|`'plain'`), `size` (`'sm'`|`'md'`|`'lg'`)

### ml-list-item

**Props:** `primary`, `secondary`, `disabled`, `interactive`

**Slots:** `leading`, (default), `trailing`

---

### ml-activity-feed

**Selector:** `ml-activity-feed` · **Import:** `import '@melodicdev/components/activity-feed'`

#### Props

`variant` (`'list'`|`'timeline'`)

### ml-activity-feed-item

**Props:** `name`, `timestamp`, `avatar-src`, `avatar-initials`, `avatar-size`, `subtitle`, `indicator`, `indicator-color` (`string` — preset name or any CSS color value)

**Slots:** (default), `avatar`, `content`

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
| `columns` | (property) | `TableColumn[]` | `[]` |
| `rows` | (property) | `Record<string, unknown>[]` | `[]` |

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

#### Events

| Event | Detail |
|-------|--------|
| `ml:sort` | `{ key, direction }` |
| `ml:select` | `{ selectedRows: number[], allSelected }` |
| `ml:row-click` | `{ row, index }` |

**Virtual scroll row heights:** sm=36px, md=44px. Parent must have defined height.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-table-bg` | `var(--ml-color-surface)` | Table background |
| `--ml-table-border-color` | `var(--ml-color-border)` | Border color |
| `--ml-table-radius` | `var(--ml-radius-lg)` | Border radius |
| `--ml-table-header-bg` | `var(--ml-color-surface-sunken)` | Column header background |
| `--ml-table-header-color` | `var(--ml-color-text-muted)` | Column header text color |
| `--ml-table-row-hover-bg` | `var(--ml-color-surface-sunken)` | Row hover background |
| `--ml-table-cell-color` | `var(--ml-color-text)` | Cell text color |
| `--ml-table-sort-active-color` | `var(--ml-color-primary)` | Active sort icon color |

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
| `virtual` | `virtual` | `boolean` | `true` |
| `showFilterRow` | `show-filter-row` | `boolean` | `false` |
| `columns` | (property) | `DataGridColumn[]` | `[]` |
| `rows` | (property) | `Record<string, unknown>[]` | `[]` |

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
  render?: (value, row, index) => unknown;
}
```

**Slots:** `toolbar-actions`

#### Events

| Event | Detail |
|-------|--------|
| `ml:sort` | `{ key, direction }` |
| `ml:filter` | `{ filters: Record<string, string> }` |
| `ml:select` | `{ selectedRows, allSelected }` |
| `ml:row-click` | `{ row, index }` |
| `ml:column-resize` | `{ key, width }` |
| `ml:column-reorder` | `{ order: string[] }` |
| `ml:page-change` | `{ page, pageSize }` |

Features: column resizing (drag), column reordering (drag-and-drop), pinned columns, client-side filter→sort→paginate pipeline (disabled when `server-side`).

---

### ml-calendar-view

**Selector:** `ml-calendar-view` · **Import:** `import '@melodicdev/components/calendar-view'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `view` | `view` | `CalendarViewMode` | `'month'` (`'month'`\|`'week'`\|`'day'`) |
| `date` | `date` | `string` | today (ISO) |
| `weekStartsOn` | `week-starts-on` | `number` | `0` (Sunday) |
| `maxVisibleEvents` | `max-visible-events` | `number` | `3` |
| `addButtonText` | `add-button-text` | `string` | `'Add event'` |
| `hideNav`, `hideTodayButton`, `hideViewSelector`, `hideAddButton` | — | `boolean` | `false` |
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

**Slots:** `header-left`, `header-actions`

#### Events

| Event | Detail |
|-------|--------|
| `ml:view-change` | `{ view }` |
| `ml:date-change` | `{ date }` |
| `ml:event-click` | `{ event }` |
| `ml:date-click` | `{ date }` |
| `ml:add-event` | `{ date? }` |

---

### ml-stat-card

Dashboard metric card with label, value, optional trend indicator, and icon.

```typescript
import '@melodicdev/components/stat-card';
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | `string` | `''` | Metric label (displayed uppercase) |
| `value` | `string \| number` | `''` | Display value |
| `trend` | `string` | `''` | Trend text (e.g. "+6 this month") |
| `trend-direction` | `'up' \| 'down' \| 'neutral'` | `'neutral'` | Trend direction for color styling |
| `icon` | `string` | `''` | Phosphor icon name |
| `icon-color` | `string` | `''` | CSS color for the icon container |
| `value-font` | `'serif' \| 'sans'` | `'serif'` | Value font family |

**Key CSS Custom Properties:**

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-stat-card-bg` | `var(--ml-color-surface)` | Card background |
| `--ml-stat-card-border-color` | `var(--ml-color-border)` | Border color |
| `--ml-stat-card-radius` | `var(--ml-radius-lg)` | Border radius |
| `--ml-stat-card-icon-bg` | `var(--ml-color-surface-raised)` | Icon container background |
| `--ml-stat-card-icon-color` | `var(--ml-color-text-tertiary)` | Icon color |
| `--ml-stat-card-value-font` | `'Cormorant Garamond', serif` | Value font family |
| `--ml-stat-card-value-size` | `2.5rem` | Value font size |
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

Identity card for person/entity detail pages with banner, avatar, and slotted sections.

```typescript
import '@melodicdev/components/profile-card';
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | `''` | Person name |
| `subtitle` | `string` | `''` | Subtitle text (e.g. "Member · Choir") |
| `avatar` | `string` | `''` | Avatar image URL (falls back to initials) |
| `avatar-size` | `Size` | `'lg'` | Avatar size |

**Slots:**

| Slot | Description |
|------|-------------|
| `actions` | Action buttons (slotted directly, centered with gap) |
| `details` | Contact info rows (each slotted element gets flex + gap) |
| `tags` | Tags/badges (flex-wrap layout) |
| `meta` | Detail fields (vertical stack) |

**Key CSS Custom Properties:**

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-profile-card-bg` | `var(--ml-color-surface)` | Card background |
| `--ml-profile-card-banner-from` | `var(--ml-color-primary)` | Banner gradient start |
| `--ml-profile-card-banner-to` | `var(--ml-color-primary-hover)` | Banner gradient end |
| `--ml-profile-card-banner-height` | `80px` | Banner height |
| `--ml-profile-card-banner-opacity` | `0.85` | Banner opacity |
| `--ml-profile-card-name-font` | `'Cormorant Garamond', serif` | Name font family |
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
| `value` | `value` | `string` | `''` | Active tab value |
| `variant` | `variant` | `TabsVariant` | `'line'` | `'line'`, `'enclosed'`, `'pills'` |
| `size` | `size` | `Size` | `'md'` | `'sm'`, `'md'`, `'lg'` |
| `orientation` | `orientation` | `TabsOrientation` | `'horizontal'` | `'horizontal'`, `'vertical'` |
| `routed` | `routed` | `boolean` | `false` | |
| `tabs` | (property) | `TabConfig[]` | `[]` | `{ value, label, icon?, disabled?, href? }` |

**Slots:** `tab` (ml-tab elements), (default) (ml-tab-panel elements)

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value: string }` |

**Keyboard:** ArrowLeft/Right/Up/Down, Home, End

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-tabs-tab-color` | `var(--ml-color-text-secondary)` | Inactive tab text color |
| `--ml-tabs-tab-active-color` | `var(--ml-color-primary)` | Active tab text color |
| `--ml-tabs-tab-hover-color` | `var(--ml-color-text)` | Hover tab text color |
| `--ml-tabs-line-indicator-color` | `var(--ml-color-primary)` | Line variant indicator color |
| `--ml-tabs-pills-active-bg` | `var(--ml-color-primary-subtle)` | Pills variant active background |
| `--ml-tabs-pills-active-color` | `var(--ml-color-primary)` | Pills variant active text color |
| `--ml-tabs-enclosed-active-bg` | `var(--ml-color-surface)` | Enclosed variant active background |
| `--ml-tabs-list-border-color` | `var(--ml-color-border)` | Tab list border color |

### ml-tab

Props: `value`, `label`, `icon`, `disabled`, `active` (managed), `href`

### ml-tab-panel

Props: `value`

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

### ml-breadcrumb-item

Props: `href`, `icon`, `current` (renders `aria-current="page"`), `separator` (inherited)

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

`page` (1), `totalPages` (`total-pages`, 1), `siblings` (1)

#### Events

| Event | Detail |
|-------|--------|
| `ml:page-change` | `{ page: number }` |

**Methods:** `goToPage(n)`, `previous()`, `next()`

---

### ml-sidebar

**Selector:** `ml-sidebar` · **Import:** `import '@melodicdev/components/sidebar'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `variant` | `variant` | `SidebarVariant` | `'default'` | `'default'`, `'slim'` |
| `active` | `active` | `string` | `''` | |
| `navigation` | (property) | `SidebarNavGroup[]` | `[]` | |
| `footerNavigation` | (property) | `SidebarNavItem[]` | `[]` | |

```typescript
interface SidebarNavGroup { label?: string; items: SidebarNavItem[] }
interface SidebarNavItem {
  value: string; label: string; icon?: string; href?: string;
  badge?: string; badgeColor?: 'default'|'primary'|'success'|'warning'|'error';
  external?: boolean; disabled?: boolean; children?: SidebarNavItem[];
}
```

**Slots:** `header`, `search`, (default), `footer-nav`, `feature`, `user`

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value }` |
| `ml:item-click` | `{ value, href? }` |

**Slim variant:** 64px collapsed → 280px on hover with shadow.

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-sidebar-width` | `280px` | Sidebar width |
| `--ml-sidebar-bg` | `var(--ml-color-surface)` | Sidebar background |
| `--ml-sidebar-border-color` | `var(--ml-color-border)` | Border color |
| `--ml-sidebar-item-color` | `var(--ml-color-text-secondary)` | Item text color |
| `--ml-sidebar-item-hover-bg` | `var(--ml-gray-100)` | Item hover background |
| `--ml-sidebar-item-active-bg` | `var(--ml-color-primary)` | Active item background |
| `--ml-sidebar-item-active-color` | `var(--ml-color-text-inverse)` | Active item text color |
| `--ml-sidebar-group-label-color` | `var(--ml-color-text-muted)` | Group label text color |

### ml-sidebar-group

Props: `label`, `collapsed` (managed)

### ml-sidebar-item

Props: `icon`, `label`, `value`, `href`, `active` (managed), `disabled`, `badge`, `badge-color`, `external`, `expanded`, `collapsed` (managed), `level`, `icon-format` (`'fill'`|`'thin'`|`'light'`|`'regular'`|`'bold'`, default `''` — icon format passed through to ml-icon)

**Slots:** `leading`, `trailing`, (default) — sub-items for expandable menus

---

### ml-steps

**Selector:** `ml-steps` · **Import:** `import '@melodicdev/components/steps'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `active` | `active` | `string` | `''` | |
| `variant` | `variant` | `StepsVariant` | `'numbered'` | `'numbered'`, `'circles'`, `'icons'`, `'bar'` |
| `orientation` | `orientation` | `StepsOrientation` | `'horizontal'` | `'horizontal'`, `'vertical'` |
| `connector` | `connector` | `StepsConnector` | `'solid'` | `'solid'`, `'dotted'` |
| `color` | `color` | `StepsColor` | `'primary'` | `'primary'`, `'success'` |
| `compact` | `compact` | `boolean` | `false` | Dots + "Step X of Y" |
| `routed` | `routed` | `boolean` | `false` | |
| `steps` | (property) | `StepConfig[]` | `[]` | `{ value, label, description?, icon?, disabled?, href? }` |

**Slots:** `step`, (default)

#### Events

| Event | Detail |
|-------|--------|
| `ml:change` | `{ value }` |

### ml-step

Props: `value`, `label`, `description`, `icon`, `href`, `disabled`, `status` (managed: `'completed'`|`'current'`|`'upcoming'`)

### ml-step-panel

Props: `value`

---

## Overlay Components

### ml-dialog

**Selector:** `ml-dialog` · **Import:** `import '@melodicdev/components/dialog'`

No public attributes. Configured via `DialogService`.

#### Slots

`dialog-header`, (default), `dialog-footer`

#### DialogService API

```typescript
import { DialogService } from '@melodicdev/components/dialog';

// Open by component class
const ref = dialogService.open(MyDialogComponent, {
  data: { message: 'Confirm?' },
  size: 'sm',           // 'sm'(400) | 'md'(500) | 'lg'(640) | 'xl'(800) | 'full'
  disableClose: true,
  panelClass: 'my-class',
  width: '700px'        // overrides size
});

ref.afterClosed((result) => { /* ... */ });

// Open by ID
dialogService.open('#confirmDialog');
```

#### Key CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-dialog-bg` | `var(--ml-color-surface)` | Dialog background |
| `--ml-dialog-radius` | `var(--ml-radius-xl)` | Border radius |
| `--ml-dialog-shadow` | `var(--ml-shadow-xl)` | Box shadow |
| `--ml-dialog-backdrop-color` | `rgba(0, 0, 0, 0.5)` | Backdrop overlay color |
| `--ml-dialog-max-width` | `500px` | Default max width |
| `--ml-dialog-header-padding` | `var(--ml-space-6)` | Header padding |
| `--ml-dialog-body-padding` | `var(--ml-space-6)` | Body padding |
| `--ml-dialog-footer-border-color` | `var(--ml-color-border)` | Footer top border color |

---

### ml-drawer

**Selector:** `ml-drawer` · **Import:** `import '@melodicdev/components/drawer'`

#### Props

`side` (`'left'`|`'right'`, default `'right'`), `size` (`'sm'`=320|`'md'`=480|`'lg'`=640|`'xl'`=800), `showClose` (`show-close`, default true)

**Slots:** `drawer-header`, (default), `drawer-footer`

**Methods:** `open()`, `close()`

#### Events

`ml:open`, `ml:close`

---

### ml-popover

**Selector:** `ml-popover` · **Import:** `import '@melodicdev/components/popover'`

#### Props

`placement` (Placement, default `'bottom'`), `offset` (number, 8), `manual` (boolean), `arrow` (boolean)

**Slots:** `trigger`, (default)

**Methods:** `open()`, `close()`, `toggle()`

Uses Popover API (`popover="auto"` or `"manual"`) + `computePosition`/`autoUpdate`.

---

### ml-dropdown

**Selector:** `ml-dropdown` · **Import:** `import '@melodicdev/components/dropdown'`

#### Props

`placement` (default `'bottom-start'`), `offset` (4), `arrow`

**Slots:** `trigger`, (default) — items/groups/separators

#### Events

| Event | Detail |
|-------|--------|
| `ml:select` | `{ value }` |
| `ml:open` | none |
| `ml:close` | none |

**Keyboard:** ArrowDown/Up, Enter/Space, Escape, Home/End, Tab

### ml-dropdown-item

Props: `value`, `icon`, `addon` (shortcut text), `disabled`, `destructive`

### ml-dropdown-group

Props: `label`

### ml-dropdown-separator

No props.

---

### ml-tooltip

**Selector:** `ml-tooltip` · **Import:** `import '@melodicdev/components/tooltip'`

#### Props

`content` (string), `placement` (default `'top'`), `delay` (ms, default 200)

**Slots:** (default) — trigger element

Shows on hover + focus. `max-width: 320px`, `z-index: 9999`.

---

## Section Components

### ml-app-shell

**Selector:** `ml-app-shell` · **Import:** `import '@melodicdev/components/app-shell'`

#### Props / Attributes

| Property | Attribute | Type | Default |
|----------|-----------|------|---------|
| `sidebar-position` | `sidebar-position` | `'left'` \| `'right'` | `'left'` |
| `sidebar-collapsed` | `sidebar-collapsed` | `boolean` | `false` |
| `header-fixed` | `header-fixed` | `boolean` | `false` |

**Slots:** `sidebar`, `header`, (default)

**Responsive:** < 768px: sidebar becomes off-screen drawer with hamburger menu.

**CSS:** `--ml-sidebar-width` (default 280px)

---

### ml-page-header

**Selector:** `ml-page-header` · **Import:** `import '@melodicdev/components/page-header'`

#### Props

`title`, `description`, `variant` (`'default'`|`'compact'`|`'centered'`), `divider` (boolean, default true)

**Slots:** `breadcrumb`, `title`, `description`, `actions`, `tabs`, `meta`

**Responsive:** <= 640px: stacks vertically, actions stretch full width.

---

### ml-hero-section

**Selector:** `ml-hero-section` · **Import:** `import '@melodicdev/components/hero-section'`

#### Props / Attributes

| Property | Attribute | Type | Default | Values |
|----------|-----------|------|---------|--------|
| `variant` | `variant` | `HeroVariant` | `'centered'` | `'centered'`, `'split'`, `'split-reverse'` |
| `size` | `size` | `HeroSize` | `'lg'` | `'sm'`, `'md'`, `'lg'` |
| `background` | `background` | `HeroBackground` | `'none'` | `'none'`, `'subtle'`, `'gradient'` |
| `title` | `title` | `string` | `''` | |
| `description` | `description` | `string` | `''` | |

**Slots:** `eyebrow`, `title`, `description`, `actions`, `media`, `social-proof`

**Title sizes:** sm=`text-3xl`, md=`text-4xl`, lg=`text-5xl`

---

### ml-page-section

Titled content section with consistent heading typography and optional action link.

```typescript
import '@melodicdev/components/page-section';
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `title` | `string` | `''` | Section title (rendered in serif font) |
| `subtitle` | `string` | `''` | Subtitle text |
| `action-label` | `string` | `''` | Action link text |
| `action-href` | `string` | `''` | Action link URL |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Content area padding |

**Slots:**

| Slot | Description |
|------|-------------|
| `default` | Section content |
| `action` | Override for complex action content (replaces action-label link) |

**Key CSS Custom Properties:**

| Property | Default | Description |
|----------|---------|-------------|
| `--ml-page-section-title-font` | `'Cormorant Garamond', serif` | Title font family |
| `--ml-page-section-title-size` | `var(--ml-text-2xl)` | Title font size |
| `--ml-page-section-title-color` | `var(--ml-color-text)` | Title color |
| `--ml-page-section-action-color` | `var(--ml-color-primary)` | Action link color |
| `--ml-page-section-gap` | `var(--ml-space-4)` | Gap between header and content |

**Example:**

```html
<ml-page-section title="Recent Activity" subtitle="Last 7 days" action-label="View All" action-href="/activity">
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
| `icon` | `icon` | `string` | `''` | Phosphor icon ligature name (e.g. `'house'`, `'gear'`) |
| `format` | `format` | `string` | `'regular'` | `'bold'`, `'fill'`, `'light'`, `'regular'`, `'thin'` |
| `size` | `size` | (attribute) | — | `'xs'`=12px, `'sm'`=16px, `'md'`=24px, `'lg'`=32px, `'xl'`=48px |

**CSS Custom Properties:**
- `--ml-icon-color` — override icon color (default: `currentColor`)
- `--ml-icon-size` — override icon size

Requires Phosphor Icons font loaded in the page.

---

## Page Components

### ml-login-page

**Selector:** `ml-login-page` · **Import:** `import '@melodicdev/components/login-page'`

#### Props

`variant` (`'centered'`|`'split'`), `title` (`'Log in to your account'`), `description` (`'Welcome back! Please enter your details.'`)

**Slots:** `logo`, `header`, `form`, `footer`, `social`, `brand` (split only)

**Centered:** Full-page centered card (max-width 440px). **Split:** Two-column; brand side hides < 768px.

---

### ml-signup-page

**Selector:** `ml-signup-page` · **Import:** `import '@melodicdev/components/signup-page'`

#### Props

`variant` (`'centered'`|`'split'`), `title` (`'Create an account'`), `description` (`'Start your journey today.'`)

**Slots:** `logo`, `header`, `form`, `footer`, `social`, `brand` (split only)

Same layout as `ml-login-page`; shares `auth-layout.styles.ts`.

---

### ml-dashboard-page

**Selector:** `ml-dashboard-page` · **Import:** `import '@melodicdev/components/dashboard-page'`

#### Props

`title`, `description`, `layout` (`'default'`|`'wide'`|`'full'`)

**Slots:** `sidebar`, `header-actions`, `metrics`, `main`, `aside` (default layout only)

**Layouts:** `default` = `2fr 1fr` (collapses < 1024px), `wide`/`full` = single column.

Composes `ml-app-shell` + `ml-page-header` internally.

---

## Token Count Summary

| Category | Count |
|----------|-------|
| Primitive colors (7 ramps × 12 + white/black) | 86 |
| Semantic color tokens | 60 |
| Spacing tokens | 35 |
| Typography tokens | 34 |
| Shadow tokens | 20 |
| Border tokens | 17 |
| Transition tokens | 15 |
| Breakpoint tokens | 6 |
| **Total design tokens** | **273** |

| Category | Component Count |
|----------|----------------|
| Form components | 18 |
| Foundation components | 4 |
| Feedback components | 5 (incl. ToastService) |
| Data display components | 11 |
| Navigation components | 12 |
| Overlay components | 8 (incl. DialogService) |
| Section components | 3 |
| General components | 1 |
| Page components | 3 |
| **Total components** | **65** |
