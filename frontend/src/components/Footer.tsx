import React from 'react';
import { ShieldAlert, GraduationCap, Github, Code, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-slate-800 bg-[#070a10] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800/80">
          {/* Institutional Attribution */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <GraduationCap className="w-4 h-4 text-sky-400" />
              <span>Academic Institutional Submission</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Minor Project (Semester 7) &bull; Autonomous Multi-Agent Portfolio Management System (MASS)
            </p>
            <p className="text-slate-300 font-medium">
              Department of Computer Science & Engineering<br />
              <strong className="text-sky-300 font-semibold">National Institute of Technology (NIT) Raipur</strong>
            </p>
            <p className="text-slate-400 pt-1">
              Author: <span className="text-slate-200 font-semibold">Vibhor Shukla</span> (Roll No: <span className="font-mono text-sky-300">23115107</span>)
            </p>
          </div>

          {/* Core Tech Stack */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Computational Architecture</span>
            </div>
            <ul className="space-y-1 text-slate-400">
              <li>&bull; <strong className="text-slate-300">LLM Inference:</strong> Groq LPU (<span className="font-mono text-sky-300">qwen3.8-27b</span>) + Gemini Fallback</li>
              <li>&bull; <strong className="text-slate-300">Agent Framework:</strong> CrewAI 7-Agent Adversarial Debate Pipeline</li>
              <li>&bull; <strong className="text-slate-300">Convex Solvers:</strong> Black-Litterman & Hierarchical Risk Parity (PyPortfolioOpt)</li>
              <li>&bull; <strong className="text-slate-300">Shielding:</strong> MASS Contamination Protocol (Entity & Temporal Anonymization)</li>
              <li>&bull; <strong className="text-slate-300">Backend / Frontend:</strong> Python FastAPI (SSE) + React 18 + Tailwind</li>
            </ul>
          </div>

          {/* Academic Legal Disclaimer */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Mandatory Academic Disclaimer</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              This software is strictly an academic experimental prototype designed for algorithmic testing. The model-derived return views, agent debates, and portfolio weights do not constitute financial advice, investment solicitation, or legal endorsement. Neither NIT Raipur nor the student researcher shall be liable for any financial losses or damages incurred.
            </p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>&copy; {new Date().getFullYear()} Autonomous Multi-Agent Portfolio Management (MASS). Released under the MIT License.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/VibhorShukla-BHRT/Portfolio-Management"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-sky-400 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
