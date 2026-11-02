import React, { useState } from 'react';
import { Key, X, Check, Cpu } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
      <div className="bg-obsidian-900 border border-white/[0.12] rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
            <Key className="w-3.5 h-3.5 text-sky-400" />
            <span>LLM Engine &amp; BYOK Configuration</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* System Active Engine Card */}
        <div className="bg-obsidian-950 border border-white/[0.06] rounded-lg p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5 text-sky-300">
              <Cpu className="w-3.5 h-3.5" />
              Primary Inference Engine
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              READY
            </span>
          </div>
          <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
            Groq LPU Hardware Acceleration (<code className="text-sky-300">qwen/qwen3.8-27b</code>). Sub-second per-agent latency for multi-agent adversarial debate.
          </p>
        </div>

        {/* Bring Your Own Key (BYOK) Section */}
        <div className="space-y-1.5 text-xs">
          <label className="block text-slate-300 font-semibold uppercase text-[10px]">
            Bring-Your-Own-Key (BYOK) Optional Override
          </label>
          <p className="text-[11px] text-slate-400 font-sans">
            Provide your personal free Groq (<code className="text-slate-300">gsk_...</code>) or OpenAI key to bypass shared community rate limits.
          </p>
          <div className="relative mt-1">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="gsk_... or sk-..."
              className="w-full bg-obsidian-950 border border-white/[0.08] rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
          {customKey && (
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
              <Check className="w-3 h-3" /> Custom API key active in browser session.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.08]">
          <button
            onClick={handleClear}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            Clear Key
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-obsidian-950 font-bold text-xs"
            >
              {saved ? 'Saved!' : 'Save Config'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
