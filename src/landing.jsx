import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import { config } from './wagmi.js';
import { WalletButton } from './WalletButton.jsx';
import './wallet.css';

const queryClient = new QueryClient();

const theme = darkTheme({
  accentColor: '#e8e3d5',
  accentColorForeground: '#0E0B14',
  borderRadius: 'medium',
  overlayBlur: 'small',
});

const mount = document.getElementById('wallet-root');
if (mount) {
  createRoot(mount).render(
    <StrictMode>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={theme} modalSize="compact">
            <WalletButton />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </StrictMode>,
  );
}

// "Launch app" opens the wallet picker instead of navigating straight through.
// Reading protocol data needs no wallet, so the hero's "Explore DeFi" link
// remains the way in without connecting.
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-launch]');
  if (!el) return;
  e.preventDefault();
  window.dispatchEvent(new CustomEvent('arcshield:launch'));
});
