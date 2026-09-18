import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  Theme as NavigationTheme,
} from "@react-navigation/native";
import {
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
  MD3Theme,
} from "react-native-paper";

// TapWifSol's own identity: a warm amber "tap complete" accent instead of a
// generic Material purple (which is what Phantom's own brand color reads
// as too) — chosen specifically to *not* be purple or Phantom-adjacent, with
// success/danger pulled out as their own tones instead of reusing the accent.
export const AMBER = "#FFB020";
export const SUCCESS_GREEN = "#3FCE93";
export const DANGER_CORAL = "#FF8A70";
// One deliberately rare "special status" accent (SKR Holder badge only) —
// cool-toned so it stands out against the warm amber palette without
// reintroducing purple as a second competing brand color.
export const HOLDER_TEAL = "#0E86A8";

const darkColors = {
  background: "#100D08",
  surface: "#171310",
  surfaceVariant: "#1C1710",
  onSurface: "#FBF3E7",
  onSurfaceVariant: "#9C9282",
  outline: "#4A4331",
  outlineVariant: "#2B2417",
  primary: AMBER,
  onPrimary: "#3D2C0A",
  primaryContainer: "#3D2C0A",
  onPrimaryContainer: "#FFE8B8",
  secondary: SUCCESS_GREEN,
  onSecondary: "#04241A",
  secondaryContainer: "#123423",
  onSecondaryContainer: "#B8F5DA",
};

const lightColors = {
  background: "#FFFBF5",
  surface: "#FFFFFF",
  surfaceVariant: "#F4EDE0",
  onSurface: "#221A0C",
  onSurfaceVariant: "#5C543F",
  outline: "#8A8064",
  outlineVariant: "#DED2B5",
  primary: "#8A5300",
  onPrimary: "#FFFFFF",
  primaryContainer: "#FFE3B3",
  onPrimaryContainer: "#2B1900",
  secondary: "#1F8F5F",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#C3F5DE",
  onSecondaryContainer: "#002010",
};

export const TapWifSolDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: { ...MD3DarkTheme.colors, ...darkColors },
};

export const TapWifSolLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, ...lightColors },
};

const { LightTheme: AdaptedLight, DarkTheme: AdaptedDark } =
  adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });

// react-native-bottom-tabs (and the rest of @react-navigation) reads colors
// off *this* theme, not the PaperProvider theme, for things like the active
// tab tint — so it has to carry the same palette or those pieces silently
// fall back to react-native-paper's own stock Material purple regardless of
// what PaperProvider is given.
export const TapWifSolNavigationDarkTheme: NavigationTheme = {
  ...AdaptedDark,
  colors: {
    ...AdaptedDark.colors,
    primary: darkColors.primary,
    background: darkColors.background,
    card: darkColors.surface,
    text: darkColors.onSurface,
    border: darkColors.outlineVariant,
  },
};

export const TapWifSolNavigationLightTheme: NavigationTheme = {
  ...AdaptedLight,
  colors: {
    ...AdaptedLight.colors,
    primary: lightColors.primary,
    background: lightColors.background,
    card: lightColors.surface,
    text: lightColors.onSurface,
    border: lightColors.outlineVariant,
  },
};
