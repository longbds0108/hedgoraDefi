import { useEffect, useRef } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';

const shorten = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function WalletButton() {
  const { openConnectModal } = useConnectModal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Only a connection the visitor just asked for should navigate. wagmi also
  // reconnects a remembered wallet on load, and throwing someone into the app
  // because they opened the landing page would take the page away from them.
  const launched = useRef(false);

  useEffect(() => {
    const open = () => {
      launched.current = true;
      openConnectModal?.();
    };
    window.addEventListener('arcshield:launch', open);
    return () => window.removeEventListener('arcshield:launch', open);
  }, [openConnectModal]);

  useEffect(() => {
    if (isConnected && launched.current) {
      window.location.href = 'app.html';
      return;
    }
    const btn = document.getElementById('launch-btn');
    if (btn) btn.style.display = isConnected ? 'none' : '';
  }, [isConnected]);

  if (!isConnected) return null;

  // Shown when someone returns to the landing page with a wallet already on.
  return (
    <div className="wallet-pill">
      <span className="dot" aria-hidden="true" />
      <span className="addr">{shorten(address)}</span>
      <a className="go" href="app.html">Open app →</a>
      <button className="unlink" onClick={() => disconnect()}>Disconnect</button>
    </div>
  );
}
