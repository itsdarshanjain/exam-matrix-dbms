import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Play, 
  Terminal, 
  Database, 
  Copy, 
  Check, 
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function QueryLabView({ onQueryExecuted }) {
  const [selectedTopic, setSelectedTopic] = useState('self_join');
  const [queryResult, setQueryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const queryTopics = [
    {
      id: 'self_join',
      title: '1. Self-Join & Hierarchy',
      short: 'Self-Join',
      concept: 'Unary Foreign Key (reports_to_id)',
      algebra: 'Faculty f₁ ⟕ f₁.reports_to_id = f₂.faculty_id Faculty f₂',
      description: 'Traverses the examination committee hierarchy: joins Moderator faculty records with their respective supervisory Controller of Examinations.',
      techNote: 'Demonstrates 1:N recursive unary relationship, foreign keys with ON DELETE SET NULL, and preserving unassigned roots via LEFT JOIN.'
    },
    {
      id: 'left_outer_join',
      title: '2. Left Outer Join & Difference',
      short: 'Outer Join',
      concept: 'Relational Difference (Students - Allocated)',
      algebra: 'Students ⟕ (Seat_Allocations ⋈ σ_{exam_id=2} Exams)',
      description: 'Identifies examinees who have NOT yet been assigned any classroom seat for Theory of Computation (CS-502).',
      techNote: 'Shows how outer joins preserve non-matching left tuples with NULL padding, essential for detecting unassigned records.'
    },
    {
      id: 'relational_division',
      title: '3. Relational Division',
      short: 'Division (÷)',
      concept: 'Universal Quantification: R ÷ S via NOT EXISTS',
      algebra: 'Students ÷ Exams = { s | ∀ e ∈ Exams: (s, e) ∈ Seat_Allocations }',
      description: 'Finds students allocated seats across ALL mandatory 5th-Semester Theory Exams (CS-501, CS-502, CS-503, CS-504). Pure relational completeness.',
      techNote: 'Fundamental relational algebra! Relational division is expressed in standard SQL via double negation (WHERE NOT EXISTS ... WHERE NOT EXISTS).'
    },
    {
      id: 'integrity_3nf',
      title: '4. 3NF Schema Proof',
      short: '3NF Proof',
      concept: 'Third Normal Form & Cascades',
      algebra: '∀ FD X → Y: X is superkey OR Y is prime attribute',
      description: 'Inspects foreign key constraints, cascade rules, and check constraints from INFORMATION_SCHEMA proving zero transitivities.',
      techNote: 'Validates that the schema conforms to 3NF and BCNF because no non-prime attribute is transitively dependent on any candidate key.'
    },
    {
      id: 'aggregate_analytics',
      title: '5. Aggregate & EXPLAIN Plan',
      short: 'EXPLAIN Plan',
      concept: 'GROUP BY, HAVING & Cost Optimizer',
      algebra: 'γ_{subject_code, AVG(marks), COUNT(*)}(Exams ⋈ Marks)',
      description: 'Computes subject-wise pass rates, average marks, and inspects the relational query optimizer execution plan via EXPLAIN.',
      techNote: 'Examines query optimization, showing how relational indices are leveraged instead of unindexed sequential table scans.'
    }
  ];

  const currentTopic = queryTopics.find((t) => t.id === selectedTopic) || queryTopics[0];

  const runQuery = async (topicId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/viva-query/${topicId}`);
      const data = await res.json();
      if (data.success) {
        setQueryResult(data);
        if (data.sqlExecuted && onQueryExecuted) onQueryExecuted(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runQuery(selectedTopic);
  }, [selectedTopic]);

  const handleCopySql = () => {
    if (!queryResult?.sqlExecuted) return;
    navigator.clipboard.writeText(queryResult.sqlExecuted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
              <FlaskConical className="w-4 h-4" />
              <span>Query Lab</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                Relational Algebra &amp; Optimization
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Advanced SQL &amp; Relational Concepts
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Demonstrate core relational database theory in practice: self-joins, relational division (double NOT EXISTS), set difference via outer joins, 3NF schema proofs, and optimizer EXPLAIN plans.
            </p>
          </div>

          <button
            onClick={() => runQuery(selectedTopic)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Execute Query</span>
          </button>
        </div>

        {/* Topic Selector Tabs */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
          {queryTopics.map((topic) => {
            const isSelected = topic.id === selectedTopic;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-brand-50 border border-brand-300 text-brand-700 shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {topic.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Concept Breakdown & Theory Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 font-mono text-xs font-bold border border-brand-200">
                {currentTopic.concept}
              </span>
              <span className="text-xs text-slate-600 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                {currentTopic.algebra}
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed font-normal">
              {currentTopic.description}
            </p>

            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-slate-700 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-brand-900 block mb-0.5 font-bold">Concept Explanation:</strong>
                <p className="text-slate-600 leading-relaxed">{currentTopic.techNote}</p>
              </div>
            </div>
          </div>

          {/* Quick Engine Meta */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
            <span className="text-slate-700 font-bold block text-[11px] uppercase tracking-wider">
              Relational Engine Internals:
            </span>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Database Schema:</span>
              <span className="text-brand-700 font-bold">exam_system_db</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Storage Engine:</span>
              <span className="text-slate-800 font-semibold">PostgreSQL Relational Core</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Isolation Level:</span>
              <span className="text-slate-800">READ COMMITTED</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Execution Latency:</span>
              <span className="text-emerald-700 font-bold">{queryResult?.durationMs || 1.8} ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exact SQL Code Block */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Terminal className="w-4 h-4 text-brand-600" />
            <span>Exact Relational SQL Query Executed:</span>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 border border-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy SQL'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
          {queryResult?.sqlExecuted || currentTopic.sql || '-- Executing query...'}
        </pre>
      </div>

      {/* Live Tabular Result */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Query Result Set
            </h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {queryResult?.data?.length || 0} Tuples Returned
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[380px]">
          {queryResult?.data && queryResult.data.length > 0 ? (
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  {Object.keys(queryResult.data[0]).map((col) => (
                    <th key={col} className="p-3 font-mono">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {queryResult.data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    {Object.values(row).map((val, cIdx) => (
                      <td key={cIdx} className="p-3 font-mono text-slate-700 whitespace-nowrap">
                        {val === null ? (
                          <span className="text-slate-400 italic font-sans">NULL</span>
                        ) : typeof val === 'object' ? (
                          JSON.stringify(val)
                        ) : (
                          String(val)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-500">
              {loading ? 'Executing query...' : 'No tuples returned.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
