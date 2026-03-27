"use client";

import { Drawer, Box, Typography } from '@mui/material';
import Editor from '@monaco-editor/react';
import { config } from '@/config';

interface SidebarRightProps {
  open: boolean;
  xmlData: string;
  onChange: (xml: string) => void;
}

export default function SidebarRight({ open, xmlData, onChange, onClose }: SidebarRightProps & { onClose: () => void }) {
  const drawerWidth = config.ui.sidebarWidth;
  return (
    <Drawer
      variant="temporary"
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        zIndex: (theme) => theme.zIndex.drawer + 2,
        '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', mt: '48px', height: 'calc(100vh - 48px)' },
      }}
    >
      <Box sx={{ flexGrow: 1, overflow: 'hidden', pt: 2, bgcolor: '#1e1e1e' }}>
        <Editor
          height="100%"
          defaultLanguage="xml"
          theme="vs-dark"
          value={xmlData}
          onChange={(value) => onChange(value || '')}
          options={{
            minimap: { enabled: false },
            wordWrap: 'on',
            formatOnPaste: true,
          }}
        />
      </Box>
    </Drawer>
  );
}
