import React from 'react';
import { Video, Image as ImageIcon } from 'lucide-react';
import { SolarisLogo } from './SolarisLogo';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-tr from-brand-yellow/20 to-brand-red/20 blur-lg rounded-full"></div>
             <SolarisLogo className="w-10 h-10 relative z-10 drop-shadow-sm" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-blue via-slate-800 to-brand-red">
            Solaris AI Studio
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <div className="hidden md:flex items-center gap-1">
            <ImageIcon className="w-4 h-4 text-brand-blue" />
            <span>Imagen 4.0</span>
          </div>
          <div className="h-4 w-px bg-slate-300 hidden md:block"></div>
          <div className="hidden md:flex items-center gap-1">
            <Video className="w-4 h-4 text-brand-red" />
            <span>Veo 3.1</span>
          </div>
        </div>
      </div>
    </header>
  );
};