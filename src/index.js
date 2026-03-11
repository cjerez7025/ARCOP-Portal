import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { DATA_PROVIDER, VALID_PROVIDERS } from './config/dataProvider';
if (!VALID_PROVIDERS.includes(DATA_PROVIDER)) {
  throw new Error(`[DataBus] Provider inválido: "${DATA_PROVIDER}". Válidos: ${VALID_PROVIDERS.join(' | ')}`);
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();