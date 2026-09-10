import { HCESession, NFCTagType4, NFCTagType4NDEFContentType } from "react-native-hce";

let sessionPromise: Promise<HCESession> | null = null;

function getSession(): Promise<HCESession> {
  if (!sessionPromise) {
    sessionPromise = HCESession.getInstance();
  }
  return sessionPromise;
}

/**
 * Broadcasts a Solana Pay URL over NFC as a Type 4 Tag (URI NDEF record), so
 * a customer's phone can read it by tapping this one — the same payload the
 * QR code carries. Safe to call repeatedly with a new URL per transaction;
 * `setApplication` updates the live session's content in place.
 */
export async function broadcastPaymentUrl(url: string): Promise<void> {
  const session = await getSession();
  const tag = new NFCTagType4({
    type: NFCTagType4NDEFContentType.URL,
    content: url,
    writable: false,
  });
  await session.setApplication(tag);
  await session.setEnabled(true);
}

export async function stopBroadcast(): Promise<void> {
  const session = await getSession();
  await session.setEnabled(false);
}
