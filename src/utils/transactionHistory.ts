import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "tapwifsol.transactionHistory";
const MAX_ENTRIES = 50;

export type HistoryEntry = {
  signature: string;
  direction: "sent" | "received";
  amountSol: string;
  counterparty: string | null;
  timestamp: number;
};

export async function getHistory(): Promise<HistoryEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

/**
 * Newest first, capped at MAX_ENTRIES — this is a local per-device log for
 * the demo/UI, not a source of truth (Solscan is), so unbounded growth
 * isn't worth guarding against more carefully than a simple cap.
 */
export async function addHistoryEntry(
  entry: Omit<HistoryEntry, "timestamp">
): Promise<void> {
  const existing = await getHistory();
  const next = [{ ...entry, timestamp: Date.now() }, ...existing].slice(
    0,
    MAX_ENTRIES
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
