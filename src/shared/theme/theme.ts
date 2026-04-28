"use client";

import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface TypographyVariants {
    displayLarge: React.CSSProperties;
    sectionEyebrow: React.CSSProperties;
    sectionTitle: React.CSSProperties;
    bodyLarge: React.CSSProperties;
    bodyMedium: React.CSSProperties;
    bodySmall: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    displayLarge?: React.CSSProperties;
    sectionEyebrow?: React.CSSProperties;
    sectionTitle?: React.CSSProperties;
    bodyLarge?: React.CSSProperties;
    bodyMedium?: React.CSSProperties;
    bodySmall?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    displayLarge: true;
    sectionEyebrow: true;
    sectionTitle: true;
    bodyLarge: true;
    bodyMedium: true;
    bodySmall: true;
  }
}

export const appTheme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: "#0b3a53",
    },
    secondary: {
      main: "#1e8fa6",
    },
    success: {
      main: "#2e7d5b",
    },
    warning: {
      main: "#f28c28",
    },
    info: {
      main: "#2f6fab",
    },
    background: {
      default: "#f4f7fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#14202b",
      secondary: "#4b5f70",
    },
    divider: "rgba(20, 32, 43, 0.1)",
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily: "var(--font-sans), sans-serif",
    h1: {
      fontSize: "3.25rem",
      lineHeight: 1,
      fontWeight: 800,
    },
    h2: {
      fontSize: "2rem",
      lineHeight: 1.1,
      fontWeight: 800,
    },
    h3: {
      fontSize: "1.5rem",
      lineHeight: 1.2,
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
    displayLarge: {
      fontSize: "clamp(2.8rem, 5vw, 5rem)",
      lineHeight: 0.96,
      fontWeight: 800,
      letterSpacing: "-0.05em",
    },
    sectionEyebrow: {
      fontSize: "0.82rem",
      textTransform: "uppercase",
      letterSpacing: "0.16em",
      fontWeight: 800,
      color: "#f28c28",
    },
    sectionTitle: {
      fontSize: "1.5rem",
      lineHeight: 1.2,
      fontWeight: 800,
    },
    bodyLarge: {
      fontSize: "1.05rem",
      lineHeight: 1.7,
    },
    bodyMedium: {
      fontSize: "0.95rem",
      lineHeight: 1.65,
    },
    bodySmall: {
      fontSize: "0.82rem",
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 18,
          minHeight: 44,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.88)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
  },
});
