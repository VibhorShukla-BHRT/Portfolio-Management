import React from 'react';
import { ShieldAlert, GraduationCap, Github, Cpu, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-white/[0.08] bg-obsidian-950 text-slate-400 font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-white/[0.06]">
          {/* Institutional Attribution */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
              <GraduationCap className="w-4 h-4 text-sky-400" />
              <span>Institutional Research Submission</span>
            </div>
            <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
              Autonomous Multi-Agent Simulation Scaling Portfolio Management (MASS)
            </p>
            <p className="text-slate-300 text-[11px]">
              Department of Computer Science &amp; Engineering<br />
              <strong className="text-sky-300 font-bold">National Institute of Technology (NIT) Raipur</strong>
            </p>
            <p className="text-slate-400 text-[11px]">
              Researcher: <span className="text-white font-semibold">Vibhor Shukla</span> (Roll: <span className="text-sky-400 font-bold">23115107</span>)
            </p>
          </div>

          {/* Core Tech Stack */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Computational Architecture</span>
            </div>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              <li>&bull; <strong className="text-slate-200">LLM Inference:</strong> Groq LPU (<span className="text-sky-300">qwen3.8-27b</span>)</li>
              <li>&bull; <strong className="text-slate-200">Orchestrator:</strong> CrewAI 7-Agent Adversarial Debate</li>
              <li>&bull; <strong className="text-slate-200">Convex Solvers:</strong> Black-Litterman Bayesian &amp; HRP (PyPortfolioOpt)</li>
              <li>&bull; <strong className="text-slate-200">Contamination Shield:</strong> MASS Entity Masking Protocol</li>
              <li>&bull; <strong className="text-slate-200">Engine:</strong> FastAPI (SSE) + React 18 + Tailwind</li>
            </ul>
          </div>

          {/* Academic Legal Disclaimer */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Academic Experimental Disclaimer</span>
            </div>
            <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
              This software is strictly an academic research prototype. The model-derived return views, agent debates, and mathematical portfolio weights do not constitute financial advice, investment solicitation, or endorsement. Neither NIT Raipur nor the author is responsible for any financial profits or losses.
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500">
          <p>&copy; {new Date().getFullYear()} MASS Autonomous Portfolio System &bull; NIT Raipur</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/VibhorShukla-BHRT/Portfolio-Management"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Source Repository</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
