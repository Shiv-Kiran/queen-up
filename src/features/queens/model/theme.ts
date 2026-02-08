export const REGION_COLORS = [
  "#315C9A",
  "#1D7D56",
  "#6E3A95",
  "#A3292A",
  "#B9851A",
  "#1D7A78",
  "#4B53A8",
  "#7A2632",
  "#70722A",
] as const;

export type AppPalette = {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accentSoft: string;
  controlBg: string;
  controlBorder: string;
  controlText: string;
  timerBg: string;
  timerText: string;
};

export const THEME_COLORS = {
  dark: {
    background: "#19110D",
    surface: "#241813",
    surfaceElevated: "#2C1D17",
    text: "#F6EDE2",
    textMuted: "#CDB9A4",
    border: "#6B4B36",
    accent: "#D3A45F",
    accentSoft: "rgba(211,164,95,0.24)",
    controlBg: "#33231C",
    controlBorder: "#7B583F",
    controlText: "#F6EDE2",
    timerBg: "#3A281F",
    timerText: "#F5D39A",
  },
  light: {
    background: "#F5F0E6",
    surface: "#FFFAF0",
    surfaceElevated: "#F2E8D7",
    text: "#2A1C16",
    textMuted: "#6C5242",
    border: "#C8B59A",
    accent: "#8C5A2B",
    accentSoft: "rgba(140,90,43,0.14)",
    controlBg: "#F3E7D4",
    controlBorder: "#D2BF9F",
    controlText: "#2A1C16",
    timerBg: "#F0DFC3",
    timerText: "#5A3A1D",
  },
} as const satisfies { dark: AppPalette; light: AppPalette };
