import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

import { Section } from "../Section";
import { useAuthorization } from "../utils/useAuthorization";
import { AccountDetailFeature } from "../components/account/account-detail-feature";
import { SignInFeature } from "../components/sign-in/sign-in-feature";
import { BrandIcon } from "../components/BrandIcon";
import { BRAND_FONT_EXTRABOLD } from "../hooks/useBrandFonts";

export function HomeScreen() {
  const { selectedAccount } = useAuthorization();
  const theme = useTheme();

  return (
    <View style={styles.screenContainer}>
      <View style={styles.brandRow}>
        <BrandIcon />
        <View style={styles.brandText}>
          <Text style={styles.title} variant="headlineMedium">
            TapWifSol
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Tap, scan, get paid in SOL
          </Text>
        </View>
      </View>
      {selectedAccount ? (
        <AccountDetailFeature />
      ) : (
        <>
          <Section
            title="Tap to pay"
            description="Broadcast a payment request over NFC — the customer just taps their phone against yours."
          />
          <Section
            title="Scan to pay"
            description="Every request is also a QR code, so a tap-in-progress always has a scan fallback."
          />
          <Section
            title="Get started"
            description="Connect or sign in with Solana (SIWS) to link your wallet account."
          />
          <SignInFeature />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    padding: 16,
    flex: 1,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  brandText: {
    marginLeft: 12,
  },
  title: {
    fontFamily: BRAND_FONT_EXTRABOLD,
  },
  buttonGroup: {
    flexDirection: "column",
    paddingVertical: 4,
  },
});
