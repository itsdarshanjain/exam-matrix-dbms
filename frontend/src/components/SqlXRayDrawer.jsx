import React, { useState } from 'react';
import { 
  Terminal, 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Check, 
  Clock, 
  Database, 
  History, 
  CheckCircle2, 
  Code
} from 'lucide-react';

export default function SqlXRayDrawer({ 
  lastQuery, 
  queryHistory = [] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(null);

  const activeDisplayQuery = selectedHistoryIndex !== null && queryHistory[selectedHistoryIndex] 
    ? queryHistory[selectedHistoryIndex] 
    : lastQuery;

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getQueryBadge = (sql = '') => {
    const s = sql.toUpperCase();
    if (s.includes('CALL SP_AUTOALLOCATESEATS')) return { label: 'NESTED CURSOR PROCEDURE', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (s.includes('CALL SP_AUTOMODERATEBORDERLINE')) return { label: 'ACID ROW-LOCK PROCEDURE', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (s.includes('TRIGGER')) return { label: 'ACTIVE TRIGGER', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (s.includes('V_STUDENTHALLTICKET')) return { label: '5-TABLE JOIN VIEW', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (s.includes('V_HALLOCCUPANCYSUMMARY')) return { label: 'GROUP BY AGGREGATE VIEW', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    if (s.includes('NOT EXISTS')) return { label: 'RELATIONAL DIVISION', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
    if (s.includes('START TRANSACTION')) return { label: 'ACID TRANSACTION', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    return { label: 'RAW SQL QUERY', color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  const badge = getQueryBadge(activeDisplayQuery?.sqlExecuted);

  return (
    <div className="no-print fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out">
      {/* Expanded Full Drawer */}
      {isOpen && (
        <div className="bg-white border-t border-slate-200 shadow-2xl max-h-[480px] flex flex-col">
          {/* Drawer Top Header */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Live SQL X-Ray Inspector
                  </h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Real-time raw MySQL query, View, Stored Procedure, and Trigger payload execution monitor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {activeDisplayQuery?.durationMs !== undefined && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200 font-mono">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  <span>Latency: {activeDisplayQuery.durationMs}ms</span>
                </div>
              )}

              <button
                onClick={() => handleCopy(activeDisplayQuery?.sqlExecuted)}
                className="flex items-center gap-1 px-3 py-1 rounded-md bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 border border-slate-200 transition-colors"
                title="Copy raw SQL to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied SQL!' : 'Copy SQL'}</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Content: Query + History List */}
          <div className="p-5 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-y-auto max-h-[380px]">
            {/* Main SQL Viewer */}
            <div className="lg:col-span-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-brand-600" />
                  <span>Executed SQL Command:</span>
                </span>
                <span className="font-mono text-[11px] text-brand-700 font-bold">
                  Engine: {activeDisplayQuery?.dbEngine || 'MySQL 8.0 InnoDB'}
                </span>
              </div>

              <div className="relative group">
                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                  {activeDisplayQuery?.sqlExecuted || '-- No query executed yet. Perform an action in the UI to see live MySQL commands.'}
                </pre>
              </div>

              {activeDisplayQuery?.transactionStatus && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">ACID Transaction State:</span>
                  <span className="font-mono font-bold">{activeDisplayQuery.transactionStatus}</span>
                </div>
              )}
            </div>

            {/* Query History Column */}
            <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-200 lg:pl-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-2">
                <span className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-brand-600" />
                  <span>Session History ({queryHistory.length})</span>
                </span>
                {selectedHistoryIndex !== null && (
                  <button 
                    onClick={() => setSelectedHistoryIndex(null)}
                    className="text-[10px] text-brand-600 font-bold hover:underline"
                  >
                    View Latest
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                {queryHistory.slice(0, 15).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedHistoryIndex(idx)}
                    className={`w-full text-left p-2 rounded-lg text-[11px] font-mono transition-all border ${
                      (selectedHistoryIndex === idx) || (selectedHistoryIndex === null && idx === 0)
                        ? 'bg-brand-50 border-brand-300 text-brand-800 font-medium shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>#{queryHistory.length - idx}</span>
                      <span>{q.durationMs ? `${q.durationMs}ms` : ''}</span>
                    </div>
                    <div className="truncate font-medium">
                      {(q.sqlExecuted || '').substring(0, 60)}...
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Floating Pill Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/95 border-t border-slate-200 shadow-md px-4 sm:px-6 py-2.5 flex items-center justify-between cursor-pointer select-none backdrop-blur-xs transition-all hover:bg-slate-50 group"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
              <Terminal className="w-3.5 h-3.5 text-brand-600" />
              <span>LIVE SQL X-RAY</span>
            </span>
          </div>

          <span className={`hidden sm:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badge.color}`}>
            {badge.label}
          </span>

          <span className="text-xs font-mono text-slate-600 truncate max-w-xs md:max-w-xl lg:max-w-3xl">
            {lastQuery?.sqlExecuted 
              ? lastQuery.sqlExecuted.replace(/\s+/g, ' ').substring(0, 110) + '...'
              : 'Listening for database actions (Click to inspect SQL internals)...'}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {lastQuery?.durationMs !== undefined && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{lastQuery.durationMs}ms</span>
            </span>
          )}

          <div className="flex items-center gap-1 text-xs text-brand-600 group-hover:text-brand-700 font-semibold">
            <span className="hidden sm:inline">{isOpen ? 'Collapse X-Ray' : 'Inspect SQL'}</span>
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>
      </div>
    </div>
  );
}
