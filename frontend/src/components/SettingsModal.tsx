import React, { useState } from 'react';
import { Key, ShieldCheck, X, Check, Cpu, Server, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customKey: string;
  onSaveCustomKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  customKey,
  onSaveCustomKey,
}) => {
  const [inputKey, setInputKey] = useState(customKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveCustomKey(inputKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setInputKey('');
    onSaveCustomKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f1523] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Key className="w-4 h-4 text-sky-400" />
            <span>LLM Engine &amp; BYOK Configuration</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* System Active Engine Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5 text-sky-300">
              <Cpu className="w-3.5 h-3.5" />
              Primary Engine (System Default)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Online
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Groq LPU Hardware Acceleration (<code className="text-sky-300">qwen3.8-27b</code>) with automatic Google Gemini 2.0 Flash failover. Multi-agent debate completes in ~35 seconds.
          </p>
        </div>

        {/* Bring Your Own Key (BYOK) Section */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-200">
            Bring-Your-Own-Key (BYOK) Fallback
          </label>
          <p className="text-[11px] text-slate-400">
            Provide your personal free Groq (<code className="text-slate-300">gsk_...</code>) or OpenAI API key to bypass shared community rate limits.
          </p>
          <div className="relative mt-1">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="gsk_... or sk-..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
            />
          </div>
          {customKey && (
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <Check className="w-3 h-3" /> Active custom key configured in browser session.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={handleClear}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            Clear Custom Key
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-md shadow-sky-500/20 flex items-center gap-1.5"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved!
                </>
              ) : (
                'Save Key'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
