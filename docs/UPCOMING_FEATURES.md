# Upcoming Features

This document outlines planned features to make Melodic a more full-featured framework.

## Implemented

### Router

The router has been ported and enhanced. See [ROUTING.md](./ROUTING.md) for full documentation.

**Implemented features:**
- `RouteMatcher` class - parameterized routes (`:id`, `*wildcard`), validation rules
- `RouterService` - intercepts history API, dispatches navigation events, `navigate()` and `replace()` methods
- `RouterOutletComponent` - listens for navigation, renders matched component
- `RouterLinkComponent` - declarative navigation links
- Lazy loading via dynamic `import()` with `loadComponent` route property
- Browser back/forward button support (popstate)

**Still to add:**
- Child/nested routes (`children: []` in route config)
- Route guards (`canActivate`, `canDeactivate`)
- Route params accessible in routed components
- Query params handling
- Active link styling (`routerLinkActive` equivalent)
- Signals integration for reactive route state

---

## High Priority

### HTTP Client Enhancements

The HTTP client already supports:
- Fetch-based requests (GET, POST, PUT, PATCH, DELETE)
- Request/response interceptors
- Error handling (HttpError, NetworkError, AbortError)
- Cancellation via AbortSignal
- Progress tracking
- URL building with query params
- Automatic body/response parsing

Still needed:
- Retry logic (with configurable attempts, backoff)
- Response caching
- Automatic cancellation for repeated requests (cancel previous when new request to same endpoint is made)

### Forms

- Reactive forms with validation
- Form controls, groups, arrays
- Built-in validators (required, min, max, pattern, etc.)
- Custom validators
- Async validators
- Form state tracking (dirty, touched, valid)

## Medium Priority

### Formatters

Unlike Angular's pipe system, Melodic can use simple formatter functions directly in templates:

```typescript
import { formatCurrency, formatDate } from 'melodic';

html`<span>${formatCurrency(price, 'USD')}</span>`
html`<span>${formatDate(created, 'MM/dd/yyyy')}</span>`
```

Common formatters to implement:
- `formatDate()` - date/time formatting
- `formatCurrency()` - currency formatting with locale support
- `formatNumber()` - number formatting (decimals, separators)
- `uppercase()` / `lowercase()` / `titlecase()` - text transforms
- `truncate()` - shorten strings with ellipsis
- `pluralize()` - singular/plural based on count

Formatters should be memoized to avoid redundant computation during re-renders. Options:
1. Built-in memoization with LRU cache (simpler for users)
2. Provide a `memoize()` utility for user control (more flexible)

### Advanced Content Projection

Building on native Shadow DOM slots, add Angular-inspired features:

**Template as Input** - Pass template functions to components for custom rendering:
```typescript
<data-table
  .items=${users}
  .rowTemplate=${(user) => html`
    <td>${user.name}</td>
    <td>${user.email}</td>
  `}
></data-table>
```

**Query Projected Content** - Access slotted elements programmatically:
```typescript
@SlotContent('header') headerEl: HTMLElement;
@SlotChildren('items') itemEls: HTMLElement[];
```

**Slot Change Detection** - React when slotted content changes (using native `slotchange` event):
```typescript
onSlotChange(slotName: string, elements: Element[]) {
  console.log(`Slot "${slotName}" now has ${elements.length} elements`);
}
```

### Lifecycle Improvements

- `onChanges` with change detection info
- `afterViewInit` / `afterContentInit` equivalents

### Module System

Melodic supports lazy loading through native ES module dynamic imports. Since components self-register via the `@MelodicComponent` decorator, lazy loading is straightforward:

**Create a module file that imports components:**
```typescript
// features/dashboard/dashboard.module.ts
import './dashboard.component';
import './widgets/chart.component';
import './widgets/stats.component';

// Importing them registers the custom elements
```

**Dynamically import on demand:**
```typescript
// Load on button click
async loadDashboard() {
  await import('./features/dashboard/dashboard.module');
  // <dashboard-component>, <chart-widget>, etc. are now available
}

// Or with route-based lazy loading
async navigateToDashboard() {
  await import('./features/dashboard/dashboard.module');
  this.currentView = html`<dashboard-component></dashboard-component>`;
}
```

Vite automatically code-splits dynamic imports into separate chunks.

**Still needed:**
- Feature modules with provider scoping
- Shared modules for common dependencies
- Module-level guards and resolvers

## Lower Priority (Nice to Have)

### Animations

- Declarative animation API
- Enter/leave transitions
- State-based animations

### i18n

- Translation service
- Locale handling
- Pluralization

### Testing Utilities

- Component test harness
- Mock services
- Test bed setup

---

## Future Ideas & Suggestions

### Component Library (Untitled UI inspired)

A built-in component library with a clean, modern design inspired by [Untitled UI](https://www.untitledui.com/).

**Layout**
- `<app-shell>` - application wrapper with header/sidebar/content slots
- `<drawer>` / `<sidebar>` - collapsible side panel
- `<tabs>` / `<tab-panel>` - tabbed content
- `<accordion>` - collapsible sections
- `<modal>` / `<dialog>` - overlay dialogs
- `<toast>` / `<snackbar>` - notification messages

**Data Display**
- `<data-table>` - sortable, paginated tables
- `<pagination>` - page navigation
- `<infinite-scroll>` - load more on scroll
- `<virtual-list>` - virtualized list for large datasets

**Forms**
- `<form-field>` - wrapper with label, error display
- `<input-text>` / `<input-number>` / `<input-date>` - enhanced inputs
- `<select>` / `<multi-select>` - dropdown selection
- `<checkbox>` / `<radio>` / `<toggle>` - boolean inputs
- `<file-upload>` - drag-and-drop file input

**Feedback**
- `<spinner>` / `<loader>` - loading indicators
- `<skeleton>` - content placeholder while loading
- `<progress-bar>` - progress indication
- `<alert>` - inline messages (info, warning, error, success)

**Utility**
- `<icon>` - icon rendering (SVG sprite or icon font)
- `<tooltip>` - hover tooltips
- `<popover>` - click-triggered popups
- `<portal>` - render children outside DOM hierarchy
