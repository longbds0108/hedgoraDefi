import { arcTestnet } from 'viem/chains';

// viem ships arcTestnet (id 5042002). Both rpc.testnet.arc.io and
// rpc.testnet.arc.network answer; the .io host is the one Arc's own docs give,
// so it leads and viem's default is the fallback.
export const arc = {
  ...arcTestnet,
  rpcUrls: {
    default: {
      http: [
        import.meta.env.VITE_ARC_RPC_URL || 'https://rpc.testnet.arc.io',
        ...arcTestnet.rpcUrls.default.http,
      ],
    },
  },
};

// Arc pays gas in USDC, and the mempool silently drops anything under 20 Gwei.
export const MIN_GAS_PRICE = 20_000_000_000n;

export const EXPLORER = 'https://explorer.testnet.arc.io';
export const txUrl = (hash) => `${EXPLORER}/tx/${hash}`;
export const addressUrl = (addr) => `${EXPLORER}/address/${addr}`;

// USDC is the gas token and an ERC-20 at once: 18 decimals natively, 6 through
// the token interface, sharing one balance. Reading the wrong one is off by 10^12.
export const USDC = {
  address: '0x3600000000000000000000000000000000000000',
  erc20Decimals: 6,
  nativeDecimals: 18,
};
