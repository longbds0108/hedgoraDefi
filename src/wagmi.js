import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, fallback } from 'viem';
import { arc } from './chain.js';

// A WalletConnect project id is only needed for the QR / mobile-wallet flow.
// Without one, injected wallets (MetaMask, Rabby, Brave) still connect, so the
// app stays usable for anyone who clones the repo without credentials.
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'arcshield-local';

export const config = getDefaultConfig({
  appName: 'ArcShield',
  projectId,
  chains: [arc],
  transports: {
    [arc.id]: fallback(arc.rpcUrls.default.http.map((url) => http(url))),
  },
  ssr: false,
});
