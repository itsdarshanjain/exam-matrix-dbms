import React from 'react';
import { AlertTriangle, X, ShieldAlert, Terminal, CheckCircle2 } from 'lucide-react';

export default function TriggerAlertModal({ errorData, onClose }) {
  if (!errorData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-rose-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800">
        {/* Top Warning Banner */}
        <div className="bg-rose-50 px-6 py-4 border-b border-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-600 text-white font-bold">
                  SQLSTATE: {errorData.sqlState || '45000'}
                </span>
                <span className="text-xs font-mono text-rose-700 font-semibold">
                  MySQL Error #{errorData.errorCode || 1644}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                RDBMS Trigger Invariant Shield Triggered!
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Trigger Message */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900">
            <div className="text-xs uppercase tracking-wider text-rose-700 font-bold mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Database Engine Trigger Signal</span>
            </div>
            <p className="text-sm font-mono font-semibold">
              {errorData.errorMessage || 'TRIGGER BLOCKED: Relational invariant violation detected!'}
            </p>
          </div>

          {/* Trigger Rule Enforced */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Firing Trigger:</span>
              <span className="font-mono font-bold text-brand-700">
                {errorData.triggerFired || 'trg_CrossExamSeatConflict'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Enforced Constraint Rule:</span>
              <span className="font-semibold text-slate-800">
                {errorData.ruleEnforced || 'Capacity & Schedule Collision Invariant'}
              </span>
            </div>
          </div>

          {/* Rejected SQL Statement */}
          {errorData.sqlExecuted && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                  <Terminal className="w-3.5 h-3.5 text-slate-600" />
                  <span>Rejected SQL Statement (Rolled Back by Trigger Signal):</span>
                </span>
                <span className="text-[11px] font-mono text-rose-700 font-semibold">
                  Transaction Auto-Aborted
                </span>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-rose-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-36">
                {errorData.sqlExecuted}
              </pre>
            </div>
          )}

          {/* Academic Viva Context */}
          <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-slate-700 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-brand-900">Viva Defense Point:</strong> In enterprise RDBMS architecture, critical business rules (such as room capacity and seat double-booking) must NEVER rely solely on the frontend or backend application code. Active triggers enforce ACID consistency directly at the database engine level.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
