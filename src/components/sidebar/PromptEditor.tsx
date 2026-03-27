"use client";

import { Box, Typography, Chip } from "@mui/material";
import dynamic from "next/dynamic";
import { config } from "@/config";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false },
);

interface PromptEditorProps {
  prompt: string;
  onPromptChange: (value: string) => void;
}

export default function PromptEditor({ prompt, onPromptChange }: PromptEditorProps) {
  const loadExamplePrompt = async (path: string) => {
    try {
      const res = await fetch(path);
      if (res.ok) onPromptChange(await res.text());
    } catch (e) {
      console.error("Failed to load example prompt:", e);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Prompt
        </Typography>
      </Box>
      <Box sx={{ mb: 1 }} data-color-mode="dark">
        <MDEditor
          value={prompt}
          onChange={(val) => onPromptChange(val || "")}
          preview="edit"
          height={200}
        />
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
        {config.gemini.examplePrompts?.map((ex) => (
          <Chip
            key={ex.id}
            label={ex.label}
            size="small"
            onClick={() => loadExamplePrompt(ex.path)}
            variant="outlined"
            sx={{ fontSize: "0.7rem" }}
          />
        ))}
      </Box>
    </>
  );
}
