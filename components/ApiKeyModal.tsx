import React, { useState } from 'react';
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Key className="w-5 h-5 text-brand-blue" />
            <h2>Set Gemini API Key</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              To use this app externally (e.g., on Vercel), you need to provide your own paid Gemini API key. 
              This key is stored securely in your browser's local storage and is never sent to our servers.
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700">
              Gemini API Key
            </label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all font-mono text-sm"
            />
          </div>
        </div>
        
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Saved
              </>
            ) : (
              'Save Key'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
