// Import theme
import { applyTheme, baseThemeCss, lightThemeCss, darkThemeCss } from '@melodicdev/components/theme';

// Import components - Forms
import '@melodicdev/components/button';
import '@melodicdev/components/input';
import '@melodicdev/components/select';
import '@melodicdev/components/textarea';
import '@melodicdev/components/checkbox';
import '@melodicdev/components/radio';
import '@melodicdev/components/toggle';
import '@melodicdev/components/form-field';
import '@melodicdev/components/slider';
import '@melodicdev/components/date-picker';
import '@melodicdev/components/button-group';
import '@melodicdev/components/radio-card-group';

// Import components - Feedback
import '@melodicdev/components/spinner';
import '@melodicdev/components/alert';
import '@melodicdev/components/progress';
import '@melodicdev/components/toast';

// Import components - Foundation
import '@melodicdev/components/card';
import '@melodicdev/components/stack';
import '@melodicdev/components/divider';
import '@melodicdev/components/container';

// Import components - Data Display
import '@melodicdev/components/badge';
import '@melodicdev/components/avatar';
import '@melodicdev/components/badge-group';
import '@melodicdev/components/table';
import '@melodicdev/components/data-grid';
import '@melodicdev/components/tag';
import '@melodicdev/components/calendar-view';
import '@melodicdev/components/activity-feed';
import '@melodicdev/components/list';

// import components - Icons
import '@melodicdev/components/icon';

// Import components - Overlays
import '@melodicdev/components/tooltip';
import '@melodicdev/components/dialog';
import '@melodicdev/components/popover';
import '@melodicdev/components/dropdown';
import '@melodicdev/components/drawer';

// Import components - Navigation
import '@melodicdev/components/tabs';
import '@melodicdev/components/breadcrumb';
import '@melodicdev/components/pagination';
import '@melodicdev/components/steps';
import '@melodicdev/components/sidebar';

// Import components - Sections
import '@melodicdev/components/app-shell';
import '@melodicdev/components/hero-section';
import '@melodicdev/components/page-header';

// Import components - Pages
import '@melodicdev/components/login-page';
import '@melodicdev/components/signup-page';
import '@melodicdev/components/dashboard-page';

// Import directives
import '@melodicdev/components/directives';

// Inject base styles
const styleSheet = document.createElement('style');
styleSheet.textContent = baseThemeCss + '\n' + lightThemeCss + '\n' + darkThemeCss;
document.head.appendChild(styleSheet);

// Apply default theme
applyTheme('light');

// Create demo app
import './components/demo-app/demo-app.component.js';
