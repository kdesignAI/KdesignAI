import React from 'react';
import { AlertCircle, ShieldAlert, KeyRound, Ban, X, Info } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onClose: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
  // Determine error type context based on message content
  const getErrorContext = (msg: string) => {
    const lowerMsg = msg.toLowerCase();
    
    if (lowerMsg.includes('safety') || lowerMsg.includes('blocked') || lowerMsg.includes('policy') || lowerMsg.includes('harmful')) {
      return {
        title: 'Content Safety Block',
        icon: <ShieldAlert className="w-5 h-5 text-red-600" />,
        suggestion: 'Your prompt may have triggered safety filters. Try rephrasing it to be less explicit or controversial.',
        isAuth: false
      };
    }
    
    if (lowerMsg.includes('key') || lowerMsg.includes('access denied') || lowerMsg.includes('403') || lowerMsg.includes('401') || lowerMsg.includes('unauthenticated')) {
      return {
        title: 'Authentication Error',
        icon: <KeyRound className="w-5 h-5 text-red-600" />,
        suggestion: 'There seems to be an issue with your API key or permissions.',
        isAuth: true
      };
    }

    if (lowerMsg.includes('quota') || lowerMsg.includes('limit') || lowerMsg.includes('429') || lowerMsg.includes('exhausted')) {
      return {
        title: 'Usage Limit Exceeded',
        icon: <Ban className="w-5 h-5 text-red-600" />,
        suggestion: 'You have hit the API rate limits. Please wait a moment before trying again.',
        isAuth: false
      };
    }

    if (lowerMsg.includes('aspect ratio') || lowerMsg.includes('resolution') || lowerMsg.includes('support') || lowerMsg.includes('model')) {
      return {
        title: 'Configuration Error',
        icon: <Info className="w-5 h-5 text-red-600" />,
        suggestion: 'The selected settings (aspect ratio, resolution) may not be supported. Please adjust your configuration.',
        isAuth: false
      };
    }

    return {
      title: 'Generation Failed',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      suggestion: 'An unexpected error occurred. Please check your prompt and connection, then try again.',
      isAuth: false
    };
  };

  const { title, icon, suggestion, isAuth } = getErrorContext(message);

  return (
    <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-red-900">{title}</h3>
            <button 
              onClick={onClose}
              className="text-red-400 hover:text-red-600 hover:bg-red-100 p-1 rounded-full transition-all"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-red-800 mt-1 break-words font-medium leading-relaxed">
            {message}
          </p>
          
          <div className="mt-3 pt-3 border-t border-red-200/60 flex flex-col sm:flex-row sm:items-start gap-2 text-xs text-red-700">
            <span className="font-bold uppercase tracking-wider opacity-70 shrink-0 mt-0.5">Suggestion:</span>
            <span className="opacity-90">{suggestion}</span>
          </div>
          
          {isAuth && window.aistudio && (
             <button 
               onClick={() => window.aistudio?.openSelectKey()}
               className="mt-4 text-xs bg-white border border-red-200 hover:bg-red-50 text-red-700 font-bold py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-2"
             >
               <KeyRound className="w-3 h-3" />
               Update API Key
             </button>
          )}
        </div>
      </div>
    </div>
  );
};
