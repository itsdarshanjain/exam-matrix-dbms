import React, { useState } from 'react';
import { 
  Network, 
  KeyRound, 
  Link2, 
  ShieldCheck, 
  Table2, 
  ChevronDown, 
  Database, 
  Info, 
  CheckCircle2, 
  GitBranch,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';

const tables = [
  {
    name: 'Faculty',
    pk: 'faculty_id',
    cols: [
      ['faculty_id', 'INT', 'PK AUTO_INCREMENT', 'Surrogate primary key'],
      ['faculty_code', 'VARCHAR(20)', 'UNIQUE NOT NULL', 'Institutional code (e.g. FAC-001)'],
      ['full_name', 'VARCHAR(100)', 'NOT NULL', 'Faculty member full name'],
      ['designation', 'VARCHAR(100)', 'NOT NULL', 'Academic title / designation'],
      ['role_type', 'VARCHAR(30)', 'CHECK', 'Controller, Moderator, or Invigilator'],
      ['reports_to_id', 'INT', 'FK -> Faculty.faculty_id', 'Unary recursive self-join (ON DELETE SET NULL)'],
      ['email', 'VARCHAR(100)', 'UNIQUE', 'Institutional email address'],
      ['phone', 'VARCHAR(15)', '', 'Contact telephone number']
    ],
    note: 'Demonstrates unary recursive self-join: Chief Moderator reports to Controller of Examinations. Root supervisor has reports_to_id = NULL.'
  },
  {
    name: 'Students',
    pk: 'enrollment_no',
    cols: [
      ['enrollment_no', 'VARCHAR(20)', 'PRIMARY KEY', 'Natural primary key (e.g. 0808CS241091)'],
      ['full_name', 'VARCHAR(100)', 'NOT NULL', 'Candidate full legal name'],
      ['branch', 'VARCHAR(20)', 'INDEX', 'Engineering department (CSE, IT, MECH, AIML)'],
      ['semester', 'INT', 'CHECK (1..8)', 'Current academic semester'],
      ['section', 'VARCHAR(5)', 'NOT NULL', 'Classroom section code (e.g. T3, A)'],
      ['email', 'VARCHAR(100)', 'UNIQUE', 'Student university email address'],
      ['phone', 'VARCHAR(15)', '', 'Contact phone number']
    ],
    note: 'Multi-department engineering examinee roster. Indexed on branch for fast filtering and anti-cheating seat interleaving.'
  },
  {
    name: 'Exams',
    pk: 'exam_id',
    cols: [
      ['exam_id', 'INT', 'PK AUTO_INCREMENT', 'Surrogate primary key'],
      ['subject_code', 'VARCHAR(20)', 'UNIQUE NOT NULL', 'Course identifier (e.g. CS-501, CS-502)'],
      ['subject_name', 'VARCHAR(100)', 'NOT NULL', 'Full course subject title'],
      ['exam_date', 'DATE', 'NOT NULL', 'Scheduled examination calendar date'],
      ['shift_time', 'VARCHAR(30)', 'NOT NULL', 'Slot timing (e.g. 10:00 AM - 01:00 PM)'],
      ['max_marks', 'INT', 'DEFAULT 70', 'Maximum theoretical marks'],
      ['passing_marks', 'INT', 'DEFAULT 23', 'Minimum score required to pass (33%)'],
      ['academic_sem', 'INT', 'CHECK (1..8)', 'Semester curriculum level']
    ],
    note: 'Master timetable of university theory examinations with passing threshold rules.'
  },
  {
    name: 'Exam_Halls',
    pk: 'hall_id',
    cols: [
      ['hall_id', 'INT', 'PK AUTO_INCREMENT', 'Surrogate primary key'],
      ['room_number', 'VARCHAR(30)', 'UNIQUE NOT NULL', 'Designated room/hall label (e.g. Hall 101)'],
      ['building_block', 'VARCHAR(50)', 'NOT NULL', 'Campus block / complex identifier'],
      ['rows_count', 'INT', 'CHECK (>0)', 'Physical classroom bench rows'],
      ['cols_count', 'INT', 'CHECK (>0)', 'Physical classroom bench columns'],
      ['seats_per_bench', 'INT', 'DEFAULT 2', 'Examinees per physical bench (1 or 2)'],
      ['total_capacity', 'INT', 'rows * cols * seats', 'Strict seating capacity limit'],
      ['invigilator_id', 'INT', 'FK -> Faculty.faculty_id', 'Chief invigilator assigned to venue']
    ],
    note: 'Physical venue topology. Enforced by capacity trigger trg_check_room_capacity to prevent hall overfilling.'
  },
  {
    name: 'Seat_Allocations',
    pk: 'allocation_id',
    cols: [
      ['allocation_id', 'INT', 'PK AUTO_INCREMENT', 'Surrogate primary key'],
      ['enrollment_no', 'VARCHAR(20)', 'FK -> Students', 'Examinee enrollment foreign key'],
      ['exam_id', 'INT', 'FK -> Exams', 'Scheduled examination paper foreign key'],
      ['hall_id', 'INT', 'FK -> Exam_Halls', 'Examination venue foreign key'],
      ['row_no', 'INT', 'CHECK (>0)', 'Classroom matrix row coordinate'],
      ['col_no', 'INT', 'CHECK (>0)', 'Classroom matrix column coordinate'],
      ['bench_no', 'INT', 'CHECK (>0)', 'Physical bench sequence number'],
      ['seat_position', 'CHAR(1)', 'CHECK (A/B)', 'Left (A) or Right (B) position on bench'],
      ['seat_label', 'VARCHAR(20)', 'UNIQUE COMPOSITE', 'Human-readable coordinate (e.g. R1-C1-A)'],
      ['allocated_at', 'DATETIME', 'DEFAULT NOW()', 'Timestamp of seat allocation']
    ],
    note: 'Composite uniqueness constraints: UK(enrollment_no, exam_id) prevents double-booking a student; UK(hall_id, exam_id, row_no, col_no, seat_position) prevents seat collisions.'
  },
  {
    name: 'Marks_Moderation',
    pk: 'moderation_id',
    cols: [
      ['moderation_id', 'INT', 'PK AUTO_INCREMENT', 'Surrogate primary key'],
      ['enrollment_no', 'VARCHAR(20)', 'FK -> Students', 'Student enrollment reference'],
      ['exam_id', 'INT', 'FK -> Exams', 'Examination paper reference'],
      ['original_marks', 'DECIMAL(5,2)', '0..max_marks', 'Raw score awarded by initial evaluator'],
      ['grace_marks', 'DECIMAL(5,2)', 'CHECK (0..10)', 'Moderation grace score awarded'],
      ['moderated_marks', 'DECIMAL(5,2)', 'original + grace', 'Final computed moderated score'],
      ['status', 'VARCHAR(20)', 'CHECK', 'Pending, Grace_Applied, or Approved'],
      ['remarks', 'TEXT', '', 'Academic moderation committee rationale'],
      ['moderator_id', 'INT', 'FK -> Faculty', 'Faculty moderator approving adjustment'],
      ['updated_at', 'DATETIME', 'DEFAULT NOW()', 'Last modification timestamp']
    ],
    note: 'Protected by BEFORE UPDATE trigger trg_cap_grace_marks (strictly caps grace <= 10) and AFTER UPDATE trigger trg_audit_marks_modification.'
  },
  {
    name: 'Marks_Audit_Log',
    pk: 'log_id',
    cols: [
      ['log_id', 'INT', 'PK AUTO_INCREMENT', 'Surrogate primary key'],
      ['moderation_id', 'INT', 'FK -> Marks_Moderation', 'Link to modified score record'],
      ['enrollment_no', 'VARCHAR(20)', 'FK -> Students', 'Examinee identifier reference'],
      ['exam_id', 'INT', 'FK -> Exams', 'Course examination reference'],
      ['old_marks', 'DECIMAL(5,2)', 'NOT NULL', 'Pre-moderation raw score value'],
      ['new_marks', 'DECIMAL(5,2)', 'NOT NULL', 'Post-moderation adjusted score value'],
      ['grace_applied', 'DECIMAL(5,2)', 'NOT NULL', 'Exact quantum of grace marks awarded'],
      ['modified_by_faculty', 'INT', 'FK -> Faculty', 'Authenticated faculty moderator ID'],
      ['action_timestamp', 'DATETIME', 'DEFAULT NOW()', 'Immutable cryptographic timestamp']
    ],
    note: 'Immutable ACID audit trail automatically populated by trigger. Cannot be modified or deleted, ensuring examination integrity.'
  }
];

const relationships = [
  { from: 'Faculty.reports_to_id', to: 'Faculty.faculty_id', type: 'Self-Join (1:N)', desc: 'Hierarchical reporting structure (Subordinate Moderator -> Chief Controller)' },
  { from: 'Exam_Halls.invigilator_id', to: 'Faculty.faculty_id', type: 'Many-to-One (N:1)', desc: 'Designated faculty member serving as chief invigilator' },
  { from: 'Seat_Allocations.enrollment_no', to: 'Students.enrollment_no', type: 'Many-to-One (N:1)', desc: 'Student assigned to a physical classroom bench' },
  { from: 'Seat_Allocations.exam_id', to: 'Exams.exam_id', type: 'Many-to-One (N:1)', desc: 'Examination paper for which seat is assigned' },
  { from: 'Seat_Allocations.hall_id', to: 'Exam_Halls.hall_id', type: 'Many-to-One (N:1)', desc: 'Physical hall containing the bench coordinate' },
  { from: 'Marks_Moderation.enrollment_no', to: 'Students.enrollment_no', type: 'Many-to-One (N:1)', desc: 'Examinee whose paper is being evaluated' },
  { from: 'Marks_Moderation.exam_id', to: 'Exams.exam_id', type: 'Many-to-One (N:1)', desc: 'Subject paper evaluated by moderation board' },
  { from: 'Marks_Moderation.moderator_id', to: 'Faculty.faculty_id', type: 'Many-to-One (N:1)', desc: 'Faculty member responsible for grace moderation' },
  { from: 'Marks_Audit_Log.moderation_id', to: 'Marks_Moderation.moderation_id', type: 'Many-to-One (N:1)', desc: 'Audit link to the adjusted score record' }
];

export default function SchemaView() {
  const [openTable, setOpenTable] = useState('Faculty');

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
              <Network className="w-4 h-4" />
              <span>Relational Architecture</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                3NF Normalized Schema
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Entity-Relationship Diagram &amp; Table Specifications
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Complete relational model across 7 base tables and 2 virtual views. Conforms to Third Normal Form (3NF) and Boyce-Codd Normal Form (BCNF) with zero transitive functional dependencies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-1.5 shadow-xs">
              <Database className="w-3.5 h-3.5 text-brand-400" />
              <span>7 Tables • 3NF Compliant</span>
            </span>
          </div>
        </div>
      </div>

      {/* Visual ER Map Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Table2 className="w-4 h-4 text-brand-600" />
            <span>Relational Entity Map</span>
          </h3>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-200">PK Primary Key</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold border border-blue-200">FK Foreign Key</span>
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold border border-purple-200">Self-Join</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Card 1: Faculty */}
          <EntityCard 
            title="Faculty"
            pk="faculty_id"
            color="indigo"
            colsCount={8}
            badge="Recursive Unary FK"
            note="Self-join via reports_to_id -> faculty_id"
            onClick={() => setOpenTable('Faculty')}
          />

          {/* Card 2: Students */}
          <EntityCard 
            title="Students"
            pk="enrollment_no"
            color="emerald"
            colsCount={7}
            badge="Natural PK"
            note="Candidate key: enrollment_no, email"
            onClick={() => setOpenTable('Students')}
          />

          {/* Card 3: Exams */}
          <EntityCard 
            title="Exams"
            pk="exam_id"
            color="violet"
            colsCount={8}
            badge="Course Master"
            note="Candidate key: subject_code"
            onClick={() => setOpenTable('Exams')}
          />

          {/* Card 4: Exam_Halls */}
          <EntityCard 
            title="Exam_Halls"
            pk="hall_id"
            color="amber"
            colsCount={8}
            badge="Venue Topology"
            note="FK -> Faculty(invigilator_id)"
            onClick={() => setOpenTable('Exam_Halls')}
          />

          {/* Card 5: Seat_Allocations */}
          <EntityCard 
            title="Seat_Allocations"
            pk="allocation_id"
            color="blue"
            colsCount={10}
            badge="Junction Table"
            note="FKs -> Students, Exams, Halls • Composite UK"
            onClick={() => setOpenTable('Seat_Allocations')}
            highlight
          />

          {/* Card 6: Marks_Moderation */}
          <EntityCard 
            title="Marks_Moderation"
            pk="moderation_id"
            color="teal"
            colsCount={10}
            badge="Evaluation State"
            note="FKs -> Students, Exams, Faculty • Trigger Guards"
            onClick={() => setOpenTable('Marks_Moderation')}
            highlight
          />
        </div>

        {/* Audit Log Card (Full-width spanning bottom) */}
        <div className="mt-4">
          <EntityCard 
            title="Marks_Audit_Log"
            pk="log_id"
            color="rose"
            colsCount={9}
            badge="Immutable ACID Trail"
            note="Automatically populated by AFTER UPDATE trigger trg_audit_marks_modification. Enforces non-repudiation."
            onClick={() => setOpenTable('Marks_Audit_Log')}
          />
        </div>
      </div>

      {/* Relational Constraints & Cardinalities */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-brand-600" />
          <span>Referential Integrity &amp; Cardinality Rules</span>
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Source Foreign Key</th>
                <th className="p-3">Referenced Primary Key</th>
                <th className="p-3 text-center">Cardinality</th>
                <th className="p-3">Business Invariant Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {relationships.map((rel, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-mono font-bold text-brand-700">{rel.from}</td>
                  <td className="p-3 font-mono text-emerald-700">{rel.to}</td>
                  <td className="p-3 text-center">
                    <span className="font-mono text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {rel.type}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">{rel.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expandable Table Column Dictionary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Table2 className="w-4 h-4 text-brand-600" />
          <span>Table Dictionary &amp; Column Constraints (Click Table to Inspect)</span>
        </h3>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {tables.map((t) => {
            const isOpen = openTable === t.name;
            return (
              <div key={t.name} className={isOpen ? 'bg-indigo-50/20' : ''}>
                <button
                  onClick={() => setOpenTable(isOpen ? null : t.name)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{t.name}</span>
                        <span className="font-mono text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                          PK: {t.pk}
                        </span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-normal">
                          {t.cols.length} Columns
                        </span>
                      </h4>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-brand-600' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 animate-fadeIn">
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-700">
                          <tr>
                            <th className="p-3 text-left">Column Name</th>
                            <th className="p-3 text-left">Data Type</th>
                            <th className="p-3 text-left">Key / Constraint</th>
                            <th className="p-3 text-left">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {t.cols.map(([col, type, constraint, desc]) => (
                            <tr key={col} className="hover:bg-slate-50/60">
                              <td className="p-3 font-mono font-bold text-slate-900">
                                {col}
                                {col === t.pk && (
                                  <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded font-bold font-mono">
                                    PK
                                  </span>
                                )}
                                {constraint.includes('FK') && (
                                  <span className="ml-1.5 text-[9px] bg-blue-100 text-blue-900 border border-blue-200 px-1.5 py-0.2 rounded font-bold font-mono">
                                    FK
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-mono text-slate-600">{type}</td>
                              <td className="p-3 font-medium text-brand-700">{constraint || '—'}</td>
                              <td className="p-3 text-slate-500">{desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-3 mt-2 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs text-slate-700 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                      <span>{t.note}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EntityCard({ title, pk, color, colsCount, badge, note, onClick, highlight }) {
  const colorMap = {
    indigo: 'border-indigo-200 bg-indigo-50/40 hover:border-indigo-300',
    emerald: 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300',
    violet: 'border-violet-200 bg-violet-50/40 hover:border-violet-300',
    amber: 'border-amber-200 bg-amber-50/40 hover:border-amber-300',
    blue: 'border-blue-200 bg-blue-50/50 hover:border-blue-300',
    teal: 'border-teal-200 bg-teal-50/40 hover:border-teal-300',
    rose: 'border-rose-200 bg-rose-50/40 hover:border-rose-300'
  };

  return (
    <div 
      onClick={onClick}
      className={`rounded-2xl border p-4 shadow-2xs hover:shadow-sm transition-all cursor-pointer ${
        colorMap[color] || 'border-slate-200 bg-white'
      } ${highlight ? 'ring-2 ring-brand-300' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-700" />
          <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
        </div>
        <span className="text-[10px] font-mono font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
          {badge}
        </span>
      </div>

      <div className="flex items-center gap-2 my-2">
        <span className="font-mono text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded">
          PK: {pk}
        </span>
        <span className="font-mono text-[10px] text-slate-500">
          {colsCount} attributes
        </span>
      </div>

      <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
        {note}
      </p>

      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-brand-700">
        <span>Click to inspect dictionary</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}
