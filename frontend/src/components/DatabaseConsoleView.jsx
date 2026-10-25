import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  RefreshCw, 
  Cloud, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Code2,
  Table2,
  Sparkles
} from 'lucide-react';

export default function DatabaseConsoleView({ onQueryExecuted }) {
  const [dbStatus, setDbStatus] = useState(null);
  const [sqlInput, setSqlInput] = useState(`SELECT * FROM students WHERE branch = 'CSE' ORDER BY enrollment_no ASC;`);
  const [queryResult, setQueryResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Supabase form
  const [showConfig, setShowConfig] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [syncFeedback, setSyncFeedback] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/database/status');
      const data = await res.json();
      if (data.success) {
        setDbStatus(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleExecuteSql = async (customSql) => {
    const queryToRun = customSql || sqlInput;
    if (!queryToRun.trim()) return;

    setIsExecuting(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/database/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: queryToRun })
      });
      const data = await res.json();
      setQueryResult(data);
      if (data.sqlExecuted && onQueryExecuted) onQueryExecuted(data);
    } catch (err) {
      setQueryResult({ success: false, error: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSaveSupabaseConfig = async (e) => {
    e.preventDefault();
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/database/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabase_url: supabaseUrl, supabase_key: supabaseKey })
      });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback({ type: 'success', text: data.message });
        fetchStatus();
        setShowConfig(false);
      } else {
        setSyncFeedback({ type: 'error', text: data.error });
      }
    } catch (err) {
      setSyncFeedback({ type: 'error', text: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/database/sync-supabase', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncFeedback({ type: 'success', text: data.message });
      } else {
        setSyncFeedback({ type: 'error', text: data.error });
      }
    } catch (err) {
      setSyncFeedback({ type: 'error', text: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const sampleQueries = [
    {
      label: 'SHOW TABLES (Schema Catalog)',
      sql: `SHOW TABLES;`
    },
    {
      label: 'DESCRIBE students (Schema Definition)',
      sql: `DESCRIBE students;`
    },
    {
      label: 'Aggregate Examinees by Branch (GROUP BY)',
      sql: `SELECT branch, COUNT(*) FROM students GROUP BY branch;`
    },
    {
      label: 'Examinees in CSE Department',
      sql: `SELECT enrollment_no, full_name, branch, semester, section FROM students WHERE branch = 'CSE' ORDER BY enrollment_no ASC;`
    },
    {
      label: 'Inspect 2D Bench Seat Allocations',
      sql: `SELECT allocation_id, enrollment_no, branch, room_number, bench_no, seat_position, seat_label FROM seat_allocations ORDER BY hall_id, row_no, col_no;`
    },
    {
      label: 'Scheduled Exams (Course Master)',
      sql: `SELECT exam_id, subject_code, subject_name, exam_date, shift_time, max_marks, passing_marks FROM exams;`
    },
    {
      label: 'Exam Halls & Seating Capacities',
      sql: `SELECT hall_id, room_number, building_block, matrix_dimensions, seats_per_bench, total_capacity, invigilator FROM exam_halls;`
    }
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
              <Database className="w-4 h-4" />
              <span>RDBMS Engine &amp; SQL Query Console</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {dbStatus?.engineName || 'PostgreSQL Engine'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Interactive Relational SQL Console
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Execute raw SQL statements, view returned relational tuples, and inspect live database state across tables.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium border border-slate-200 transition-colors"
            >
              <Cloud className="w-4 h-4 text-brand-600" />
              <span>{dbStatus?.isSupabaseConnected ? 'Supabase Connected' : 'Configure Supabase'}</span>
            </button>

            {dbStatus?.isSupabaseConnected && (
              <button
                onClick={handleSyncToSupabase}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Data to Cloud</span>
              </button>
            )}
          </div>
        </div>

        {syncFeedback && (
          <div className={`p-3 rounded-lg border text-xs sm:text-sm flex items-center justify-between ${
            syncFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{syncFeedback.text}</span>
            </div>
            <button onClick={() => setSyncFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>
        )}
      </div>

      {/* Supabase Configuration Drawer */}
      {showConfig && (
        <div className="bg-white border border-brand-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Supabase Cloud PostgreSQL Connection
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              supabase_schema.sql ready in /database
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Connect to your Supabase cloud project so you can open the Supabase <strong>Table Editor</strong> in another browser tab and show real PostgreSQL tables, ER diagrams, and SQL execution live to your faculty guide!
          </p>

          <form onSubmit={handleSaveSupabaseConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Project URL (SUPABASE_URL)
              </label>
              <input
                type="url"
                required
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-brand-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                API Key (Anon / Service Role Key)
              </label>
              <input
                type="password"
                required
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:bg-white focus:border-brand-500 font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Schema file: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-brand-700">database/supabase_schema.sql</code> (Contains all tables, triggers &amp; views)
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSyncing ? 'Testing Connection...' : 'Connect Supabase'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SQL Runner Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Execute Raw SQL Statement
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExecuteSql()}
              disabled={isExecuting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isExecuting ? 'Executing...' : 'Run SQL Query'}</span>
            </button>
          </div>
        </div>

        {/* Quick Sample Queries */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 block">
            1-Click Pre-set Demonstration Queries:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSqlInput(q.sql);
                  handleExecuteSql(q.sql);
                }}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 hover:border-brand-300 transition-colors font-medium"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* SQL Editor Area */}
        <div className="relative">
          <textarea
            rows={4}
            value={sqlInput}
            onChange={(e) => setSqlInput(e.target.value)}
            className="w-full p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed"
            placeholder="Type your SQL command here (SELECT, INSERT, UPDATE, DELETE)..."
          />
        </div>

        {/* Results Table */}
        {queryResult && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-800">Relational Result Set</span>
                <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {queryResult.rowCount || 0} Tuples
                </span>
              </div>
              {queryResult.durationMs !== undefined && (
                <span className="font-mono text-slate-500 text-[11px]">
                  Execution Latency: <strong className="text-emerald-700">{queryResult.durationMs}ms</strong>
                </span>
              )}
            </div>

            {queryResult.error ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
                {queryResult.error}
              </div>
            ) : queryResult.rows && queryResult.rows.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[360px]">
                <table className="w-full text-left text-xs font-medium">
                  <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      {queryResult.columns?.map((col) => (
                        <th key={col} className="p-3 font-mono">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {queryResult.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                        {queryResult.columns?.map((col, cIdx) => (
                          <td key={cIdx} className="p-3 font-mono text-slate-700 whitespace-nowrap">
                            {row[col] === null ? (
                              <span className="text-slate-400 italic">NULL</span>
                            ) : typeof row[col] === 'object' ? (
                              JSON.stringify(row[col])
                            ) : (
                              String(row[col])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                Query executed successfully. 0 rows returned.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
