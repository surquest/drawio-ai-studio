"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Chip } from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  data: string;
}

interface FileDropzoneProps {
  attachments: AttachedFile[];
  onAttachmentsChange: (attachments: AttachedFile[]) => void;
}

export default function FileDropzone({ attachments, onAttachmentsChange }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isDrawio =
        file.name.endsWith(".drawio") ||
        file.name.endsWith(".xml") ||
        file.type.includes("xml");

      if (!isImage && !isDrawio) {
        alert(
          `Unsupported file type: ${file.name}. Only Images and Draw.io/XML files are allowed.`,
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result as string;
        onAttachmentsChange([
          ...attachments,
          {
            id: Math.random().toString(36).substring(7),
            name: file.name,
            type:
              file.type ||
              (isDrawio ? "application/xml" : "application/octet-stream"),
            data,
          },
        ]);
      };

      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter((att) => att.id !== id));
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const hasFiles = Array.from(e.clipboardData.files).some(
          (f) =>
            f.type.startsWith("image/") ||
            f.name.endsWith(".xml") ||
            f.name.endsWith(".drawio"),
        );
        if (hasFiles) {
          processFiles(e.clipboardData.files);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  });

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        border: isDragging ? "2px dashed #1976d2" : "2px dashed #888",
        backgroundColor: isDragging
          ? "rgba(25, 118, 210, 0.08)"
          : "transparent",
        borderRadius: 1,
        p: 2,
        mb: 3,
        textAlign: "center",
        transition: "all 0.2s ease",
      }}
    >
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Drag & Drop, or Paste Images / Draw.io files here
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        or
      </Typography>
      <Button
        component="label"
        variant="outlined"
        size="small"
        startIcon={<AttachFileIcon />}
        sx={{ mt: 1 }}
      >
        Select Files
        <input
          type="file"
          hidden
          multiple
          accept="image/*,.drawio,.xml"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
      </Button>

      {attachments.length > 0 && (
        <Box
          sx={{
            mt: 2,
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            justifyContent: "center",
          }}
        >
          {attachments.map((att) => (
            <Chip
              key={att.id}
              label={att.name}
              onDelete={() => removeAttachment(att.id)}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
