"use client";

import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-data-grid/themeAugmentation";

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
      fontSize: "3rem",
      lineHeight: 1,
      fontWeight: 800,
    },
    h2: {
      fontSize: "1.85rem",
      lineHeight: 1.1,
      fontWeight: 800,
    },
    h3: {
      fontSize: "1.4rem",
      lineHeight: 1.2,
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
    displayLarge: {
      fontSize: "clamp(2.5rem, 4.6vw, 4.4rem)",
      lineHeight: 0.96,
      fontWeight: 800,
      letterSpacing: "-0.05em",
    },
    sectionEyebrow: {
      fontSize: "0.78rem",
      textTransform: "uppercase",
      letterSpacing: "0.16em",
      fontWeight: 800,
      color: "#f28c28",
    },
    sectionTitle: {
      fontSize: "1.35rem",
      lineHeight: 1.2,
      fontWeight: 800,
    },
    bodyLarge: {
      fontSize: "0.98rem",
      lineHeight: 1.7,
    },
    bodyMedium: {
      fontSize: "0.9rem",
      lineHeight: 1.65,
    },
    bodySmall: {
      fontSize: "0.78rem",
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
          paddingInline: 16,
          minHeight: 40,
          fontSize: "0.9rem",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiFormControl: {
      defaultProps: {
        size: "small",
      },
    },
    MuiAutocomplete: {
      defaultProps: {
        size: "small",
      },
    },
    MuiDatePicker: {
      defaultProps: {
        slotProps: {
          textField: {
            size: "small",
          },
        },
      },
    },
    MuiDateTimePicker: {
      defaultProps: {
        slotProps: {
          textField: {
            size: "small",
          },
        },
      },
    },
    MuiTimePicker: {
      defaultProps: {
        slotProps: {
          textField: {
            size: "small",
          },
        },
      },
    },
    MuiPickersTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiIconButton: {
      defaultProps: {
        size: "small",
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 36,
          fontSize: "0.9rem",
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
        input: {
          fontSize: "0.9rem",
          paddingTop: 10,
          paddingBottom: 10,
        },
      },
    },
    MuiChip: {
      defaultProps: {
        size: "small",
      },
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: "0.78rem",
        },
      },
    },
    MuiDataGrid: {
      defaultProps: {
        rowHeight: 38,
        columnHeaderHeight: 46,
      },
    },
  },
});
