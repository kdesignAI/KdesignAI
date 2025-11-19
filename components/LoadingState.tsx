import React from 'react';

export const LoadingState: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="w-full h-64 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-brand-blue border-t-transparent animate-spin"></div>
        <div className="absolute inset-2 rounded-full bg-brand-red/10 animate-pulse"></div>
      </div>
      <p className="text-slate-600 font-medium animate-pulse text-center max-w-xs">
        {message}
      </p>
    </div>
  );
};