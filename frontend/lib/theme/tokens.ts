// MarketBytes CRM Design System Tokens
// Source of truth: DESIGN_SYSTEM.md & marketbytes-crm-design-spec.md

export const colors = {
  ink: "#030712",
  primary: "#155DFC",
  primarySoft: "#D5E3FC",
  secondary: "#7F71F8",
  secondarySoft: "#EEECFE",
  tertiary: "#F54900",
  tertiarySoft: "#FFF1E6",
  neutralIcon: "#6B7280",
  neutralSoft: "#F1F2F4",
  success: "#00BC7D",
  danger: "#FB3038",
  bg: "#E3E7EF",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  textSecondary: "#6B7280",
  dark: {
    bg: "#121214",
    surface: "#1A1A1D",
    ink: "#F2F2F3",
    textSecondary: "#9A9AA2",
    border: "#2B2B2F",
    primarySoft: "#1E2440",
  }
} as const;

export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "24px",
  6: "32px",
} as const;

export const radius = {
  sm: "9px",
  md: "11px",
  lg: "14px",
  full: "999px",
} as const;

export const shadows = {
  card: "0 1px 2px rgba(3,7,18,.04), 0 8px 20px rgba(3,7,18,.06)",
} as const;

export const typography = {
  fonts: {
    heading: "var(--font-sora), sans-serif",
    body: "var(--font-inter), sans-serif",
  },
  styles: {
    pageTitle: { font: "Sora", size: "26px", weight: 800, lineHeight: "1.25" },
    sectionTitle: { font: "Sora", size: "20px", weight: 800, lineHeight: "1.3" },
    cardTitle: { font: "Sora", size: "15px", weight: 700, lineHeight: "1.3" },
    body: { font: "Inter", size: "13.5px", weight: 400, lineHeight: "1.5" },
    secondary: { font: "Inter", size: "12px", weight: 400, lineHeight: "1.4" },
    tableHeader: { font: "Inter", size: "11px", weight: 600, lineHeight: "1.3" },
  }
} as const;
