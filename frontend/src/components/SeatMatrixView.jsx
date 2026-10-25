import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  DoorOpen, 
  Layers, 
  Building,
  User,
  Ticket,
  ChevronRight,
  ShieldCheck,
  Search,
  Users,
  Sparkles,
  Info
} from 'lucide-react';

export default function SeatMatrixView({ 
  exams = [], 
  selectedExamId, 
  setSelectedExamId, 
  onNavigateToStudents
}) {
  const [occupancy, setOccupancy] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedHallFilter, setSelectedHallFilter] = useState('ALL'); // 'ALL' or hall_id

  // Bench configuration
  const [seatsPerBench, setSeatsPerBench] = useState(2); // 1 or 2
  const [branchPairing, setBranchPairing] = useState('CROSS_ALL');

  const activeExam = exams.find(e => e.exam_id === selectedExamId) || exams[0] || {
    exam_id: 1,
    subject_code: 'CS-501',
    subject_name: 'Database Management Systems',
    exam_date: '2026-11-10',
    shift_time: '10:00 AM - 01:00 PM'
  };

  const fetchMatrixData = async (examId) => {
    setLoading(true);
    try {
      const occRes = await fetch(`/api/allocations/occupancy?exam_id=${examId}`);
      const occData = await occRes.json();
      if (occData.success) {
        setOccupancy(occData.data);
      }

      const allocRes = await fetch(`/api/allocations/matrix?exam_id=${examId}`);
      const allocData = await allocRes.json();
      if (allocData.success) {
        setAllocations(allocData.data);
      }
    } catch (err) {
      console.error('Error fetching seat matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchMatrixData(selectedExamId);
    }
  }, [selectedExamId]);

  const handleAutoAllocate = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/allocations/auto-allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: selectedExamId,
          seats_per_bench: seatsPerBench,
          branch_pairing: branchPairing
        })
      });
      const data = await res.json();

      if (data.success) {
        setActionMessage({
          type: 'success',
          text: data.data?.message || 'Seats allocated successfully with anti-cheating separation!'
        });
        fetchMatrixData(selectedExamId);
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Allocation could not be completed' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllocations = async () => {
    if (!confirm('Clear all allocated seats for this examination?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/allocations/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exam_id: selectedExamId })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage({
          type: 'info',
          text: 'Seating allocations cleared. You can now run a fresh allocation.'
        });
        fetchMatrixData(selectedExamId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBranchBadgeColor = (branch) => {
    switch (branch) {
      case 'CSE': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'IT': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'MECH': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'AIML': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'CIVIL': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'EC': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const displayedHalls = selectedHallFilter === 'ALL' 
    ? occupancy 
    : occupancy.filter(h => h.hall_id.toString() === selectedHallFilter.toString());

  const totalSeatsInSystem = occupancy.reduce((sum, h) => sum + (h.total_capacity || 0), 0);
  const totalOccupiedInSystem = occupancy.reduce((sum, h) => sum + (h.occupied_seats || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Allocation Action Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
              <Layers className="w-4 h-4" />
              <span>Smart Examination Seating</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">Anti-Cheating Classroom Matrix</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Classroom Bench &amp; Seat Allocation
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Dynamically maps students into classroom benches. On dual-seater benches (Seat A &amp; Seat B), students from different academic departments sit together to prevent cheating.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleAutoAllocate}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow transition-all disabled:opacity-50 active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>{loading ? 'Allocating...' : 'Auto Allocate Seats'}</span>
            </button>

            <button
              onClick={handleClearAllocations}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Clear Seats</span>
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Exam Paper Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Select Examination Paper
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-brand-500 transition-colors"
            >
              {exams.map(e => (
                <option key={e.exam_id} value={e.exam_id}>
                  {e.subject_code} - {e.subject_name} ({e.exam_date})
                </option>
              ))}
            </select>
          </div>

          {/* Bench Layout: Dual vs Single */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Bench Arrangement
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setSeatsPerBench(2)}
                className={`py-1.5 rounded-lg transition-all ${
                  seatsPerBench === 2 ? 'bg-white text-brand-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2 Students / Bench
              </button>
              <button
                type="button"
                onClick={() => setSeatsPerBench(1)}
                className={`py-1.5 rounded-lg transition-all ${
                  seatsPerBench === 1 ? 'bg-white text-brand-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 Student / Bench
              </button>
            </div>
          </div>

          {/* Anti-Cheating Strategy */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Department Separation
            </label>
            <select
              value={branchPairing}
              onChange={(e) => setBranchPairing(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-brand-500 transition-colors"
            >
              <option value="CROSS_ALL">Interleave All Departments (Recommended)</option>
              <option value="CSE_IT">Alternate CSE &amp; IT Examinees</option>
              <option value="CSE_MECH">Alternate CSE &amp; MECH Examinees</option>
            </select>
          </div>
        </div>

        {/* Feedback message banner */}
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

      {/* Hall Tabs & Overview Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-brand-600" />
              <span>Examination Hall Selector</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a hall to inspect individual bench assignments or view all halls together
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-600">
              Total Assigned: <strong className="text-brand-600 font-mono text-sm">{totalOccupiedInSystem}</strong> / {totalSeatsInSystem} Seats
            </span>
            <span className="px-2.5 py-1 rounded-full font-bold bg-brand-50 text-brand-700 border border-brand-200">
              {totalSeatsInSystem ? Math.round((totalOccupiedInSystem / totalSeatsInSystem) * 100) : 0}% Filled
            </span>
          </div>
        </div>

        {/* Hall Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setSelectedHallFilter('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedHallFilter === 'ALL'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Halls ({occupancy.length})
          </button>

          {occupancy.map((hall) => {
            const isSelected = selectedHallFilter.toString() === hall.hall_id.toString();
            return (
              <button
                key={hall.hall_id}
                onClick={() => setSelectedHallFilter(hall.hall_id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{hall.room_number}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {hall.occupied_seats}/{hall.total_capacity}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2D Classroom Visualizer for Each Displayed Hall */}
      <div className="space-y-6">
        {displayedHalls.map((hall) => {
          const hallAllocations = allocations.filter(a => a.hall_id === hall.hall_id);
          const rows = hall.rows_count || 4;
          const cols = hall.cols_count || 5;

          return (
            <div key={hall.hall_id} className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-7 shadow-xs space-y-4">
              {/* Hall Title and Branch Legend */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{hall.room_number}</h3>
                    <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {hall.building_block}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Dimensions: {rows} Rows × {cols} Columns ({rows * cols} Benches • {hall.total_capacity} Seats) • Invigilator: <strong className="text-slate-700">{hall.invigilator_name || 'Assigned Faculty'}</strong>
                  </p>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Branches:</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">CSE</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">IT</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">MECH</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">AIML</span>
                </div>
              </div>

              {/* Classroom Blackboard / Front Desk */}
              <div className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-center text-xs font-bold tracking-wider flex items-center justify-center gap-2 shadow-xs">
                <Building className="w-4 h-4 text-slate-300" />
                <span>FRONT OF CLASSROOM • CHIEF INVIGILATOR DESK &amp; BLACKBOARD</span>
              </div>

              {/* 2D Bench Matrix Grid */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90 overflow-x-auto">
                <div 
                  className="grid gap-3 min-w-[760px]"
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(148px, 1fr))` }}
                >
                  {Array.from({ length: rows }).map((_, rIdx) => {
                    const rowNo = rIdx + 1;
                    return Array.from({ length: cols }).map((_, cIdx) => {
                      const colNo = cIdx + 1;
                      const benchNo = (rowNo - 1) * cols + colNo;
                      
                      // Seat A (Left) and Seat B (Right) for this bench
                      const allocA = hallAllocations.find(a => a.row_no === rowNo && a.col_no === colNo && (a.seat_position === 'A' || !a.seat_position));
                      const allocB = hallAllocations.find(a => a.row_no === rowNo && a.col_no === colNo && a.seat_position === 'B');

                      const isDualOccupied = allocA && allocB;
                      const isAntiCheat = isDualOccupied && allocA.branch !== allocB.branch;

                      return (
                        <div
                          key={`bench-${rowNo}-${colNo}`}
                          className={`p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between min-h-[115px] ${
                            allocA || allocB
                              ? 'bg-white border-slate-300/80 shadow-2xs hover:shadow-xs'
                              : 'bg-white/60 border-dashed border-slate-200'
                          }`}
                        >
                          {/* Bench Header */}
                          <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-slate-100">
                            <span className="font-bold text-slate-700 text-[11px]">
                              Bench {benchNo}
                            </span>

                            {isAntiCheat && (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1" title="Anti-cheating verified: different branches on same bench">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                <span>Anti-Cheat</span>
                              </span>
                            )}
                          </div>

                          {/* 2 Physical Seats: Left (Seat A) & Right (Seat B) */}
                          <div className="grid grid-cols-2 gap-1.5 py-1.5 flex-1">
                            {/* Seat A */}
                            <div 
                              onClick={() => allocA && setSelectedSeat(allocA)}
                              className={`p-1.5 rounded-lg border flex flex-col justify-between transition-colors ${
                                allocA 
                                  ? 'bg-slate-50 hover:bg-brand-50 cursor-pointer border-slate-200 hover:border-brand-300' 
                                  : 'border-dashed border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-mono font-bold text-slate-400">Seat A</span>
                                {allocA && (
                                  <span className={`text-[9px] font-bold px-1 rounded border ${getBranchBadgeColor(allocA.branch)}`}>
                                    {allocA.branch}
                                  </span>
                                )}
                              </div>
                              {allocA ? (
                                <div className="mt-1">
                                  <div className="font-bold text-[11px] text-slate-900 truncate">{allocA.full_name}</div>
                                  <div className="font-mono text-[9px] text-slate-500 truncate">{allocA.enrollment_no.slice(-4)}</div>
                                </div>
                              ) : (
                                <span className="text-[9px] text-slate-300 italic text-center py-2">+ Empty</span>
                              )}
                            </div>

                            {/* Seat B */}
                            {seatsPerBench === 2 ? (
                              <div 
                                onClick={() => allocB && setSelectedSeat(allocB)}
                                className={`p-1.5 rounded-lg border flex flex-col justify-between transition-colors ${
                                  allocB 
                                    ? 'bg-slate-50 hover:bg-brand-50 cursor-pointer border-slate-200 hover:border-brand-300' 
                                    : 'border-dashed border-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-mono font-bold text-slate-400">Seat B</span>
                                  {allocB && (
                                    <span className={`text-[9px] font-bold px-1 rounded border ${getBranchBadgeColor(allocB.branch)}`}>
                                      {allocB.branch}
                                    </span>
                                  )}
                                </div>
                                {allocB ? (
                                  <div className="mt-1">
                                    <div className="font-bold text-[11px] text-slate-900 truncate">{allocB.full_name}</div>
                                    <div className="font-mono text-[9px] text-slate-500 truncate">{allocB.enrollment_no.slice(-4)}</div>
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-slate-300 italic text-center py-2">+ Empty</span>
                                )}
                              </div>
                            ) : (
                              <div className="p-1 rounded-lg bg-slate-100 text-[9px] text-slate-400 flex items-center justify-center font-medium">
                                Single
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Seat Inspector Modal / Card */}
      {selectedSeat && (
        <div className="bg-white border border-brand-300 rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {selectedSeat.seat_label}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-slate-900">{selectedSeat.full_name}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-md font-bold border ${getBranchBadgeColor(selectedSeat.branch)}`}>
                  {selectedSeat.branch}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {selectedSeat.enrollment_no}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Room: <strong className="text-slate-800">{selectedSeat.room_number}</strong> • Bench #{selectedSeat.bench_no} ({selectedSeat.seat_position === 'A' ? 'Left Seat' : 'Right Seat'}) • Exam: <strong className="text-slate-800">{activeExam.subject_name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSeat(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
