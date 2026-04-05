import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box, IconButton, Alert } from '@mui/material';
import { Key, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  initialKey?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, initialKey = '' }) => {
  const [apiKey, setApiKey] = useState(initialKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('custom_gemini_api_key', apiKey.trim());
      onSave(apiKey.trim());
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1500);
    } else {
      localStorage.removeItem('custom_gemini_api_key');
      onSave('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth 
      PaperProps={{ 
        sx: { 
          borderRadius: 4,
          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
          overflow: 'hidden'
        } 
      }}
    >
      <DialogTitle sx={{ m: 0, p: 3, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.50', borderRadius: 2, color: 'primary.main' }}>
            <Key size={20} />
          </Box>
          <Typography variant="h6" component="div" fontWeight="800" sx={{ letterSpacing: '-0.02em' }}>
            Set Gemini API Key
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'text.secondary', bgcolor: 'grey.50', '&:hover': { bgcolor: 'grey.100', color: 'text.primary' } }}
          size="small"
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, pb: 4, pt: '0 !important' }}>
        <Alert 
          severity="info" 
          icon={<AlertCircle size={20} />} 
          sx={{ 
            mb: 4, 
            borderRadius: 3,
            bgcolor: 'info.50',
            color: 'info.900',
            border: '1px solid',
            borderColor: 'info.100',
            '& .MuiAlert-icon': { color: 'info.main' }
          }}
        >
          To use this app externally (e.g., on Vercel), you need to provide your own paid Gemini API key. 
          This key is stored securely in your browser's local storage and is never sent to our servers.
        </Alert>
        
        <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ mb: 1 }}>
          Gemini API Key
        </Typography>
        <TextField
          autoFocus
          fullWidth
          type="password"
          placeholder="AIzaSy..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          variant="outlined"
          size="medium"
          InputProps={{ 
            sx: { 
              fontFamily: 'monospace',
              bgcolor: 'grey.50',
              borderRadius: 2,
              '&:hover': { bgcolor: 'white' },
              '&.Mui-focused': { bgcolor: 'white', boxShadow: '0 0 0 2px rgba(14, 165, 233, 0.2)' }
            } 
          }}
        />
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose} 
          color="inherit" 
          sx={{ fontWeight: 600, borderRadius: 2, px: 3, py: 1, color: 'text.secondary', '&:hover': { bgcolor: 'grey.100' } }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disableElevation
          sx={{ 
            bgcolor: 'grey.900', 
            color: 'white', 
            '&:hover': { bgcolor: 'black', transform: 'translateY(-1px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            py: 1,
            transition: 'all 0.2s'
          }}
          startIcon={isSaved ? <CheckCircle2 size={18} /> : null}
        >
          {isSaved ? 'Saved' : 'Save Key'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
