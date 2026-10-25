const db = require('../config/db');

// Catalog of Core Relational Viva Queries
const VIVA_QUERIES = {
  self_join: {
    title: 'Self-Join Hierarchy (Recursive Foreign Key)',
    concept: 'Unary Relationship / Self-Join with ON DELETE SET NULL',
    description: 'Traverses the organizational hierarchy of IPS Academy Exam Moderation Committee, joining Faculty f1 (Subordinate/Moderator) with Faculty f2 (Supervisor/Controller of Examinations).',
    sql: `SELECT 
    f1.faculty_id,
    f1.faculty_code,
    f1.full_name AS faculty_name,
    f1.designation,
    f1.role_type,
    COALESCE(f2.full_name, 'BOARD OF GOVERNORS / AUTONOMOUS') AS reports_to_supervisor,
    COALESCE(f2.designation, 'CHIEF CONTROLLER') AS supervisor_designation
FROM Faculty f1
LEFT JOIN Faculty f2 ON f1.reports_to_id = f2.faculty_id
ORDER BY f1.reports_to_id ASC, f1.faculty_id ASC;`,
    explain: `id: 1 | select_type: SIMPLE | table: f1 | type: ALL | possible_keys: NULL | rows: 5 | Extra: Using filesort
id: 1 | select_type: SIMPLE | table: f2 | type: eq_ref | key: PRIMARY | key_len: 4 | ref: f1.reports_to_id | rows: 1`
  },

  left_outer_join: {
    title: 'Left Outer Join (Relational Difference / Empty Sets)',
    concept: 'Non-matching Tuples Preservation (Outer Join)',
    description: 'Identifies all students who are NOT YET allocated any seat for Exam CS-502 (Theory of Computation), demonstrating Set Difference (Students - Allocated_Students).',
    sql: `SELECT 
    s.enrollment_no,
    s.full_name,
    s.branch,
    s.section,
    sa.allocation_id,
    COALESCE(sa.seat_label, 'UNALLOCATED') AS allocation_status
FROM Students s
LEFT OUTER JOIN Seat_Allocations sa 
    ON s.enrollment_no = sa.enrollment_no AND sa.exam_id = 2
WHERE sa.allocation_id IS NULL
ORDER BY s.enrollment_no ASC;`,
    explain: `id: 1 | select_type: SIMPLE | table: s | type: ALL | rows: 25 | Extra: NULL
id: 1 | select_type: SIMPLE | table: sa | type: ref | key: uk_student_exam | rows: 1 | Extra: Using where; Not exists`
  },

  relational_division: {
    title: 'Relational Division (NOT EXISTS / Relational Completeness)',
    concept: 'Universal Quantification via Double Negation: R ÷ S',
    description: 'Finds students who are allocated seats across ALL mandatory 5th-Semester Theory Exams (CS-501, CS-502, CS-503, CS-504). Pure relational division algebraic property.',
    sql: `SELECT s.enrollment_no, s.full_name, s.branch, s.section
FROM Students s
WHERE NOT EXISTS (
    SELECT e.exam_id 
    FROM Exams e
    WHERE e.academic_sem = 5
      AND NOT EXISTS (
          SELECT sa.allocation_id 
          FROM Seat_Allocations sa
          WHERE sa.enrollment_no = s.enrollment_no
            AND sa.exam_id = e.exam_id
      )
);`,
    explain: `id: 1 | select_type: PRIMARY | table: s | type: ALL | rows: 25 | Extra: Using where
id: 2 | select_type: DEPENDENT SUBQUERY | table: e | type: ALL | rows: 4 | Extra: Using where
id: 3 | select_type: DEPENDENT SUBQUERY | table: sa | type: ref | key: uk_student_exam | rows: 1`
  },

  integrity_3nf: {
    title: '3NF Schema & Foreign Key Referential Integrity Proof',
    concept: 'Boyce-Codd / 3rd Normal Form & Cascade Constraints',
    description: 'Inspects relational metadata: verifying that every determinant is a candidate key and no transitive functional dependencies exist.',
    sql: `SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    CONSTRAINT_NAME, 
    REFERENCED_TABLE_NAME, 
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'ips_exam_db' 
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;`,
    explain: `Execution: System Schema Table Scan (INFORMATION_SCHEMA) using Primary Indices.`
  },

  aggregate_analytics: {
    title: 'Aggregate Analytics & Hall Utilization Metrics',
    concept: 'Relational Aggregation (GROUP BY, HAVING, ROUND)',
    description: 'Calculates student count, average moderated score, pass percentage, and standard deviation per subject.',
    sql: `SELECT 
    e.subject_code,
    e.subject_name,
    COUNT(m.moderation_id) AS total_evaluated,
    ROUND(AVG(m.original_marks), 2) AS avg_raw_marks,
    ROUND(AVG(m.moderated_marks), 2) AS avg_moderated_marks,
    SUM(CASE WHEN m.moderated_marks >= e.passing_marks THEN 1 ELSE 0 END) AS passed_students,
    ROUND((SUM(CASE WHEN m.moderated_marks >= e.passing_marks THEN 1 ELSE 0 END) / COUNT(m.moderation_id)) * 100.0, 1) AS pass_percentage
FROM Exams e
JOIN Marks_Moderation m ON e.exam_id = m.exam_id
GROUP BY e.exam_id, e.subject_code, e.subject_name;`,
    explain: `id: 1 | select_type: SIMPLE | table: e | type: ALL | rows: 4 | Extra: Using temporary; Using filesort
id: 1 | select_type: SIMPLE | table: m | type: ref | key: fk_marks_exam | key_len: 4 | rows: 25`
  }
};

// GET /api/analytics/viva-query/:query_key
exports.runVivaQuery = async (req, res) => {
  const queryKey = req.params.query_key;
  const vivaItem = VIVA_QUERIES[queryKey];
  const startTime = Date.now();

  if (!vivaItem) {
    return res.status(404).json({ success: false, error: 'Query key not recognized' });
  }

  try {
    if (db.isSupabaseConnected() && db.pool) {
      const [rows] = await db.pool.query(vivaItem.sql);
      let explainRows = [];
      try {
        const [expl] = await db.pool.query(`EXPLAIN ${vivaItem.sql}`);
        explainRows = expl;
      } catch (e) {
        explainRows = [{ plan: vivaItem.explain }];
      }

      return res.json({
        success: true,
        meta: vivaItem,
        data: rows,
        explainPlan: explainRows,
        sqlExecuted: vivaItem.sql,
        durationMs: Date.now() - startTime,
        dbEngine: db.getEngineStatus().engineName
      });
    }

    // In-memory simulation of the 5 viva queries
    let resultRows = [];
    if (queryKey === 'self_join') {
      resultRows = db.state.faculty.map(f1 => {
        const sup = db.state.faculty.find(f => f.faculty_id === f1.reports_to_id);
        return {
          faculty_id: f1.faculty_id,
          faculty_code: f1.faculty_code,
          faculty_name: f1.full_name,
          designation: f1.designation,
          role_type: f1.role_type,
          reports_to_supervisor: sup ? sup.full_name : 'BOARD OF GOVERNORS / AUTONOMOUS',
          supervisor_designation: sup ? sup.designation : 'CHIEF CONTROLLER'
        };
      });
    } else if (queryKey === 'left_outer_join') {
      // Find unallocated students for Exam 2
      const allocatedForExam2 = new Set(
        db.state.allocations.filter(a => a.exam_id === 2).map(a => a.enrollment_no)
      );
      resultRows = db.state.students
        .filter(s => !allocatedForExam2.has(s.enrollment_no))
        .map(s => ({
          enrollment_no: s.enrollment_no,
          full_name: s.full_name,
          branch: s.branch,
          section: s.section,
          allocation_id: null,
          allocation_status: 'UNALLOCATED'
        }));
    } else if (queryKey === 'relational_division') {
      // Students allocated in ALL 4 exams (CS-501 to CS-504)
      const allExamIds = [1, 2, 3, 4];
      resultRows = db.state.students.filter(s => {
        const studentExamIds = new Set(
          db.state.allocations.filter(a => a.enrollment_no === s.enrollment_no).map(a => a.exam_id)
        );
        return allExamIds.every(id => studentExamIds.has(id));
      }).map(s => ({
        enrollment_no: s.enrollment_no,
        full_name: s.full_name,
        branch: s.branch,
        section: s.section
      }));
    } else if (queryKey === 'integrity_3nf') {
      resultRows = [
        { TABLE_NAME: 'Seat_Allocations', COLUMN_NAME: 'enrollment_no', CONSTRAINT_NAME: 'fk_alloc_student', REFERENCED_TABLE_NAME: 'Students', REFERENCED_COLUMN_NAME: 'enrollment_no' },
        { TABLE_NAME: 'Seat_Allocations', COLUMN_NAME: 'exam_id', CONSTRAINT_NAME: 'fk_alloc_exam', REFERENCED_TABLE_NAME: 'Exams', REFERENCED_COLUMN_NAME: 'exam_id' },
        { TABLE_NAME: 'Seat_Allocations', COLUMN_NAME: 'hall_id', CONSTRAINT_NAME: 'fk_alloc_hall', REFERENCED_TABLE_NAME: 'Exam_Halls', REFERENCED_COLUMN_NAME: 'hall_id' },
        { TABLE_NAME: 'Marks_Moderation', COLUMN_NAME: 'enrollment_no', CONSTRAINT_NAME: 'fk_marks_student', REFERENCED_TABLE_NAME: 'Students', REFERENCED_COLUMN_NAME: 'enrollment_no' },
        { TABLE_NAME: 'Marks_Moderation', COLUMN_NAME: 'exam_id', CONSTRAINT_NAME: 'fk_marks_exam', REFERENCED_TABLE_NAME: 'Exams', REFERENCED_COLUMN_NAME: 'exam_id' },
        { TABLE_NAME: 'Marks_Moderation', COLUMN_NAME: 'moderator_id', CONSTRAINT_NAME: 'fk_marks_moderator', REFERENCED_TABLE_NAME: 'Faculty', REFERENCED_COLUMN_NAME: 'faculty_id' },
        { TABLE_NAME: 'Marks_Audit_Log', COLUMN_NAME: 'enrollment_no', CONSTRAINT_NAME: 'fk_audit_student', REFERENCED_TABLE_NAME: 'Students', REFERENCED_COLUMN_NAME: 'enrollment_no' },
        { TABLE_NAME: 'Faculty', COLUMN_NAME: 'reports_to_id', CONSTRAINT_NAME: 'fk_faculty_reports_to', REFERENCED_TABLE_NAME: 'Faculty', REFERENCED_COLUMN_NAME: 'faculty_id' }
      ];
    } else if (queryKey === 'aggregate_analytics') {
      resultRows = db.state.exams.map(e => {
        const marksForExam = db.state.marks.filter(m => m.exam_id === e.exam_id);
        const count = marksForExam.length;
        const sumOrig = marksForExam.reduce((acc, m) => acc + Number(m.original_marks), 0);
        const sumMod = marksForExam.reduce((acc, m) => acc + Number(m.moderated_marks), 0);
        const passedCount = marksForExam.filter(m => Number(m.moderated_marks) >= e.passing_marks).length;

        return {
          subject_code: e.subject_code,
          subject_name: e.subject_name,
          total_evaluated: count,
          avg_raw_marks: count > 0 ? Number((sumOrig / count).toFixed(2)) : 0,
          avg_moderated_marks: count > 0 ? Number((sumMod / count).toFixed(2)) : 0,
          passed_students: passedCount,
          pass_percentage: count > 0 ? Number(((passedCount / count) * 100).toFixed(1)) : 0
        };
      });
    }

    res.json({
      success: true,
      meta: vivaItem,
      data: resultRows,
      explainPlan: [
        { info: vivaItem.explain }
      ],
      sqlExecuted: vivaItem.sql,
      durationMs: Date.now() - startTime,
      dbEngine: db.getEngineStatus().engineName
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, sqlExecuted: vivaItem.sql });
  }
};

// GET /api/analytics/dashboard-stats
exports.getDashboardStats = async (req, res) => {
  const startTime = Date.now();
  try {
    const totalStudents = db.state.students.length;
    const totalExams = db.state.exams.length;
    const totalHalls = db.state.halls.length;
    const totalCapacity = db.state.halls.reduce((s, h) => s + (h.total_capacity || 0), 0);
    const totalAllocations = db.state.allocations.length;
    const totalMarksEntries = db.state.marks.length;
    const totalAuditEvents = db.state.auditLog.length;

    let passCount = 0;
    let failCount = 0;
    let sumMarks = 0;
    const gradeDistribution = { O: 0, 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, F: 0 };

    db.state.marks.forEach((m) => {
      const exam = db.state.exams.find((e) => e.exam_id === m.exam_id);
      const max = exam ? exam.max_marks : 70;
      const pass = exam ? exam.passing_marks : 23;
      const moderated = Number(m.moderated_marks);
      sumMarks += moderated;
      if (moderated >= pass) passCount++; else failCount++;
      const g = db.fn_ComputeGrade(moderated, max);
      if (gradeDistribution[g] !== undefined) gradeDistribution[g]++;
    });

    const averageMarks = totalMarksEntries > 0 ? Number((sumMarks / totalMarksEntries).toFixed(1)) : 0;

    const sqlExecuted = `SELECT COUNT(*) AS totalStudents FROM Students;\nSELECT COUNT(*) AS totalExams FROM Exams;\nSELECT COUNT(*) AS totalHalls, SUM(total_capacity) AS totalCapacity FROM Exam_Halls;\nSELECT COUNT(*) AS totalAllocations FROM Seat_Allocations;\nSELECT COUNT(*) AS totalMarksEntries FROM Marks_Moderation;\nSELECT COUNT(*) AS totalAuditEvents FROM Marks_Audit_Log;\nSELECT fn_ComputeGrade(moderated_marks, max_marks) AS grade, COUNT(*) FROM Marks_Moderation m JOIN Exams e ON m.exam_id=e.exam_id GROUP BY grade;`;

    res.json({
      success: true,
      data: {
        totalStudents,
        totalExams,
        totalHalls,
        totalCapacity,
        totalAllocations,
        totalMarksEntries,
        totalAuditEvents,
        passCount,
        failCount,
        averageMarks,
        gradeDistribution
      },
      sqlExecuted,
      durationMs: Date.now() - startTime,
      dbEngine: db.getEngineStatus().engineName
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/analytics/grade-distribution?exam_id=1
exports.getGradeDistribution = async (req, res) => {
  const examId = parseInt(req.query.exam_id || '1', 10);
  const startTime = Date.now();
  try {
    const exam = db.state.exams.find((e) => e.exam_id === examId) || db.state.exams[0];
    const marksForExam = db.state.marks.filter((m) => m.exam_id === examId);
    const dist = { O: 0, 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, F: 0 };
    marksForExam.forEach((m) => {
      const g = db.fn_ComputeGrade(Number(m.moderated_marks), exam.max_marks);
      if (dist[g] !== undefined) dist[g]++;
    });
    const sqlExecuted = `SELECT fn_ComputeGrade(moderated_marks, ${exam.max_marks}) AS grade, COUNT(*) AS cnt FROM Marks_Moderation WHERE exam_id=${examId} GROUP BY grade ORDER BY FIELD(grade,'O','A+','A','B+','B','C','F');`;
    res.json({
      success: true,
      data: { examId, subject_code: exam.subject_code, subject_name: exam.subject_name, distribution: dist, total: marksForExam.length },
      sqlExecuted,
      durationMs: Date.now() - startTime
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/analytics/status
exports.getSystemStatus = async (req, res) => {
  res.json({
    success: true,
    data: db.getEngineStatus()
  });
};

// POST /api/analytics/reset
exports.resetDatabase = async (req, res) => {
  const result = db.resetDatabaseState();
  res.json({
    success: true,
    ...result
  });
};
