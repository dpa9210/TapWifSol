import React from "react";
import { Avatar, useTheme } from "react-native-paper";

// The actual app icon mark (two tapping phones + a spark), reused as the
// in-app brand glyph wherever the wordmark appears, instead of a generic
// MaterialCommunityIcons stand-in. adaptive-icon.png is the transparent,
// safely-inset version made for exactly this kind of circular/masked
// display — the full icon.png's corners would get clipped by the circle.
export function BrandIcon({ size = 44 }: { size?: number }) {
  const theme = useTheme();
  return (
    <Avatar.Image
      size={size}
      source={require("../../assets/adaptive-icon.png")}
      style={{ backgroundColor: theme.colors.primaryContainer }}
    />
  );
}
