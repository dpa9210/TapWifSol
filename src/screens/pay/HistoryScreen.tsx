import React, { useCallback, useState } from "react";
import { FlatList, Linking, Pressable, StyleSheet, View } from "react-native";
import { Avatar, List, Text, useTheme } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import * as Clipboard from "expo-clipboard";

import { getHistory, HistoryEntry } from "../../utils/transactionHistory";

function shortenKey(key: string): string {
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString();
}

function HistoryRow({ item }: { item: HistoryEntry }) {
  const isSent = item.direction === "sent";
  const theme = useTheme();

  return (
    <List.Item
      title={`${isSent ? "-" : "+"}${item.amountSol} SOL`}
      titleStyle={isSent ? styles.sentText : styles.receivedText}
      description={() => (
        <View>
          <Text variant="bodySmall" style={styles.dateText}>
            {formatTimestamp(item.timestamp)}
          </Text>
          {item.counterparty && (
            <Pressable
              style={styles.addressRow}
              onPress={() => Clipboard.setStringAsync(item.counterparty!)}
              hitSlop={8}
            >
              <Text variant="bodySmall" style={styles.addressText}>
                {shortenKey(item.counterparty)}
              </Text>
              <MaterialCommunityIcon
                name="content-copy"
                size={14}
                color={theme.colors.onSurfaceVariant}
                style={styles.copyIcon}
              />
            </Pressable>
          )}
        </View>
      )}
      left={(props) => (
        <Avatar.Icon
          {...props}
          size={40}
          icon={isSent ? "arrow-up" : "arrow-down"}
          style={isSent ? styles.sentIcon : styles.receivedIcon}
        />
      )}
      onPress={() =>
        Linking.openURL(
          `https://solscan.io/tx/${item.signature}?cluster=devnet`
        )
      }
    />
  );
}

export function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
    }, [])
  );

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.centerText}>
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
    padding: 16,
  },
  centerText: {
    textAlign: "center",
  },
  listContent: {
    paddingVertical: 8,
  },
  sentText: {
    color: "#FF6B6B",
    fontWeight: "bold",
  },
  receivedText: {
    color: "#14F195",
    fontWeight: "bold",
  },
  sentIcon: {
    backgroundColor: "#FF6B6B",
  },
  receivedIcon: {
    backgroundColor: "#14F195",
  },
  dateText: {
    marginTop: 2,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  addressText: {
    fontVariant: ["tabular-nums"],
  },
  copyIcon: {
    marginLeft: 6,
  },
});
