const db = require('../config/db');

// GET /api/students
exports.getAllStudents = async (req, res) => {
  const { branch, semester, search } = req.query;
  const startTime = Date.now();

  try {
    let sqlExecuted = 'SELECT * FROM students';
    const conditions = [];

    if (branch && branch !== 'ALL') {
      conditions.push(`branch = '${branch.toUpperCase()}'`);
    }
    if (semester && semester !== 'ALL') {
      conditions.push(`semester = ${parseInt(semester, 10)}`);
    }
    if (search) {
      conditions.push(`(enrollment_no ILIKE '%${search}%' OR full_name ILIKE '%${search}%')`);
    }

    if (conditions.length > 0) {
      sqlExecuted += ' WHERE ' + conditions.join(' AND ');
    }
    sqlExecuted += ' ORDER BY branch ASC, enrollment_no ASC;';

    // 1. Supabase Cloud Query (Direct live database access)
    if (db.isSupabaseConnected() && db.getSupabase()) {
      let query = db.getSupabase().from('students').select('*');
      if (branch && branch !== 'ALL') query = query.eq('branch', branch.toUpperCase());
      if (semester && semester !== 'ALL') query = query.eq('semester', parseInt(semester, 10));
      if (search) query = query.or(`enrollment_no.ilike.%${search}%,full_name.ilike.%${search}%`);

      const { data, error } = await query.order('branch', { ascending: true }).order('enrollment_no', { ascending: true });
      if (!error && data) {
        // Keep in-memory state synchronized if fetching full list
        if (!branch && !semester && !search) {
          db.state.students = data;
        }
        return res.json({
          success: true,
          data,
          total: data.length,
          sqlExecuted,
          durationMs: Date.now() - startTime,
          dbEngine: db.getEngineStatus().engineName
        });
      }
    }

    // 2. Local In-Memory Fallback
    let filtered = [...db.state.students];
    if (branch && branch !== 'ALL') {
      filtered = filtered.filter(s => s.branch.toUpperCase() === branch.toUpperCase());
    }
    if (semester && semester !== 'ALL') {
      filtered = filtered.filter(s => s.semester === parseInt(semester, 10));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s => 
        s.enrollment_no.toLowerCase().includes(q) || 
        s.full_name.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => a.branch.localeCompare(b.branch) || a.enrollment_no.localeCompare(b.enrollment_no));

    res.json({
      success: true,
      data: filtered,
      total: filtered.length,
      sqlExecuted,
      durationMs: Date.now() - startTime,
      dbEngine: db.getEngineStatus().engineName
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/students (Create Student)
exports.createStudent = async (req, res) => {
  const { enrollment_no, full_name, branch, semester, section, email, phone } = req.body;
  const startTime = Date.now();

  if (!enrollment_no || !full_name || !branch) {
    return res.status(400).json({
      success: false,
      error: 'Enrollment No, Full Name, and Branch are required fields.'
    });
  }

  const cleanEnrollment = enrollment_no.trim().toUpperCase();
  const cleanName = full_name.trim();
  const cleanBranch = branch.trim().toUpperCase();
  const cleanSem = parseInt(semester || 5, 10);
  const cleanSec = (section || 'A').trim().toUpperCase();
  const cleanEmail = (email || `${cleanEnrollment.toLowerCase()}@university.edu`).trim();
  const cleanPhone = (phone || '9876500000').trim();

  const sqlExecuted = `INSERT INTO students (enrollment_no, full_name, branch, semester, section, email, phone)
VALUES ('${cleanEnrollment}', '${cleanName}', '${cleanBranch}', ${cleanSem}, '${cleanSec}', '${cleanEmail}', '${cleanPhone}');`;

  try {
    const newStudent = {
      enrollment_no: cleanEnrollment,
      full_name: cleanName,
      branch: cleanBranch,
      semester: cleanSem,
      section: cleanSec,
      email: cleanEmail,
      phone: cleanPhone,
      academic_year: '2026-2027',
      created_at: new Date().toISOString()
    };

    // If Supabase Connected
    if (db.isSupabaseConnected() && db.getSupabase()) {
      // Check duplicate in Supabase
      const { data: existingSupa } = await db.getSupabase()
        .from('students')
        .select('enrollment_no')
        .ilike('enrollment_no', cleanEnrollment)
        .maybeSingle();

      if (existingSupa) {
        return res.status(400).json({
          success: false,
          error: `Integrity Error: Student with Enrollment No ${cleanEnrollment} already exists in Supabase.`,
          sqlExecuted
        });
      }

      const { data: supaInserted, error: insertErr } = await db.getSupabase()
        .from('students')
        .insert([newStudent])
        .select();

      if (insertErr) {
        return res.status(400).json({
          success: false,
          error: `Supabase Error: ${insertErr.message}`,
          sqlExecuted
        });
      }

      const savedStudent = (supaInserted && supaInserted[0]) || newStudent;

      // Sync local state
      const localIdx = db.state.students.findIndex(s => s.enrollment_no.toUpperCase() === cleanEnrollment);
      if (localIdx >= 0) {
        db.state.students[localIdx] = savedStudent;
      } else {
        db.state.students.push(savedStudent);
      }

      return res.status(201).json({
        success: true,
        data: savedStudent,
        message: `Examinee ${savedStudent.full_name} (${savedStudent.branch}) registered successfully in Supabase!`,
        sqlExecuted,
        durationMs: Date.now() - startTime
      });
    }

    // Local in-memory check
    const exists = db.state.students.find(s => s.enrollment_no.toUpperCase() === cleanEnrollment);
    if (exists) {
      return res.status(400).json({
        success: false,
        error: `Integrity Error: Student with Enrollment No ${cleanEnrollment} already exists in the database.`,
        sqlExecuted
      });
    }

    db.state.students.push(newStudent);

    res.status(201).json({
      success: true,
      data: newStudent,
      message: `Student ${newStudent.full_name} (${newStudent.branch}) registered successfully. Ready for exam seating allocation!`,
      sqlExecuted,
      durationMs: Date.now() - startTime
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, sqlExecuted });
  }
};

// PUT /api/students/:enrollment_no (Update Student)
exports.updateStudent = async (req, res) => {
  const rawEnrollment = req.params.enrollment_no || '';
  const cleanEnrollment = decodeURIComponent(rawEnrollment).trim().toUpperCase();
  const { full_name, branch, semester, section, email, phone } = req.body;
  const startTime = Date.now();

  const updateFields = {};
  if (full_name !== undefined) updateFields.full_name = full_name.trim();
  if (branch !== undefined) updateFields.branch = branch.trim().toUpperCase();
  if (semester !== undefined) updateFields.semester = parseInt(semester, 10);
  if (section !== undefined) updateFields.section = section.trim().toUpperCase();
  if (email !== undefined) updateFields.email = email.trim();
  if (phone !== undefined) updateFields.phone = phone.trim();

  const sqlSet = Object.entries(updateFields)
    .map(([k, v]) => typeof v === 'number' ? `${k} = ${v}` : `${k} = '${v}'`)
    .join(', ');

  const sqlExecuted = `UPDATE students 
SET ${sqlSet || 'full_name = full_name'}
WHERE enrollment_no = '${cleanEnrollment}';`;

  try {
    // 1. Supabase Cloud Update
    if (db.isSupabaseConnected() && db.getSupabase()) {
      // Find the student first in Supabase
      const { data: supaStudent, error: findError } = await db.getSupabase()
        .from('students')
        .select('*')
        .ilike('enrollment_no', cleanEnrollment)
        .maybeSingle();

      const localIdx = db.state.students.findIndex(s => s.enrollment_no.toUpperCase() === cleanEnrollment);

      if (!supaStudent && localIdx === -1) {
        return res.status(404).json({
          success: false,
          error: `Student with enrollment number '${cleanEnrollment}' does not exist in the database.`,
          sqlExecuted
        });
      }

      // Perform update on Supabase
      const { data: updatedRows, error: updateError } = await db.getSupabase()
        .from('students')
        .update(updateFields)
        .ilike('enrollment_no', cleanEnrollment)
        .select();

      if (updateError) {
        return res.status(400).json({
          success: false,
          error: `Supabase Update Failed: ${updateError.message}`,
          sqlExecuted
        });
      }

      const updatedRecord = (updatedRows && updatedRows[0]) || {
        ...(supaStudent || db.state.students[localIdx]),
        ...updateFields
      };

      // Sync into local state
      if (localIdx !== -1) {
        db.state.students[localIdx] = updatedRecord;
      } else {
        db.state.students.push(updatedRecord);
      }

      return res.json({
        success: true,
        data: updatedRecord,
        message: `Examinee ${cleanEnrollment} profile successfully updated in Supabase.`,
        sqlExecuted,
        durationMs: Date.now() - startTime
      });
    }

    // 2. Local In-Memory Update
    const studentIndex = db.state.students.findIndex(s => s.enrollment_no.toUpperCase() === cleanEnrollment);
    if (studentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Student with enrollment number '${cleanEnrollment}' does not exist in the database.`,
        sqlExecuted
      });
    }

    const updated = {
      ...db.state.students[studentIndex],
      ...updateFields
    };

    db.state.students[studentIndex] = updated;

    res.json({
      success: true,
      data: updated,
      message: `Examinee ${cleanEnrollment} profile updated successfully.`,
      sqlExecuted,
      durationMs: Date.now() - startTime
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, sqlExecuted });
  }
};

// DELETE /api/students/:enrollment_no (Delete Student & Cascade)
exports.deleteStudent = async (req, res) => {
  const rawEnrollment = req.params.enrollment_no || '';
  const cleanEnrollment = decodeURIComponent(rawEnrollment).trim().toUpperCase();
  const startTime = Date.now();

  const sqlExecuted = `DELETE FROM students WHERE enrollment_no = '${cleanEnrollment}'; -- Triggers CASCADE on seat_allocations and marks_moderation`;

  try {
    let deletedName = cleanEnrollment;

    // 1. Supabase Cloud Delete
    if (db.isSupabaseConnected() && db.getSupabase()) {
      const { data: supaDeleted, error: delError } = await db.getSupabase()
        .from('students')
        .delete()
        .ilike('enrollment_no', cleanEnrollment)
        .select();

      if (delError) {
        return res.status(400).json({
          success: false,
          error: `Supabase Delete Failed: ${delError.message}`,
          sqlExecuted
        });
      }

      if (supaDeleted && supaDeleted.length > 0) {
        deletedName = supaDeleted[0].full_name || cleanEnrollment;
      }

      // Cascade delete in local state
      db.state.students = db.state.students.filter(s => s.enrollment_no.toUpperCase() !== cleanEnrollment);
      db.state.allocations = db.state.allocations.filter(a => a.enrollment_no.toUpperCase() !== cleanEnrollment);
      db.state.marks = db.state.marks.filter(m => m.enrollment_no.toUpperCase() !== cleanEnrollment);

      return res.json({
        success: true,
        message: `Examinee ${deletedName} (${cleanEnrollment}) deleted from Supabase. All seat allocations and moderation marks were cascade removed.`,
        sqlExecuted,
        durationMs: Date.now() - startTime
      });
    }

    // 2. Local In-Memory Delete
    const studentIndex = db.state.students.findIndex(s => s.enrollment_no.toUpperCase() === cleanEnrollment);
    if (studentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: `Student with enrollment number '${cleanEnrollment}' does not exist.`,
        sqlExecuted
      });
    }

    const deletedStudent = db.state.students[studentIndex];
    deletedName = deletedStudent.full_name;

    db.state.students.splice(studentIndex, 1);
    db.state.allocations = db.state.allocations.filter(a => a.enrollment_no.toUpperCase() !== cleanEnrollment);
    db.state.marks = db.state.marks.filter(m => m.enrollment_no.toUpperCase() !== cleanEnrollment);

    res.json({
      success: true,
      message: `Examinee ${deletedName} (${cleanEnrollment}) deleted. All seat allocations were cascade removed.`,
      sqlExecuted,
      durationMs: Date.now() - startTime
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, sqlExecuted });
  }
};

// POST /api/students/import-sample-batch
exports.importSampleBatch = async (req, res) => {
  const startTime = Date.now();
  const sampleBatch = [
    { enrollment_no: '0808CS241099', full_name: 'Harsh Vardhan', branch: 'CSE', semester: 5, section: 'T3', email: 'harsh.v@university.edu', phone: '9876510001', academic_year: '2026-2027' },
    { enrollment_no: '0808IT241021', full_name: 'Sneha Kulkarni', branch: 'IT', semester: 5, section: 'A', email: 'sneha.k@university.edu', phone: '9876510002', academic_year: '2026-2027' },
    { enrollment_no: '0808ME241015', full_name: 'Raghav Singhal', branch: 'MECH', semester: 5, section: 'M1', email: 'raghav.s@university.edu', phone: '9876510003', academic_year: '2026-2027' },
    { enrollment_no: '0808AI241012', full_name: 'Ananya Deshmukh', branch: 'AIML', semester: 5, section: 'AI', email: 'ananya.d@university.edu', phone: '9876510004', academic_year: '2026-2027' }
  ];

  let addedCount = 0;

  try {
    if (db.isSupabaseConnected() && db.getSupabase()) {
      for (const s of sampleBatch) {
        const { data: existing } = await db.getSupabase().from('students').select('enrollment_no').ilike('enrollment_no', s.enrollment_no).maybeSingle();
        if (!existing) {
          await db.getSupabase().from('students').insert([s]);
          addedCount++;
        }
        // Local state sync
        if (!db.state.students.some(loc => loc.enrollment_no.toUpperCase() === s.enrollment_no.toUpperCase())) {
          db.state.students.push({ ...s, created_at: new Date().toISOString() });
        }
      }
    } else {
      sampleBatch.forEach(s => {
        if (!db.state.students.some(existing => existing.enrollment_no.toUpperCase() === s.enrollment_no.toUpperCase())) {
          db.state.students.push({ ...s, created_at: new Date().toISOString() });
          addedCount++;
        }
      });
    }

    const sqlExecuted = `INSERT INTO students (enrollment_no, full_name, branch, semester, section, email, phone) VALUES
('0808CS241099', 'Harsh Vardhan', 'CSE', 5, 'T3', 'harsh.v@university.edu', '9876510001'),
('0808IT241021', 'Sneha Kulkarni', 'IT', 5, 'A', 'sneha.k@university.edu', '9876510002'),
('0808ME241015', 'Raghav Singhal', 'MECH', 5, 'M1', 'raghav.s@university.edu', '9876510003'),
('0808AI241012', 'Ananya Deshmukh', 'AIML', 5, 'AI', 'ananya.d@university.edu', '9876510004');`;

    res.json({
      success: true,
      addedCount,
      message: `Imported ${addedCount} sample examinees across CSE, IT, MECH, and AIML branches.`,
      sqlExecuted,
      durationMs: Date.now() - startTime
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
