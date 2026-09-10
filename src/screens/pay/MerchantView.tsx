import React, { useCallback, useEffect, useRef, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import {
  Avatar,
  Button,
  Chip,
  ProgressBar,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import QRCode from "react-native-qrcode-svg";
import { PublicKey } from "@solana/web3.js";

import { useConnection } from "../../utils/ConnectionProvider";
import { alertAndLog } from "../../utils/alertAndLog";
import {
  createPaymentRequest,
  PaymentRequest,
  waitForPayment,
} from "../../solana/solanaPay";
import { broadcastPaymentUrl, stopBroadcast } from "../../nfc/hceBroadcast";
import { useCountdown, formatCountdown } from "../../hooks/useCountdown";

type Status = "idle" | "waiting" | "paid" | "timedOut";

// Matches waitForPayment's own default timeoutMs — the visible countdown
// should reach zero at (about) the same moment the poll gives up.
const WAIT_SECONDS = 120;
const QUICK_AMOUNTS = ["0.01", "0.05", "0.1", "0.5"];

export function MerchantView({ recipient }: { recipient: PublicKey }) {
  const { connection } = useConnection();
  const theme = useTheme();
  const [amount, setAmount] = useState("0.01");
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [signature, setSignature] = useState<string | null>(null);
  const [nfcBroadcasting, setNfcBroadcasting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const secondsLeft = useCountdown(WAIT_SECONDS, status === "waiting", () => {
    // waitForPayment's own timeout fires around the same moment and sets
    // "timedOut" itself; this is just a belt-and-suspenders UI guard.
    setStatus((s) => (s === "waiting" ? "timedOut" : s));
  });

  // Broadcast the same URL the QR code carries over NFC, so either transport
  // can complete the payment. NFC hardware/support varies, so a failure here
  // just means "no NFC option this time" — the QR code still works.
  useEffect(() => {
    if (!request) {
      setNfcBroadcasting(false);
      return;
    }
    let cancelled = false;
    broadcastPaymentUrl(request.url.toString())
      .then(() => {
        if (!cancelled) setNfcBroadcasting(true);
      })
      .catch(() => {
        if (!cancelled) setNfcBroadcasting(false);
      });
    return () => {
      cancelled = true;
      stopBroadcast().catch(() => {});
    };
  }, [request]);

  const createRequest = useCallback(() => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      alertAndLog("Invalid amount", "Enter a positive SOL amount.");
      return;
    }

    const paymentRequest = createPaymentRequest({
      recipient,
      amountSol: amount,
    });
    setRequest(paymentRequest);
    setSignature(null);
    setStatus("waiting");

    const controller = new AbortController();
    abortRef.current = controller;
    waitForPayment(connection, paymentRequest.reference, {
      signal: controller.signal,
    })
      .then((sig) => {
        setSignature(sig);
        setStatus("paid");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setStatus("timedOut");
        alertAndLog("No payment detected", String(error?.message ?? error));
      });
  }, [amount, connection, recipient]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setRequest(null);
    setStatus("idle");
    setSignature(null);
  }, []);

  if (request) {
    return (
      <View style={styles.container}>
        <Surface style={styles.qrWrap} elevation={3}>
          <QRCode value={request.url.toString()} size={240} />
        </Surface>
        <Text variant="titleMedium" style={styles.centerText}>
          Requesting {amount} SOL
        </Text>
        <Chip
          icon={nfcBroadcasting ? "wifi" : "qrcode-scan"}
          style={styles.transportChip}
        >
          {nfcBroadcasting
            ? "Scan the QR or tap phones together"
            : "Scan the QR to pay"}
        </Chip>

        {status === "waiting" && (
          <View style={styles.statusBlock}>
            <Text style={styles.centerText}>
              Waiting for the customer to scan and pay…
            </Text>
            <Text
              variant="titleMedium"
              style={[styles.centerText, styles.countdownText]}
            >
              Expires in {formatCountdown(secondsLeft)}
            </Text>
            <View style={styles.progressBarWrap}>
              <ProgressBar
                progress={secondsLeft / WAIT_SECONDS}
                style={styles.progressBar}
              />
            </View>
          </View>
        )}
        {status === "paid" && (
          <View style={styles.statusBlock}>
            <Avatar.Icon
              icon="check-circle"
              size={56}
              style={{ backgroundColor: theme.colors.secondary }}
            />
            <Text
              variant="titleMedium"
              style={[styles.centerText, styles.success]}
            >
              Payment received!
            </Text>
            <Button
              mode="text"
              compact
              onPress={() =>
                Linking.openURL(
                  `https://solscan.io/tx/${signature}?cluster=devnet`
                )
              }
            >
              View {signature?.slice(0, 12)}… on Solscan
            </Button>
          </View>
        )}
        {status === "timedOut" && (
          <Text style={styles.centerText}>
            No payment detected in time — the request is still valid, try
            again or cancel.
          </Text>
        )}
        <Button mode="outlined" onPress={reset} style={styles.button}>
          {status === "paid" ? "New request" : "Cancel"}
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        label="Amount (SOL)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <View style={styles.quickAmountRow}>
        {QUICK_AMOUNTS.map((value) => (
          <Chip
            key={value}
            selected={amount === value}
            onPress={() => setAmount(value)}
            style={styles.quickAmountChip}
          >
            {value} SOL
          </Chip>
        ))}
      </View>
      <Button mode="contained" onPress={createRequest} style={styles.button}>
        Create payment request
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
  },
  input: {
    width: "100%",
    marginBottom: 12,
  },
  quickAmountRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 4,
  },
  quickAmountChip: {
    margin: 4,
  },
  qrWrap: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  transportChip: {
    marginBottom: 12,
  },
  statusBlock: {
    alignItems: "center",
    width: "100%",
    marginTop: 4,
  },
  countdownText: {
    fontVariant: ["tabular-nums"],
  },
  progressBarWrap: {
    width: "80%",
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  centerText: {
    textAlign: "center",
    marginBottom: 8,
  },
  success: {
    fontWeight: "bold",
  },
  button: {
    marginTop: 16,
    width: "100%",
  },
});
