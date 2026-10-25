import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles,
  Ticket,
  GraduationCap
} from 'lucide-react';

export default function StudentsCrudView({ onSelectForAdmitCard, onQueryExecuted }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    enrollment_no: '',
    full_name: '',
    branch: 'CSE',
    semester: 5,
    section: 'A',
    email: '',
    phone: ''
  });

  const availableBranches = ['CSE', 'IT', 'MECH', 'AIML', 'CIVIL', 'EC'];

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (branchFilter !== 'ALL') params.append('branch', branchFilter);
      if (semesterFilter !== 'ALL') params.append('semester', semesterFilter);
      if (search) params.append('search', search);

      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
        if (data.sqlExecuted && onQueryExecuted) onQueryExecuted(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [branchFilter, semesterFilter, search]);

  const handleOpenAddModal = () => {
    setFormData({
      enrollment_no: `0808${branchFilter !== 'ALL' ? branchFilter : 'CSE'}241${Math.floor(100 + Math.random() * 900)}`,
      full_name: '',
      branch: branchFilter !== 'ALL' ? branchFilter : 'CSE',
      semester: 5,
      section: 'A',
      email: '',
      phone: ''
    });
    setEditingStudent(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setFormData({
      enrollment_no: student.enrollment_no,
      full_name: student.full_name,
      branch: student.branch,
      semester: student.semester,
      section: student.section,
      email: student.email || '',
      phone: student.phone || ''
    });
    setEditingStudent(student);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionFeedback(null);
    try {
      let res, data;
      if (editingStudent) {
        // Update
        res = await fetch(`/api/students/${encodeURIComponent(editingStudent.enrollment_no)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        data = await res.json();
      } else {
        // Create
        res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        data = await res.json();
      }

      if (data.sqlExecuted && onQueryExecuted) onQueryExecuted(data);

      if (data.success) {
        setActionFeedback({ type: 'success', text: data.message });
        setIsAddModalOpen(false);
        fetchStudents();
      } else {
        setActionFeedback({ type: 'error', text: data.error || 'Operation failed' });
      }
    } catch (err) {
      setActionFeedback({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (enrollment_no, name) => {
    if (!confirm(`Are you sure you want to delete student ${name} (${enrollment_no})? This will also remove any existing seat allocations.`)) return;

    try {
      const res = await fetch(`/api/students/${encodeURIComponent(enrollment_no)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.sqlExecuted && onQueryExecuted) onQueryExecuted(data);

      if (data.success) {
        setActionFeedback({ type: 'success', text: data.message });
        fetchStudents();
      } else {
        setActionFeedback({ type: 'error', text: data.error });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportSampleBatch = async () => {
    try {
      const res = await fetch('/api/students/import-sample', { method: 'POST' });
      const data = await res.json();
      if (data.sqlExecuted && onQueryExecuted) onQueryExecuted(data);
      if (data.success) {
        setActionFeedback({ type: 'success', text: data.message });
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getBranchBadge = (b) => {
    switch (b) {
      case 'CSE': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IT': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MECH': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'AIML': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CIVIL': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'EC': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
              <Users className="w-4 h-4" />
              <span>Academic Records &amp; Enrollment Cell</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">Examinee Roster</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Student Directory &amp; Department Roster</span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-normal">
                {students.length} Total
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Manage examinees across engineering departments. Newly registered students dynamically update the seating allocation matrix and official admit cards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleImportSampleBatch}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium border border-slate-200 transition-colors"
              title="Add 4 sample students from CSE, IT, MECH, and AIML to test cross-branch bench pairings"
            >
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Import Multi-Branch Batch</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Student</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or enrollment number..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500"
            />
          </div>

          <div>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:outline-none focus:bg-white focus:border-brand-500"
            >
              <option value="ALL">All Departments / Branches</option>
              {availableBranches.map(b => (
                <option key={b} value={b}>{b} Department</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-700 focus:outline-none focus:bg-white focus:border-brand-500"
            >
              <option value="ALL">All Semesters</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
          </div>
        </div>

        {/* Feedback message */}
        {actionFeedback && (
          <div className={`p-3 rounded-lg border text-xs sm:text-sm flex items-center justify-between ${
            actionFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              {actionFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
              <span>{actionFeedback.text}</span>
            </div>
            <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
          </div>
        )}
      </div>

      {/* Students Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Registered Examinees
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              {students.length} Records
            </span>
          </div>

          <span className="text-xs text-slate-500">
            Click <Ticket className="w-3.5 h-3.5 inline mx-1 text-brand-600" /> to preview admit card
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Enrollment No</th>
                <th className="p-3.5">Student Full Name</th>
                <th className="p-3.5">Department / Branch</th>
                <th className="p-3.5 text-center">Semester &amp; Sec</th>
                <th className="p-3.5">Email Contact</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {students.length > 0 ? (
                students.map((student) => {
                  return (
                    <tr 
                      key={student.enrollment_no} 
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="p-3.5 font-mono font-bold text-brand-700 whitespace-nowrap">
                        {student.enrollment_no}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900">
                        {student.full_name}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono ${getBranchBadge(student.branch)}`}>
                          {student.branch}
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-slate-600 font-mono">
                        Sem {student.semester} - {student.section}
                      </td>
                      <td className="p-3.5 text-slate-500 truncate max-w-[200px]">
                        {student.email}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectForAdmitCard && onSelectForAdmitCard(student.enrollment_no)}
                            className="p-1.5 rounded-md hover:bg-brand-50 text-slate-500 hover:text-brand-600 transition-colors"
                            title="Generate Admit Card / Hall Ticket"
                          >
                            <Ticket className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Edit Student"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.enrollment_no, student.full_name)}
                            className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    {loading ? 'Fetching student records...' : 'No examinees match the current search or branch filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl max-w-lg w-full space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-600" />
                <span>{editingStudent ? 'Edit Examinee Details' : 'Register New Examinee'}</span>
              </h4>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Enrollment No *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    value={formData.enrollment_no}
                    onChange={(e) => setFormData({ ...formData, enrollment_no: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:bg-white focus:border-brand-500 disabled:opacity-60"
                    placeholder="e.g. 0808CS241099"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Department / Branch *
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-semibold focus:outline-none focus:bg-white focus:border-brand-500"
                  >
                    {availableBranches.map(b => (
                      <option key={b} value={b}>{b} Department</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-brand-500"
                  placeholder="e.g. Rohan Sharma"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-brand-500"
                    placeholder="e.g. T3 or A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-brand-500"
                    placeholder="student@university.edu"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:bg-white focus:border-brand-500"
                    placeholder="9876500000"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-xs"
                >
                  {editingStudent ? 'Save Changes' : 'Register Examinee (SQL INSERT)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
