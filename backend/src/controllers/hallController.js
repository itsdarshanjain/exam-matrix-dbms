const db = require('../config/db');

// GET /api/halls
exports.getAllHalls = async (req, res) => {
  const startTime = Date.now();
  const sqlExecuted = `SELECT 
    h.hall_id, h.room_number, h.building_block, h.rows_count, h.cols_count, 
    h.seats_per_bench, h.total_capacity, h.invigilator_id, f.full_name AS invigilator_name
FROM exam_halls h
LEFT JOIN faculty f ON h.invigilator_id = f.faculty_id
ORDER BY h.hall_id ASC;`;

  try {
    const enriched = db.state.halls.map(h => {
      const invig = db.state.faculty.find(f => f.faculty_id === h.invigilator_id);
      return {
        ...h,
        invigilator_name: invig ? invig.full_name : 'Unassigned'
      };
    });

    res.json({
      success: true,
      data: enriched,
      sqlExecuted,
      durationMs: Date.now() - startTime,
      dbEngine: db.getEngineStatus().engineName
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/halls (Create Exam Hall)
exports.createHall = async (req, res) => {
  const { room_number, building_block, rows_count, cols_count, seats_per_bench, invigilator_id } = req.body;
  const startTime = Date.now();

  if (!room_number || !building_block) {
    return res.status(400).json({
      success: false,
      error: 'Room Number and Building Block are required.'
    });
  }

  const rows = parseInt(rows_count || 4, 10);
  const cols = parseInt(cols_count || 5, 10);
  const spb = parseInt(seats_per_bench || 2, 10);
  const totalCapacity = rows * cols * spb;

  const sqlExecuted = `INSERT INTO exam_halls (room_number, building_block, rows_count, cols_count, seats_per_bench, total_capacity, invigilator_id)
VALUES ('${room_number.trim()}', '${building_block.trim()}', ${rows}, ${cols}, ${spb}, ${totalCapacity}, ${invigilator_id || 'NULL'});`;

  try {
    const exists = db.state.halls.find(h => h.room_number.toLowerCase() === room_number.trim().toLowerCase());
    if (exists) {
      return res.status(400).json({
        success: false,
        error: `Hall ${room_number} already exists.`,
        sqlExecuted
      });
    }

    db.state.lastHallId++;
    const newHall = {
      hall_id: db.state.lastHallId,
      room_number: room_number.trim(),
      building_block: building_block.trim(),
      rows_count: rows,
      cols_count: cols,
      seats_per_bench: spb,
      total_capacity: totalCapacity,
      invigilator_id: invigilator_id ? parseInt(invigilator_id, 10) : null
    };

    db.state.halls.push(newHall);

    res.status(201).json({
      success: true,
      data: newHall,
      message: `Examination Hall ${newHall.room_number} (${newHall.total_capacity} seats) created successfully.`,
      sqlExecuted,
      durationMs: Date.now() - startTime
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, sqlExecuted });
  }
};

// PUT /api/halls/:hall_id
exports.updateHall = async (req, res) => {
  const hallId = parseInt(req.params.hall_id, 10);
  const { room_number, building_block, rows_count, cols_count, seats_per_bench, invigilator_id } = req.body;
  const startTime = Date.now();

  try {
    const hallIndex = db.state.halls.findIndex(h => h.hall_id === hallId);
    if (hallIndex === -1) {
      return res.status(404).json({ success: false, error: 'Hall not found.' });
    }

    const current = db.state.halls[hallIndex];
    const rows = rows_count !== undefined ? parseInt(rows_count, 10) : current.rows_count;
    const cols = cols_count !== undefined ? parseInt(cols_count, 10) : current.cols_count;
    const spb = seats_per_bench !== undefined ? parseInt(seats_per_bench, 10) : current.seats_per_bench;
    const totalCapacity = rows * cols * spb;

    const updated = {
      ...current,
      room_number: room_number || current.room_number,
      building_block: building_block || current.building_block,
      rows_count: rows,
      cols_count: cols,
      seats_per_bench: spb,
      total_capacity: totalCapacity,
      invigilator_id: invigilator_id !== undefined ? (invigilator_id ? parseInt(invigilator_id, 10) : null) : current.invigilator_id
    };

    db.state.halls[hallIndex] = updated;

    const sqlExecuted = `UPDATE exam_halls 
SET room_number = '${updated.room_number}', building_block = '${updated.building_block}', rows_count = ${rows}, cols_count = ${cols}, seats_per_bench = ${spb}, total_capacity = ${totalCapacity}, invigilator_id = ${updated.invigilator_id || 'NULL'}
WHERE hall_id = ${hallId};`;

    res.json({
      success: true,
      data: updated,
      message: `Hall ${updated.room_number} updated.`,
      sqlExecuted,
      durationMs: Date.now() - startTime
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/halls/:hall_id
exports.deleteHall = async (req, res) => {
  const hallId = parseInt(req.params.hall_id, 10);
  const startTime = Date.now();

  try {
    const hallIndex = db.state.halls.findIndex(h => h.hall_id === hallId);
    if (hallIndex === -1) {
      return res.status(404).json({ success: false, error: 'Hall not found.' });
    }

    const deleted = db.state.halls[hallIndex];
    db.state.halls.splice(hallIndex, 1);
    // Cascade remove allocations in this hall
    db.state.allocations = db.state.allocations.filter(a => a.hall_id !== hallId);

    const sqlExecuted = `DELETE FROM exam_halls WHERE hall_id = ${hallId}; -- Cascades seat allocations`;

    res.json({
      success: true,
      message: `Hall ${deleted.room_number} deleted successfully.`,
      sqlExecuted,
      durationMs: Date.now() - startTime
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
