import { useFonts } from "expo-font";
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from "@expo-google-fonts/bricolage-grotesque";

// The "TapWifSol" wordmark's own typeface — quirky rounded terminals that
// nod to the app's dogwifhat naming without losing legibility. Used only
// for the brand name itself; everything else stays the system font.
export const BRAND_FONT_BOLD = "BricolageGrotesque_700Bold";
export const BRAND_FONT_EXTRABOLD = "BricolageGrotesque_800ExtraBold";

export function useBrandFonts() {
  const [loaded] = useFonts({
    [BRAND_FONT_BOLD]: BricolageGrotesque_700Bold,
    [BRAND_FONT_EXTRABOLD]: BricolageGrotesque_800ExtraBold,
  });
  return loaded;
}
