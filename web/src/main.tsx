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
          colorPrimary: '#f7c948',
          colorBackground: '#2b1a0d',
          colorText: '#ffeccc',
          colorTextSecondary: '#d8c3a0',
          colorInputBackground: '#3a2412',
          colorInputText: '#ffeccc',
          colorNeutral: '#ffeccc',
          borderRadius: '0.75rem',
        },
        elements: {
          userButtonPopoverCard: { background: '#2b1a0d', border: '1px solid rgba(247,201,72,0.35)' },
          userButtonPopoverMain: { background: '#2b1a0d' },
          userButtonPopoverActionButton: { color: '#ffeccc' },
          userButtonPopoverActionButtonText: { color: '#ffeccc' },
          userButtonPopoverActionButtonIcon: { color: '#f7c948' },
          userButtonPopoverActionButton__manageAccount: { color: '#ffeccc' },
          userButtonPopoverActionButton__signOut: { color: '#ffeccc' },
          userButtonPopoverFooter: { background: 'transparent' },
          menuButton: { color: '#ffeccc' },
          menuList: { background: '#2b1a0d' },
          menuItem: { color: '#ffeccc' },
        },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);
