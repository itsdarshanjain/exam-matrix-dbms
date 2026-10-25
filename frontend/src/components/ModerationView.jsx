import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Edit3, 
  Sparkles,
  TrendingUp,
  FileCheck2,
  X
} from 'lucide-react';

export default function ModerationView({ 
  exams = [], 
  selectedExamId, 
  setSelectedExamId
}) {
  const [marks, setMarks] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maxGrace, setMaxGrace] = useState('5.00');
  const [actionMessage, setActionMessage] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [manualGraceInput, setManualGraceInput] = useState('');
  const [manualRemarksInput, setManualRemarksInput] = useState('');

  const activeExam = exams.find(e => e.exam_id === selectedExamId) || exams[0] || {
    exam_id: 1,
    subject_code: 'CS-501',
    subject_name: 'Database Management Systems',
    max_marks: 70,
    passing_marks: 23
  };

  const fetchModerationData = async (examId) => {
    setLoading(true);
    try {
      const marksRes = await fetch(`/api/moderation/marks?exam_id=${examId}`);
      const marksData = await marksRes.json();
      if (marksData.success) {
        setMarks(marksData.data);
      }

      const auditRes = await fetch('/api/moderation/audit-log');
      const auditData = await auditRes.json();
      if (auditData.success) {
        setAuditLog(auditData.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchModerationData(selectedExamId);
    }
  }, [selectedExamId]);

  const handleAutoModerate = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/moderation/auto-moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: selectedExamId,
          max_grace: parseFloat(maxGrace)
        })
      });
      const data = await res.json();

      if (data.success) {
        setActionMessage({
          type: 'success',
          text: data.data?.message || 'Grace marks applied to borderline students successfully!'
        });
        fetchModerationData(selectedExamId);
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to apply grace marks' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const res = await fetch('/api/moderation/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moderation_id: editingStudent.moderation_id,
          grace_marks: parseFloat(manualGraceInput || 0),
          remarks: manualRemarksInput || 'Faculty Evaluation Review',
          status: 'Approved',
          moderator_id: 2
        })
      });
      const data = await res.json();

      if (data.success) {
        setActionMessage({
          type: 'success',
          text: `Marks updated successfully for ${editingStudent.student_name}.`
        });
        setEditingStudent(null);
        fetchModerationData(selectedExamId);
      } else {
        setActionMessage({
          type: 'error',
          text: data.error || 'Failed to update marks'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const borderlineCount = marks.filter(m => m.isBorderline).length;
  const passCount = marks.filter(m => m.moderated_marks >= activeExam.passing_marks).length;
  const avgMarks = marks.length > 0 
    ? (marks.reduce((acc, m) => acc + Number(m.moderated_marks), 0) / marks.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Grace Action Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
              <Award className="w-4 h-4" />
              <span>Academic Evaluation Cell</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">Marks &amp; Results</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Examination Marks &amp; Moderation
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Review candidate scores, award borderline passing grace marks, and maintain an immutable change history for all results.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium">
              <span className="text-slate-500 font-semibold">Max Grace Cap:</span>
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={maxGrace}
                onChange={(e) => setMaxGrace(e.target.value)}
                className="w-14 bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-center font-bold text-brand-700 focus:outline-none focus:border-brand-500"
              />
              <span className="text-slate-500">marks</span>
            </div>

            <button
              onClick={handleAutoModerate}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow transition-all disabled:opacity-50 active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Apply Grace to Borderline</span>
            </button>
          </div>
        </div>

        {/* Subject Exam Selector */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase mr-1">Subject Exam:</span>
          {exams.map((exam) => {
            const isSelected = exam.exam_id === selectedExamId;
            return (
              <button
                key={exam.exam_id}
                onClick={() => setSelectedExamId(exam.exam_id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{exam.subject_code}</span>
                <span className="hidden sm:inline font-normal opacity-90">{exam.subject_name}</span>
              </button>
            );
          })}
        </div>

        {/* Action feedback message */}
        {actionMessage && (
          <div className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${
            actionMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            actionMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-2">✕</button>
          </div>
        )}
      </div>

      {/* Metric summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Candidates</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{marks.length}</div>
          <span className="text-xs text-slate-500 mt-0.5 block">Evaluated papers</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Borderline (Failing)</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{borderlineCount}</div>
          <span className="text-xs text-slate-500 mt-0.5 block">Eligible for passing grace</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Passed Candidates</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{passCount}</div>
          <span className="text-xs text-slate-500 mt-0.5 block">≥ {activeExam.passing_marks} pass threshold</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average Score</span>
          <div className="text-2xl font-bold text-brand-600 mt-1">{avgMarks}</div>
          <span className="text-xs text-slate-500 mt-0.5 block">Out of {activeExam.max_marks || 70} max marks</span>
        </div>
      </div>

      {/* Candidate marks table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Candidate Scores &amp; Grade Report ({activeExam.subject_code})
          </h3>
          <span className="text-xs text-slate-500">
            Passing Criteria: <strong className="text-slate-800">{activeExam.passing_marks}</strong> / {activeExam.max_marks || 70} Marks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Candidate Details</th>
                <th className="p-3.5">Branch</th>
                <th className="p-3.5 text-center">Original Score</th>
                <th className="p-3.5 text-center">Grace Awarded</th>
                <th className="p-3.5 text-center">Final Score</th>
                <th className="p-3.5 text-center">Grade</th>
                <th className="p-3.5 text-center">Result Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium">
              {marks.map((row) => {
                const isPassed = row.moderated_marks >= activeExam.passing_marks;
                const hasGrace = Number(row.grace_marks) > 0;

                return (
                  <tr key={row.moderation_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{row.student_name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{row.enrollment_no}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {row.branch}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-600">
                      {Number(row.original_marks).toFixed(1)}
                    </td>
                    <td className="p-3.5 text-center font-mono">
                      {hasGrace ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          +{Number(row.grace_marks).toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-900 text-sm">
                      {Number(row.moderated_marks).toFixed(1)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        row.final_grade === 'F' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        row.final_grade === 'O' || row.final_grade === 'A+' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {row.final_grade}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isPassed 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {isPassed ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => {
                          setEditingStudent(row);
                          setManualGraceInput(row.grace_marks || '0');
                          setManualRemarksInput(row.remarks || '');
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                      >
                        Edit Score
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Edit Score Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-base">Adjust Candidate Marks</h4>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">{editingStudent.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Enrollment No:</span>
                <span className="font-mono text-slate-700">{editingStudent.enrollment_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Original Raw Marks:</span>
                <span className="font-mono font-bold text-slate-900">{editingStudent.original_marks} / 70</span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Grace Marks to Award:
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={manualGraceInput}
                  onChange={(e) => setManualGraceInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold text-sm focus:outline-none focus:border-brand-500"
                  placeholder="Enter grace (e.g. 2.0)..."
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Evaluation Remarks:
                </label>
                <input
                  type="text"
                  value={manualRemarksInput}
                  onChange={(e) => setManualRemarksInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                  placeholder="e.g. Borderline compensation approved"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change & Audit History Log */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Marks Revision &amp; Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Complete log of all score changes and grace marks awarded
              </p>
            </div>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            {auditLog.length} Records Logged
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[300px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="p-3">Log #</th>
                <th className="p-3">Candidate</th>
                <th className="p-3">Subject</th>
                <th className="p-3 text-center">Marks Transition</th>
                <th className="p-3 text-center">Grace</th>
                <th className="p-3">Status</th>
                <th className="p-3">Moderator</th>
                <th className="p-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium">
              {auditLog.length > 0 ? (
                auditLog.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 font-mono text-slate-400">
                      #{log.log_id}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{log.student_name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{log.enrollment_no}</div>
                    </td>
                    <td className="p-3 font-mono text-brand-700 font-bold">
                      {log.subject_code}
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span className="text-slate-400">{Number(log.old_marks).toFixed(1)}</span>
                      <span className="text-slate-400 mx-1.5">→</span>
                      <span className="font-bold text-slate-900">{Number(log.new_marks).toFixed(1)}</span>
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        +{Number(log.grace_applied).toFixed(1)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-slate-600 font-medium">
                        {log.old_status} → <strong className="text-emerald-700">{log.new_status}</strong>
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">
                      {log.modified_by_name}
                    </td>
                    <td className="p-3 text-right font-mono text-[10px] text-slate-500">
                      {log.action_timestamp}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-slate-500">
                    No score changes logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
