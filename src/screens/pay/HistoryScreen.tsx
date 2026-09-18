import React, { useCallback, useState } from "react";
import { FlatList, Linking, Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import * as Clipboard from "expo-clipboard";

import { getHistory, HistoryEntry } from "../../utils/transactionHistory";
import { DANGER_CORAL } from "../../theme";

function shortenKey(key: string): string {
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

function formatTimestamp(ms: number): string {
  const date = new Date(ms);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (isToday) return time;
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${time}`;
}

function HistoryRow({ item }: { item: HistoryEntry }) {
  const isSent = item.direction === "sent";
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const amountColor = isSent ? DANGER_CORAL : theme.colors.secondary;
  const iconBg = isSent
    ? "rgba(255, 138, 112, 0.16)"
    : theme.colors.secondaryContainer;

  const copyAddress = useCallback(() => {
    if (!item.counterparty) return;
    Clipboard.setStringAsync(item.counterparty);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [item.counterparty]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.colors.outlineVariant },
        pressed && { opacity: 0.6 },
      ]}
      onPress={() =>
        Linking.openURL(`https://solscan.io/tx/${item.signature}?cluster=devnet`)
      }
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcon
          name={isSent ? "arrow-up" : "arrow-down"}
          size={18}
          color={amountColor}
        />
      </View>

      <View style={styles.midColumn}>
        <Text
          variant="bodyMedium"
          style={[styles.dateText, { color: theme.colors.onSurface }]}
        >
          {isSent ? "Sent" : "Received"} · {formatTimestamp(item.timestamp)}
        </Text>
        {item.counterparty && (
          <Pressable style={styles.addressRow} onPress={copyAddress} hitSlop={8}>
            <Text
              variant="bodySmall"
              style={[styles.addressText, { color: theme.colors.onSurfaceVariant }]}
            >
              {copied ? "Copied" : shortenKey(item.counterparty)}
            </Text>
            <MaterialCommunityIcon
              name={copied ? "check" : "content-copy"}
              size={12}
              color={theme.colors.onSurfaceVariant}
              style={styles.copyIcon}
            />
          </Pressable>
        )}
      </View>

      <Text
        variant="titleMedium"
        style={[styles.amountText, { color: amountColor }]}
      >
        {isSent ? "−" : "+"}
        {item.amountSol}
      </Text>
    </Pressable>
  );
}

export function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const theme = useTheme();

  useFocusEffect(
    useCallback(() => {
      getHistory().then((entries) =>
        setHistory([...entries].sort((a, b) => b.timestamp - a.timestamp))
      );
    }, [])
  );

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcon
          name="receipt"
          size={40}
          color={theme.colors.onSurfaceVariant}
          style={styles.emptyIcon}
        />
        <Text style={[styles.centerText, { color: theme.colors.onSurfaceVariant }]}>
          No payments yet — sent and received payments will show up here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.signature}
      renderItem={({ item }) => <HistoryRow item={item} />}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  centerText: {
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  midColumn: {
    flex: 1,
    minWidth: 0,
  },
  dateText: {
    fontWeight: "600",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  addressText: {
    fontVariant: ["tabular-nums"],
  },
  copyIcon: {
    marginLeft: 5,
  },
  amountText: {
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginLeft: 8,
  },
});
