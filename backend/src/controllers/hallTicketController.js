const db = require('../config/db');

// GET /api/hall-ticket/:enrollment_no
exports.getHallTicket = async (req, res) => {
  const rawEnrollment = req.params.enrollment_no || '0808CS241091';
  const enrollmentNo = decodeURIComponent(rawEnrollment).trim().toUpperCase();
  const startTime = Date.now();

  const sqlQuery = `SELECT 
    s.enrollment_no,
    s.full_name AS student_name,
    s.branch,
    s.semester,
    s.section,
    s.email AS student_email,
    e.exam_id,
    e.subject_code,
    e.subject_name,
    e.exam_date,
    e.shift_time,
    e.max_marks,
    e.passing_marks,
    h.hall_id,
    h.building_block,
    h.room_number,
    sa.seat_label,
    sa.row_no,
    sa.col_no,
    sa.allocated_at,
    COALESCE(f.full_name, 'Exam Cell Observer') AS invigilator_name,
    COALESCE(f.faculty_code, 'FAC-EXAM') AS invigilator_code,
    m.moderated_marks,
    fn_ComputeGrade(m.moderated_marks, e.max_marks) AS rgpv_grade,
    m.status AS result_status
FROM students s
INNER JOIN seat_allocations sa ON s.enrollment_no = sa.enrollment_no
INNER JOIN exams e ON sa.exam_id = e.exam_id
INNER JOIN exam_halls h ON sa.hall_id = h.hall_id
LEFT JOIN faculty f ON h.invigilator_id = f.faculty_id
LEFT JOIN marks_moderation m ON m.enrollment_no = s.enrollment_no AND m.exam_id = e.exam_id
WHERE s.enrollment_no = '${enrollmentNo}'
ORDER BY e.exam_date ASC;`;

  try {
    // 1. Supabase Cloud live query
    if (db.isSupabaseConnected() && db.getSupabase()) {
      const { data: supaStudent } = await db.getSupabase()
        .from('students')
        .select('*')
        .ilike('enrollment_no', enrollmentNo)
        .maybeSingle();

      if (supaStudent) {
        const [allocsRes, marksRes] = await Promise.all([
          db.getSupabase()
            .from('seat_allocations')
            .select('*, exams(*), exam_halls(*, faculty(*))')
            .ilike('enrollment_no', enrollmentNo),
          db.getSupabase()
            .from('marks_moderation')
            .select('*')
            .ilike('enrollment_no', enrollmentNo)
        ]);

        const papers = (allocsRes.data || []).map(sa => {
          const exam = sa.exams || {};
          const hall = sa.exam_halls || {};
          const invig = hall.faculty || {};
          const markRec = (marksRes.data || []).find(m => m.exam_id === sa.exam_id);
          const marksVal = markRec ? Number(markRec.moderated_marks) : null;
          const grade = marksVal !== null ? db.fn_ComputeGrade(marksVal, exam.max_marks || 70) : 'PENDING';

          return {
            enrollment_no: supaStudent.enrollment_no,
            student_name: supaStudent.full_name,
            branch: supaStudent.branch,
            semester: supaStudent.semester,
            section: supaStudent.section,
            student_email: supaStudent.email,
            exam_id: exam.exam_id,
            subject_code: exam.subject_code || 'CS-501',
            subject_name: exam.subject_name || 'DBMS',
            exam_date: exam.exam_date,
            shift_time: exam.shift_time || '10:00 AM - 01:00 PM',
            max_marks: exam.max_marks || 70,
            passing_marks: exam.passing_marks || 23,
            hall_id: hall.hall_id,
            building_block: hall.building_block || 'Block-A',
            room_number: hall.room_number || 'Hall 101',
            seat_label: sa.seat_label,
            row_no: sa.row_no,
            col_no: sa.col_no,
            allocated_at: sa.allocated_at,
            invigilator_name: invig.full_name || 'Prof. Preeti Agrawal (Chief Moderator)',
            invigilator_code: invig.faculty_code || 'FAC-002',
            moderated_marks: marksVal,
            rgpv_grade: grade,
            result_status: markRec ? markRec.status : 'Awaiting Exam'
          };
        }).sort((a, b) => (a.exam_date || '').localeCompare(b.exam_date || ''));

        return res.json({
          success: true,
          student: {
            enrollment_no: supaStudent.enrollment_no,
            student_name: supaStudent.full_name,
            branch: supaStudent.branch,
            semester: supaStudent.semester,
            section: supaStudent.section,
            student_email: supaStudent.email
          },
          papers,
          sqlExecuted: sqlQuery,
          durationMs: Date.now() - startTime,
          dbEngine: db.getEngineStatus().engineName
        });
      }
    }

    // 2. In-Memory View & UDF Computation
    const student = db.state.students.find(s => s.enrollment_no.toUpperCase() === enrollmentNo);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: `Examinee with enrollment ${enrollmentNo} not found in the university database.`,
        sqlExecuted: `-- Student record not found for enrollment_no = '${enrollmentNo}'`
      });
    }

    const studentAllocations = db.state.allocations.filter(a => a.enrollment_no.toUpperCase() === enrollmentNo);
    const papers = studentAllocations.map(sa => {
      const exam = db.state.exams.find(e => e.exam_id === sa.exam_id) || {};
      const hall = db.state.halls.find(h => h.hall_id === sa.hall_id) || {};
      const invigilator = db.state.faculty.find(f => f.faculty_id === hall.invigilator_id);
      const markRecord = db.state.marks.find(m => m.enrollment_no.toUpperCase() === enrollmentNo && m.exam_id === sa.exam_id);

      const marksVal = markRecord ? Number(markRecord.moderated_marks) : null;
      const grade = marksVal !== null ? db.fn_ComputeGrade(marksVal, exam.max_marks || 70) : 'PENDING';

      return {
        enrollment_no: student.enrollment_no,
        student_name: student.full_name,
        branch: student.branch,
        semester: student.semester,
        section: student.section,
        student_email: student.email,
        exam_id: exam.exam_id,
        subject_code: exam.subject_code,
        subject_name: exam.subject_name,
        exam_date: exam.exam_date,
        shift_time: exam.shift_time,
        max_marks: exam.max_marks,
        passing_marks: exam.passing_marks,
        hall_id: hall.hall_id,
        building_block: hall.building_block,
        room_number: hall.room_number,
        seat_label: sa.seat_label,
        row_no: sa.row_no,
        col_no: sa.col_no,
        allocated_at: sa.allocated_at,
        invigilator_name: invigilator ? invigilator.full_name : 'Prof. Preeti Agrawal (Chief Moderator)',
        invigilator_code: invigilator ? invigilator.faculty_code : 'FAC-002',
        moderated_marks: marksVal,
        rgpv_grade: grade,
        result_status: markRecord ? markRecord.status : 'Awaiting Exam'
      };
    }).sort((a, b) => (a.exam_date || '').localeCompare(b.exam_date || ''));

    res.json({
      success: true,
      student: {
        enrollment_no: student.enrollment_no,
        student_name: student.full_name,
        branch: student.branch,
        semester: student.semester,
        section: student.section,
        student_email: student.email
      },
      papers: papers,
      sqlExecuted: sqlQuery,
      durationMs: Date.now() - startTime,
      dbEngine: db.getEngineStatus().engineName
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      sqlExecuted: sqlQuery
    });
  }
};
