const express = require('express');
const router = express.Router();
const db = require('../config/db');

const studentController = require('../controllers/studentController');
const hallController = require('../controllers/hallController');
const examController = require('../controllers/examController');
const allocationController = require('../controllers/allocationController');
const hallTicketController = require('../controllers/hallTicketController');
const moderationController = require('../controllers/moderationController');
const databaseController = require('../controllers/databaseController');
const analyticsController = require('../controllers/analyticsController');

// 1. Students CRUD Routes
router.get('/students', studentController.getAllStudents);
router.post('/students', studentController.createStudent);
router.put('/students/:enrollment_no', studentController.updateStudent);
router.delete('/students/:enrollment_no', studentController.deleteStudent);
router.post('/students/import-sample', studentController.importSampleBatch);

// 2. Exam Halls / Rooms CRUD Routes
router.get('/halls', hallController.getAllHalls);
router.post('/halls', hallController.createHall);
router.put('/halls/:hall_id', hallController.updateHall);
router.delete('/halls/:hall_id', hallController.deleteHall);

// 3. Exams & Schedule CRUD Routes
router.get('/exams', examController.getAllExams);
router.post('/exams', examController.createExam);
router.put('/exams/:exam_id', examController.updateExam);
router.delete('/exams/:exam_id', examController.deleteExam);

// 4. Seating Allocation & Matrix Routes
router.get('/allocations/occupancy', allocationController.getOccupancySummary);
router.get('/allocations/matrix', allocationController.getHallAllocations);
router.post('/allocations/auto-allocate', allocationController.autoAllocateSeats);
router.post('/allocations/clear', allocationController.clearAllocations);
router.post('/allocations/test-trigger-conflict', allocationController.testTriggerConflict);

// 5. Hall Ticket & Admit Card Routes
router.get('/hall-ticket/:enrollment_no', hallTicketController.getHallTicket);

// 6. Moderation & Audit Log Routes
router.get('/moderation/marks', moderationController.getMarks);
router.post('/moderation/auto-moderate', moderationController.autoModerateBorderline);
router.put('/moderation/update', moderationController.updateMarksManual);
router.get('/moderation/audit-log', moderationController.getAuditLog);

// 7. Database Engine & Supabase Routes
router.post('/database/execute-sql', databaseController.executeRawSql);
router.get('/database/status', databaseController.getDatabaseStatus);
router.post('/database/config', databaseController.configureSupabase);
router.post('/database/sync-supabase', databaseController.syncToSupabase);

// 8. Relational Analytics & System Reset
router.get('/analytics/dashboard-stats', analyticsController.getDashboardStats);
router.get('/analytics/grade-distribution', analyticsController.getGradeDistribution);
router.get('/analytics/viva-query/:query_key', analyticsController.runVivaQuery);
router.get('/analytics/status', analyticsController.getSystemStatus);
router.post('/analytics/reset', analyticsController.resetDatabase);

// 9. Faculty List
router.get('/faculty', (req, res) => {
  res.json({
    success: true,
    data: db.state.faculty,
    sqlExecuted: 'SELECT * FROM faculty ORDER BY faculty_id ASC;'
  });
});

module.exports = router;
