"use client";

import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { config } from '@/config';

interface DrawioEmbedProps {
  xmlData: string;
  xmlSource: string;
  theme: 'light' | 'dark';
  onXmlChange: (xml: string) => void;
}

export default function DrawioEmbed({ xmlData, xmlSource, theme, onXmlChange }: DrawioEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const xmlDataRef = useRef(xmlData);
  const onXmlChangeRef = useRef(onXmlChange);
  const [loaded, setLoaded] = useState(false);

  const baseParams = new URLSearchParams(({
    ...config.drawio.params,
    libs: config.drawio.libs.join(';'),
    dark: theme === 'dark' ? '1' : '0',
    configure: '1',
  } as unknown) as Record<string, string>).toString();
  const clibsParam = config.drawio.clibs?.length
    ? `&clibs=${config.drawio.clibs.join(';')}`
    : '';
  const drawioUrl = `${config.drawio.baseUrl}?${baseParams}${clibsParam}`;

  // Keep refs in sync without triggering effects
  xmlDataRef.current = xmlData;
  onXmlChangeRef.current = onXmlChange;

  // Single message listener — registered once
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'string') return;
      try {
        const msg = JSON.parse(e.data);

        if (msg.event === 'configure') {
          iframeRef.current?.contentWindow?.postMessage(JSON.stringify({
            action: 'configure',
            config: config.drawio.defaultStyles
          }), '*');
        }

        if (msg.event === 'init') {
          readyRef.current = true;
          setLoaded(true);
          iframeRef.current?.contentWindow?.postMessage(JSON.stringify({
            action: 'load',
            autosave: 1,
            xml: xmlDataRef.current || '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>'
          }), '*');
        }

        if (msg.event === 'autosave' || msg.event === 'save') {
          if (msg.xml) {
            onXmlChangeRef.current(msg.xml);
          }
        }

        if (msg.event === 'exit') {
          // Re-load the current diagram to prevent the iframe from going blank
          iframeRef.current?.contentWindow?.postMessage(JSON.stringify({
            action: 'load',
            autosave: 1,
            xml: xmlDataRef.current || '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>'
          }), '*');
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Push XML to Draw.io only when the change came from outside (monaco or AI)
  // Debounce monaco updates to avoid disrupting typing
  useEffect(() => {
    if (!readyRef.current || !xmlData) return;
    if (xmlSource === 'drawio') return;

    const delay = xmlSource === 'monaco' ? 1000 : 0;
    const timer = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ action: 'load', xml: xmlData }),
        '*'
      );
    }, delay);

    return () => clearTimeout(timer);
  }, [xmlData, xmlSource]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {!loaded && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            zIndex: 1,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <iframe
        ref={iframeRef}
        src={drawioUrl}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Draw.io Editor"
      />
    </Box>
  );
}
