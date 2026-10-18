import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './icons/icons.css';
import './styles/pages/home.css';
import './styles/pages/discover.css';
import './styles/pages/explore.css';
import './styles/pages/city.css';
import './styles/pages/settings.css';
import './styles/pages/social.css';
import './styles/pages/friends.css';
import './styles/pages/checkin.css';
import './styles/pages/people.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline shell for the installed app. Skipped inside embedded previews.
if ('serviceWorker' in navigator && import.meta.env.PROD && window.self === window.top && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline support is optional */
    });
  });
}
