"use client";

import { useCallback, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import dynamic from "next/dynamic";
import { config } from "@/config";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false },
);

interface AdvancedConfigProps {
  systemInstructions: string;
  onSystemInstructionsChange: (value: string) => void;
}

export default function AdvancedConfig({
  systemInstructions,
  onSystemInstructionsChange,
}: AdvancedConfigProps) {
  const loadExampleInstruction = useCallback(
    async (path: string) => {
      try {
        const res = await fetch(path);
        if (res.ok) onSystemInstructionsChange(await res.text());
      } catch (e) {
        console.error("Failed to load example instruction:", e);
      }
    },
    [onSystemInstructionsChange],
  );

  useEffect(() => {
    if (config.gemini.defaultInstructionsPath) {
      loadExampleInstruction(config.gemini.defaultInstructionsPath);
    }
  }, [loadExampleInstruction]);

  return (
    <Accordion
      sx={{
        backgroundColor: "transparent",
        backgroundImage: "none",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "none",
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">Advanced Configuration</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 0.5,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            System Instructions
          </Typography>
        </Box>
        <Box sx={{ mb: 1 }} data-color-mode="dark">
          <MDEditor
            value={systemInstructions}
            onChange={(val) => onSystemInstructionsChange(val || "")}
            preview="edit"
            height={150}
          />
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {config.gemini.exampleInstructions?.map((ex) => (
            <Chip
              key={ex.id}
              label={ex.label}
              size="small"
              onClick={() => loadExampleInstruction(ex.path)}
              variant="outlined"
              sx={{ fontSize: "0.7rem" }}
            />
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
