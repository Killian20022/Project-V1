import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

// Clé publique Clerk (publishable key). Publique par nature — pas de secret ici.
const PUBLISHABLE_KEY = 'pk_test_cHJvdmVuLWdhemVsbGUtNTg2LmNsZXJrLmFjY291bnRzLmRldiQ';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: '#38bdf8',
          colorBackground: '#0c1424',
          colorText: '#eaf3ff',
          colorTextSecondary: '#a8bed8',
          colorInputBackground: '#111c30',
          colorInputText: '#eaf3ff',
          borderRadius: '0.85rem',
        },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);
