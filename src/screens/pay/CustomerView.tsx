import React, { useCallback, useEffect, useRef, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Avatar, Button, ProgressBar, Text } from "react-native-paper";
import { CameraView, useCameraPermissions } from "expo-camera";
import { PublicKey } from "@solana/web3.js";
import type { BarcodeScanningResult } from "expo-camera";

import { useConnection } from "../../utils/ConnectionProvider";
import { useMobileWallet } from "../../utils/useMobileWallet";
import { alertAndLog } from "../../utils/alertAndLog";
import { buildPaymentTransaction, parsePaymentURL } from "../../solana/solanaPay";
import { cancelNfcRead, readOneNfcUrl } from "../../nfc/nfcReader";
import { useCountdown, formatCountdown } from "../../hooks/useCountdown";

type Status = "scanning" | "processing" | "sent";

// Solana blockhashes expire in roughly 60-90s (see AGENTS.md) — cap wallet
// approval to 60s so a stalled approval fails fast with a clear message
// instead of quietly dying to "Transaction expired" from the wallet later.
const SIGN_TIMEOUT_SECONDS = 60;

// A failed attempt resets status to "scanning", which immediately re-arms
// the NFC listener — if the phones are still touching from the same tap,
// the tag gets rediscovered instantly and re-fires with the identical URL
// before the user did anything. Refuse to re-attempt the same URL within
// this window so one physical tap can't stack two wallet launches.
const RETRY_COOLDOWN_MS = 3000;

export function CustomerView({ payer }: { payer: PublicKey }) {
  const { connection } = useConnection();
  const wallet = useMobileWallet();
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<Status>("scanning");
  const [signature, setSignature] = useState<string | null>(null);
  // Read via a ref too, so the NFC effect (which only runs once) always
  // checks the *current* status rather than the value from when it started.
  const statusRef = useRef(status);
  statusRef.current = status;
  // Guards a payment attempt in flight so a timeout can make the UI move on
  // (back to "scanning") without a late wallet response clobbering it.
  const cancelTokenRef = useRef<{ cancelled: boolean } | null>(null);
  const lastFailedRef = useRef<{ url: string; until: number } | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const processPaymentUrl = useCallback(
    async (urlString: string) => {
      if (statusRef.current !== "scanning") return;
      const lastFailed = lastFailedRef.current;
      if (
        lastFailed &&
        lastFailed.url === urlString &&
        Date.now() < lastFailed.until
      ) {
        return;
      }
      currentUrlRef.current = urlString;
      const token = { cancelled: false };
      cancelTokenRef.current = token;
      setStatus("processing");
      try {
        const fields = parsePaymentURL(urlString);
        const {
          context: { slot: minContextSlot },
        } = await connection.getLatestBlockhashAndContext();
        const transaction = await buildPaymentTransaction(
          connection,
          payer,
          fields
        );
        const sig = await wallet.signAndSendTransaction(
          transaction,
          minContextSlot
        );
        if (token.cancelled) return;
        await connection.confirmTransaction(sig, "confirmed");
        if (token.cancelled) return;
        setSignature(sig);
        setStatus("sent");
      } catch (error: any) {
        if (token.cancelled) return;
        lastFailedRef.current = {
          url: urlString,
          until: Date.now() + RETRY_COOLDOWN_MS,
        };
        alertAndLog("Payment failed", String(error?.message ?? error));
        setStatus("scanning");
      }
    },
    [connection, payer, wallet]
  );

  const handleSignTimeout = useCallback(() => {
    if (cancelTokenRef.current) cancelTokenRef.current.cancelled = true;
    if (currentUrlRef.current) {
      lastFailedRef.current = {
        url: currentUrlRef.current,
        until: Date.now() + RETRY_COOLDOWN_MS,
      };
    }
    alertAndLog(
      "Transaction expired",
      "You took too long to approve in your wallet, so this request timed out. Scan or tap again to retry."
    );
    setStatus("scanning");
  }, []);

  const secondsLeft = useCountdown(
    SIGN_TIMEOUT_SECONDS,
    status === "processing",
    handleSignTimeout
  );

  const handleScan = useCallback(
    (result: BarcodeScanningResult) => {
      processPaymentUrl(result.data);
    },
    [processPaymentUrl]
  );

  // Listen for an NFC tap in parallel with the camera — whichever transport
  // completes first wins. NFC unsupported/unavailable just means this
  // listener never resolves; the camera path still works on its own.
  useEffect(() => {
    if (status !== "scanning") return;
    let active = true;
    readOneNfcUrl()
      .then((url) => {
        if (active) processPaymentUrl(url);
      })
      .catch(() => {
        // No NFC tap happened (unsupported hardware, cancelled, etc.) —
        // nothing to do, the QR path is still live.
      });
    return () => {
      active = false;
      cancelNfcRead();
    };
  }, [status, processPaymentUrl]);

  const scanAgain = useCallback(() => {
    setSignature(null);
    setStatus("scanning");
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.centerText}>
          Camera access is needed to scan a payment QR code.
        </Text>
        <Button mode="contained" onPress={requestPermission}>
          Grant camera permission
        </Button>
      </View>
    );
  }

  if (status === "sent") {
    return (
      <View style={styles.container}>
        <Avatar.Icon icon="check-circle" size={64} style={styles.successIcon} />
        <Text variant="titleMedium" style={[styles.centerText, styles.success]}>
          Payment sent!
        </Text>
        <Button
          mode="text"
          compact
          onPress={() =>
            Linking.openURL(`https://solscan.io/tx/${signature}?cluster=devnet`)
          }
        >
          View {signature?.slice(0, 20)}… on Solscan
        </Button>
        <Button mode="contained" onPress={scanAgain} style={styles.button}>
          Scan another
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      {status === "scanning" && (
        <>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={handleScan}
          />
          <View pointerEvents="none" style={styles.viewfinder} />
        </>
      )}
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          {status === "processing"
            ? "Confirm the payment in your wallet…"
            : "Scan a payment QR code or tap the merchant's phone"}
        </Text>
        {status === "processing" && (
          <>
            <Text style={[styles.overlayText, styles.countdownText]}>
              Expires in {formatCountdown(secondsLeft)}
            </Text>
            <ProgressBar
              progress={secondsLeft / SIGN_TIMEOUT_SECONDS}
              style={styles.progressBar}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    minHeight: 400,
    backgroundColor: "black",
  },
  overlay: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    padding: 12,
  },
  overlayText: {
    color: "white",
    textAlign: "center",
  },
  countdownText: {
    marginTop: 6,
    fontVariant: ["tabular-nums"],
  },
  progressBar: {
    marginTop: 8,
    height: 6,
    borderRadius: 3,
  },
  viewfinder: {
    position: "absolute",
    top: "28%",
    left: "15%",
    right: "15%",
    aspectRatio: 1,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.85)",
    borderRadius: 24,
  },
  centerText: {
    textAlign: "center",
    marginBottom: 16,
  },
  success: {
    fontWeight: "bold",
  },
  successIcon: {
    backgroundColor: "#14F195",
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
});
