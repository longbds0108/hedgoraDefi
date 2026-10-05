import { useEffect, useState } from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';

const shorten = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function LaunchModal() {
  const [open, setOpen] = useState(false);
  const [googleNote, setGoogleNote] = useState(false);
  const { openConnectModal } = useConnectModal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // The landing page is plain HTML, so its buttons talk to React by event.
  useEffect(() => {
    const show = () => { setGoogleNote(false); setOpen(true); };
    window.addEventListener('arcshield:launch', show);
    return () => window.removeEventListener('arcshield:launch', show);
  }, []);

  // Connecting is the point of the dialog, so get out of the way once it lands,
  // and hand the header slot over to the connected pill.
  useEffect(() => {
    if (isConnected) setOpen(false);
    const btn = document.getElementById('launch-btn');
    if (btn) btn.style.display = isConnected ? 'none' : '';
  }, [isConnected]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (isConnected && !open) {
    return (
      <div className="wallet-pill">
        <span className="dot" aria-hidden="true" />
        <span className="addr">{shorten(address)}</span>
        <a className="go" href="app.html">Open app →</a>
        <button className="unlink" onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  if (!open) return null;

  return (
    <div className="lm-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="lm" role="dialog" aria-modal="true" aria-labelledby="lm-title">
        <div className="lm-head">
          <div>
            <h2 id="lm-title">Launch ArcShield</h2>
            <p>Connect to see your own positions. Browsing works without it.</p>
          </div>
          <button className="lm-x" onClick={() => setOpen(false)} aria-label="Close">✕</button>
        </div>

        <button
          className="lm-opt"
          onClick={() => { setOpen(false); openConnectModal?.(); }}
        >
          <span className="ic" aria-hidden="true">◈</span>
          <span className="txt">
            <span className="t">Connect EVM wallet</span>
            <span className="d">MetaMask, Rainbow, Coinbase and WalletConnect</span>
          </span>
          <span className="go" aria-hidden="true">→</span>
        </button>

        <button className="lm-opt" onClick={() => setGoogleNote(true)}>
          <span className="ic g" aria-hidden="true">G</span>
          <span className="txt">
            <span className="t">Continue with Google</span>
            <span className="d">Creates a wallet for you — no extension needed</span>
          </span>
          <span className="go" aria-hidden="true">→</span>
        </button>

        {googleNote && (
          <div className="lm-note">
            Google sign-in runs on Circle's user-controlled wallets, which mint the
            session server-side with a secret key. That endpoint is not deployed yet,
            so this route is not live. Wallet connect works now.
          </div>
        )}

        <a className="lm-skip" href="app.html">Browse without connecting →</a>
      </div>
    </div>
  );
}
