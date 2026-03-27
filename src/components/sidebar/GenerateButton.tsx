"use client";

import { Button } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface GenerateButtonProps {
  loading: boolean;
  onClick: () => void;
}

export default function GenerateButton({ loading, onClick }: GenerateButtonProps) {
  return (
    <Button
      variant="contained"
      fullWidth
      onClick={onClick}
      disabled={loading}
      startIcon={
        loading ? (
          <AutoAwesomeIcon
            sx={{
              animation: "sparkle 1.2s ease-in-out infinite",
              "@keyframes sparkle": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.6 },
              },
            }}
          />
        ) : undefined
      }
      sx={{
        mb: 2,
        py: 1.5,
        fontWeight: "bold",
        position: "relative",
        overflow: "hidden",
        ...(loading && {
          background:
            "linear-gradient(270deg, #1565c0, #7c4dff, #00bfa5, #1565c0)",
          backgroundSize: "600% 600%",
          animation: "gradientShift 3s ease infinite",
          "@keyframes gradientShift": {
            "0%": { backgroundPosition: "0% 50%" },
            "50%": { backgroundPosition: "100% 50%" },
            "100%": { backgroundPosition: "0% 50%" },
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
            animation: "shimmer 1.8s ease-in-out infinite",
          },
          "@keyframes shimmer": {
            "0%": { left: "-100%" },
            "100%": { left: "100%" },
          },
        }),
      }}
    >
      {loading ? "Generating..." : "Generate Diagram"}
    </Button>
  );
}
