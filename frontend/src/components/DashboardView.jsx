import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Layers, 
  Building2, 
  Ticket, 
  Award,
  ArrowRight, 
  Database, 
  TrendingUp, 
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Printer,
  Calendar
} from 'lucide-react';

export default function DashboardView({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/dashboard-stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setStats(d.data);
        }
      })
      .catch((err) => console.error('Error fetching dashboard stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const coreModules = [
    { 
      id: 'seating', 
      label: 'Seat Allocation', 
      desc: 'Smart 2D classroom bench matrix with anti-cheating branch separation.', 
      icon: Layers,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      tag: 'Core Feature'
    },
    { 
      id: 'students', 
      label: 'Student Directory', 
      desc: 'Add, edit, search, and manage student enrollments across departments.', 
      icon: Users,
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-600',
      tag: 'Directory'
    },
    { 
      id: 'halls', 
      label: 'Exam Halls', 
      desc: 'Configure examination centers, bench layouts, and invigilator duties.', 
      icon: Building2,
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      text: 'text-violet-600',
      tag: 'Venues'
    },
    { 
      id: 'admit', 
      label: 'Admit Cards', 
      desc: 'Generate, verify, and print official examination hall tickets.', 
      icon: Ticket,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-600',
      tag: 'Print Ready'
    },
    { 
      id: 'moderation', 
      label: 'Marks & Results', 
      desc: 'Record exam marks, apply borderline grace marks, and review final grades.', 
      icon: Award,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-600',
      tag: 'Evaluation'
    }
  ];

  const highlights = [
    {
      title: 'Anti-Cheating Seating',
      desc: 'Pairs students from different academic branches on adjacent bench seats.',
      icon: ShieldCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Printable Admit Cards',
      desc: 'Instantly generates clean hall tickets with allocated room and bench numbers.',
      icon: Printer,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      title: 'Capacity Protection',
      desc: 'Guarantees exam halls are never overbooked and prevents duplicate seat claims.',
      icon: Building2,
      color: 'text-violet-600',
      bg: 'bg-violet-50'
    },
    {
      title: 'Transparent Evaluation',
      desc: 'Automates borderline passing grace marks with a complete, tamper-proof history log.',
      icon: Award,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Welcome Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  University Examination System
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  System Online
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
                Complete platform for seating allocation, student administration, hall tickets, and results evaluation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('seating')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Seat Allocation</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-all"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Student Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Students */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Students
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2">
              {stats.totalStudents}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Active candidates enrolled
            </div>
          </div>

          {/* Card 2: Exams */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Examinations
              </span>
              <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2">
              {stats.totalExams}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Scheduled course papers
            </div>
          </div>

          {/* Card 3: Halls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Exam Halls
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2">
              {stats.totalHalls}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.totalCapacity} total seat capacity
            </div>
          </div>

          {/* Card 4: Occupancy */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Allocated Seats
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2">
              {stats.totalAllocations}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.totalCapacity ? Math.round((stats.totalAllocations / stats.totalCapacity) * 100) : 0}% capacity utilization
            </div>
          </div>
        </div>
      ) : null}

      {/* Core Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Quick Navigation Modules
          </h2>
          <span className="text-xs text-slate-400">Select any module to get started</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreModules.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => setActiveTab(action.id)}
                className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-brand-400 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className={`w-10 h-10 rounded-xl ${action.bg} ${action.border} border flex items-center justify-center ${action.text}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                      {action.tag}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-sm mt-3.5 group-hover:text-brand-600 transition-colors">
                  {action.label}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {action.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grade Distribution Overview */}
      {stats && stats.gradeDistribution && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-600" />
                <span>Examination Performance &amp; Grade Distribution</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of student grades across all evaluated examination papers
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {stats.passCount} Passed
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                {stats.failCount} Failed
              </span>
              <span className="text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-medium">
                Avg Score: <strong className="text-slate-900">{stats.averageMarks}</strong> / 70
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-3 h-28 pt-4">
            {Object.entries(stats.gradeDistribution).map(([grade, count]) => {
              const max = Math.max(...Object.values(stats.gradeDistribution), 1);
              const height = (count / max) * 75;
              const barColor = 
                grade === 'F' ? 'bg-rose-500' :
                grade === 'O' ? 'bg-emerald-500' :
                grade === 'A+' ? 'bg-teal-500' :
                grade === 'A' ? 'bg-indigo-500' :
                grade === 'B+' ? 'bg-blue-500' : 'bg-slate-400';

              return (
                <div key={grade} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-xs font-bold text-slate-700">
                    {count}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${barColor}`}
                    style={{ height: `${Math.max(height, 8)}px` }}
                  />
                  <span className="text-xs font-bold text-slate-600">
                    {grade}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clean System Highlights */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span>Core System Features</span>
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center ${item.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
