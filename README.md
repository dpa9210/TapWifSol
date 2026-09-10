# TapWifSol

A mobile tap-to-pay app for the [Solana Mobile Hackathon](https://solanamobile.com/hackathon). One phone acts as a point-of-sale terminal; a customer either **taps** their phone against it over NFC or **scans** a QR code — both carry the same [Solana Pay](https://docs.solanapay.com/) transfer-request URL, so either transport lands on the exact same "parse → build transaction → sign" path. Signing goes through the [Mobile Wallet Adapter](https://docs.solanamobile.com/react-native/quickstart) protocol, so it works with whatever Solana wallet is already on the phone (Seed Vault on a Seeker device, or Phantom/Solflare on any Android phone) — no wallet-specific code.

Currently running on **devnet** for development and testing.

## Why

Most Solana Pay demos are QR-only. This app treats NFC tap-to-pay (via Android Host Card Emulation) as a first-class transport alongside QR, so it actually exercises the phone's hardware rather than just wrapping a payment link in an app shell — the kind of thing the Solana Mobile hardware track rewards.

## Features

- **Tap to pay** — the merchant screen broadcasts the payment request over NFC (HCE); the customer's phone reads it just by tapping.
- **Scan to pay** — every request is also a QR code, so there's always a fallback transport.
- **Any Solana wallet** — signing goes through Mobile Wallet Adapter, not a bundled wallet.
- **Live countdowns** — both the merchant's "waiting for payment" screen and the customer's "confirm in your wallet" screen show a real countdown and auto-cancel instead of silently failing once a blockhash expires.
- **Balance privacy** — a hide/unhide toggle on the balance card, because showing your balance on a POS screen in public isn't always what you want.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | React Native (Expo 52, custom dev client — not Expo Go) |
| Language | TypeScript, with a thin native Kotlin layer only where Expo can't reach (the NFC HCE service) |
| Payments | [`@solana/pay`](https://www.npmjs.com/package/@solana/pay), [`@solana/web3.js`](https://www.npmjs.com/package/@solana/web3.js) |
| Wallet | [Mobile Wallet Adapter](https://github.com/solana-mobile/mobile-wallet-adapter) (wallet-agnostic) |
| NFC | [`react-native-hce`](https://github.com/appidea/react-native-hce) (merchant broadcast), [`react-native-nfc-manager`](https://github.com/revtel/react-native-nfc-manager) (customer read) |
| QR | [`react-native-qrcode-svg`](https://github.com/awesomejerry/react-native-qrcode-svg), `expo-camera` |
| UI | React Native Paper (Material Design 3) |

## Running it

This project builds entirely from the CLI — no Android Studio required.

**Prerequisites**: Node 22, JDK 17, the Android SDK (`platform-tools`, `build-tools`, NDK), yarn (`corepack enable`), and a physical Android device with an MWA-compatible wallet installed (Phantom, Solflare, or Seed Vault on a Seeker device).

```bash
yarn install

# One-time: generate the native android/ project (already committed here —
# only needed if you're regenerating from scratch)
npx expo prebuild -p android

# Build and install
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Start the Metro dev server (from the project root)
npx expo start --dev-client
adb reverse tcp:8081 tcp:8081
```

You'll also need a devnet RPC endpoint — set `EXPO_PUBLIC_HELIUS_DEVNET_API_KEY` in a `.env` file (a free [Helius](https://helius.dev) API key works well; the public `api.devnet.solana.com` endpoint is rate-limited too aggressively for even solo testing).

Full setup notes, gotchas, and current project status live in [AGENTS.md](./AGENTS.md).

## Status

Built for the Solana Mobile Hackathon (submissions close October 8, 2026). Core wallet connect + devnet signing, the Solana Pay QR flow, and NFC tap-to-pay are all built and smoke-tested on real hardware; see [AGENTS.md](./AGENTS.md) for the detailed, up-to-date build log and what's still outstanding.

## License

MIT — see [LICENSE](./LICENSE).
