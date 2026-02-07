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

// Import components - Feedback
import '@melodicdev/components/spinner';
import '@melodicdev/components/alert';

// Import components - Foundation
import '@melodicdev/components/card';
import '@melodicdev/components/stack';
import '@melodicdev/components/divider';

// Import components - Data Display
import '@melodicdev/components/badge';
import '@melodicdev/components/avatar';

// import components - Icons
import '@melodicdev/components/icon';

// Import components - Overlays
import '@melodicdev/components/tooltip';
import '@melodicdev/components/dialog';
import '@melodicdev/components/popover';

// Import components - Navigation
import '@melodicdev/components/tabs';

// Inject base styles
const styleSheet = document.createElement('style');
styleSheet.textContent = baseThemeCss + '\n' + lightThemeCss + '\n' + darkThemeCss;
document.head.appendChild(styleSheet);

// Apply default theme
applyTheme('light');

// Create demo app
import './components/demo-app/demo-app.component.js';
