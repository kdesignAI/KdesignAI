import React from 'react';
import { Alert, AlertTitle, Button, IconButton, Box, Typography } from '@mui/material';
import { ShieldAlert, KeyRound, Ban, X, Info, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onClose: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
  // Determine error type context based on message content
  const getErrorContext = (msg: string) => {
    const lowerMsg = msg.toLowerCase();
    
    if (lowerMsg.includes('safety') || lowerMsg.includes('blocked') || lowerMsg.includes('policy') || lowerMsg.includes('harmful') || lowerMsg.includes('content is restricted')) {
      return {
        title: 'Safety Policy Violation',
        icon: <ShieldAlert size={20} />,
        severity: 'warning' as const,
        suggestion: "Your prompt triggered Google's safety filters. Please rephrase your request to remove any potentially explicit, violent, or controversial content.",
        action: null,
        isAuth: false
      };
    }
    
    if (lowerMsg.includes('key') || lowerMsg.includes('access denied') || lowerMsg.includes('403') || lowerMsg.includes('401') || lowerMsg.includes('unauthenticated') || lowerMsg.includes('requested entity was not found')) {
      return {
        title: 'API Key / Authentication Error',
        icon: <KeyRound size={20} />,
        severity: 'error' as const,
        suggestion: 'Your API key is missing, invalid, or lacks the necessary permissions for this model. You may need to re-select or update your API key.',
        action: {
          label: 'Update API Key',
          icon: <KeyRound size={16} />,
          onClick: () => window.aistudio?.openSelectKey()
        },
        isAuth: true
      };
    }

    if (lowerMsg.includes('quota') || lowerMsg.includes('limit') || lowerMsg.includes('429') || lowerMsg.includes('exhausted') || lowerMsg.includes('too many requests')) {
      return {
        title: 'Quota Exceeded',
        icon: <Ban size={20} />,
        severity: 'warning' as const,
        suggestion: 'You have reached your API usage limit or are sending requests too quickly. Please wait a few minutes before trying again, or check your Google Cloud billing account.',
        action: {
          label: 'Check Billing Details',
          icon: <ExternalLink size={16} />,
          onClick: () => window.open('https://console.cloud.google.com/billing', '_blank')
        },
        isAuth: false
      };
    }

    if (lowerMsg.includes('aspect ratio') || lowerMsg.includes('resolution') || lowerMsg.includes('support') || lowerMsg.includes('model') || lowerMsg.includes('invalid argument')) {
      return {
        title: 'Configuration Error',
        icon: <Info size={20} />,
        severity: 'info' as const,
        suggestion: 'The selected settings (like aspect ratio or resolution) are not supported by the current model. Please adjust your configuration and try again.',
        action: null,
        isAuth: false
      };
    }
    
    if (lowerMsg.includes('network') || lowerMsg.includes('fetch') || lowerMsg.includes('failed to fetch') || lowerMsg.includes('offline')) {
      return {
        title: 'Network Error',
        icon: <RefreshCw size={20} />,
        severity: 'error' as const,
        suggestion: 'There was a problem connecting to the server. Please check your internet connection and try again.',
        action: null,
        isAuth: false
      };
    }

    return {
      title: 'Generation Failed',
      icon: <AlertCircle size={20} />,
      severity: 'error' as const,
      suggestion: 'An unexpected error occurred. Please check your prompt and try again.',
      action: null,
      isAuth: false
    };
  };

  const { title, icon, severity, suggestion, action, isAuth } = getErrorContext(message);

  return (
    <Box sx={{ mb: 4, animation: 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)', '@keyframes slideDown': { from: { opacity: 0, transform: 'translateY(-10px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      <Alert 
        severity={severity} 
        icon={icon}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onClose}
            sx={{ opacity: 0.7, '&:hover': { opacity: 1, bgcolor: 'rgba(0,0,0,0.05)' } }}
          >
            <X size={20} />
          </IconButton>
        }
        sx={{ 
          borderRadius: 3, 
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
          border: '1px solid',
          borderColor: severity === 'error' ? 'error.light' : severity === 'warning' ? 'warning.light' : 'info.light',
          '& .MuiAlert-icon': { pt: 0.5 }
        }}
      >
        <AlertTitle sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>{title}</AlertTitle>
        <Typography variant="body2" sx={{ mb: 1.5, wordBreak: 'break-word', opacity: 0.9, lineHeight: 1.5 }}>
          {message}
        </Typography>
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'rgba(0,0,0,0.08)', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: { sm: 'flex-start' } }}>
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', opacity: 0.6, mt: 0.5, letterSpacing: '0.05em' }}>
            Suggestion
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, lineHeight: 1.5 }}>
            {suggestion}
          </Typography>
        </Box>
        
        {action && (
          <Button 
            variant="contained" 
            color={severity} 
            size="small" 
            startIcon={action.icon}
            onClick={action.onClick}
            disableElevation
            sx={{ mt: 2.5, borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
          >
            {action.label}
          </Button>
        )}
        
        {!action && isAuth && window.aistudio && (
          <Button 
            variant="contained" 
            color={severity} 
            size="small" 
            startIcon={<KeyRound size={16} />}
            onClick={() => window.aistudio?.openSelectKey()}
            disableElevation
            sx={{ mt: 2.5, borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
          >
            Update API Key
          </Button>
        )}
      </Alert>
    </Box>
  );
};
