import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import App from './App';
import './index.css';

// Clé publique Clerk (publishable key). Publique par nature — pas de secret ici.
const PUBLISHABLE_KEY = 'pk_test_cHJvdmVuLWdhemVsbGUtNTg2LmNsZXJrLmFjY291bnRzLmRldiQ';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#f5c518',
          colorBackground: '#070a12',
          colorText: '#e9edf6',
          colorTextSecondary: '#a6adbb',
          colorInputBackground: '#0d1220',
          colorInputText: '#e9edf6',
          colorNeutral: '#e9edf6',
          borderRadius: '0.75rem',
        },
        elements: {
          userButtonPopoverCard: { background: '#0b1020', border: '1px solid rgba(245,197,24,0.24)' },
          userButtonPopoverMain: { background: '#0b1020' },
          userButtonPopoverActionButton: { color: '#e6e9f2' },
          userButtonPopoverActionButtonText: { color: '#e6e9f2' },
          userButtonPopoverActionButtonIcon: { color: '#f5c518' },
          userButtonPopoverActionButton__manageAccount: { color: '#e6e9f2' },
          userButtonPopoverActionButton__signOut: { color: '#e6e9f2' },
          userButtonPopoverFooter: { background: 'transparent' },
          menuButton: { color: '#e6e9f2' },
          menuList: { background: '#0b1020' },
          menuItem: { color: '#e6e9f2' },
        },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);
