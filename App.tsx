// Polyfills
import "./src/polyfills";

import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConnectionProvider } from "./src/utils/ConnectionProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PaperProvider } from "react-native-paper";
import { AppNavigator } from "./src/navigators/AppNavigator";
import { ClusterProvider } from "./src/components/cluster/cluster-data-access";
import {
  ThemePreferenceProvider,
  useThemePreference,
} from "./src/utils/ThemePreferenceProvider";
import { TapWifSolDarkTheme, TapWifSolLightTheme } from "./src/theme";
import { useBrandFonts } from "./src/hooks/useBrandFonts";

const queryClient = new QueryClient();

function ThemedApp() {
  const { resolvedScheme } = useThemePreference();
  const theme =
    resolvedScheme === "dark" ? TapWifSolDarkTheme : TapWifSolLightTheme;
  const fontsLoaded = useBrandFonts();

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: theme.colors.background }]}
    >
      <PaperProvider theme={theme}>
        {fontsLoaded ? <AppNavigator /> : null}
      </PaperProvider>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClusterProvider>
        <ConnectionProvider config={{ commitment: "processed" }}>
          <ThemePreferenceProvider>
            <ThemedApp />
          </ThemePreferenceProvider>
        </ConnectionProvider>
      </ClusterProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
});
