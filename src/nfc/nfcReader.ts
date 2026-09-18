import NfcManager, {
  Ndef,
  NfcAdapter,
  NfcEvents,
  type TagEvent,
} from "react-native-nfc-manager";

let started = false;

async function ensureStarted(): Promise<void> {
  if (!started) {
    await NfcManager.start();
    started = true;
  }
}

function extractUrlFromTag(tag: TagEvent): string | null {
  for (const record of tag.ndefMessage ?? []) {
    if (record.tnf !== Ndef.TNF_WELL_KNOWN) continue;
    const type =
      typeof record.type === "string"
        ? record.type
        : Ndef.util.bytesToString(record.type);
    if (type === Ndef.RTD_URI) {
      return Ndef.uri.decodePayload(new Uint8Array(record.payload));
    }
  }
  return null;
}

/**
 * Resolves with the URL string from the next NFC tag tapped (reading the
 * merchant's HCE broadcast the same way it would read a passive NDEF
 * sticker — no custom reader logic needed for HCE specifically). Rejects if
 * NFC isn't supported/enabled on this device; callers should treat that as
 * "fall back to QR" rather than a hard error.
 */
export async function readOneNfcUrl(): Promise<string> {
  await ensureStarted();
  const supported = await NfcManager.isSupported();
  if (!supported) {
    throw new Error("NFC is not supported on this device");
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.unregisterTagEvent().catch(() => {});
    };
    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
      cleanup();
      const url = extractUrlFromTag(tag);
      if (url) {
        resolve(url);
      } else {
        reject(new Error("That tag didn't contain a payment link"));
      }
    });
    NfcManager.registerTagEvent({
      isReaderModeEnabled: true,
      // Reader mode defaults to requesting zero NFC technologies
      // (readerModeFlags: 0) unless told otherwise, which makes Android's
      // enableReaderMode a silent no-op — logs "Reader mode Binder was
      // never registered" and never actually polls for a tag. HCE Type-4
      // tags (what the merchant broadcasts) show up over NFC-A.
      readerModeFlags: NfcAdapter.FLAG_READER_NFC_A,
    }).catch((error) => {
      cleanup();
      reject(error);
    });
  });
}

export async function cancelNfcRead(): Promise<void> {
  NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
  await NfcManager.unregisterTagEvent().catch(() => {});
}
