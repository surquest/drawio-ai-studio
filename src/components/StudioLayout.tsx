"use client";

import { useState, useRef, useCallback } from 'react';
import { Box, IconButton, Toolbar, AppBar, Typography, Button, Menu, MenuItem, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CodeIcon from '@mui/icons-material/Code';
import LogoutIcon from '@mui/icons-material/Logout';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import SaveIcon from '@mui/icons-material/Save';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SidebarLeft from './SidebarLeft';
import SidebarRight from './SidebarRight';
import DrawioEmbed from './DrawioEmbed';
import ExportDialog from './ExportDialog';
import { config } from '@/config';

type XmlSource = 'drawio' | 'monaco' | 'ai';

interface StudioLayoutProps {
  token: string;
  onLogout: () => void;
}

export default function StudioLayout({ token, onLogout }: StudioLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(false);
  const [drawioTheme, setDrawioTheme] = useState<'light' | 'dark'>('light');
  const [xmlData, setXmlData] = useState<string>('');
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const [exportFormat, setExportFormat] = useState<'pptx' | 'drawio'>('pptx');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const xmlSourceRef = useRef<XmlSource>('ai');

  const ignoreDrawioRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDrawioChange = useCallback((newXml: string) => {
    if (ignoreDrawioRef.current) return;
    xmlSourceRef.current = 'drawio';
    setXmlData(newXml);
  }, []);

  const handleMonacoChange = useCallback((newXml: string) => {
    xmlSourceRef.current = 'monaco';
    ignoreDrawioRef.current = true;
    setXmlData(newXml);

    // Re-enable drawio updates after user stops typing
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      ignoreDrawioRef.current = false;
    }, 1500);
  }, []);

  const handleAiGeneration = useCallback((generatedXml: string) => {
    xmlSourceRef.current = 'ai';
    setXmlData(generatedXml);
  }, []);

  const handleExportMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExportAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportAnchor(null);
  };

  const handleExportSelect = (format: 'pptx' | 'drawio') => {
    setExportFormat(format);
    setExportDialogOpen(true);
    handleExportMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar variant="dense">
          <IconButton edge="start" color="inherit" onClick={() => setLeftOpen(!leftOpen)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            {config.ui.title}
          </Typography>
          
          <IconButton color="inherit" onClick={handleExportMenuOpen} sx={{ mr: 1 }}>
            <SaveAsIcon />
          </IconButton>
          <Menu
            anchorEl={exportAnchor}
            open={Boolean(exportAnchor)}
            onClose={handleExportMenuClose}
          >
            <MenuItem onClick={() => handleExportSelect('pptx')}>
              <ListItemIcon><SlideshowIcon fontSize="small" /></ListItemIcon>
              <ListItemText>as PPTX</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleExportSelect('drawio')}>
              <ListItemIcon><SaveIcon fontSize="small" /></ListItemIcon>
              <ListItemText>as DrawIO</ListItemText>
            </MenuItem>
          </Menu>

          <IconButton color="inherit" onClick={() => setRightOpen(!rightOpen)} sx={{ mr: 1 }}>
            <CodeIcon />
          </IconButton>

          <Tooltip title={`Switch to ${drawioTheme === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton color="inherit" onClick={() => setDrawioTheme(drawioTheme === 'dark' ? 'light' : 'dark')} sx={{ mr: 2 }}>
              {drawioTheme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <IconButton color="inherit" onClick={onLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <SidebarLeft 
        open={leftOpen} 
        token={token} 
        onGenerate={handleAiGeneration} 
      />

      <Box component="main" sx={{ flexGrow: 1, p: 0, mt: '48px', height: 'calc(100vh - 48px)', position: 'relative' }}>
        <DrawioEmbed 
          xmlData={xmlData} 
          xmlSource={xmlSourceRef.current} 
          theme={drawioTheme}
          onXmlChange={handleDrawioChange} 
        />
      </Box>

      <SidebarRight 
        open={rightOpen} 
        xmlData={xmlData} 
        onChange={handleMonacoChange} 
        onClose={() => setRightOpen(false)}
      />

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        format={exportFormat}
        xmlData={xmlData}
      />
    </Box>
  );
}
