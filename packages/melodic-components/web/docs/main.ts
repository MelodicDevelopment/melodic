// Import theme
import { applyTheme, baseThemeCss, lightThemeCss, darkThemeCss } from '@melodicdev/components/theme';

// Inject base styles
const styleSheet = document.createElement('style');
styleSheet.textContent = baseThemeCss + '\n' + lightThemeCss + '\n' + darkThemeCss;
document.head.appendChild(styleSheet);

// Apply default theme
applyTheme('system');

// Import all components for demos
import '@melodicdev/components/button';
import '@melodicdev/components/spinner';
import '@melodicdev/components/input';
import '@melodicdev/components/textarea';
import '@melodicdev/components/checkbox';
import '@melodicdev/components/radio';
import '@melodicdev/components/toggle';

// Import docs app
import './components/docs-app.js';
