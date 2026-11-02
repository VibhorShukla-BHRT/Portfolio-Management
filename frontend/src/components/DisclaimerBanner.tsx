import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-200/90 flex items-center justify-between">
      <div className="max-w-7xl mx-auto flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong className="text-amber-300 font-semibold">Academic Experimental Project:</strong> This system is developed solely for computational finance research within the Department of Computer Science & Engineering at the National Institute of Technology (NIT) Raipur. Recommendations are model-generated and do not constitute financial advice. The developers and NIT Raipur assume zero liability for investment outcomes.
        </span>
      </div>
    </div>
  );
};
