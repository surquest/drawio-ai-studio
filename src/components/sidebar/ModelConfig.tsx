"use client";

import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { config } from "@/config";

interface ModelConfigProps {
  model: string;
  thinkingLevel: string;
  requestTier: string;
  onModelChange: (model: string) => void;
  onThinkingLevelChange: (level: string) => void;
  onRequestTierChange: (tier: string) => void;
}

export default function ModelConfig({
  model,
  thinkingLevel,
  requestTier,
  onModelChange,
  onThinkingLevelChange,
  onRequestTierChange,
}: ModelConfigProps) {
  return (
    <Box
      sx={{ mb: 2, pt: 2, display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 0.5 }}
        >
          Pricing / Request Tier
        </Typography>
        <ToggleButtonGroup
          value={requestTier}
          exclusive
          onChange={(e, next) => next && onRequestTierChange(next)}
          size="small"
          fullWidth
        >
          {config.gemini.requestTiers.map((tier) => (
            <ToggleButton
              key={tier.id}
              value={tier.id}
              sx={{ textTransform: "capitalize" }}
            >
              {tier.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <FormControl fullWidth size="small">
        <InputLabel>Gemini Model</InputLabel>
        <Select
          value={model}
          label="Gemini Model"
          onChange={(e) => onModelChange(e.target.value as string)}
        >
          {config.gemini.models.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {(model.includes("gemini-3") ||
        model.includes("gemini-2.0-flash-thinking")) && (
        <FormControl fullWidth size="small">
          <InputLabel>Thinking Level</InputLabel>
          <Select
            value={thinkingLevel}
            label="Thinking Level"
            onChange={(e) => onThinkingLevelChange(e.target.value as string)}
          >
            {config.gemini.thinkingLevels.map((lvl) => (
              <MenuItem key={lvl.id} value={lvl.id}>
                {lvl.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
}
