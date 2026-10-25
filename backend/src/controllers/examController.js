const db = require('../config/db');

// GET /api/exams
exports.getAllExams = async (req, res) => {
  const startTime = Date.now();
  const sqlExecuted = `SELECT * FROM exams ORDER BY exam_date ASC, exam_id ASC;`;
  res.json({
    success: true,
    data: db.state.exams,
    sqlExecuted,
    durationMs: Date.now() - startTime,
    dbEngine: db.getEngineStatus().engineName
  });
};

// POST /api/exams
exports.createExam = async (req, res) => {
  const { subject_code, subject_name, exam_date, shift_time, max_marks, passing_marks, academic_sem } = req.body;
  const startTime = Date.now();

  if (!subject_code || !subject_name || !exam_date) {
    return res.status(400).json({ success: false, error: 'Subject Code, Name, and Date are required.' });
  }

  const cleanCode = subject_code.trim().toUpperCase();
  const exists = db.state.exams.find(e => e.subject_code === cleanCode);
  if (exists) {
    return res.status(400).json({ success: false, error: `Course Code ${cleanCode} already scheduled.` });
  }

  db.state.lastExamId++;
  const newExam = {
    exam_id: db.state.lastExamId,
    subject_code: cleanCode,
    subject_name: subject_name.trim(),
    exam_date: exam_date,
    shift_time: shift_time || '10:00 AM - 01:00 PM',
    max_marks: parseInt(max_marks || 70, 10),
    passing_marks: parseInt(passing_marks || 23, 10),
    academic_sem: parseInt(academic_sem || 5, 10),
    created_at: new Date().toISOString()
  };

  db.state.exams.push(newExam);
  const sqlExecuted = `INSERT INTO exams (subject_code, subject_name, exam_date, shift_time, max_marks, passing_marks, academic_sem)
VALUES ('${cleanCode}', '${newExam.subject_name}', '${exam_date}', '${newExam.shift_time}', ${newExam.max_marks}, ${newExam.passing_marks}, ${newExam.academic_sem});`;

  res.status(201).json({
    success: true,
    data: newExam,
    message: `Exam paper ${newExam.subject_code} (${newExam.subject_name}) scheduled.`,
    sqlExecuted,
    durationMs: Date.now() - startTime
  });
};

// PUT /api/exams/:exam_id
exports.updateExam = async (req, res) => {
  const examId = parseInt(req.params.exam_id, 10);
  const { subject_code, subject_name, exam_date, shift_time, max_marks, passing_marks } = req.body;
  const startTime = Date.now();

  const index = db.state.exams.findIndex(e => e.exam_id === examId);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Exam paper not found.' });
  }

  const current = db.state.exams[index];
  const updated = {
    ...current,
    subject_code: (subject_code || current.subject_code).toUpperCase(),
    subject_name: subject_name || current.subject_name,
    exam_date: exam_date || current.exam_date,
    shift_time: shift_time || current.shift_time,
    max_marks: max_marks !== undefined ? parseInt(max_marks, 10) : current.max_marks,
    passing_marks: passing_marks !== undefined ? parseInt(passing_marks, 10) : current.passing_marks
  };

  db.state.exams[index] = updated;
  const sqlExecuted = `UPDATE exams SET subject_code='${updated.subject_code}', subject_name='${updated.subject_name}', exam_date='${updated.exam_date}', shift_time='${updated.shift_time}' WHERE exam_id=${examId};`;

  res.json({
    success: true,
    data: updated,
    message: `Exam ${updated.subject_code} updated.`,
    sqlExecuted,
    durationMs: Date.now() - startTime
  });
};

// DELETE /api/exams/:exam_id
exports.deleteExam = async (req, res) => {
  const examId = parseInt(req.params.exam_id, 10);
  const startTime = Date.now();

  const index = db.state.exams.findIndex(e => e.exam_id === examId);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Exam paper not found.' });
  }

  const deleted = db.state.exams[index];
  db.state.exams.splice(index, 1);
  db.state.allocations = db.state.allocations.filter(a => a.exam_id !== examId);
  db.state.marks = db.state.marks.filter(m => m.exam_id !== examId);

  const sqlExecuted = `DELETE FROM exams WHERE exam_id=${examId}; -- Cascaded to seat_allocations & marks_moderation`;

  res.json({
    success: true,
    message: `Exam paper ${deleted.subject_code} deleted.`,
    sqlExecuted,
    durationMs: Date.now() - startTime
  });
};
