import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export const formDialogContentSx: SxProps<Theme> = {
  pt: 1,
};

export const formDialogActionsEndSx: SxProps<Theme> = {
  px: 3,
  pb: 3,
  justifyContent: "flex-end",
  gap: 1,
};

export const formDialogActionsSplitSx: SxProps<Theme> = {
  px: 3,
  pb: 3,
  justifyContent: "space-between",
  gap: 1,
};

export const formDialogPrimaryActionSx: SxProps<Theme> = {
  backgroundColor: "var(--accent-secondary)",
  color: "#ffffff",
  "&:hover": {
    backgroundColor: "#0c5b65",
  },
};

type FeatureDialogTitleProps = Readonly<{
  icon: ReactNode;
  eyebrow: string;
  title?: string;
}>;

export function FeatureDialogTitle({
  icon,
  eyebrow,
  title,
}: FeatureDialogTitleProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        borderRadius: 2,
        px: 1.5,
        py: 1.25,
        background:
          "linear-gradient(145deg, rgba(15,109,122,0.12) 0%, rgba(8,19,31,0.08) 100%)",
        border: "1px solid rgba(8, 19, 31, 0.12)",
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 1.5,
          display: "grid",
          placeItems: "center",
          backgroundColor: "var(--accent-secondary)",
          color: "#ffffff",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="sectionEyebrow">{eyebrow}</Typography>
        {title ? (
          <Typography variant="sectionTitle" sx={{ fontSize: "1.2rem" }}>
            {title}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
