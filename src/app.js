import { loadArcData } from './data/arc.js';

const store = window.ArcShieldStore;

function setStatus(text, tone) {
  const el = document.getElementById('data-status');
  if (!el) return;
  el.textContent = text;
  el.className = 'data-status' + (tone ? ' ' + tone : '');
}

async function boot() {
  if (!store) return;
  setStatus('Reading Arc testnet…', 'busy');
  try {
    const { rows, errors } = await loadArcData();
    if (!rows.length) {
      setStatus(errors.length ? `Could not reach Arc: ${errors[0]}` : 'Arc testnet returned no markets', 'bad');
      return;
    }
    store.setData(rows);
    store.markLoaded();
    const when = rows.find((r) => r.asOf)?.asOf;
    setStatus(
      `${rows.length} live from Arc testnet${when ? ' · ' + new Date(when).toUTCString().slice(17, 22) + ' UTC' : ''}`,
      'live',
    );
  } catch (e) {
    setStatus(`Could not reach Arc: ${e.message}`, 'bad');
  }
}

boot();
