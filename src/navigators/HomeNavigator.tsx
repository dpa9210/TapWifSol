import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, View } from "react-native";
import { TopBar } from "../components/top-bar/top-bar-feature";
import { HomeScreen } from "../screens/HomeScreen";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "react-native-paper";
import { PayScreen } from "../screens/pay/PayScreen";
import { HistoryScreen } from "../screens/pay/HistoryScreen";

const Tab = createBottomTabNavigator();

type IconName = React.ComponentProps<typeof MaterialCommunityIcon>["name"];

function tabIconName(routeName: string, focused: boolean): IconName {
  switch (routeName) {
    case "Home":
      return focused ? "home" : "home-outline";
    case "Pay":
      return focused ? "qrcode-scan" : "qrcode";
    case "History":
      return focused ? "history" : "history";
    default:
      return "circle";
  }
}

/**
 * This is the main navigator with a bottom tab bar.
 * Each tab is a stack navigator with its own set of screens.
 *
 * More info: https://reactnavigation.org/docs/bottom-tab-navigator/
 */
export function HomeNavigator() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <TopBar />,
        tabBarStyle: {
          height: 72,
          paddingTop: 10,
          paddingBottom: 14,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outlineVariant,
        },
        // A bordered "pill" per icon, filled solid on the active tab —
        // gives the bar some visual weight instead of bare glyphs sitting
        // flush against the bar's edge.
        tabBarIcon: ({ focused, color, size }) => (
          <View
            style={[
              styles.iconPill,
              {
                borderColor: focused ? color : theme.colors.outlineVariant,
                backgroundColor: focused ? color : "transparent",
              },
            ]}
          >
            <MaterialCommunityIcon
              name={tabIconName(route.name, focused)}
              size={size - 4}
              color={focused ? theme.colors.surface : color}
            />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Pay" component={PayScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconPill: {
    width: 46,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
