import { AssignmentTurnedIn } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { ContentCard } from "@/shared/ui/content-card";
import { SectionHeader } from "@/shared/ui/section-header";

export default function MyActivitiesPage() {
  return (
    <Stack spacing={3}>
      <SectionHeader
        eyebrow="Area Volontario"
        title="Le mie attivita"
        description="Vista dedicata alle tue attivita operative e ai tuoi incarichi recenti."
      />

      <ContentCard>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1,
          }}
        >
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              backgroundColor: "var(--accent-secondary)",
              color: "#ffffff",
            }}
          >
            <AssignmentTurnedIn fontSize="small" />
          </Box>
          <Box>
            <Typography variant="sectionEyebrow">Prossimo step</Typography>
            <Typography
              variant="bodySmall"
              sx={{ color: "text.secondary", mt: 0.5 }}
            >
              Questa pagina e pronta per ospitare la timeline attivita del
              volontario nelle prossime milestone.
            </Typography>
          </Box>
        </Box>
      </ContentCard>
    </Stack>
  );
}
