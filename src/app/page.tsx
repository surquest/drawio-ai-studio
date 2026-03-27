"use client";

import { useState, useEffect } from 'react';
import { Box, Button, Typography, Container, CircularProgress } from '@mui/material';
import { useGoogleLogin } from '@react-oauth/google';
import StudioLayout from '@/components/StudioLayout';
import { config } from '@/config';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  
  useEffect(() => {
    // Check if we have a valid, unexpired token on mount
    const checkToken = async () => {
      // If IAP is enabled, we don't need a token from Google Login
      // instead we will rely on identity aware proxy's auth
      if (config.google.iap.enabled) {
        setToken('iap-authorized');
        setIsInitializing(false);
        return;
      }

      const savedToken = localStorage.getItem('google_access_token');
      const tokenExpiresAt = localStorage.getItem('google_access_token_expires');
      
      if (savedToken && tokenExpiresAt) {
        const expiresAt = parseInt(tokenExpiresAt, 10);
        // Add a 5 minute buffer before actual expiration
        if (Date.now() < expiresAt - (5 * 60 * 1000)) {
          // Token is likely valid
          setToken(savedToken);
        } else {
          // Token expired, clean up
          localStorage.removeItem('google_access_token');
          localStorage.removeItem('google_access_token_expires');
        }
      }
      setIsInitializing(false);
    };
    
    checkToken();
  }, []);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setToken(tokenResponse.access_token);
      localStorage.setItem('google_access_token', tokenResponse.access_token);
      // Calculate expiration time (usually 1 hour / 3600 seconds)
      const expiresIn = tokenResponse.expires_in || 3600;
      const expiresAt = Date.now() + (expiresIn * 1000);
      localStorage.setItem('google_access_token_expires', expiresAt.toString());
    },
    onError: (error) => console.log('Login Failed', error),
    scope: config.google.scopes.join(' '),
    prompt: 'consent', // Force consent so new scopes are properly requested
  });

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_access_token_expires');
  };

  if (isInitializing) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!token) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {config.ui.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Please log in with your Google Cloud credentials to access the studio.
        </Typography>
        <Button variant="contained" color="primary" size="large" onClick={() => login()}>
          Login with Google
        </Button>
      </Container>
    );
  }

  return <StudioLayout token={token} onLogout={handleLogout} />;
}
