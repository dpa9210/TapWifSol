import React from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Divider, List, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";

const HOW_IT_WORKS: {
  icon: React.ComponentProps<typeof MaterialCommunityIcon>["name"];
  title: string;
  description: string;
}[] = [
  {
    icon: "wallet-outline",
    title: "Connect your wallet",
    description: "Link any Solana Mobile Wallet Adapter–compatible wallet — no account or sign-up.",
  },
  {
    icon: "cellphone-nfc",
    title: "Tap or scan",
    description: "A merchant broadcasts a payment request over NFC and as a QR code; the customer taps or scans.",
  },
  {
    icon: "shield-check-outline",
    title: "Approve in your wallet",
    description: "The transaction is built on-device and signed in your own wallet app — TapWifSol never holds your funds.",
  },
  {
    icon: "receipt",
    title: "Get a receipt",
    description: "Every payment is saved to History, with an optional compressed-NFT receipt minted straight to your wallet.",
  },
];

export function AboutScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.brandRow}>
        <Avatar.Icon
          icon="cellphone-nfc"
          size={56}
          style={{ backgroundColor: theme.colors.primaryContainer }}
          color={theme.colors.onPrimaryContainer}
        />
        <View style={styles.brandText}>
          <Text variant="headlineSmall" style={styles.title}>
            TapWifSol
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Version 1.0.0
          </Text>
        </View>
      </View>

      <Text variant="bodyLarge" style={styles.intro}>
        TapWifSol turns any phone into a point-of-sale terminal for Solana.
        Tap two phones together or scan a QR code to send or receive SOL
        instantly — signed by your own wallet, with no middleman.
      </Text>

      <Text
        variant="labelLarge"
        style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
      >
        HOW IT WORKS
      </Text>
      <View style={styles.card}>
        {HOW_IT_WORKS.map((step, i) => (
          <React.Fragment key={step.title}>
            <List.Item
              title={step.title}
              description={step.description}
              descriptionNumberOfLines={3}
              left={(props) => <List.Icon {...props} icon={step.icon} />}
            />
            {i < HOW_IT_WORKS.length - 1 && <Divider style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>

      <Text
        variant="labelLarge"
        style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}
      >
        LINKS
      </Text>
      <View style={styles.card}>
        <List.Item
          title="Source code"
          description="github.com/dpa9210/TapWifSol"
          left={(props) => <List.Icon {...props} icon="github" />}
          onPress={() => Linking.openURL("https://github.com/dpa9210/TapWifSol")}
        />
      </View>

      <Text style={[styles.footnote, { color: theme.colors.onSurfaceVariant }]}>
        Payments run on Solana devnet by default — switch networks in Settings.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  brandText: {
    marginLeft: 14,
  },
  title: {
    fontWeight: "bold",
  },
  intro: {
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionLabel: {
    letterSpacing: 0.5,
    marginBottom: 4,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  divider: {
    marginLeft: 72,
  },
  footnote: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 4,
  },
});
