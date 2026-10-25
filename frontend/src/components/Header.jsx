import React from 'react';
import { 
  Database, 
  LayoutDashboard,
  Layers, 
  Users, 
  Building2, 
  Ticket, 
  Award, 
  RotateCcw,
  Github
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  dbStatus,
  onResetDb, 
  isResetting
}) {
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'seating', label: 'Seat Allocation', icon: Layers },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'halls', label: 'Exam Halls', icon: Building2 },
    { id: 'admit', label: 'Admit Cards', icon: Ticket },
    { id: 'moderation', label: 'Marks & Results', icon: Award }
  ];

  return (
    <header className="no-print bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  ExamMatrix
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  Exam Cell
                </span>
              </div>
              <p className="text-xs text-slate-500">
                University Examination &amp; Seating System
              </p>
            </div>
          </div>

          {/* Clean Desktop Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-2xs font-bold border border-brand-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/itsdarshanjain/ips-academy-exam-dbms"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors shadow-2xs"
              title="View on GitHub"
            >
              <Github className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <button
              onClick={onResetDb}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
              title="Reset data to initial state"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-100 overflow-x-auto gap-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-bold'
                    : 'text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
