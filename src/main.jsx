import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// ============================================================================
// RetailMind AI - Design System Styling Architecture
// Single canonical entry point for all application stylesheets.
// Order is strictly arranged for proper CSS cascade:
// 1. variables.css  - Design tokens, color system, typography & spacing scales
// 2. global.css     - Reset, typography hierarchy, base primitives & utilities
// 3. layout.css     - Shell layout, responsive sidebar & top navigation
// 4. components.css - Reusable UI elements (cards, buttons, tables, badges, modals)
// 5. pages.css      - Specialized domain page grids, charts & simulator views
// ============================================================================
import './styles/variables.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
