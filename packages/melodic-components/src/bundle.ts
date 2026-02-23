/**
 * Bundle entry point — imports every component to trigger custom element registration.
 * Used to build assets/melodic-components.js for CDN / script-tag usage.
 *
 * All theme functions, utilities, and services are also exported so they remain
 * available when using the bundle programmatically:
 *
 *   import { applyTheme, ToastService } from '.../melodic-components.js';
 */

// Theme, utilities, functions, directives
export * from './theme/index.js';
export * from './utils/index.js';
export * from './functions/index.js';
export * from './directives/index.js';

// Forms
export * from './components/forms/button/index.js';
export * from './components/forms/button-group/index.js';
export * from './components/forms/input/index.js';
export * from './components/forms/textarea/index.js';
export * from './components/forms/checkbox/index.js';
export * from './components/forms/radio/index.js';
export * from './components/forms/radio-card-group/index.js';
export * from './components/forms/toggle/index.js';
export * from './components/forms/select/index.js';
export * from './components/forms/slider/index.js';
export * from './components/forms/form-field/index.js';
export * from './components/forms/date-picker/index.js';

// Feedback
export * from './components/feedback/spinner/index.js';
export * from './components/feedback/alert/index.js';
export * from './components/feedback/toast/index.js';
export * from './components/feedback/progress/index.js';

// Foundation
export * from './components/foundation/card/index.js';
export * from './components/foundation/divider/index.js';
export * from './components/foundation/stack/index.js';
export * from './components/foundation/container/index.js';

// Data Display
export * from './components/data-display/avatar/index.js';
export * from './components/data-display/badge/index.js';
export * from './components/data-display/badge-group/index.js';
export * from './components/data-display/tag/index.js';
export * from './components/data-display/list/index.js';
export * from './components/data-display/activity-feed/index.js';
export * from './components/data-display/table/index.js';
// data-grid shares SortDirection with table — side-effect import avoids re-export conflict
import './components/data-display/data-grid/index.js';
export * from './components/data-display/calendar-view/index.js';

// General
export * from './components/general/icon/index.js';

// Navigation
export * from './components/navigation/tabs/index.js';
export * from './components/navigation/breadcrumb/index.js';
export * from './components/navigation/pagination/index.js';
export * from './components/navigation/sidebar/index.js';
export * from './components/navigation/steps/index.js';

// Overlays
export * from './components/overlays/dialog/index.js';
export * from './components/overlays/drawer/index.js';
export * from './components/overlays/dropdown/index.js';
export * from './components/overlays/tooltip/index.js';
export * from './components/overlays/popover/index.js';

// Sections
export * from './components/sections/app-shell/index.js';
export * from './components/sections/hero/index.js';
export * from './components/sections/page-header/index.js';

// Pages
export * from './components/pages/auth/index.js';
export * from './components/pages/dashboard/index.js';
