/**
 * One-time setup: creates a publicly-mintable Bubblegum merkle tree on
 * devnet that CustomerView.tsx mints a payment-receipt cNFT into on every
 * payment. Not part of the shipped app — run once with:
 *
 *   node --env-file=.env -r tsx/cjs scripts/createReceiptTree.ts
 *
 * Prints the resulting tree address; paste it into
 * src/solana/receiptTree.ts as RECEIPT_TREE_ADDRESS.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { Keypair, Connection, clusterApiUrl } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplBubblegum, createTree } from "@metaplex-foundation/mpl-bubblegum";
import {
  fromWeb3JsKeypair,
  toWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import { createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";

const AUTHORITY_KEYPAIR_PATH = ".receipt-tree-authority.json";

function loadOrCreateAuthority(): Keypair {
  if (existsSync(AUTHORITY_KEYPAIR_PATH)) {
    const secret = JSON.parse(readFileSync(AUTHORITY_KEYPAIR_PATH, "utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(secret));
  }
  const keypair = Keypair.generate();
  writeFileSync(
    AUTHORITY_KEYPAIR_PATH,
    JSON.stringify(Array.from(keypair.secretKey))
  );
  console.log(`Generated new tree authority, saved to ${AUTHORITY_KEYPAIR_PATH}`);
  return keypair;
}

async function ensureFunded(connection: Connection, keypair: Keypair) {
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`Authority ${keypair.publicKey.toBase58()} balance: ${balance / 1e9} SOL`);
  if (balance > 0.05 * 1e9) return;

  console.log("Requesting devnet airdrop...");
  const sig = await connection.requestAirdrop(keypair.publicKey, 1e9);
  await connection.confirmTransaction(sig, "confirmed");
  console.log("Airdrop confirmed.");
}

async function main() {
  const heliusKey = process.env.EXPO_PUBLIC_HELIUS_DEVNET_API_KEY;
  const endpoint = heliusKey
    ? `https://devnet.helius-rpc.com/?api-key=${heliusKey}`
    : clusterApiUrl("devnet");

  const connection = new Connection(endpoint, "confirmed");
  const authority = loadOrCreateAuthority();
  await ensureFunded(connection, authority);

  const umi = createUmi(endpoint).use(mplBubblegum());
  const umiSigner = createSignerFromKeypair(umi, fromWeb3JsKeypair(authority));
  umi.use(signerIdentity(umiSigner));

  const merkleTree = umi.eddsa.generateKeypair();
  const merkleTreeSigner = createSignerFromKeypair(umi, merkleTree);

  console.log(`Creating public receipt tree at ${merkleTree.publicKey}...`);
  const builder = await createTree(umi, {
    merkleTree: merkleTreeSigner,
    maxDepth: 14,
    maxBufferSize: 64,
    public: true,
  });
  await builder.sendAndConfirm(umi);

  console.log("\nDone. Receipt tree address:");
  console.log(toWeb3JsPublicKey(merkleTree.publicKey).toBase58());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
