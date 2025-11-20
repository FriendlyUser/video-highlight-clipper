
import React, { useEffect, useRef } from 'react';
import { LogMessage } from '../types';

interface Props {
  logs: LogMessage[];
}

export const ProcessingLog: React.FC<Props> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cast to any to avoid TS errors if DOM types are incomplete in the environment
    (bottomRef.current as any)?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-full h-48 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden flex flex-col font-mono text-xs shadow-inner">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="text-slate-300 font-bold">System Terminal</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {logs.length === 0 && <span className="text-slate-600 italic">Ready for input...</span>}
        {logs.map((log, i) => (
          <div key={i} className={`flex gap-3 ${
            log.type === 'error' ? 'text-red-400' : 
            log.type === 'success' ? 'text-emerald-400' : 'text-slate-400'
          }`}>
            <span className="opacity-50">[{new Date(log.timestamp).toLocaleTimeString().split(' ')[0]}]</span>
            <span>{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
