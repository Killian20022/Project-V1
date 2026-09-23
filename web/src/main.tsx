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
          colorPrimary: '#d7bd83',
          colorBackground: '#17352d',
          colorText: '#f4eddf',
          colorTextSecondary: '#bfcbb8',
          colorInputBackground: '#24483a',
          colorInputText: '#f4eddf',
          colorNeutral: '#f4eddf',
          borderRadius: '0.75rem',
        },
        elements: {
          userButtonPopoverCard: { background: '#17352d', border: '1px solid rgba(215,189,131,0.35)' },
          userButtonPopoverMain: { background: '#17352d' },
          userButtonPopoverActionButton: { color: '#f4eddf' },
          userButtonPopoverActionButtonText: { color: '#f4eddf' },
          userButtonPopoverActionButtonIcon: { color: '#d7bd83' },
          userButtonPopoverActionButton__manageAccount: { color: '#f4eddf' },
          userButtonPopoverActionButton__signOut: { color: '#f4eddf' },
          userButtonPopoverFooter: { background: 'transparent' },
          menuButton: { color: '#f4eddf' },
          menuList: { background: '#17352d' },
          menuItem: { color: '#f4eddf' },
        },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);
