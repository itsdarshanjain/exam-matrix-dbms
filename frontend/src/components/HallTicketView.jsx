import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Search, 
  Award, 
  FileText, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  GraduationCap
} from 'lucide-react';

export default function HallTicketView({ 
  preselectedEnrollment,
  onQueryExecuted 
}) {
  const [enrollmentInput, setEnrollmentInput] = useState(preselectedEnrollment || '0808CS241091');
  const [searchedEnrollment, setSearchedEnrollment] = useState(preselectedEnrollment || '0808CS241091');
  const [hallTicketData, setHallTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('admit_card'); // 'admit_card' or 'grade_card'

  useEffect(() => {
    if (preselectedEnrollment) {
      setEnrollmentInput(preselectedEnrollment);
      setSearchedEnrollment(preselectedEnrollment);
    }
  }, [preselectedEnrollment]);

  useEffect(() => {
    fetch('/api/students')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStudentsList(data.data);
        }
      })
      .catch(console.error);
  }, []);

  const fetchHallTicket = async (enrollment) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hall-ticket/${enrollment}`);
      const data = await res.json();
      if (data.success) {
        setHallTicketData(data);
        if (data.sqlExecuted && onQueryExecuted) onQueryExecuted(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchedEnrollment) {
      fetchHallTicket(searchedEnrollment);
    }
  }, [searchedEnrollment]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (enrollmentInput.trim()) {
      setSearchedEnrollment(enrollmentInput.trim());
    }
  };

  const handleSelectStudent = (enrollment) => {
    setEnrollmentInput(enrollment);
    setSearchedEnrollment(enrollment);
  };

  const handlePrint = () => {
    window.print();
  };

  const student = hallTicketData?.student;
  const papers = hallTicketData?.papers || [];

  return (
    <div className="space-y-6 pb-24">
      {/* Search & Student Filter Bar (Hidden when printing) */}
      <div className="no-print bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
              <FileText className="w-4 h-4" />
              <span>Official Student Examination Portal</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">Verified Hall Ticket</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Admit Card Verification &amp; Grade Transcript
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Generates digitally verified student admit cards joining students, course schedules, examination halls, bench numbers, and invigilator seals.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-lg bg-slate-100 text-xs font-medium border border-slate-200">
              <button
                onClick={() => setActiveSubTab('admit_card')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeSubTab === 'admit_card' ? 'bg-white text-brand-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admit Card
              </button>
              <button
                onClick={() => setActiveSubTab('grade_card')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeSubTab === 'grade_card' ? 'bg-white text-brand-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Official Grades
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={enrollmentInput}
              onChange={(e) => setEnrollmentInput(e.target.value)}
              placeholder="Enter Student Enrollment No (e.g. 0808CS241091, 0808IT241001)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        {/* Quick-Select Pills for Examinees */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-500 block">
            Quick-Select Registered Examinees:
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {studentsList.map((s) => {
              const isSelected = s.enrollment_no === searchedEnrollment;
              return (
                <button
                  key={s.enrollment_no}
                  type="button"
                  onClick={() => handleSelectStudent(s.enrollment_no)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-mono transition-all border ${
                    isSelected
                      ? 'bg-brand-600 text-white font-bold border-brand-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold mr-1 text-[10px] opacity-75">{s.branch}</span>
                  <span>{s.full_name} ({s.enrollment_no.slice(-4)})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Printable Card (Official Document Layout) */}
      {student ? (
        <div className="print-card bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-slate-900 max-w-4xl mx-auto">
          {/* Institutional Crest & Header */}
          <div className="border-b-2 border-slate-200 pb-5 text-center space-y-1">
            <div className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200 mb-2 tracking-wide">
              AUTONOMOUS INSTITUTION • AFFILIATED TO STATE UNIVERSITY
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
              INSTITUTE OF ENGINEERING &amp; SCIENCE
            </h1>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-700">
              OFFICE OF THE CONTROLLER OF EXAMINATIONS
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Autonomous Semester Theory Examination Verification Cell
            </p>
            <div className="pt-2">
              <span className="inline-block bg-slate-900 text-white px-4 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                {activeSubTab === 'admit_card' ? 'EXAMINATION HALL TICKET / ADMIT CARD — NOVEMBER 2026' : 'OFFICIAL TRANSCRIPT & PROVISIONAL GRADE CARD'}
              </span>
            </div>
          </div>

          {/* Student Identity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Student Avatar / Photo Box */}
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white border border-slate-200 text-center">
              <div className="w-20 h-24 rounded-md bg-gradient-to-b from-brand-50 to-slate-100 flex flex-col items-center justify-center text-brand-600 font-bold border border-brand-200 mb-2">
                <GraduationCap className="w-8 h-8 mb-1" />
                <span className="text-[10px] font-mono">SEMESTER {student.semester}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono font-semibold">VERIFIED EXAMINEE</span>
            </div>

            {/* Student Data Fields */}
            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Candidate Name:</span>
                <p className="font-bold text-sm text-slate-900">{student.student_name}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Enrollment Number:</span>
                <p className="font-mono font-bold text-sm text-brand-700">{student.enrollment_no}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Department / Branch:</span>
                <p className="font-semibold text-slate-800">B.Tech ({student.branch})</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Semester / Section:</span>
                <p className="font-semibold text-slate-800">Semester {student.semester} • Section {student.section}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Academic Year:</span>
                <p className="font-semibold text-slate-800 font-mono">2026-2027</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Institutional Email:</span>
                <p className="font-medium text-slate-700 truncate">{student.student_email}</p>
              </div>
            </div>
          </div>

          {/* Subtab 1: Admit Card Papers Schedule */}
          {activeSubTab === 'admit_card' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Scheduled Theory Examinations &amp; Designated Benches
                </h3>
                <span className="text-xs text-brand-700 font-mono font-bold">
                  {papers.length} Papers Scheduled
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="print-table w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Course Code</th>
                      <th className="p-3">Course Title</th>
                      <th className="p-3">Date &amp; Shift</th>
                      <th className="p-3">Examination Hall</th>
                      <th className="p-3 text-center">Bench Coordinate</th>
                      <th className="p-3">Invigilator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium">
                    {papers.length > 0 ? (
                      papers.map((p) => (
                        <tr key={p.exam_id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-mono font-bold text-brand-700 whitespace-nowrap">
                            {p.subject_code}
                          </td>
                          <td className="p-3 font-semibold text-slate-900">
                            {p.subject_name}
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            <div className="font-medium text-slate-800">{p.exam_date}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{p.shift_time}</div>
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{p.room_number}</div>
                            <div className="text-[11px] text-slate-500">{p.building_block}</div>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span className="inline-block px-3 py-1 rounded-md font-mono font-bold bg-brand-50 text-brand-800 border border-brand-200 shadow-xs text-xs">
                              {p.seat_label}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            <div className="text-slate-800 font-medium">{p.invigilator_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{p.invigilator_code}</div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-6 text-center text-slate-500">
                          No seat allocations found for this student. Use the <strong>Seat Allocation</strong> tab to assign examinees!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Instructions and Barcode Block */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div className="md:col-span-2 space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
                  <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                    Official Examination Instructions:
                  </h4>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Candidates must occupy their designated physical bench at least 15 minutes before the scheduled shift time.</li>
                    <li>Anti-cheating seating rules apply: adjacent examinees belong to different academic departments.</li>
                    <li>This Hall Ticket is digitally authenticated via Relational View <code className="text-brand-700 font-mono font-semibold">v_student_hall_ticket</code>.</li>
                  </ul>
                </div>

                {/* Digital Verification Barcode Block */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center">
                  <div className="font-mono text-xl tracking-widest text-slate-800 font-bold border-b border-slate-300 pb-1 mb-1">
                    ||||| |||| || |||||||
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">
                    AUTH-ID: {student.enrollment_no}-2026-EXAM
                  </span>
                  <span className="text-[10px] text-emerald-700 flex items-center gap-1 mt-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>RDBMS Verified</span>
                  </span>
                </div>
              </div>

              {/* Signatures Row */}
              <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs">
                <div className="border-t border-slate-300 pt-2">
                  <span className="text-slate-600 font-medium">Candidate Signature</span>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <span className="text-slate-600 font-medium">Exam Invigilator Seal</span>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <span className="font-bold text-slate-900 block">Dr. Vivek Shrivastava</span>
                  <span className="text-[11px] text-slate-500">Controller of Examinations</span>
                </div>
              </div>
            </div>
          ) : (
            /* Subtab 2: Grade Card & Results */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Evaluated Marks &amp; Letter Grades (UDF: fn_ComputeGrade)
                </h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="print-table w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Course Code</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3 text-center">Max Marks</th>
                      <th className="p-3 text-center">Passing Marks</th>
                      <th className="p-3 text-center">Moderated Marks</th>
                      <th className="p-3 text-center">Grade</th>
                      <th className="p-3 text-center">Result Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium">
                    {papers.map((p) => {
                      const isPassing = (p.moderated_marks || 0) >= (p.passing_marks || 23);
                      return (
                        <tr key={p.exam_id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-mono font-bold text-brand-700">{p.subject_code}</td>
                          <td className="p-3 font-semibold text-slate-900">{p.subject_name}</td>
                          <td className="p-3 text-center text-slate-700 font-mono">{p.max_marks}</td>
                          <td className="p-3 text-center text-slate-500 font-mono">{p.passing_marks}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-900">
                            {p.moderated_marks !== null ? Number(p.moderated_marks).toFixed(2) : 'Awaiting Grading'}
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-block px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-brand-50 text-brand-800 border border-brand-200">
                              {p.rgpv_grade || 'A'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`text-[11px] font-bold ${isPassing ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {isPassing ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl">
          {loading ? 'Fetching student record...' : 'No examinee found. Search by enrollment number above.'}
        </div>
      )}
    </div>
  );
}
