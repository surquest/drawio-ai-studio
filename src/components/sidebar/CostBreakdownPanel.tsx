"use client";

import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export interface CostBreakdown {
  inputTokens: number;
  plainOutputTokens: number;
  reasoningTokens: number;
  totalOutputTokens: number;
  inputCost: number;
  plainOutputCost: number;
  reasoningCost: number;
  totalOutputCost: number;
  total: number;
}

interface CostBreakdownPanelProps {
  data: CostBreakdown;
  requestTier: string;
  onClose: () => void;
}

export default function CostBreakdownPanel({ data, requestTier, onClose }: CostBreakdownPanelProps) {
  return (
    <Box
      sx={{
        mb: 3,
        p: 1.5,
        bgcolor: "background.paper",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        fontSize: "0.75rem",
        position: "relative",
      }}
    >
      <IconButton
        size="small"
        onClick={onClose}
        sx={{ position: "absolute", top: 4, right: 4, opacity: 0.6 }}
      >
        <CloseIcon sx={{ fontSize: "1rem" }} />
      </IconButton>
      <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: "0.8rem" }}>
        Request Cost Breakdown
      </Typography>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}
      >
        <span>
          Input ({data.inputTokens.toLocaleString()} tkns):
        </span>
        <span>${data.inputCost.toFixed(6)}</span>
      </Box>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}
      >
        <span>
          Output ({data.totalOutputTokens.toLocaleString()} tkns):
        </span>
        <span>${data.totalOutputCost.toFixed(6)}</span>
      </Box>
      {data.reasoningTokens > 0 && (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              color: "text.secondary",
              mb: 0.25,
            }}
          >
            <span>
              {" "}
              &nbsp;&#x21B3; Thinking (
              {data.reasoningTokens.toLocaleString()} tkns):
            </span>
            <span>${data.reasoningCost.toFixed(6)}</span>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              color: "text.secondary",
              mb: 0.25,
            }}
          >
            <span>
              {" "}
              &nbsp;&#x21B3; Candidates (
              {data.plainOutputTokens.toLocaleString()} tkns):
            </span>
            <span>${data.plainOutputCost.toFixed(6)}</span>
          </Box>
        </>
      )}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 0.5,
          pt: 0.5,
          borderTop: "1px solid",
          borderColor: "divider",
          fontWeight: "bold",
        }}
      >
        <span>
          Total{requestTier === "flex" ? " (Flex 50% discount)" : ""}:
        </span>
        <span>${data.total.toFixed(6)}</span>
      </Box>
    </Box>
  );
}
