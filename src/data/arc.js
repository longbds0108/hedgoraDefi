import { AppKit } from '@circle-fin/app-kit';
import { contractProfile, concentration } from './blockscout.js';

const CHAIN = 'Arc_Testnet';
const kit = new AppKit(
  import.meta.env.VITE_CIRCLE_KIT_KEY ? { kitKey: import.meta.env.VITE_CIRCLE_KIT_KEY } : {},
);

const pct = (n) => (Number(n) || 0) * 100;
const num = (v) => (Number(v) || 0);

/**
 * App Kit reports APY as a fraction and amounts as decimal strings already in
 * token units, so nothing here needs decimal maths — that only applies to raw
 * on-chain reads, where USDC is 18dp natively and 6dp through the ERC-20 view.
 */
function fromVault(v) {
  const apy = pct(v.currentApy);
  const organic = pct(v.nativeApy);
  return {
    name: v.name,
    kind: 'vault',
    type: 'vault',
    asset: String(v.asset || '').toLowerCase(),
    label: `${v.asset} ${v.protocol === 'MORPHO' ? 'Morpho vault' : v.protocol}`,
    protocol: v.protocol,
    address: v.vaultAddress,
    apy,
    organic,
    // Rewards are listed per token; the gap to currentApy is the same number.
    incentive: Math.max(0, apy - organic),
    rewards: (v.rewards ?? []).map((r) => ({ token: r.token, apy: pct(r.apy) })),
    tvl: num(v.totalDeposits),
    liq: num(v.liquidity),
    status: v.status,
    asOf: v.apyProfile?.asOf ?? v.asOf ?? null,
    history: {
      d7: v.apyProfile?.d7 == null ? null : pct(v.apyProfile.d7),
      d30: v.apyProfile?.d30 == null ? null : pct(v.apyProfile.d30),
      d90: v.apyProfile?.d90 == null ? null : pct(v.apyProfile.d90),
    },
    // Circle's own warnings, carried through verbatim rather than re-graded.
    sdkWarnings: (v.riskSignals?.warnings ?? []).map((w) => ({
      type: w.type, level: w.level,
    })),
    manager: v.manager?.name ?? null,
  };
}

function fromMarket(m) {
  return {
    name: `${m.collateralAsset.symbol} → ${m.loanAsset.symbol}`,
    kind: 'market',
    type: 'lending',
    asset: String(m.loanAsset.symbol || '').toLowerCase(),
    label: `${m.loanAsset.symbol} borrow vs ${m.collateralAsset.symbol}`,
    protocol: (m.protocol || '').toUpperCase(),
    address: null,
    marketId: m.marketId,
    apy: pct(m.borrowApy),
    organic: pct(m.borrowApy),
    incentive: 0,
    rewards: [],
    tvl: num(m.borrowAssets?.amount),
    liq: num(m.liquidity?.amount),
    utilization: pct(m.utilization),
    lltv: pct(m.lltv),
    status: 'active',
    asOf: m.refreshedAt ?? null,
    history: { d7: null, d30: null, d90: null },
    sdkWarnings: [],
    manager: null,
  };
}

/** Turns what we know into the named, unranked indicators the UI shows. */
function flagsFor(row) {
  const flags = [];
  if (row.chain?.verified === true) flags.push(['good', 'Verified']);
  if (row.chain?.verified === false) flags.push(['warn', 'Unverified contract']);
  if (row.chain?.upgradeable) flags.push(['warn', 'Upgradeable']);
  if (row.chain?.flaggedScam) flags.push(['warn', 'Flagged by explorer']);

  for (const w of row.sdkWarnings) {
    const label = w.type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
    flags.push([w.level === 'RED' ? 'warn' : 'warn', label]);
  }
  if (row.incentive === 0 && row.kind === 'vault') flags.push(['good', 'No incentives']);
  if (row.conc?.topShare != null && row.conc.topShare > 0.5) {
    flags.push(['warn', `Top holders ${Math.round(row.conc.topShare * 100)}%`]);
  }
  if (row.tvl > 0 && row.liq / row.tvl < 0.2) flags.push(['warn', 'Thin withdrawal liquidity']);
  return flags;
}

/**
 * Everything ArcShield can see about Arc testnet right now. The on-chain
 * lookups are per-contract, so they run together rather than in sequence, and
 * a failure there degrades one row instead of emptying the page.
 */
export async function loadArcData() {
  const [vaultsRes, marketsRes] = await Promise.allSettled([
    kit.earn.exploreVaults({ chain: CHAIN }),
    kit.borrow.exploreMarkets({ chain: CHAIN, sortBy: 'borrowApy' }),
  ]);

  const rows = [];
  if (vaultsRes.status === 'fulfilled') rows.push(...(vaultsRes.value.vaults ?? []).map(fromVault));
  if (marketsRes.status === 'fulfilled') rows.push(...(marketsRes.value.markets ?? []).map(fromMarket));

  await Promise.all(rows.map(async (row) => {
    if (!row.address) return;
    const [profile, conc] = await Promise.allSettled([
      contractProfile(row.address),
      concentration(row.address),
    ]);
    if (profile.status === 'fulfilled') row.chain = profile.value;
    if (conc.status === 'fulfilled') row.conc = conc.value;
  }));

  for (const row of rows) {
    row.flags = flagsFor(row);
    row.audited = null;        // no machine source — stays unknown, never assumed
    row.upgradeable = row.chain?.upgradeable ?? null;
    row.admin = row.manager ?? (row.chain?.creator ? 'EOA' : 'Unknown');
    row.oracle = 'Unknown';
  }

  const errors = [vaultsRes, marketsRes].filter((r) => r.status === 'rejected')
    .map((r) => r.reason?.message ?? String(r.reason));
  return { rows, errors };
}
