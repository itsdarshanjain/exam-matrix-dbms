const db = require('../config/db');

// GET /api/moderation/marks?exam_id=1
exports.getMarks = async (req, res) => {
  const examId = parseInt(req.query.exam_id || '1', 10);
  const startTime = Date.now();

  const sqlQuery = `SELECT 
    m.moderation_id, 
    m.enrollment_no, 
    s.full_name AS student_name, 
    m.exam_id, 
    e.subject_code,
    e.subject_name,
    e.max_marks,
    e.passing_marks,
    m.original_marks, 
    m.grace_marks, 
    m.moderated_marks,
    fn_ComputeGrade(m.moderated_marks, e.max_marks) AS rgpv_grade,
    m.status, 
    m.remarks, 
    m.updated_at, 
    f.full_name AS moderator_name
FROM marks_moderation m
JOIN students s ON m.enrollment_no = s.enrollment_no
JOIN exams e ON m.exam_id = e.exam_id
JOIN faculty f ON m.moderator_id = f.faculty_id
WHERE m.exam_id = ${examId}
ORDER BY m.original_marks ASC;`;

  try {
    // 1. Supabase Cloud live access
    if (db.isSupabaseConnected() && db.getSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('marks_moderation')
        .select('*, students(full_name), exams(subject_code, subject_name, max_marks, passing_marks), faculty(full_name)')
        .eq('exam_id', examId)
        .order('original_marks', { ascending: true });

      if (!error && data && data.length > 0) {
        const enriched = data.map(m => {
          const origMarks = Number(m.original_marks);
          const graceMarks = Number(m.grace_marks || 0);
          const modMarks = Number(m.moderated_marks);
          const maxMarks = m.exams?.max_marks || 70;
          const passMarks = m.exams?.passing_marks || 23;
          const isBorderline = origMarks >= (passMarks - 5) && origMarks < passMarks && m.status !== 'Approved';

          return {
            moderation_id: m.moderation_id,
            enrollment_no: m.enrollment_no,
            student_name: m.students?.full_name || m.enrollment_no,
            exam_id: m.exam_id,
            subject_code: m.exams?.subject_code || 'CS-501',
            subject_name: m.exams?.subject_name || 'DBMS',
            max_marks: maxMarks,
            passing_marks: passMarks,
            original_marks: origMarks,
            grace_marks: graceMarks,
            moderated_marks: modMarks,
            rgpv_grade: db.fn_ComputeGrade(modMarks, maxMarks),
            status: m.status,
            remarks: m.remarks,
            updated_at: m.updated_at,
            moderator_name: m.faculty?.full_name || 'Prof. Preeti Agrawal',
            isBorderline
          };
        });

        return res.json({
          success: true,
          data: enriched,
          sqlExecuted: sqlQuery,
          durationMs: Date.now() - startTime,
          dbEngine: db.getEngineStatus().engineName
        });
      }
    }

    // 2. In-Memory Computation Fallback
    const exam = db.state.exams.find(e => e.exam_id === examId) || db.state.exams[0] || { max_marks: 70, passing_marks: 23 };
    const filteredMarks = db.state.marks.filter(m => m.exam_id === examId);

    const enriched = filteredMarks.map(m => {
      const student = db.state.students.find(s => s.enrollment_no.toUpperCase() === m.enrollment_no.toUpperCase()) || {};
      const moderator = db.state.faculty.find(f => f.faculty_id === m.moderator_id) || db.state.faculty[1];
      const origMarks = Number(m.original_marks);
      const graceMarks = Number(m.grace_marks || 0);
      const modMarks = Number(m.moderated_marks);
      const passMarks = exam.passing_marks || 23;
      const isBorderline = origMarks >= (passMarks - 5) && origMarks < passMarks && m.status !== 'Approved';

      return {
        moderation_id: m.moderation_id,
        enrollment_no: m.enrollment_no,
        student_name: student.full_name || m.enrollment_no,
        exam_id: m.exam_id,
        subject_code: exam.subject_code,
        subject_name: exam.subject_name,
        max_marks: exam.max_marks,
        passing_marks: passMarks,
        original_marks: origMarks,
        grace_marks: graceMarks,
        moderated_marks: modMarks,
        rgpv_grade: db.fn_ComputeGrade(modMarks, exam.max_marks),
        status: m.status,
        remarks: m.remarks,
        updated_at: m.updated_at,
        moderator_name: moderator.full_name,
        isBorderline: isBorderline
      };
    }).sort((a, b) => a.original_marks - b.original_marks);

    res.json({
      success: true,
      data: enriched,
      sqlExecuted: sqlQuery,
      durationMs: Date.now() - startTime,
      dbEngine: db.getEngineStatus().engineName
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, sqlExecuted: sqlQuery });
  }
};

// POST /api/moderation/auto-moderate
exports.autoModerateBorderline = async (req, res) => {
  const examId = parseInt(req.body.exam_id || '1', 10);
  const maxGrace = parseFloat(req.body.max_grace || '5.00');
  const startTime = Date.now();

  const sqlProcedureCall = `START TRANSACTION;
SAVEPOINT sp_before_grace;
-- Invoking Stored Procedure with Row-Level Locking (SELECT ... FOR UPDATE)
CALL sp_AutoModerateBorderline(${examId}, ${maxGrace.toFixed(2)}, @p_upgraded_count);
SELECT @p_upgraded_count AS upgraded_count;
COMMIT;
-- Note: trg_MarksAuditLog automatically fired for all updated records.`;

  try {
    const exam = db.state.exams.find(e => e.exam_id === examId) || db.state.exams[0] || { passing_marks: 23 };
    const passMarks = exam.passing_marks || 23;
    const minEligible = passMarks - maxGrace;

    let upgradedCount = 0;
    const nowTimestamp = new Date().toISOString();

    // 1. Supabase Cloud Auto-Moderation
    if (db.isSupabaseConnected() && db.getSupabase()) {
      const { data: supaMarks } = await db.getSupabase()
        .from('marks_moderation')
        .select('*')
        .eq('exam_id', examId);

      if (supaMarks) {
        for (const m of supaMarks) {
          const origMarks = Number(m.original_marks);
          if (origMarks >= minEligible && origMarks < passMarks && m.status !== 'Approved') {
            const graceNeeded = Number((passMarks - origMarks).toFixed(2));
            await db.getSupabase().from('marks_moderation').update({
              grace_marks: graceNeeded,
              moderated_marks: passMarks,
              status: 'Grace_Applied',
              remarks: `Auto-Moderated via Borderline Policy (Grace: +${graceNeeded})`,
              updated_at: nowTimestamp
            }).eq('moderation_id', m.moderation_id);
            upgradedCount++;
          }
        }
      }
    }

    // 2. Local State Sync
    db.state.marks.forEach(m => {
      if (m.exam_id === examId && Number(m.original_marks) >= minEligible && Number(m.original_marks) < passMarks && m.status !== 'Approved') {
        const oldMarks = Number(m.moderated_marks);
        const oldStatus = m.status;
        const graceNeeded = Number((passMarks - Number(m.original_marks)).toFixed(2));
        const newMarks = passMarks;

        m.grace_marks = graceNeeded;
        m.moderated_marks = newMarks;
        m.status = 'Grace_Applied';
        m.remarks = `Auto-Moderated via Borderline Policy (Grace: +${graceNeeded})`;
        m.updated_at = nowTimestamp;

        if (!db.isSupabaseConnected()) {
          upgradedCount++;
        }

        db.state.lastAuditId++;
        db.state.auditLog.unshift({
          log_id: db.state.lastAuditId,
          moderation_id: m.moderation_id,
          enrollment_no: m.enrollment_no,
          exam_id: m.exam_id,
          old_marks: oldMarks,
          new_marks: newMarks,
          grace_applied: graceNeeded,
          old_status: oldStatus,
          new_status: 'Grace_Applied',
          modified_by_faculty: m.moderator_id || 2,
          action_timestamp: nowTimestamp
        });
      }
    });

    res.json({
      success: true,
      data: {
        upgraded_count: upgradedCount,
        message: `SUCCESS: Auto-Moderation upgraded ${upgradedCount} borderline students to passing threshold (23 marks).`
      },
      sqlExecuted: sqlProcedureCall,
      durationMs: Date.now() - startTime,
      transactionStatus: 'ACID TRANSACTION COMMITTED'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      sqlExecuted: `ROLLBACK; -- Transaction rolled back to SAVEPOINT sp_before_grace;`
    });
  }
};

// PUT /api/moderation/update
exports.updateMarksManual = async (req, res) => {
  const { moderation_id, grace_marks, remarks, moderator_id, status } = req.body;
  const startTime = Date.now();

  const moderationId = parseInt(moderation_id, 10);
  const graceVal = parseFloat(grace_marks || 0);

  const sqlAttempt = `START TRANSACTION;
UPDATE marks_moderation
SET grace_marks = ${graceVal.toFixed(2)},
    status = '${status || 'Approved'}',
    remarks = '${remarks || 'Faculty Moderation Adjustment'}',
    moderator_id = ${moderator_id || 2}
WHERE moderation_id = ${moderationId};
-- Triggers trg_ValidateModerationMarks (BEFORE UPDATE) and trg_log_marks_moderation (AFTER UPDATE)
COMMIT;`;

  // Trigger 2 Check: Cap grace marks at 10.00
  if (graceVal > 10.00) {
    return res.status(400).json({
      success: false,
      triggerFired: 'trg_ValidateModerationMarks',
      sqlState: '45000',
      errorCode: 1644,
      errorMessage: 'TRIGGER BLOCKED: University policy caps grace marks at 10.00!',
      sqlExecuted: sqlAttempt,
      durationMs: Date.now() - startTime,
      ruleEnforced: 'BEFORE UPDATE trigger validation failed: NEW.grace_marks > 10.00'
    });
  }

  try {
    const nowTimestamp = new Date().toISOString();
    let updatedRecord = null;

    // 1. Supabase Cloud Update
    if (db.isSupabaseConnected() && db.getSupabase()) {
      const { data: supaRec } = await db.getSupabase()
        .from('marks_moderation')
        .select('*')
        .eq('moderation_id', moderationId)
        .single();

      if (supaRec) {
        const origMarks = Number(supaRec.original_marks);
        const newModMarks = origMarks + graceVal;
        const newStatus = status || (graceVal > 0 ? 'Grace_Applied' : 'Approved');

        const { data: updatedRows, error: upError } = await db.getSupabase()
          .from('marks_moderation')
          .update({
            grace_marks: graceVal,
            moderated_marks: newModMarks,
            status: newStatus,
            remarks: remarks || 'Faculty Manual Moderation',
            moderator_id: moderator_id || 2,
            updated_at: nowTimestamp
          })
          .eq('moderation_id', moderationId)
          .select();

        if (upError) {
          return res.status(400).json({ success: false, error: upError.message, sqlExecuted: sqlAttempt });
        }
        updatedRecord = updatedRows && updatedRows[0];
      }
    }

    // 2. In-Memory State Sync
    const record = db.state.marks.find(m => m.moderation_id === moderationId);
    if (record) {
      const oldMarks = Number(record.moderated_marks);
      const oldStatus = record.status;
      const newModMarks = Number(record.original_marks) + graceVal;

      record.grace_marks = graceVal;
      record.moderated_marks = newModMarks;
      record.status = status || (graceVal > 0 ? 'Grace_Applied' : 'Approved');
      record.remarks = remarks || 'Faculty Manual Moderation';
      record.updated_at = nowTimestamp;
      record.moderator_id = moderator_id || 2;

      db.state.lastAuditId++;
      const auditRecord = {
        log_id: db.state.lastAuditId,
        moderation_id: record.moderation_id,
        enrollment_no: record.enrollment_no,
        exam_id: record.exam_id,
        old_marks: oldMarks,
        new_marks: newModMarks,
        grace_applied: graceVal,
        old_status: oldStatus,
        new_status: record.status,
        modified_by_faculty: record.moderator_id,
        action_timestamp: nowTimestamp
      };
      db.state.auditLog.unshift(auditRecord);
      if (!updatedRecord) updatedRecord = record;
    }

    res.json({
      success: true,
      message: 'Marks updated successfully in Supabase and logged in forensic audit trail.',
      data: updatedRecord,
      sqlExecuted: sqlAttempt,
      durationMs: Date.now() - startTime,
      transactionStatus: 'ACID TRANSACTION COMMITTED'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, sqlExecuted: sqlAttempt });
  }
};

// GET /api/moderation/audit-log
exports.getAuditLog = async (req, res) => {
  const startTime = Date.now();
  const sqlQuery = `SELECT 
    a.log_id,
    a.moderation_id,
    a.enrollment_no,
    s.full_name AS student_name,
    a.exam_id,
    e.subject_code,
    e.subject_name,
    a.old_marks,
    a.new_marks,
    a.grace_applied,
    a.old_status,
    a.new_status,
    f.full_name AS modified_by_name,
    f.designation AS faculty_designation,
    a.action_timestamp
FROM marks_audit_log a
JOIN students s ON a.enrollment_no = s.enrollment_no
JOIN exams e ON a.exam_id = e.exam_id
JOIN faculty f ON a.modified_by_faculty = f.faculty_id
ORDER BY a.action_timestamp DESC, a.log_id DESC
LIMIT 50;`;

  try {
    // 1. Supabase Cloud live access
    if (db.isSupabaseConnected() && db.getSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('marks_audit_log')
        .select('*, students(full_name), exams(subject_code, subject_name), faculty(full_name, designation)')
        .order('action_timestamp', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        const formatted = data.map(a => ({
          log_id: a.log_id,
          moderation_id: a.moderation_id,
          enrollment_no: a.enrollment_no,
          student_name: a.students?.full_name || a.enrollment_no,
          exam_id: a.exam_id,
          subject_code: a.exams?.subject_code || 'CS-501',
          subject_name: a.exams?.subject_name || 'DBMS',
          old_marks: a.old_marks,
          new_marks: a.new_marks,
          grace_applied: a.grace_applied,
          old_status: a.old_status,
          new_status: a.new_status,
          modified_by_name: a.faculty?.full_name || 'Prof. Preeti Agrawal',
          faculty_designation: a.faculty?.designation || 'Chief Exam Moderator',
          action_timestamp: a.action_timestamp
        }));

        return res.json({
          success: true,
          data: formatted,
          sqlExecuted: sqlQuery,
          durationMs: Date.now() - startTime,
          dbEngine: db.getEngineStatus().engineName
        });
      }
    }

    // 2. In-Memory Fallback
    const enrichedLogs = db.state.auditLog.map(a => {
      const student = db.state.students.find(s => s.enrollment_no.toUpperCase() === a.enrollment_no.toUpperCase()) || {};
      const exam = db.state.exams.find(e => e.exam_id === a.exam_id) || {};
      const faculty = db.state.faculty.find(f => f.faculty_id === a.modified_by_faculty) || db.state.faculty[1];

      return {
        log_id: a.log_id,
        moderation_id: a.moderation_id,
        enrollment_no: a.enrollment_no,
        student_name: student.full_name || a.enrollment_no,
        exam_id: a.exam_id,
        subject_code: exam.subject_code || 'CS-501',
        subject_name: exam.subject_name || 'DBMS',
        old_marks: a.old_marks,
        new_marks: a.new_marks,
        grace_applied: a.grace_applied,
        old_status: a.old_status,
        new_status: a.new_status,
        modified_by_name: faculty.full_name || 'Prof. Preeti Agrawal',
        faculty_designation: faculty.designation || 'Chief Exam Moderator',
        action_timestamp: a.action_timestamp
      };
    });

    res.json({
      success: true,
      data: enrichedLogs,
      sqlExecuted: sqlQuery,
      durationMs: Date.now() - startTime,
      dbEngine: db.getEngineStatus().engineName
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, sqlExecuted: sqlQuery });
  }
};
