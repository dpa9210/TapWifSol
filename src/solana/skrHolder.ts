import { Connection, PublicKey } from "@solana/web3.js";

// Real SKR token, airdropped to Solana Mobile Seeker phone owners in
// January 2026 — a standard SPL Token mint, no devnet counterpart exists.
// This module only ever reads mainnet balances; it never signs or sends
// anything, so it carries none of the risk of moving real SKR in a demo.
export const SKR_MINT_ADDRESS = "SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3";

// The project's Helius API key works against both the devnet and mainnet
// endpoints (verified directly), so this one-off read-only lookup reuses it
// instead of provisioning a second key just for this.
function mainnetReadOnlyConnection(): Connection {
  const heliusKey = process.env.EXPO_PUBLIC_HELIUS_DEVNET_API_KEY;
  const endpoint = heliusKey
    ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
    : "https://api.mainnet-beta.solana.com";
  return new Connection(endpoint, "confirmed");
}

let cachedConnection: Connection | null = null;
function getConnection(): Connection {
  if (!cachedConnection) cachedConnection = mainnetReadOnlyConnection();
  return cachedConnection;
}

/**
 * Whether `owner` holds any SKR on mainnet. Purely cosmetic/read-only —
 * unlocks a "Seeker Holder" badge and an upgraded cNFT receipt tier, never
 * changes the amount actually transferred. Any failure (offline, rate
 * limited, no mainnet activity) resolves to `false` rather than throwing —
 * this check must never be able to block or break a payment.
 */
export async function isSkrHolder(owner: PublicKey): Promise<boolean> {
  try {
    const connection = getConnection();
    const { value } = await connection.getParsedTokenAccountsByOwner(owner, {
      mint: new PublicKey(SKR_MINT_ADDRESS),
    });
    return value.some((account) => {
      const parsed = account.account.data as any;
      return (parsed.parsed?.info?.tokenAmount?.uiAmount ?? 0) > 0;
    });
  } catch {
    return false;
  }
}
