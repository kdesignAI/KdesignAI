import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export const LoadingState: React.FC<{ message: string }> = ({ message }) => {
  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: 256, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        bgcolor: 'white', 
        borderRadius: 4, 
        border: '1px solid', 
        borderColor: 'divider',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle animated background gradient */}
      <Box sx={{ 
        position: 'absolute', 
        inset: 0, 
        background: 'linear-gradient(120deg, rgba(248,250,252,0) 0%, rgba(241,245,249,0.5) 50%, rgba(248,250,252,0) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite linear',
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        }
      }} />

      <Box sx={{ position: 'relative', mb: 3, zIndex: 1 }}>
        <CircularProgress size={56} thickness={4} sx={{ color: 'primary.main', opacity: 0.2 }} />
        <CircularProgress 
          size={56} 
          thickness={4} 
          disableShrink
          sx={{ 
            color: 'primary.main', 
            position: 'absolute', 
            left: 0, 
            animationDuration: '1.5s',
            strokeLinecap: 'round'
          }} 
        />
      </Box>
      <Typography 
        variant="body2" 
        color="text.secondary" 
        fontWeight="600" 
        align="center" 
        sx={{ 
          maxWidth: 320, 
          zIndex: 1,
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.5 }
          }
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};