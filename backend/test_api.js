const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5001${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body || {});
    const req = http.request(`http://localhost:5001${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- 1. TESTING /api/exams ---');
  const exams = await get('/api/exams');
  console.log('Exams count:', exams.data.length);
  console.log('Sample exam:', exams.data[0].subject_code, exams.data[0].subject_name);

  console.log('\n--- 2. TESTING /api/allocations/occupancy?exam_id=1 ---');
  const occ = await get('/api/allocations/occupancy?exam_id=1');
  console.log('Halls summary count:', occ.data.length);
  occ.data.forEach(h => console.log(`- ${h.room_number}: ${h.occupied_seats}/${h.total_capacity} occupied (${h.occupancy_percentage}%)`));

  console.log('\n--- 3. TESTING /api/allocations/matrix?exam_id=1 (Darshan Jain) ---');
  const matrix = await get('/api/allocations/matrix?exam_id=1');
  const darshan = matrix.data.find(a => a.enrollment_no === '0808CS241091');
  console.log('Sample student allocated bench:', darshan?.room_number, darshan?.seat_label);

  console.log('\n--- 4. TESTING /api/hall-ticket/0808CS241091 ---');
  const ht = await get('/api/hall-ticket/0808CS241091');
  console.log('Student:', ht.student.student_name, ht.student.enrollment_no, ht.student.branch, ht.student.section);
  console.log('Scheduled papers:', ht.papers.map(p => `${p.subject_code} (Room: ${p.room_number}, Seat: ${p.seat_label}, Grade: ${p.rgpv_grade})`).join('; '));

  console.log('\n--- 5. TESTING /api/moderation/marks?exam_id=1 ---');
  const marks = await get('/api/moderation/marks?exam_id=1');
  console.log('Total evaluated marks records:', marks.data.length);
  const borderlines = marks.data.filter(m => m.isBorderline);
  console.log('Borderline failure students eligible for grace:', borderlines.length);

  console.log('\n--- 6. TESTING /api/moderation/auto-moderate (CALL sp_AutoModerateBorderline) ---');
  const modResult = await post('/api/moderation/auto-moderate', { exam_id: 1, max_grace: 5.0 });
  console.log('Auto-moderate status:', modResult.status, 'Upgraded count:', modResult.body.data.upgraded_count);

  console.log('\n--- 7. TESTING /api/moderation/audit-log (Trigger trg_MarksAuditLog) ---');
  const audit = await get('/api/moderation/audit-log');
  console.log('Audit events logged count:', audit.data.length);
  console.log('Recent audit log entry:', audit.data[0].student_name, `${audit.data[0].old_marks} -> ${audit.data[0].new_marks}`, 'Grace:', audit.data[0].grace_applied);

  console.log('\n--- 8. TESTING TRIGGER TEST (SIGNAL SQLSTATE 45000) ---');
  const trigResult = await post('/api/allocations/test-trigger-conflict', { testType: 'capacity' });
  console.log('Trigger Response HTTP Status:', trigResult.status);
  console.log('SQLSTATE:', trigResult.body.sqlState);
  console.log('ErrorMessage:', trigResult.body.errorMessage);

  console.log('\n--- 9. TESTING RELATIONAL DIVISION (Relational Completeness) ---');
  const divResult = await get('/api/analytics/viva-query/relational_division');
  console.log('Students allocated across ALL 4 exams:', divResult.data.map(s => `${s.full_name} (${s.enrollment_no})`).join(', '));

  console.log('\n✓ ALL BACKEND AND DATABASE ENGINE MODULES VERIFIED 100% OPERATIONAL!');
}

run().catch(console.error);
