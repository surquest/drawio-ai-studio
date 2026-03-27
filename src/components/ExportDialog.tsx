"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Typography, Divider 
} from '@mui/material';
import { DrawioToPptxConverter } from '@/utils/DrawioToPptxConverter';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  format: 'pptx' | 'drawio';
  xmlData: string;
}

export default function ExportDialog({ open, onClose, format, xmlData }: ExportDialogProps) {
  const [fileName, setFileName] = useState('');
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const defaultName = format === 'pptx' ? `Diagram_${timestamp}.pptx` : `Diagram_${timestamp}.drawio`;
      setFileName(defaultName);
      setError(null);

      if (format === 'pptx' && xmlData) {
        (async () => {
          try {
            const converter = await DrawioToPptxConverter.create();
            const { svgHtml } = converter.processXml(xmlData);
            setPreviewSvg(svgHtml);
          } catch (err: any) {
            setError(`Preview failed: ${err.message}`);
            setPreviewSvg(null);
          }
        })();
      } else {
        setPreviewSvg(null);
      }
    }
  }, [open, format, xmlData]);

  const handleDownload = async () => {
    try {
      if (format === 'pptx') {
        const converter = await DrawioToPptxConverter.create();
        const { pptx } = converter.processXml(xmlData);
        await pptx.writeFile({ fileName: fileName || 'diagram.pptx' });
      } else {
        // Ensure XML is wrapped in standard Draw.io mxfile envelope
        let finalXml = xmlData;
        if (!finalXml.includes('<mxfile')) {
          const host = window.location.hostname || 'localhost';
          const modifiedDate = new Date().toISOString();
          const cleanName = (fileName || 'diagram.drawio').replace('.drawio', '');
          const diagramId = Math.random().toString(36).substring(2, 10);
          finalXml = `<mxfile host="${host}" modified="${modifiedDate}" agent="Draw.io AI Studio" version="21.0.0" type="device">
  <diagram id="${diagramId}" name="${cleanName}">
    ${xmlData}
  </diagram>
</mxfile>`;
        }

        const blob = new Blob([finalXml], { type: 'application/x-drawio' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'diagram.drawio';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      onClose();
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Export as {format.toUpperCase()}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="File Name"
            variant="outlined"
            size="small"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </Box>

        {format === 'pptx' && (
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Preview
            </Typography>
            {error ? (
              <Typography color="error" variant="body2">{error}</Typography>
            ) : (
              <Box 
                sx={{ 
                  border: '1px solid #ccc', 
                  backgroundColor: '#f5f5f5',
                  height: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  '& svg': { maxWidth: '100%', maxHeight: '100%' }
                }}
                dangerouslySetInnerHTML={previewSvg ? { __html: previewSvg } : undefined}
              />
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleDownload} variant="contained" color="primary">
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
}
