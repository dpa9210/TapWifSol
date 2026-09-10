// Polyfills
import "./src/polyfills";

import { StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConnectionProvider } from "./src/utils/ConnectionProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import {
  PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
} from "react-native-paper";
import { AppNavigator } from "./src/navigators/AppNavigator";
import { ClusterProvider } from "./src/components/cluster/cluster-data-access";

const queryClient = new QueryClient();

// Solana's own brand colors, so the app reads as "of this ecosystem" rather
// than a generic Material Design purple template.
const SOLANA_PURPLE = "#9945FF";
const SOLANA_GREEN = "#14F195";

export default function App() {
  const colorScheme = useColorScheme();
  const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });

  const CombinedDefaultTheme = {
    ...MD3LightTheme,
    ...LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      ...LightTheme.colors,
      primary: SOLANA_PURPLE,
      onPrimary: "#FFFFFF",
      primaryContainer: "#F0E4FF",
      onPrimaryContainer: "#3D0091",
      secondary: "#00A870",
    },
  };
  const CombinedDarkTheme = {
    ...MD3DarkTheme,
    ...DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      ...DarkTheme.colors,
      primary: SOLANA_GREEN,
      onPrimary: "#00391F",
      primaryContainer: "#0B4B33",
      onPrimaryContainer: "#B6FFDB",
      secondary: "#D0B3FF",
    },
  };
  return (
    <QueryClientProvider client={queryClient}>
      <ClusterProvider>
        <ConnectionProvider config={{ commitment: "processed" }}>
          <SafeAreaView
            style={[
              styles.shell,
              {
                backgroundColor:
                  colorScheme === "dark"
                    ? MD3DarkTheme.colors.background
                    : MD3LightTheme.colors.background,
              },
            ]}
          >
            <PaperProvider
              theme={
                colorScheme === "dark"
                  ? CombinedDarkTheme
                  : CombinedDefaultTheme
              }
            >
              <AppNavigator />
            </PaperProvider>
          </SafeAreaView>
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
