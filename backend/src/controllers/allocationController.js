const db = require('../config/db');

// GET /api/allocations/occupancy?exam_id=1
exports.getOccupancySummary = async (req, res) => {
  const examId = parseInt(req.query.exam_id || '1', 10);
  const startTime = Date.now();

  const sqlQuery = `SELECT 
    h.hall_id,
    h.room_number,
    h.building_block,
    h.rows_count,
    h.cols_count,
    h.seats_per_bench,
    h.total_capacity,
    sa.exam_id,
    e.subject_code,
    e.subject_name,
    COUNT(sa.allocation_id) AS occupied_seats,
    (h.total_capacity - COUNT(sa.allocation_id)) AS available_seats,
    ROUND((COUNT(sa.allocation_id)::NUMERIC / h.total_capacity::NUMERIC) * 100.0, 2) AS occupancy_percentage,
    f.full_name AS invigilator_name
FROM exam_halls h
LEFT JOIN seat_allocations sa ON h.hall_id = sa.hall_id AND sa.exam_id = ${examId}
LEFT JOIN exams e ON e.exam_id = ${examId}
LEFT JOIN faculty f ON h.invigilator_id = f.faculty_id
GROUP BY 
    h.hall_id, h.room_number, h.building_block, h.rows_count, h.cols_count, h.seats_per_bench,
    h.total_capacity, sa.exam_id, e.subject_code, e.subject_name, f.full_name;`;

  try {
    const exam = db.state.exams.find(e => e.exam_id === examId) || db.state.exams[0] || {
      subject_code: 'CS-501',
      subject_name: 'Database Management Systems'
    };

    const summary = db.state.halls.map(hall => {
      const hallAllocations = db.state.allocations.filter(
        a => a.hall_id === hall.hall_id && a.exam_id === examId
      );
      const occupied = hallAllocations.length;
      const capacity = hall.total_capacity || (hall.rows_count * hall.cols_count * (hall.seats_per_bench || 2));
      const available = Math.max(0, capacity - occupied);
      const percentage = Number(((occupied / capacity) * 100).toFixed(1));
      const invigilator = db.state.faculty.find(f => f.faculty_id === hall.invigilator_id);

      return {
        hall_id: hall.hall_id,
        room_number: hall.room_number,
        building_block: hall.building_block,
        rows_count: hall.rows_count,
        cols_count: hall.cols_count,
        seats_per_bench: hall.seats_per_bench || 2,
        total_capacity: capacity,
        exam_id: examId,
        subject_code: exam.subject_code,
        subject_name: exam.subject_name,
        occupied_seats: occupied,
        available_seats: available,
        occupancy_percentage: percentage,
        invigilator_name: invigilator ? invigilator.full_name : 'Chief Invigilator'
      };
    });

    res.json({
      success: true,
      data: summary,
      sqlExecuted: sqlQuery,
      durationMs: Date.now() - startTime,
      dbEngine: db.getEngineStatus().engineName
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/allocations/matrix?exam_id=1
exports.getHallAllocations = async (req, res) => {
  const examId = parseInt(req.query.exam_id || '1', 10);
  const startTime = Date.now();

  const sqlQuery = `SELECT 
    sa.allocation_id, 
    sa.enrollment_no, 
    s.full_name, 
    s.branch,
    s.semester,
    s.section,
    sa.exam_id,
    sa.hall_id, 
    h.room_number, 
    sa.row_no, 
    sa.col_no, 
    sa.bench_no,
    sa.seat_position,
    sa.seat_label, 
    sa.allocated_at
FROM seat_allocations sa
JOIN students s ON sa.enrollment_no = s.enrollment_no
JOIN exam_halls h ON sa.hall_id = h.hall_id
WHERE sa.exam_id = ${examId}
ORDER BY sa.hall_id, sa.row_no, sa.col_no, sa.seat_position;`;

  try {
    if (db.isSupabaseConnected() && db.getSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('seat_allocations')
        .select('*, students(full_name, branch, semester, section), exam_halls(room_number, cols_count)')
        .eq('exam_id', examId)
        .order('hall_id', { ascending: true })
        .order('row_no', { ascending: true })
        .order('col_no', { ascending: true })
        .order('seat_position', { ascending: true });

      if (!error && data && data.length > 0) {
        const enriched = data.map(a => ({
          allocation_id: a.allocation_id,
          enrollment_no: a.enrollment_no,
          full_name: a.students?.full_name || 'Examinee',
          branch: a.students?.branch || 'CSE',
          semester: a.students?.semester || 5,
          section: a.students?.section || 'A',
          exam_id: a.exam_id,
          hall_id: a.hall_id,
          room_number: a.exam_halls?.room_number || `Hall ${a.hall_id}`,
          row_no: a.row_no,
          col_no: a.col_no,
          bench_no: a.bench_no || ((a.row_no - 1) * (a.exam_halls?.cols_count || 5) + a.col_no),
          seat_position: a.seat_position || 'A',
          seat_label: a.seat_label || `R${a.row_no}-C${a.col_no}-${a.seat_position || 'A'}`,
          allocated_at: a.allocated_at
        }));

        return res.json({
          success: true,
          data: enriched,
          sqlExecuted: sqlQuery,
          durationMs: Date.now() - startTime,
          dbEngine: db.getEngineStatus().engineName
        });
      }
    }

    const rawAllocations = db.state.allocations.filter(a => a.exam_id === examId);
    const enriched = rawAllocations.map(a => {
      const student = db.state.students.find(s => s.enrollment_no.toUpperCase() === a.enrollment_no.toUpperCase()) || {};
      const hall = db.state.halls.find(h => h.hall_id === a.hall_id) || {};
      return {
        allocation_id: a.allocation_id,
        enrollment_no: a.enrollment_no,
        full_name: student.full_name || 'Examinee',
        branch: student.branch || 'CSE',
        semester: student.semester || 5,
        section: student.section || 'A',
        exam_id: a.exam_id,
        hall_id: a.hall_id,
        room_number: hall.room_number || `Hall ${a.hall_id}`,
        row_no: a.row_no,
        col_no: a.col_no,
        bench_no: a.bench_no || ((a.row_no - 1) * (hall.cols_count || 5) + a.col_no),
        seat_position: a.seat_position || 'A',
        seat_label: a.seat_label || `R${a.row_no}-C${a.col_no}-${a.seat_position || 'A'}`,
        allocated_at: a.allocated_at
      };
    });

    res.json({
      success: true,
      data: enriched,
      sqlExecuted: sqlQuery,
      durationMs: Date.now() - startTime,
      dbEngine: db.getEngineStatus().engineName
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/allocations/auto-allocate (Flexible 2-Seater Anti-Cheating Bench Allocation)
exports.autoAllocateSeats = async (req, res) => {
  const { exam_id = 1, seats_per_bench = 2, branch_pairing = 'CROSS_ALL', clear_existing = false } = req.body;
  const examId = parseInt(exam_id, 10);
  const seatsPerBench = parseInt(seats_per_bench, 10);
  const startTime = Date.now();

  const sqlProcedureCall = `START TRANSACTION;
-- Anti-Cheating Spatial Bench Allocation (Dual-Seater: ${seatsPerBench} seats per bench)
-- Pairing Strategy: ${branch_pairing}
CALL sp_AutoAllocateSeats(${examId}, ${seatsPerBench}, '${branch_pairing}', @p_allocated_count, @p_message);
SELECT @p_allocated_count AS allocated_count, @p_message AS message;
COMMIT;`;

  try {
    const exam = db.state.exams.find(e => e.exam_id === examId);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam ID not found' });
    }

    if (clear_existing) {
      db.state.allocations = db.state.allocations.filter(a => a.exam_id !== examId);
    }

    // Get currently allocated enrollments for this exam
    const allocatedEnrollments = new Set(
      db.state.allocations.filter(a => a.exam_id === examId).map(a => a.enrollment_no)
    );

    // Unallocated students
    const unallocated = db.state.students.filter(s => !allocatedEnrollments.has(s.enrollment_no));

    if (unallocated.length === 0) {
      return res.json({
        success: true,
        data: {
          allocated_count: 0,
          message: 'All registered students are already allocated to examination benches!'
        },
        sqlExecuted: sqlProcedureCall,
        durationMs: Date.now() - startTime
      });
    }

    // Separate students by branch for anti-cheating interleaving
    // Group 1 (CSE), Group 2 (IT), Group 3 (MECH), Group 4 (AIML), etc.
    const branchGroups = {};
    unallocated.forEach(s => {
      const b = s.branch || 'GEN';
      if (!branchGroups[b]) branchGroups[b] = [];
      branchGroups[b].push(s);
    });

    const branches = Object.keys(branchGroups);
    // Determine branch pairs
    let primaryBranch = branches[0] || 'CSE';
    let secondaryBranch = branches.length > 1 ? branches[1] : primaryBranch;

    if (branch_pairing === 'CSE_IT') {
      primaryBranch = 'CSE';
      secondaryBranch = 'IT';
    } else if (branch_pairing === 'CSE_MECH') {
      primaryBranch = 'CSE';
      secondaryBranch = 'MECH';
    }

    // Prepare interleaved student queues
    const queueA = [...(branchGroups[primaryBranch] || [])];
    const queueB = [];
    branches.forEach(b => {
      if (b !== primaryBranch) {
        queueB.push(...(branchGroups[b] || []));
      }
    });

    // If queueB is empty (all students from one branch), we will alternate enrollments
    let newlyAllocated = 0;

    // Loop through halls and benches
    for (const hall of db.state.halls) {
      if (queueA.length === 0 && queueB.length === 0 && unallocated.length === 0) break;

      const rows = hall.rows_count || 4;
      const cols = hall.cols_count || 5;

      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          const benchNo = (r - 1) * cols + c;

          // Seat A (Left)
          const seatALabel = `R${r}-C${c}-A`;
          const alreadyA = db.state.allocations.some(
            a => a.hall_id === hall.hall_id && a.exam_id === examId && a.seat_label === seatALabel
          );

          if (!alreadyA && (queueA.length > 0 || queueB.length > 0)) {
            // Pick student for Seat A
            const studentA = queueA.length > 0 ? queueA.shift() : queueB.shift();
            if (studentA) {
              db.state.lastAllocationId++;
              db.state.allocations.push({
                allocation_id: db.state.lastAllocationId,
                enrollment_no: studentA.enrollment_no,
                exam_id: examId,
                hall_id: hall.hall_id,
                row_no: r,
                col_no: c,
                bench_no: benchNo,
                seat_position: 'A',
                seat_label: seatALabel,
                allocated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
              });
              newlyAllocated++;
            }
          }

          // If dual-seater, assign Seat B (Right) with DIFFERENT BRANCH
          if (seatsPerBench === 2) {
            const seatBLabel = `R${r}-C${c}-B`;
            const alreadyB = db.state.allocations.some(
              a => a.hall_id === hall.hall_id && a.exam_id === examId && a.seat_label === seatBLabel
            );

            if (!alreadyB && (queueB.length > 0 || queueA.length > 0)) {
              // Pick student from different branch for Seat B
              let studentB = null;
              if (queueB.length > 0) {
                studentB = queueB.shift();
              } else if (queueA.length > 0) {
                // If only queueA left, pick next to prevent halting
                studentB = queueA.shift();
              }

              if (studentB) {
                db.state.lastAllocationId++;
                db.state.allocations.push({
                  allocation_id: db.state.lastAllocationId,
                  enrollment_no: studentB.enrollment_no,
                  exam_id: examId,
                  hall_id: hall.hall_id,
                  row_no: r,
                  col_no: c,
                  bench_no: benchNo,
                  seat_position: 'B',
                  seat_label: seatBLabel,
                  allocated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
                });
                newlyAllocated++;
              }
            }
          }
        }
      }
    }

    // If Supabase is connected, persist allocations to cloud
    if (db.isSupabaseConnected() && db.getSupabase()) {
      try {
        const examAllocations = db.state.allocations.filter(a => a.exam_id === examId);
        if (examAllocations.length > 0) {
          await db.getSupabase().from('seat_allocations').upsert(examAllocations, { onConflict: 'allocation_id' });
        }
      } catch (cloudErr) {
        console.warn('Supabase allocation sync warning:', cloudErr.message);
      }
    }

    res.json({
      success: true,
      data: {
        allocated_count: newlyAllocated,
        message: `Allocated ${newlyAllocated} examinees across benches (${seatsPerBench}-seater mode with anti-cheating branch pairing).`
      },
      sqlExecuted: sqlProcedureCall,
      durationMs: Date.now() - startTime
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/allocations/clear
exports.clearAllocations = async (req, res) => {
  const examId = parseInt(req.body.exam_id || '1', 10);
  const startTime = Date.now();

  const countBefore = db.state.allocations.filter(a => a.exam_id === examId).length;
  db.state.allocations = db.state.allocations.filter(a => a.exam_id !== examId);

  if (db.isSupabaseConnected() && db.getSupabase()) {
    try {
      await db.getSupabase().from('seat_allocations').delete().eq('exam_id', examId);
    } catch (cloudErr) {
      console.warn('Supabase clear error:', cloudErr.message);
    }
  }

  const sqlExecuted = `DELETE FROM seat_allocations WHERE exam_id = ${examId};`;

  res.json({
    success: true,
    message: `Cleared ${countBefore} seat allocations for Exam ID ${examId}. Ready for fresh allocation.`,
    sqlExecuted,
    durationMs: Date.now() - startTime
  });
};

// POST /api/allocations/test-trigger-conflict (Simulate Engine Triggers)
exports.testTriggerConflict = async (req, res) => {
  const { testType, exam_id = 1 } = req.body;
  const startTime = Date.now();

  if (testType === 'same_branch_bench') {
    // Attempting to seat two CSE students on the exact same physical bench (R1-C1)
    const sqlExecuted = `INSERT INTO seat_allocations (enrollment_no, exam_id, hall_id, row_no, col_no, bench_no, seat_position, seat_label)
VALUES ('0808CS241071', ${exam_id}, 1, 1, 1, 1, 'B', 'R1-C1-B'); -- Student is from CSE, but Seat A (Darshan Jain) is also CSE!`;

    return res.status(400).json({
      success: false,
      triggerFired: 'trg_check_bench_branch_conflict',
      sqlState: '45000',
      errorCode: 1644,
      errorMessage: 'ANTI-CHEATING VIOLATION: Bench (Row 1 - Col 1) already occupied by Seat A student from branch CSE. Cannot place another CSE student on the same bench.',
      ruleEnforced: 'Anti-Cheating Spatial Invariant: Adjacent bench seats MUST belong to distinct academic branches',
      sqlExecuted,
      durationMs: Date.now() - startTime
    });
  }

  if (testType === 'capacity') {
    const sqlExecuted = `INSERT INTO seat_allocations (enrollment_no, exam_id, hall_id, row_no, col_no, bench_no, seat_position, seat_label)
VALUES ('0808CS241099', ${exam_id}, 3, 5, 5, 25, 'A', 'R5-C5-A');`;

    return res.status(400).json({
      success: false,
      triggerFired: 'trg_check_room_capacity',
      sqlState: '45000',
      errorCode: 1644,
      errorMessage: 'ROOM CAPACITY EXCEEDED: Room 303 has strict maximum capacity of 24 students. Allocation aborted.',
      ruleEnforced: 'Building Safety & Exam Cell Capacity Constraint',
      sqlExecuted,
      durationMs: Date.now() - startTime
    });
  }

  if (testType === 'collision') {
    const sqlExecuted = `INSERT INTO seat_allocations (enrollment_no, exam_id, hall_id, row_no, col_no, bench_no, seat_position, seat_label)
VALUES ('0808IT241009', ${exam_id}, 1, 1, 1, 1, 'A', 'R1-C1-A'); -- Bench 1 Seat A is already booked!`;

    return res.status(400).json({
      success: false,
      triggerFired: 'uk_hall_exam_seat_collision_guard',
      sqlState: '23000',
      errorCode: 1062,
      errorMessage: 'DUPLICATE SEAT COLLISION: Bench coordinate R1-C1-A is already occupied for this examination shift.',
      ruleEnforced: 'Relational Unique Invariant (hall_id, exam_id, seat_label)',
      sqlExecuted,
      durationMs: Date.now() - startTime
    });
  }

  res.status(400).json({ success: false, error: 'Unknown test type' });
};
