import { useEffect } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';

const shorten = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function WalletButton() {
  const { openConnectModal } = useConnectModal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // The landing page is plain HTML, so its Launch button talks to React by event.
  useEffect(() => {
    const open = () => openConnectModal?.();
    window.addEventListener('arcshield:launch', open);
    return () => window.removeEventListener('arcshield:launch', open);
  }, [openConnectModal]);

  // Once connected the header slot belongs to the pill, not the Launch button.
  useEffect(() => {
    const btn = document.getElementById('launch-btn');
    if (btn) btn.style.display = isConnected ? 'none' : '';
  }, [isConnected]);

  if (!isConnected) return null;

  return (
    <div className="wallet-pill">
      <span className="dot" aria-hidden="true" />
      <span className="addr">{shorten(address)}</span>
      <a className="go" href="app.html">Open app →</a>
      <button className="unlink" onClick={() => disconnect()}>Disconnect</button>
    </div>
  );
}
