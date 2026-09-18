import ClusterPickerFeature from "../components/cluster/cluster-picker-feature";
import { StyleSheet, View } from "react-native";
import { List, SegmentedButtons, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

import { useThemePreference } from "../utils/ThemePreferenceProvider";

function AppearancePicker() {
  const { preference, setPreference } = useThemePreference();

  return (
    <View style={styles.section}>
      <Text variant="headlineMedium">Appearance:</Text>
      <SegmentedButtons
        style={styles.segmented}
        value={preference}
        onValueChange={(value) => setPreference(value as typeof preference)}
        buttons={[
          { value: "system", label: "System", icon: "theme-light-dark" },
          { value: "light", label: "Light", icon: "white-balance-sunny" },
          { value: "dark", label: "Dark", icon: "moon-waning-crescent" },
        ]}
      />
    </View>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation();

  return (
    <>
      <View style={styles.screenContainer}>
        <AppearancePicker />
        <ClusterPickerFeature />
        <View style={styles.aboutRow}>
          <List.Item
            title="About TapWifSol"
            left={(props) => <List.Icon {...props} icon="information-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate("About")}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    height: "100%",
    padding: 16,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  segmented: {
    marginTop: 12,
  },
  aboutRow: {
    marginTop: 8,
    marginHorizontal: -16,
  },
});
