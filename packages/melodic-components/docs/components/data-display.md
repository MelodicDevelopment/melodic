# Data Display Components

- [ml-avatar](#ml-avatar)
- [ml-badge](#ml-badge)
- [ml-badge-group](#ml-badge-group)
- [ml-tag](#ml-tag)
- [ml-list / ml-list-item](#ml-list--ml-list-item)
- [ml-activity-feed / ml-activity-feed-item](#ml-activity-feed--ml-activity-feed-item)
- [ml-table](#ml-table)
- [ml-data-grid](#ml-data-grid)
- [ml-calendar-view](#ml-calendar-view)

---

## ml-avatar

```ts
import '@melodicdev/components/avatar';
```

```html
<!-- Image -->
<ml-avatar src="https://example.com/photo.jpg" alt="Jane Doe" size="lg"></ml-avatar>

<!-- Initials fallback -->
<ml-avatar initials="JD" size="md"></ml-avatar>

<!-- Custom icon fallback -->
<ml-avatar rounded>
  <ml-icon icon="user"></ml-icon>
</ml-avatar>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string` | `''` | Image URL |
| `alt` | `string` | `''` | Alt text for the image |
| `initials` | `string` | `''` | Initials shown when no image (max 2 chars) |
| `size` | `'xs'` \| `'sm'` \| `'md'` \| `'lg'` \| `'xl'` | `'md'` | Avatar size |
| `rounded` | `boolean` | `false` | Rounded square instead of circle |

**Slots:** `default` (custom fallback content — used when no `src` or `initials`)

Fallback order: image → initials → slot content → generic user icon.

---

## ml-badge

```ts
import '@melodicdev/components/badge';
```

```html
<ml-badge variant="success">Active</ml-badge>
<ml-badge variant="error" dot>Errors</ml-badge>
<ml-badge variant="warning" pill size="sm">Pending</ml-badge>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default'` \| `'primary'` \| `'success'` \| `'warning'` \| `'error'` | `'default'` | Color variant |
| `size` | `'xs'` \| `'sm'` \| `'md'` \| `'lg'` | `'md'` | Badge size |
| `dot` | `boolean` | `false` | Show a colored dot to the left of the label |
| `pill` | `boolean` | `false` | Fully rounded shape |

**Slots:** `default` (label text)

---

## ml-badge-group

A compound element pairing a badge label with supporting text. Useful for announcement banners and release callouts.

```ts
import '@melodicdev/components/badge-group';
```

```html
<ml-badge-group label="New" variant="primary">
  We just released a new feature
</ml-badge-group>

<ml-badge-group label="v2.0" variant="success" icon="arrow-right" badge-position="trailing">
  Check out the latest updates
</ml-badge-group>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | `''` | Text inside the inner badge |
| `variant` | `'default'` \| `'primary'` \| `'success'` \| `'warning'` \| `'error'` | `'default'` | Badge color variant |
| `theme` | `'pill'` \| `'modern'` | `'pill'` | Overall shape style |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Size |
| `badge-position` | `'leading'` \| `'trailing'` | `'leading'` | Badge left or right of the message |
| `icon` | `string` | `''` | Optional trailing Phosphor icon |

**Slots:** `default` (the message text)

---

## ml-tag

Compact interactive labels. Supports avatars, icons, counts, close buttons, and checkbox states.

```ts
import '@melodicdev/components/tag';
```

```html
<!-- Basic -->
<ml-tag>Design</ml-tag>

<!-- With dot indicator -->
<ml-tag dot dot-color="success">Online</ml-tag>

<!-- With avatar -->
<ml-tag avatar-src="photo.jpg">Jane Doe</ml-tag>

<!-- Closable -->
<ml-tag closable @ml:close=${e => this.removeTag(tag)}>React</ml-tag>

<!-- With count -->
<ml-tag count="12">Comments</ml-tag>

<!-- Checkable (toggle state) -->
<ml-tag checkable .checked=${selected} @ml:change=${e => this.selected = e.detail.checked}>
  TypeScript
</ml-tag>
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `'xs'` \| `'sm'` \| `'md'` \| `'lg'` | `'md'` | Tag size |
| `dot` | `boolean` | `false` | Show colored dot |
| `dot-color` | `'success'` \| `'warning'` \| `'error'` \| `'primary'` \| `'gray'` | `'success'` | Dot color |
| `closable` | `boolean` | `false` | Show × close button |
| `avatar-src` | `string` | `''` | Avatar image URL |
| `icon` | `string` | `''` | Phosphor icon name |
| `count` | `string` | `''` | Count badge on the right |
| `checkable` | `boolean` | `false` | Renders as a checkbox toggle |
| `checked` | `boolean` | `false` | Checked state (checkable mode) |
| `disabled` | `boolean` | `false` | Disabled state |

**Slots:** `default` (label text)

**Events:**
- `ml:close` — fired when close button is clicked
- `ml:change` `{ checked: boolean }` — fired when checkbox state changes

---

## ml-list / ml-list-item

A styled list container for contacts, settings rows, or any structured item-based content.

```ts
import '@melodicdev/components/list';
```

```html
<ml-list>
  <ml-list-item
    primary="Phoenix Baker"
    secondary="Member since Feb 2025"
    interactive
    @click=${this.handleClick}
  >
    <ml-avatar slot="leading" initials="PB"></ml-avatar>
    <ml-badge slot="trailing" variant="success">Active</ml-badge>
  </ml-list-item>

  <ml-list-item primary="Olivia Rhye" secondary="olivia@example.com">
    <ml-avatar slot="leading" src="olivia.jpg" alt="Olivia"></ml-avatar>
  </ml-list-item>
</ml-list>
```

**ml-list:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'default'` \| `'plain'` | `'default'` | `default` adds borders between items; `plain` removes them |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Controls item padding |

**Slots:** `default` (list items)

**ml-list-item:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `primary` | `string` | `''` | Primary text |
| `secondary` | `string` | `''` | Secondary/subtitle text |
| `disabled` | `boolean` | `false` | Disabled appearance |
| `interactive` | `boolean` | `false` | Hover and focus states (use for clickable items) |

**Slots:** `leading` (left content — avatars, icons), `default` (overrides primary/secondary text), `trailing` (right content — badges, actions)

---

## ml-activity-feed / ml-activity-feed-item

Display a chronological stream of user activity.

```ts
import '@melodicdev/components/activity-feed';
```

```html
<!-- List layout (default) -->
<ml-activity-feed>
  <ml-activity-feed-item
    name="Jane Doe"
    timestamp="2 hours ago"
    avatar-initials="JD"
    subtitle="@janedoe"
    indicator
    indicator-color="success"
  >
    Updated the project status to <strong>In Review</strong>
    <div slot="content">
      <ml-badge variant="primary">v2.3.0</ml-badge>
    </div>
  </ml-activity-feed-item>

  <ml-activity-feed-item
    name="Alex Chen"
    timestamp="Yesterday"
    avatar-src="alex.jpg"
  >
    Pushed 3 commits to <code>main</code>
  </ml-activity-feed-item>
</ml-activity-feed>

<!-- Timeline layout -->
<ml-activity-feed variant="timeline">
  ...
</ml-activity-feed>
```

**ml-activity-feed:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'list'` \| `'timeline'` | `'list'` | `list` is a plain stack; `timeline` adds a vertical connector line |

**Slots:** `default` (activity items)

**ml-activity-feed-item:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | `''` | User display name |
| `timestamp` | `string` | `''` | Timestamp text (e.g. "2 hours ago") |
| `avatar-src` | `string` | `''` | Avatar image URL |
| `avatar-initials` | `string` | `''` | Avatar initials fallback |
| `avatar-size` | `Size` | `'sm'` | Avatar size |
| `subtitle` | `string` | `''` | Secondary text below name (e.g. @handle) |
| `indicator` | `boolean` | `false` | Show a colored dot indicator |
| `indicator-color` | `'success'` \| `'warning'` \| `'error'` \| `'primary'` \| `'gray'` | `'gray'` | Indicator dot color |

**Slots:** `default` (activity description), `avatar` (custom avatar override), `content` (extra content below description)

---

## ml-table

Data table with sorting, selection, and custom cell rendering. Supports virtual scrolling for large datasets.

```ts
import '@melodicdev/components/table';
```

```html
<ml-table
  .columns=${columns}
  .rows=${rows}
  striped
  hoverable
  table-title="Users"
  @ml:sort=${this.handleSort}
  @ml:row-click=${this.handleRowClick}
></ml-table>

<!-- With footer slot -->
<ml-table .columns=${columns} .rows=${rows}>
  <ml-pagination slot="footer" .page=${page} .totalPages=${totalPages}></ml-pagination>
</ml-table>

<!-- Virtual scrolling for large datasets (parent must have a fixed height) -->
<div style="height: 500px">
  <ml-table .columns=${columns} .rows=${largeDataset} virtual sticky-header></ml-table>
</div>
```

**TableColumn interface:**

```ts
interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;       // e.g. '200px' or '20%'
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: Record<string, unknown>, index: number) => unknown;
}
```

**Attributes:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `TableColumn[]` | `[]` | Column definitions (property) |
| `rows` | `Record<string, unknown>[]` | `[]` | Row data (property) |
| `selectable` | `boolean` | `false` | Row checkboxes |
| `striped` | `boolean` | `false` | Alternating row backgrounds |
| `hoverable` | `boolean` | `true` | Row highlight on hover |
| `sticky-header` | `boolean` | `false` | Freeze header row on scroll |
| `virtual` | `boolean` | `false` | Virtual scrolling (requires fixed parent height) |
| `size` | `'sm'` \| `'md'` | `'md'` | Row height and text size |
| `table-title` | `string` | `''` | Title shown above the table |
| `description` | `string` | `''` | Description text below title |

**Slots:** `footer` (pagination, etc.), `header-actions` (buttons next to the title)

**Events:**
- `ml:sort` `{ key, direction: 'asc' | 'desc' }`
- `ml:select` `{ selectedRows: number[], allSelected: boolean }`
- `ml:row-click` `{ row, index }`

> **Virtual scrolling:** When `virtual` is set, the table wrapper becomes the scroll container. The parent element **must have a defined height** (e.g. `height: 500px` or `height: 100%` inside a flex/grid). Row heights are fixed (`44px` for `md`, `36px` for `sm`).

---

## ml-data-grid

Full-featured enterprise data grid with virtual scrolling, sorting, filtering, selection, column resizing, column reordering, pinned columns, and pagination.

```ts
import '@melodicdev/components/data-grid';
```

```html
<ml-data-grid
  .columns=${columns}
  .rows=${rows}
  selectable
  virtual
  show-filter-row
  grid-title="Users"
  description="Manage your team"
  page-size="50"
  @ml:sort=${this.handleSort}
  @ml:filter=${this.handleFilter}
  @ml:select=${this.handleSelect}
  @ml:row-click=${this.handleRowClick}
  @ml:page-change=${this.handlePageChange}
></ml-data-grid>
```

**DataGridColumn interface:**

```ts
interface DataGridColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;         // pixels
  minWidth?: number;      // pixels (default: 80)
  pinned?: 'left';
  render?: (value: unknown, row: Record<string, unknown>, index: number) => unknown;
}
```

**Attributes:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `DataGridColumn[]` | `[]` | Column definitions (property) |
| `rows` | `Record<string, unknown>[]` | `[]` | Row data (property) |
| `selectable` | `boolean` | `false` | Row checkboxes with select-all |
| `striped` | `boolean` | `false` | Alternating row backgrounds |
| `hoverable` | `boolean` | `true` | Row highlight on hover |
| `virtual` | `boolean` | `true` | Virtual scrolling |
| `show-filter-row` | `boolean` | `false` | Per-column filter inputs |
| `size` | `'sm'` \| `'md'` | `'md'` | Row height |
| `grid-title` | `string` | `''` | Title in the toolbar |
| `description` | `string` | `''` | Description in the toolbar |
| `page-size` | `number` | `50` | Rows per page |
| `server-side` | `boolean` | `false` | Disables client-side sort/filter/pagination |

**Slots:** `toolbar-actions` (buttons placed in the toolbar)

**Events:**
- `ml:sort` `{ key, direction }`
- `ml:filter` `{ filters: Record<string, string> }`
- `ml:select` `{ selectedRows: number[], allSelected: boolean }`
- `ml:row-click` `{ row, index }`
- `ml:column-resize` `{ key, width }`
- `ml:column-reorder` `{ order: string[] }`
- `ml:page-change` `{ page, pageSize }`

Column interactions: drag headers to reorder, drag resize handles to resize, click column headers to sort.

---

## ml-calendar-view

Full-featured calendar with month, week, and day views.

```ts
import '@melodicdev/components/calendar-view';
```

```html
<ml-calendar-view
  .events=${events}
  view="month"
  @ml:event-click=${this.handleEventClick}
  @ml:date-click=${this.handleDateClick}
  @ml:add-event=${this.handleAddEvent}
></ml-calendar-view>
```

**CalendarEvent interface:**

```ts
interface CalendarEvent {
  id: string;
  title: string;
  start: string;   // ISO date string (YYYY-MM-DD)
  end?: string;    // ISO date string
  color?: string;  // CSS color or semantic: 'primary' | 'success' | 'warning' | 'error'
  allDay?: boolean;
  startTime?: string; // 'HH:MM' for week/day views
  endTime?: string;
}
```

**Attributes:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `events` | `CalendarEvent[]` | `[]` | Calendar events (property) |
| `view` | `'month'` \| `'week'` \| `'day'` | `'month'` | Active view mode |
| `date` | `string` | today | Currently navigated date (`YYYY-MM-DD`) |
| `week-starts-on` | `number` | `0` | First day of week: `0` = Sunday, `1` = Monday |
| `max-visible-events` | `number` | `3` | Max events visible per day cell in month view |
| `add-button-text` | `string` | `'Add event'` | Label for the add button |
| `hide-nav` | `boolean` | `false` | Hide prev/next navigation arrows |
| `hide-today-button` | `boolean` | `false` | Hide the "Today" button |
| `hide-view-selector` | `boolean` | `false` | Hide the view dropdown |
| `hide-add-button` | `boolean` | `false` | Hide the add event button |

**Slots:** `header-left` (custom content before the title), `header-actions` (custom content after the add button)

**Events:**
- `ml:view-change` `{ view }` — emitted when the user switches views
- `ml:date-change` `{ date }` — emitted when navigating to a new date
- `ml:event-click` `{ event }` — emitted when an event is clicked
- `ml:date-click` `{ date }` — emitted when a date cell is clicked
- `ml:add-event` `{ date? }` — emitted when the add event button is clicked (month/day view passes the date)

Clicking "more events" in month view automatically switches to day view for that date.
