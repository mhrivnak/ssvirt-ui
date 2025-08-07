import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ConfigLoader } from './components/common/ConfigLoader';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error(
    'Failed to find the root element. Make sure you have <div id="root"></div> in your HTML.'
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <ConfigLoader>
      <App />
    </ConfigLoader>
  </StrictMode>
);
