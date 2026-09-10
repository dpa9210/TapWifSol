import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SegmentedButtons, Text } from "react-native-paper";

import { useAuthorization } from "../../utils/useAuthorization";
import { SignInFeature } from "../../components/sign-in/sign-in-feature";
import { MerchantView } from "./MerchantView";
import { CustomerView } from "./CustomerView";

type Role = "merchant" | "customer";

export function PayScreen() {
  const { selectedAccount } = useAuthorization();
  const [role, setRole] = useState<Role>("merchant");

  if (!selectedAccount) {
    return (
      <View style={styles.screenContainer}>
        <Text variant="titleMedium" style={styles.centerText}>
          Connect a wallet to send or receive a payment.
        </Text>
        <SignInFeature />
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <SegmentedButtons
        value={role}
        onValueChange={(value) => setRole(value as Role)}
        style={styles.segmented}
        buttons={[
          { value: "merchant", label: "Receive" },
          { value: "customer", label: "Pay" },
        ]}
      />
      {role === "merchant" ? (
        <MerchantView recipient={selectedAccount.publicKey} />
      ) : (
        <CustomerView payer={selectedAccount.publicKey} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 16,
  },
  segmented: {
    marginBottom: 16,
  },
  centerText: {
    textAlign: "center",
    marginBottom: 16,
  },
});
