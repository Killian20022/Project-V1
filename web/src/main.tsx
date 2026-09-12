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
          colorPrimary: '#38bdf8',
          colorBackground: '#0c1424',
          colorText: '#eaf3ff',
          colorTextSecondary: '#c3d5ec',
          colorInputBackground: '#111c30',
          colorInputText: '#eaf3ff',
          colorNeutral: '#eaf3ff',
          borderRadius: '0.85rem',
        },
        elements: {
          userButtonPopoverCard: { background: '#0c1424', border: '1px solid rgba(56,189,248,0.18)' },
          userButtonPopoverMain: { background: '#0c1424' },
          userButtonPopoverActionButton: { color: '#eaf3ff' },
          userButtonPopoverActionButtonText: { color: '#eaf3ff' },
          userButtonPopoverActionButtonIcon: { color: '#7dd3fc' },
          userButtonPopoverActionButton__manageAccount: { color: '#eaf3ff' },
          userButtonPopoverActionButton__signOut: { color: '#eaf3ff' },
          userButtonPopoverFooter: { background: 'transparent' },
          menuButton: { color: '#eaf3ff' },
          menuList: { background: '#0c1424' },
          menuItem: { color: '#eaf3ff' },
        },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);
