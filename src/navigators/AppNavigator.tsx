/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 */
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "react-native-paper";
import * as Screens from "../screens";
import { HomeNavigator } from "./HomeNavigator";
import { StatusBar } from "expo-status-bar";
import { useThemePreference } from "../utils/ThemePreferenceProvider";
import {
  TapWifSolNavigationDarkTheme,
  TapWifSolNavigationLightTheme,
} from "../theme";

const ONBOARDING_SEEN_KEY = "tapwifsol.onboardingSeen";

/**
 * This type allows TypeScript to know what routes are defined in this navigator
 * as well as what properties (if any) they might take when navigating to them.
 *
 * If no params are allowed, pass through `undefined`.
 *
 * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 *   https://reactnavigation.org/docs/typescript/#organizing-types
 *
 */

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
  About: undefined;
  // 🔥 Your screens go here
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator();

const AppStack = () => {
  return (
    <Stack.Navigator initialRouteName={"Home"}>
      <Stack.Screen
        name="HomeStack"
        component={HomeNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Settings" component={Screens.SettingsScreen} />
      <Stack.Screen
        name="About"
        component={Screens.AboutScreen}
        options={{ title: "About" }}
      />
      {/** 🔥 Your screens go here */}
    </Stack.Navigator>
  );
};

export interface NavigationProps
  extends Partial<React.ComponentProps<typeof NavigationContainer>> {}

export const AppNavigator = (props: NavigationProps) => {
  const { resolvedScheme } = useThemePreference();
  const theme = useTheme();
  // null = still checking AsyncStorage; render nothing rather than flash
  // the onboarding screen for a returning user.
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY).then((value) => {
      setOnboardingSeen(value === "true");
    });
  }, []);

  if (onboardingSeen === null) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  if (!onboardingSeen) {
    return (
      <>
        <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
        <Screens.OnboardingScreen
          onDone={() => {
            AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true").catch(() => {});
            setOnboardingSeen(true);
          }}
        />
      </>
    );
  }

  return (
    <NavigationContainer
      theme={
        resolvedScheme === "dark"
          ? TapWifSolNavigationDarkTheme
          : TapWifSolNavigationLightTheme
      }
      {...props}
    >
      <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
      <AppStack />
    </NavigationContainer>
  );
};
