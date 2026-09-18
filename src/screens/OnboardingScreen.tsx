import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Avatar, Button, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { BRAND_FONT_EXTRABOLD } from "../hooks/useBrandFonts";

type Slide = {
  icon: React.ComponentProps<typeof MaterialCommunityIcon>["name"];
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    icon: "cellphone-nfc",
    title: "Welcome to TapWifSol",
    body: "Turn your phone into a point-of-sale terminal for Solana — tap, scan, and get paid in SOL.",
  },
  {
    icon: "wifi",
    title: "Tap or scan to pay",
    body: "Merchants broadcast a payment request over NFC — the customer just taps phones. Every request is also a QR code, so there's always a fallback.",
  },
  {
    icon: "wallet",
    title: "Signed by your own wallet",
    body: "Payments are signed directly in your Solana wallet via Mobile Wallet Adapter — this app never holds your funds. Every payment lands in History automatically.",
  },
];

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.skipRow}>
        {!isLast && (
          <Button mode="text" onPress={onDone} textColor={theme.colors.onSurfaceVariant}>
            Skip
          </Button>
        )}
      </View>

      <View style={styles.content}>
        <Avatar.Icon
          icon={slide.icon}
          size={88}
          style={{ backgroundColor: theme.colors.primaryContainer }}
          color={theme.colors.onPrimaryContainer}
        />
        <Text
          variant="headlineMedium"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          {slide.title}
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.body, { color: theme.colors.onSurfaceVariant }]}
        >
          {slide.body}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === index ? theme.colors.primary : theme.colors.outlineVariant,
                  width: i === index ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
        <Button
          mode="contained"
          onPress={() => (isLast ? onDone() : setIndex(index + 1))}
          style={styles.nextButton}
        >
          {isLast ? "Get Started" : "Next"}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  skipRow: {
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  title: {
    fontFamily: BRAND_FONT_EXTRABOLD,
    textAlign: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  body: {
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    paddingBottom: 8,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: "100%",
  },
});
