# TapWifSol — Solana Mobile Hackathon Project Guide

Read the exact versioned Expo docs at https://docs.expo.dev/versions/v52.0.0/ before writing any code — Expo moves fast and training data goes stale.

## What we're building

A mobile tap-to-pay app for the Solana dApp Store: one phone acts as a point-of-sale terminal, another taps it via NFC (or scans a QR code as an equivalent transport) to pay in SOL/USDC. Both transports carry the same Solana Pay transfer-request URL, feeding one shared "parse → build transaction → sign via Mobile Wallet Adapter" code path. Full architecture rationale lives in the approved plan (see "Plan file" below); this doc tracks living status and gotchas.

**Plan file**: `/home/ninja/.claude/plans/adaptive-launching-raven.md` has the original approved architecture and week-by-week breakdown. Treat this AGENTS.md as the up-to-date companion — when the two disagree, this file wins (it reflects what we actually learned by testing on real hardware).

## Hackathon essentials

- Deadline: submissions close **October 8, 2026**. Winners announced early November 2026.
- $135k total prizes; a dedicated **$10,000 for a creative SKR integration** (stretch goal, lowest priority — only attempt after the core app is submittable).
- **Winning apps must be published on the Solana dApp Store to claim prize money.** Shipping something small and finished beats something ambitious and half-working.
- Core loop before anything else: **install a wallet on-device, switch it to Devnet (free practice network), get free practice SOL from a faucet, connect the wallet to the app, and sign a transaction on devnet.** That's the whole spine of a Seeker dApp — we proved this works end-to-end in week 1 (see Status below).
- Path to entering: get the app running and signing on devnet → publish to the Solana dApp Store → apply for a Builder Grant → come back to the hackathon site (Align) and open **CLOCK IN REGISTRATION** to register the team → open **SUBMISSION** when the app is ready to enter.
- Toolbox / docs: solanamobile.com/hackathon, Solana Mobile developer docs, Mobile Wallet Adapter docs, Solana dApp Store Publishing Portal, Radiants Discord for workshops/support.

## Status

**Week 1 — done.** Proven end-to-end on real hardware (one Seeker-class Android device + a second Android phone running Solflare):
- CLI-only Android build toolchain works with zero Android Studio (Gradle + NDK + Kotlin compiled fine; `adb install` onto physical devices over USB).
- Mobile Wallet Adapter connect flow: our app's "Connect" button correctly triggers the wallet picker/association and lands an authorized session with Solflare. MWA is wallet-agnostic — no wallet-specific code needed (works the same against Solflare or Seed Vault Wallet).
- A real signed devnet transfer (self-send of 0.01 SOL) reached **finalized** status on-chain with no error, signed via Solflare through MWA.

**Week 2 — core logic done, live two-device scan test still pending.** Built the shared Solana Pay layer (`src/solana/solanaPay.ts`: `createPaymentRequest`, `parsePaymentURL`, `buildPaymentTransaction`, `waitForPayment`) and a new "Pay" tab (`src/screens/pay/`) with `MerchantView` (amount input → QR code → polls `findReference` for payment) and `CustomerView` (camera → scan → parse → sign via MWA → confirm). Verified on-device: QR generation renders correctly, camera permission + live preview + scan overlay all render correctly, and the full encode→parse→build round trip was independently confirmed against the live Helius connection (a standalone script reproduced the same `@solana/pay` calls the app makes and successfully built a valid, correctly fee-paid, blockhash-set transaction). **Not yet tested**: an actual live QR scan (needs a second device to display the QR while the first scans it — can't usefully test on one device alone).

**⚠ Reminder: run the live two-device QR test.** User explicitly asked to be reminded — don't let this slip. Needs the second Android phone (Phantom/Solflare) connected so the app can be installed and a real scan-and-pay driven between both devices.

**Week 3 — NFC — built, rebuild/on-device test pending.** Added `src/nfc/hceBroadcast.ts` (merchant: `HCESession` broadcasts the same Solana Pay URL as a Type 4 Tag URI record whenever a payment request is active) and `src/nfc/nfcReader.ts` (customer: `NfcManager.registerTagEvent` reader mode, races against the camera scan — whichever transport completes first wins). Hand-edited `android/app/src/main/AndroidManifest.xml` (NFC permission, `hardware.nfc.hce` feature marked `required="false"` so QR-only devices still work, and the `CardService` `<service>` block) and added `android/app/src/main/res/xml/aid_list.xml` (custom AID, category `"other"` per the plan). These are native/manifest changes — a JS reload won't pick them up, needs a full `gradlew assembleDebug` + reinstall. Rebuilt (4m, much faster than the first 39m build thanks to Gradle caching) and reinstalled — on-device smoke test passed: creating a payment request successfully calls `HCESession.setEnabled(true)` (confirmed real NFC HAL/SecureElement activity in logcat, not just a silent no-op) and the merchant UI correctly shows "Scan the QR or tap phones together"; the customer Pay view's camera + NFC reader mode both initialize with no crash. **Still needs the live two-device tap test** to confirm an actual HCE↔reader handshake completes — same pending item as the QR scan test above.

Also fixed while in here: `APP_IDENTITY` in `useAuthorization.tsx` was still the template's placeholder `"https://fakedomain.com"`, which is exactly why Solflare showed an "Unknown site" warning during signing — updated to `TapWifSol` / `https://tappaywip.app` (still a placeholder at the time; superseded by the real rename below).

**Week 4 — UI polish — done, not yet on-device tested.** JS/TS-only changes (no native rebuild needed, `npx tsc --noEmit` clean):
- **Branding**: `App.tsx` now overrides the Paper theme with Solana's own brand colors (`#9945FF` purple / `#14F195` green, swapped as primary between light/dark mode) instead of the default MD3 purple, so the app reads as "of this ecosystem" rather than a generic template. `HomeScreen.tsx` no longer shows the leftover boilerplate title "Solana Mobile Expo Template" — replaced with a proper brand row (icon + "TapWifSol" + tagline) and reworded the pre-connect `Section`s to describe this app instead of the template's stock copy.
- **Balance section**: `AccountBalance` in `account-ui.tsx` was shrunk from `displayLarge` (57px, the "too large" the user flagged) down to `headlineLarge`, wrapped in a branded `Surface` card, and given a **hide/unhide toggle** (eye icon) that swaps the number for `••••••` — state persists across app restarts via AsyncStorage (`tapwifsol.balanceHidden`). `AccountButtonGroup`'s three buttons got icons and equal-width flex layout instead of plain unlabeled text buttons.
- **Countdown + auto-cancel**: new `src/hooks/useCountdown.ts` (`useCountdown(totalSeconds, active, onExpire)` — drift-free, elapsed-time based). Wired into both payment screens per the user's ask ("most crypto apps have an auto countdown and cancel the transaction because delays will usually make the transaction fail"):
  - `MerchantView.tsx`: while `status === "waiting"`, shows a live "Expires in mm:ss" + `ProgressBar` counting down 120s (matches `waitForPayment`'s own default `timeoutMs`) — visual confirmation of the same timeout that was previously invisible.
  - `CustomerView.tsx`: while `status === "processing"` (waiting on the wallet to approve/sign), a 60s countdown runs — chosen to sit safely inside Solana's ~60-90s blockhash expiry window (see Gotchas). If it hits zero before the wallet responds, a `cancelTokenRef` flips to `cancelled: true`, an alert explains what happened, and the UI resets to `"scanning"` — a late wallet response after that is silently ignored (checked via the same ref) rather than clobbering state. MWA itself has no true cancel API, so this is a UI-level "move on," not a literal abort of the in-flight `transact()` call.
- Other polish: merchant amount screen now has quick-amount `Chip`s (0.01/0.05/0.1/0.5 SOL); the QR is inside a shadowed `Surface` card; both "payment received"/"payment sent" states got a `check-circle` icon and a tappable "View on Solscan" link (`https://solscan.io/tx/<sig>?cluster=devnet`, via `Linking.openURL`); the customer scan screen has a viewfinder-square overlay.
**On-device verification — done.** JS reload (no rebuild) and eyeballed on the same device: brand colors, home screen branding, balance card + hide/unhide toggle (persists via AsyncStorage, confirmed by toggling and re-screenshotting), quick-amount chips, QR card, and the scan-screen viewfinder overlay all render as intended.

One real bug found and fixed during this pass: **react-native-paper's `ProgressBar` only forwards its `style` prop to the inner fill track, not the outer measuring `View`** (see `node_modules/react-native-paper/src/components/ProgressBar.tsx` — the outer `View` gets `onLayout` but no `style`). Inside a `alignItems: "center"` flex column, that outer View has no intrinsic width, so it measures 0 and the whole bar — track and fill — silently renders nothing (no crash, no log). Fix: wrap `<ProgressBar>` in a plain `View` with an explicit width (default `alignItems: "stretch"` then lets the bar's own outer View fill it). Applied in `MerchantView.tsx` (needed the wrapper — its countdown block uses `alignItems: "center"`); `CustomerView.tsx`'s countdown bar lives in the `overlay` View which never set `alignItems`, so it already defaulted to `stretch` and didn't need the fix — confirmed both render correctly on-device (merchant's green bar full-width at 1:59/2:00).

**Still not done**: the live two-device QR/NFC test from weeks 2-3 — unaffected by this round of changes but still the biggest open risk before packaging for submission.

**Renamed `TapPayWIP` → `TapWifSol`** (checked for collisions first — `SolTap`, `PaySol`, `Solstice Pay`, and `SolSwipe` are all real existing Solana payment apps; `TapWifSol` had no hits and rides the $WIF/dogwifhat naming trend, which reads well to crypto-native judges). Renamed everywhere: `app.json` (name/slug/bundleIdentifier/package → `com.wisedavis.tapwifsol`), `useAuthorization.tsx`'s `APP_IDENTITY`, `solanaPay.ts`'s `MERCHANT_LABEL`, the AsyncStorage balance-hidden key, `HomeScreen.tsx`'s title, and the whole native Android side by hand (moved the Kotlin package directory, `build.gradle` `namespace`/`applicationId`, `AndroidManifest.xml`'s deep-link `scheme`s, `settings.gradle`'s `rootProject.name`, `strings.xml`'s `app_name`) — did **not** run `expo prebuild --clean` for this, since that would wipe the hand-edited NFC manifest/AID work from week 3 (`react-native-hce` has no Expo config plugin to regenerate it). Ran `gradlew clean` + a fresh `assembleDebug` afterward since the old package's stale build output (`android/app/build/`) was still full of `com.wisedavis.tappaywip` class files. Also noticed `android/app/build/`, `android/build/`, and `android/.gradle/` (562MB+) were never gitignored — added them (plus `android/local.properties`) to `.gitignore` before the first real commit/push.

**Git/GitHub**: the repo had exactly one stale "Initial commit" with everything since (Solana Pay, NFC, UI polish, this rename) sitting uncommitted and nothing ever pushed anywhere — a hackathon requirement is that judges can see the code *and* commit history, so this needed fixing. Public GitHub repo: `TapWifSol`, pushed under the `dpa9210` GitHub account (already authenticated locally via `gh`).

## Environment setup (already done on this machine)

- Node 22, JDK 17 (via sdkman), Android SDK at `~/Android/Sdk` (platform-tools, build-tools, NDK, cmdline-tools all present) — **no Android Studio IDE needed or installed**, everything is CLI: `expo prebuild -p android`, then `cd android && ./gradlew assembleDebug`, then `adb install -r`.
- Package manager is **yarn**, not npm — the template has a known Metro/MWA module-resolution bug under npm. Corepack (bundled with Node) provides yarn: `corepack enable --install-directory ~/.local/bin`.
- App identity is currently a **placeholder** (`TapWifSol` / `com.wisedavis.tapwifsol` in `app.json`) — swap to a real name/package before dApp Store submission (do this early enough that the native `android/` project regenerates cleanly if needed).
- Devnet RPC: `src/components/cluster/cluster-data-access.tsx` reads `EXPO_PUBLIC_HELIUS_DEVNET_API_KEY` from `.env` (gitignored) and builds a Helius devnet endpoint. **Do not fall back to the plain `clusterApiUrl("devnet")` / `api.devnet.solana.com`** — it's heavily rate-limited (429s within minutes) and unsuitable even for solo dev testing. Also tried Ankr's public devnet RPC (no key needed) — it doesn't rate-limit but returns JSON-RPC responses that fail `@solana/web3.js`'s schema validation, so it's not a viable fallback either. Helius free tier caps `requestAirdrop` at **1 SOL/project/day**; once that's hit, fund test wallets via faucet.solana.com's web UI (needs a human to click through, not automatable).
- Metro dev server: `npx expo start --dev-client` + `adb reverse tcp:8081 tcp:8081`. The port-forward drops whenever the USB session re-enumerates (e.g. after unlocking the phone or a wallet-app permission flow) — just re-run `adb reverse tcp:8081 tcp:8081` and it recovers instantly. `.env` changes require a full Metro restart (env vars load once at server start), not just a JS reload.
- Full JS reload without a physical replug: `adb shell am start -a android.intent.action.VIEW -d "com.wisedavis.tapwifsol://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"`.

## Gotchas learned the hard way

- **MWA local-association has a short timeout.** If you dawdle mid-flow (e.g. stop to read a wallet's onboarding/backup screens, or spend too long fumbling with UI), the request times out client-side (`ConnectionFailedException` / `TimeoutException: waiting for response`) even if the wallet-side approval eventually succeeds. Just retry — it's fast once both sides are ready.
- **Solflare (and presumably other wallets) default to mainnet.** A devnet transaction against a mainnet-selected wallet fails with an explicit "Network mismatch" error. Switch the wallet's network to devnet in its own settings before testing.
- **Solana transaction blockhashes expire in roughly 60–90 seconds.** Don't stop to investigate UI mid-transaction — build the full sign → approve → confirm chain as one fast pass, or the wallet will show "Transaction expired."
- **The template's demo "Send SOL" dialog (`account-ui.tsx`) doesn't clear its TextInput state between opens** — reopening it after a previous attempt can leave stale/duplicated text in the fields, which then fails Solana's base58 pubkey parsing with a cryptic "Invalid public key input" red-box. This is throwaway boilerplate we're replacing with our own Solana Pay screens in week 2, so it's not worth patching — just remember a full JS reload (see above) resets it if you're ever poking at that demo screen again.
- Stray Gradle/Kotlin daemons can linger between sessions holding several GB of RAM (`-Xmx8G` each by default) even when idle. `cd android && ./gradlew --stop` after a build session frees it back up; check with `ps aux | grep -i java` if the machine feels sluggish.

## Package list (installed)

```
@solana/web3.js, @solana/spl-token
@solana/pay@0.2.6            # pinned — 1.0.x is @solana/kit-based, a different paradigm from MWA/web3.js
@solana-mobile/mobile-wallet-adapter-protocol(-web3js)
react-native-hce              # merchant-side NFC broadcast (week 3)
react-native-nfc-manager       # customer-side NFC read (week 3)
react-native-qrcode-svg, react-native-svg
expo-camera                    # QR scanning
react-native-paper             # Material Design UI
```
