import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  createTransfer,
  encodeURL,
  findReference,
  FindReferenceError,
  parseURL,
  TransferRequestURLFields,
} from "@solana/pay";
import BigNumber from "bignumber.js";

export const MERCHANT_LABEL = "TapWifSol";

export type PaymentRequest = {
  url: URL;
  reference: PublicKey;
  fields: TransferRequestURLFields;
};

/**
 * Builds a Solana Pay transfer-request URL for a fixed SOL amount, with a
 * fresh one-time reference key the merchant can watch for on-chain. This is
 * the one payload both the QR and NFC transports carry — see AGENTS.md.
 */
export function createPaymentRequest(params: {
  recipient: PublicKey;
  amountSol: string;
  message?: string;
}): PaymentRequest {
  const reference = Keypair.generate().publicKey;
  const fields: TransferRequestURLFields = {
    recipient: params.recipient,
    amount: new BigNumber(params.amountSol),
    reference,
    label: MERCHANT_LABEL,
    message: params.message,
  };
  return { url: encodeURL(fields), reference, fields };
}

export type PaymentFields = TransferRequestURLFields & { amount: BigNumber };

/**
 * Parses a scanned/tapped Solana Pay URL. Only direct transfer-request links
 * with a fixed amount are supported — transaction-request links (which point
 * back to a merchant server for a dynamically-built transaction) and
 * amount-less requests are out of scope for this app.
 */
export function parsePaymentURL(urlString: string): PaymentFields {
  const parsed = parseURL(urlString);
  if (!("recipient" in parsed)) {
    throw new Error(
      "This QR/tap is a transaction-request link, which this app doesn't support — only direct transfer requests."
    );
  }
  if (!parsed.amount) {
    throw new Error("This payment request is missing an amount.");
  }
  return parsed as PaymentFields;
}

export async function buildPaymentTransaction(
  connection: Connection,
  payer: PublicKey,
  fields: PaymentFields
): Promise<Transaction> {
  return createTransfer(connection, payer, fields);
}

/**
 * Polls until a transaction referencing `reference` shows up on-chain, or
 * the timeout elapses. This is how the merchant screen detects "paid"
 * without running its own backend/webhook.
 */
export async function waitForPayment(
  connection: Connection,
  reference: PublicKey,
  options?: { pollIntervalMs?: number; timeoutMs?: number; signal?: AbortSignal }
): Promise<string> {
  const pollIntervalMs = options?.pollIntervalMs ?? 1500;
  const timeoutMs = options?.timeoutMs ?? 120_000;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (options?.signal?.aborted) {
      throw new Error("Cancelled");
    }
    try {
      const result = await findReference(connection, reference, {
        finality: "confirmed",
      });
      return result.signature;
    } catch (error) {
      if (!(error instanceof FindReferenceError)) {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("Timed out waiting for payment");
}
