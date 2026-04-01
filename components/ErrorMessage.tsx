import React from 'react';
import { AlertCircle, ShieldAlert, KeyRound, Ban, X, Info, ExternalLink, RefreshCw } from 'lucide-react';

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
        icon: <ShieldAlert className="w-5 h-5 text-orange-600" />,
        colorClass: 'bg-orange-50 border-orange-200 text-orange-900',
        suggestion: "Your prompt triggered Google's safety filters. Please rephrase your request to remove any potentially explicit, violent, or controversial content.",
        action: null,
        isAuth: false
      };
    }
    
    if (lowerMsg.includes('key') || lowerMsg.includes('access denied') || lowerMsg.includes('403') || lowerMsg.includes('401') || lowerMsg.includes('unauthenticated') || lowerMsg.includes('requested entity was not found')) {
      return {
        title: 'API Key / Authentication Error',
        icon: <KeyRound className="w-5 h-5 text-red-600" />,
        colorClass: 'bg-red-50 border-red-200 text-red-900',
        suggestion: 'Your API key is missing, invalid, or lacks the necessary permissions for this model. You may need to re-select or update your API key.',
        action: {
          label: 'Update API Key',
          icon: <KeyRound className="w-3 h-3" />,
          onClick: () => window.aistudio?.openSelectKey()
        },
        isAuth: true
      };
    }

    if (lowerMsg.includes('quota') || lowerMsg.includes('limit') || lowerMsg.includes('429') || lowerMsg.includes('exhausted') || lowerMsg.includes('too many requests')) {
      return {
        title: 'Quota Exceeded',
        icon: <Ban className="w-5 h-5 text-amber-600" />,
        colorClass: 'bg-amber-50 border-amber-200 text-amber-900',
        suggestion: 'You have reached your API usage limit or are sending requests too quickly. Please wait a few minutes before trying again, or check your Google Cloud billing account.',
        action: {
          label: 'Check Billing Details',
          icon: <ExternalLink className="w-3 h-3" />,
          onClick: () => window.open('https://console.cloud.google.com/billing', '_blank')
        },
        isAuth: false
      };
    }

    if (lowerMsg.includes('aspect ratio') || lowerMsg.includes('resolution') || lowerMsg.includes('support') || lowerMsg.includes('model') || lowerMsg.includes('invalid argument')) {
      return {
        title: 'Configuration Error',
        icon: <Info className="w-5 h-5 text-blue-600" />,
        colorClass: 'bg-blue-50 border-blue-200 text-blue-900',
        suggestion: 'The selected settings (like aspect ratio or resolution) are not supported by the current model. Please adjust your configuration and try again.',
        action: null,
        isAuth: false
      };
    }
    
    if (lowerMsg.includes('network') || lowerMsg.includes('fetch') || lowerMsg.includes('failed to fetch') || lowerMsg.includes('offline')) {
      return {
        title: 'Network Error',
        icon: <RefreshCw className="w-5 h-5 text-slate-600" />,
        colorClass: 'bg-slate-50 border-slate-200 text-slate-900',
        suggestion: 'There was a problem connecting to the server. Please check your internet connection and try again.',
        action: null,
        isAuth: false
      };
    }

    return {
      title: 'Generation Failed',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      colorClass: 'bg-red-50 border-red-200 text-red-900',
      suggestion: 'An unexpected error occurred. Please check your prompt and try again.',
      action: null,
      isAuth: false
    };
  };

  const { title, icon, colorClass, suggestion, action, isAuth } = getErrorContext(message);

  return (
    <div className={`mb-8 border rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${colorClass}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold opacity-90">{title}</h3>
            <button 
              onClick={onClose}
              className="opacity-50 hover:opacity-100 p-1 rounded-full transition-all"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm mt-1 break-words font-medium leading-relaxed opacity-90">
            {message}
          </p>
          
          <div className="mt-3 pt-3 border-t border-current/10 flex flex-col sm:flex-row sm:items-start gap-2 text-xs">
            <span className="font-bold uppercase tracking-wider opacity-70 shrink-0 mt-0.5">Suggestion:</span>
            <span className="opacity-90">{suggestion}</span>
          </div>
          
          {action && (
             <button 
               onClick={action.onClick}
               className="mt-4 text-xs bg-white border border-current/20 hover:bg-black/5 font-bold py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-2"
             >
               {action.icon}
               {action.label}
             </button>
          )}
          
          {/* Fallback for auth if action wasn't explicitly set but isAuth is true */}
          {!action && isAuth && window.aistudio && (
             <button 
               onClick={() => window.aistudio?.openSelectKey()}
               className="mt-4 text-xs bg-white border border-current/20 hover:bg-black/5 font-bold py-2 px-4 rounded-lg transition-all shadow-sm hover:shadow flex items-center gap-2"
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
