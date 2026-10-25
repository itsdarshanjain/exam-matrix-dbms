import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  DoorOpen, 
  Users, 
  CheckCircle2, 
  X,
  Layers
} from 'lucide-react';

export default function ExamHallsCrudView({ onQueryExecuted }) {
  const [halls, setHalls] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [formData, setFormData] = useState({
    room_number: '',
    building_block: 'Block-A (Academic Complex)',
    rows_count: 4,
    cols_count: 5,
    seats_per_bench: 2,
    invigilator_id: ''
  });

  const fetchHalls = async () => {
    try {
      const res = await fetch('/api/halls');
      const data = await res.json();
      if (data.success) {
        setHalls(data.data);
        if (data.sqlExecuted && onQueryExecuted) onQueryExecuted(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await fetch('/api/faculty');
      const data = await res.json();
      if (data.success) {
        setFacultyList(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHalls();
    fetchFaculty();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      room_number: `Hall ${halls.length + 1}0${halls.length + 1}`,
      building_block: 'Block-A (Academic Complex)',
      rows_count: 4,
      cols_count: 5,
      seats_per_bench: 2,
      invigilator_id: facultyList[0]?.faculty_id || ''
    });
    setEditingHall(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (hall) => {
    setFormData({
      room_number: hall.room_number,
      building_block: hall.building_block,
      rows_count: hall.rows_count,
      cols_count: hall.cols_count,
      seats_per_bench: hall.seats_per_bench || 2,
      invigilator_id: hall.invigilator_id || ''
    });
    setEditingHall(hall);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      let res, data;
      if (editingHall) {
        res = await fetch(`/api/halls/${editingHall.hall_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch('/api/halls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      data = await res.json();
      if (data.sqlExecuted && onQueryExecuted) onQueryExecuted(data);

      if (data.success) {
        setFeedback({ type: 'success', text: data.message });
        setIsModalOpen(false);
        fetchHalls();
      } else {
        setFeedback({ type: 'error', text: data.error });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (hall_id, room_number) => {
    if (!confirm(`Are you sure you want to delete ${room_number}? All existing seat allocations in this hall will be removed.`)) return;

    try {
      const res = await fetch(`/api/halls/${hall_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.sqlExecuted && onQueryExecuted) onQueryExecuted(data);
      if (data.success) {
        setFeedback({ type: 'success', text: data.message });
        fetchHalls();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
              <Building2 className="w-4 h-4" />
              <span>Infrastructure &amp; Examination Centers</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">Venues &amp; Dimensions</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Exam Halls, Rooms &amp; Bench Layouts
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Configure physical examination venues, classroom bench matrices (Rows × Columns), seats per bench (1 or 2 students), and assign chief invigilators.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Examination Hall</span>
          </button>
        </div>

        {feedback && (
          <div className={`p-3 rounded-lg border text-xs sm:text-sm flex items-center justify-between ${
            feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>
        )}
      </div>

      {/* Grid of Halls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {halls.map((hall) => {
          const benches = (hall.rows_count || 4) * (hall.cols_count || 5);
          return (
            <div key={hall.hall_id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                      <DoorOpen className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{hall.room_number}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{hall.building_block}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(hall)}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                    title="Edit Hall Dimensions"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(hall.hall_id, hall.room_number)}
                    className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                    title="Delete Hall"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dimensions specs */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block uppercase">Matrix</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">{hall.rows_count} × {hall.cols_count}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block uppercase">Benches</span>
                  <span className="font-bold text-brand-700 font-mono text-sm">{benches}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block uppercase">Max Capacity</span>
                  <span className="font-bold text-emerald-700 font-mono text-sm">{hall.total_capacity}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Seats Per Bench:</span>
                <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                  {hall.seats_per_bench || 2} Students / Bench
                </span>
              </div>

              <div className="pt-1 text-xs flex items-center justify-between text-slate-600">
                <span className="text-slate-400">Invigilator:</span>
                <span className="font-medium text-slate-800 truncate max-w-[160px]">
                  {hall.invigilator_name || 'Unassigned'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Hall Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl max-w-md w-full space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-600" />
                <span>{editingHall ? 'Edit Examination Hall' : 'Add Examination Hall'}</span>
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Room / Hall Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-brand-500"
                  placeholder="e.g. Hall 101 (Main Auditorium)"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Building Block *
                </label>
                <input
                  type="text"
                  required
                  value={formData.building_block}
                  onChange={(e) => setFormData({ ...formData, building_block: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-brand-500"
                  placeholder="e.g. Block-A (Academic Complex)"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Rows</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.rows_count}
                    onChange={(e) => setFormData({ ...formData, rows_count: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Columns</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.cols_count}
                    onChange={(e) => setFormData({ ...formData, cols_count: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Seats/Bench</label>
                  <select
                    value={formData.seats_per_bench}
                    onChange={(e) => setFormData({ ...formData, seats_per_bench: parseInt(e.target.value, 10) })}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-brand-500 font-semibold"
                  >
                    <option value="2">2 (Dual)</option>
                    <option value="1">1 (Single)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-brand-900 flex justify-between items-center">
                <span>Calculated Maximum Capacity:</span>
                <span className="font-mono font-bold text-sm">
                  {formData.rows_count * formData.cols_count * formData.seats_per_bench} Examinees
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Assigned Faculty Invigilator
                </label>
                <select
                  value={formData.invigilator_id}
                  onChange={(e) => setFormData({ ...formData, invigilator_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-brand-500"
                >
                  <option value="">Unassigned Observer</option>
                  {facultyList.map(f => (
                    <option key={f.faculty_id} value={f.faculty_id}>
                      {f.full_name} ({f.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-xs"
                >
                  {editingHall ? 'Save Room' : 'Create Room (SQL INSERT)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
