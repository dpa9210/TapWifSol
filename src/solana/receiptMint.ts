import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplBubblegum, mintV1 } from "@metaplex-foundation/mpl-bubblegum";
import {
  fromWeb3JsPublicKey,
  toWeb3JsInstruction,
} from "@metaplex-foundation/umi-web3js-adapters";
import { createNoopSigner } from "@metaplex-foundation/umi";

// One-time public Bubblegum tree created by scripts/createReceiptTree.ts —
// "public: true" means any signer can mint into it, which is what lets the
// customer's own MWA signature cover both the SOL transfer and this mint in
// a single transaction (see buildReceiptMintInstruction below).
export const RECEIPT_TREE_ADDRESS = "956gzviikZbDPXr2z9dDcGmtNAKdHuhPHWUt2qgrqdtT";
export const RECEIPT_METADATA_URI =
  "https://raw.githubusercontent.com/dpa9210/TapWifSol/main/assets/receipt-metadata.json";

/**
 * Builds (but does not sign or send) the Bubblegum mint instruction for a
 * payment-receipt cNFT, minted directly into the payer's own wallet as
 * `leafOwner`. Because the tree is public, the payer's single signature also
 * covers the `payer`/`treeCreatorOrDelegate` signer roles here — no
 * merchant co-signature or backend key needed. The caller appends this
 * instruction to the same Transaction as the SOL transfer before MWA signs.
 */
export function buildReceiptMintInstruction(
  rpcEndpoint: string,
  payer: PublicKey,
  amountSol: string,
  isSkrHolder: boolean = false
): TransactionInstruction {
  const umi = createUmi(rpcEndpoint).use(mplBubblegum());
  const payerUmiKey = fromWeb3JsPublicKey(payer);
  const noop = createNoopSigner(payerUmiKey);

  // The metadata JSON/image is one static file shared by every receipt —
  // the "SKR Holder" tier is expressed purely through this per-mint name,
  // since a public tree + static metadata can't otherwise carry a
  // per-payment attribute.
  const name = isSkrHolder
    ? `TapWifSol Receipt — ${amountSol} SOL (SKR Holder)`
    : `TapWifSol Receipt — ${amountSol} SOL`;

  const builder = mintV1(umi, {
    leafOwner: payerUmiKey,
    merkleTree: fromWeb3JsPublicKey(new PublicKey(RECEIPT_TREE_ADDRESS)),
    payer: noop,
    treeCreatorOrDelegate: noop,
    metadata: {
      name,
      symbol: "TWSRCPT",
      uri: RECEIPT_METADATA_URI,
      sellerFeeBasisPoints: 0,
      collection: null,
      creators: [],
    },
  });

  const [ix] = builder.getInstructions();
  return toWeb3JsInstruction(ix);
}
