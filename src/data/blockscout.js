const BASE = 'https://explorer.testnet.arc.io/api/v2';

const get = async (path) => {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`blockscout ${res.status} ${path}`);
  return res.json();
};

/**
 * Verification and proxy state for one contract. Both are risk indicators the
 * App Kit response has no field for.
 */
export async function contractProfile(address) {
  const a = await get(`/addresses/${address}`);
  return {
    verified: a.is_verified === true,
    // A rewritable implementation slot is what makes a vault upgradeable.
    upgradeable: Boolean(a.proxy_type) || (a.implementations ?? []).length > 0,
    proxyType: a.proxy_type ?? null,
    creator: a.creator_address_hash ?? null,
    flaggedScam: a.is_scam === true,
    explorerName: a.name ?? null,
  };
}

/**
 * Share of supply held by the largest holders. Blockscout returns them already
 * sorted, so the top slice is the concentration figure without extra work.
 */
export async function concentration(address, top = 5) {
  const { items = [] } = await get(`/tokens/${address}/holders`);
  const balances = items.map((h) => Number(h.value)).filter((n) => Number.isFinite(n));
  const total = balances.reduce((s, n) => s + n, 0);
  if (!total) return { topShare: null, holders: [], counted: 0 };
  const holders = items.slice(0, top).map((h, i) => ({
    address: h.address?.hash ?? '',
    share: balances[i] / total,
  }));
  return {
    topShare: holders.reduce((s, h) => s + h.share, 0),
    holders,
    // Blockscout pages holders, so this is "of those returned", not of all.
    counted: items.length,
  };
}
