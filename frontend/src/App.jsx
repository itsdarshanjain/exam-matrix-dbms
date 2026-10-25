import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import SeatMatrixView from './components/SeatMatrixView';
import StudentsCrudView from './components/StudentsCrudView';
import ExamHallsCrudView from './components/ExamHallsCrudView';
import HallTicketView from './components/HallTicketView';
import ModerationView from './components/ModerationView';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'seating', 'students', 'halls', 'admit', 'moderation'
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(1);
  const [dbStatus, setDbStatus] = useState(null);
  const [preselectedStudentEnrollment, setPreselectedStudentEnrollment] = useState('0808CS241091');
  const [isResetting, setIsResetting] = useState(false);

  const fetchDbStatus = () => {
    fetch('/api/database/status')
      .then(r => r.json())
      .then(data => {
        if (data.success) setDbStatus(data.data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetch('/api/exams')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setExams(data.data);
          if (data.data.length > 0) setSelectedExamId(data.data[0].exam_id);
        }
      })
      .catch(console.error);

    fetchDbStatus();
  }, []);

  const handleResetDb = async () => {
    if (!confirm('Reset examination system data to initial demo state?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/analytics/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSelectStudentForAdmitCard = (enrollment_no) => {
    setPreselectedStudentEnrollment(enrollment_no);
    setActiveTab('admit');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        dbStatus={dbStatus} 
        onResetDb={handleResetDb} 
        isResetting={isResetting} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="animate-fadeIn">
          {activeTab === 'dashboard' && (
            <DashboardView 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'seating' && (
            <SeatMatrixView 
              exams={exams} 
              selectedExamId={selectedExamId} 
              setSelectedExamId={setSelectedExamId} 
              onNavigateToStudents={() => setActiveTab('students')}
            />
          )}

          {activeTab === 'students' && (
            <StudentsCrudView 
              onSelectForAdmitCard={handleSelectStudentForAdmitCard}
            />
          )}

          {activeTab === 'halls' && (
            <ExamHallsCrudView />
          )}

          {activeTab === 'admit' && (
            <HallTicketView 
              preselectedEnrollment={preselectedStudentEnrollment}
            />
          )}

          {activeTab === 'moderation' && (
            <ModerationView 
              exams={exams} 
              selectedExamId={selectedExamId} 
              setSelectedExamId={setSelectedExamId} 
            />
          )}
        </div>
      </main>

      <footer className="no-print mt-auto border-t border-slate-200/80 bg-white py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">ExamMatrix</span> — Academic RDBMS Demonstration Project by <span className="font-medium text-brand-600">Darshan Jain</span> (0808CS241091, 5th Sem CSE)
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://github.com/itsdarshanjain/exam-matrix-dbms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-brand-600 flex items-center gap-1.5 transition-colors font-medium"
            >
              <span>GitHub Repository</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
