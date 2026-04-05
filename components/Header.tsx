import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Tooltip, Chip } from '@mui/material';
import { Video, Image as ImageIcon, Settings, Sparkles } from 'lucide-react';
import { SolarisLogo } from './SolarisLogo';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'rgba(0,0,0,0.05)', bgcolor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', zIndex: 1100 }}>
      <Toolbar sx={{ maxWidth: 'xl', width: '100%', mx: 'auto', display: 'flex', justifyContent: 'space-between', py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box sx={{ position: 'relative', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.main', borderRadius: '14px', boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.3), 0 4px 6px -4px rgba(14, 165, 233, 0.3)', background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' }}>
            <SolarisLogo className="w-8 h-8 relative z-10 text-white" />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: 'grey.900', lineHeight: 1.1, letterSpacing: '-0.03em', fontSize: '1.25rem' }}>
              Solaris Studio
            </Typography>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, letterSpacing: '0.02em', textTransform: 'uppercase', fontSize: '0.65rem', mt: 0.5 }}>
              <Sparkles size={10} /> AI Creation Suite
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1, bgcolor: 'grey.50', p: 0.5, borderRadius: '12px', border: '1px solid', borderColor: 'grey.200' }}>
            <Chip 
              icon={<ImageIcon size={14} />} 
              label="Imagen 4.0" 
              size="small" 
              sx={{ bgcolor: 'white', fontWeight: 700, color: 'grey.900', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', borderRadius: '8px', px: 0.5, height: 28 }} 
            />
            <Chip 
              icon={<Video size={14} />} 
              label="Veo 3.1" 
              size="small" 
              sx={{ bgcolor: 'transparent', fontWeight: 600, color: 'grey.500', '& .MuiChip-icon': { color: 'grey.400' }, px: 0.5, height: 28, '&:hover': { bgcolor: 'grey.100', color: 'grey.700' } }} 
            />
          </Box>
          <Tooltip title="Settings">
            <IconButton onClick={onOpenSettings} sx={{ color: 'grey.600', bgcolor: 'white', border: '1px solid', borderColor: 'grey.200', borderRadius: '12px', width: 40, height: 40, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', '&:hover': { color: 'primary.main', bgcolor: 'primary.50', borderColor: 'primary.100', transform: 'translateY(-1px)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }, transition: 'all 0.2s' }}>
              <Settings size={20} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};