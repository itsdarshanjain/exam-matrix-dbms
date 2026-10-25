const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Support loading .env from backend folder or project root
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config();

// Supabase configuration
let supabaseUrl = process.env.SUPABASE_URL || '';
let supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';
let supabase = null;
let isSupabaseConnected = false;

async function syncFromSupabase() {
  if (!supabase || !isSupabaseConnected) return false;
  try {
    const [studentsRes, facultyRes, examsRes, hallsRes, allocsRes, marksRes, auditRes] = await Promise.all([
      supabase.from('students').select('*').order('enrollment_no', { ascending: true }),
      supabase.from('faculty').select('*').order('faculty_id', { ascending: true }),
      supabase.from('exams').select('*').order('exam_id', { ascending: true }),
      supabase.from('exam_halls').select('*').order('hall_id', { ascending: true }),
      supabase.from('seat_allocations').select('*').order('allocation_id', { ascending: true }),
      supabase.from('marks_moderation').select('*').order('moderation_id', { ascending: true }),
      supabase.from('marks_audit_log').select('*').order('action_timestamp', { ascending: false })
    ]);

    if (!studentsRes.error && studentsRes.data && studentsRes.data.length > 0) {
      state.students = studentsRes.data;
    }
    if (!facultyRes.error && facultyRes.data && facultyRes.data.length > 0) {
      state.faculty = facultyRes.data;
      state.lastFacultyId = Math.max(...facultyRes.data.map(f => f.faculty_id || 0), 5);
    }
    if (!examsRes.error && examsRes.data && examsRes.data.length > 0) {
      state.exams = examsRes.data;
      state.lastExamId = Math.max(...examsRes.data.map(e => e.exam_id || 0), 4);
    }
    if (!hallsRes.error && hallsRes.data && hallsRes.data.length > 0) {
      state.halls = hallsRes.data;
      state.lastHallId = Math.max(...hallsRes.data.map(h => h.hall_id || 0), 3);
    }
    if (!allocsRes.error && allocsRes.data) {
      state.allocations = allocsRes.data;
      state.lastAllocationId = allocsRes.data.length > 0 ? Math.max(...allocsRes.data.map(a => a.allocation_id || 0)) : 0;
    }
    if (!marksRes.error && marksRes.data) {
      state.marks = marksRes.data;
      state.lastModerationId = marksRes.data.length > 0 ? Math.max(...marksRes.data.map(m => m.moderation_id || 0)) : 0;
    }
    if (!auditRes.error && auditRes.data) {
      state.auditLog = auditRes.data;
      state.lastAuditId = auditRes.data.length > 0 ? Math.max(...auditRes.data.map(a => a.log_id || 0)) : 0;
    }
    console.log(`✓ Synchronized with Supabase: ${state.students.length} students loaded`);
    return true;
  } catch (err) {
    console.warn('Supabase sync warning:', err.message);
    return false;
  }
}

function initSupabase(url, key) {
  if (url && key) {
    try {
      supabase = createClient(url, key);
      supabaseUrl = url;
      supabaseKey = key;
      isSupabaseConnected = true;
      console.log('✓ Supabase Client initialized with URL:', url);
      syncFromSupabase().catch(e => console.warn('Supabase initial sync error:', e.message));
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e.message);
      isSupabaseConnected = false;
    }
  } else {
    isSupabaseConnected = false;
  }
}

if (supabaseUrl && supabaseKey) {
  initSupabase(supabaseUrl, supabaseKey);
}


// Initial Multi-Branch Students Data (36 Students across 5 Departments)
const initialStudents = [
  // Computer Science Engineering (CSE)
  { enrollment_no: '0808CS241091', full_name: 'Darshan Jain', branch: 'CSE', semester: 5, section: 'T3', email: 'darshan.jain@university.edu', phone: '9826191091' },
  { enrollment_no: '0808CS241070', full_name: 'Aarav Patel', branch: 'CSE', semester: 5, section: 'T3', email: 'aarav.patel@university.edu', phone: '9876500001' },
  { enrollment_no: '0808CS241071', full_name: 'Aditi Joshi', branch: 'CSE', semester: 5, section: 'T3', email: 'aditi.joshi@university.edu', phone: '9876500002' },
  { enrollment_no: '0808CS241072', full_name: 'Aman Sharma', branch: 'CSE', semester: 5, section: 'T3', email: 'aman.sharma@university.edu', phone: '9876500003' },
  { enrollment_no: '0808CS241075', full_name: 'Ananya Gupta', branch: 'CSE', semester: 5, section: 'T3', email: 'ananya.gupta@university.edu', phone: '9876500004' },
  { enrollment_no: '0808CS241078', full_name: 'Aniket Verma', branch: 'CSE', semester: 5, section: 'T3', email: 'aniket.verma@university.edu', phone: '9876500005' },
  { enrollment_no: '0808CS241080', full_name: 'Anushka Chouhan', branch: 'CSE', semester: 5, section: 'T3', email: 'anushka.c@university.edu', phone: '9876500006' },
  { enrollment_no: '0808CS241082', full_name: 'Aryan Sen', branch: 'CSE', semester: 5, section: 'T3', email: 'aryan.sen@university.edu', phone: '9876500007' },
  { enrollment_no: '0808CS241085', full_name: 'Ayush Rathore', branch: 'CSE', semester: 5, section: 'T3', email: 'ayush.r@university.edu', phone: '9876500008' },
  { enrollment_no: '0808CS241088', full_name: 'Bhavya Tiwari', branch: 'CSE', semester: 5, section: 'T3', email: 'bhavya.t@university.edu', phone: '9876500009' },

  // Information Technology (IT)
  { enrollment_no: '0808IT241001', full_name: 'Ishaan Malhotra', branch: 'IT', semester: 5, section: 'A', email: 'ishaan.m@university.edu', phone: '9876500011' },
  { enrollment_no: '0808IT241002', full_name: 'Kavya Nair', branch: 'IT', semester: 5, section: 'A', email: 'kavya.n@university.edu', phone: '9876500012' },
  { enrollment_no: '0808IT241003', full_name: 'Manav Singhania', branch: 'IT', semester: 5, section: 'A', email: 'manav.s@university.edu', phone: '9876500013' },
  { enrollment_no: '0808IT241004', full_name: 'Niharika Roy', branch: 'IT', semester: 5, section: 'A', email: 'niharika.r@university.edu', phone: '9876500014' },
  { enrollment_no: '0808IT241005', full_name: 'Pooja Bhatt', branch: 'IT', semester: 5, section: 'A', email: 'pooja.b@university.edu', phone: '9876500015' },
  { enrollment_no: '0808IT241006', full_name: 'Prateek Deshmukh', branch: 'IT', semester: 5, section: 'A', email: 'prateek.d@university.edu', phone: '9876500016' },
  { enrollment_no: '0808IT241007', full_name: 'Riddhi Agarwal', branch: 'IT', semester: 5, section: 'A', email: 'riddhi.a@university.edu', phone: '9876500017' },
  { enrollment_no: '0808IT241008', full_name: 'Rishabh Mehta', branch: 'IT', semester: 5, section: 'A', email: 'rishabh.m@university.edu', phone: '9876500018' },
  { enrollment_no: '0808IT241009', full_name: 'Sanya Kapoor', branch: 'IT', semester: 5, section: 'A', email: 'sanya.k@university.edu', phone: '9876500019' },
  { enrollment_no: '0808IT241010', full_name: 'Shreyas Iyer', branch: 'IT', semester: 5, section: 'A', email: 'shreyas.i@university.edu', phone: '9876500020' },

  // Mechanical Engineering (MECH)
  { enrollment_no: '0808ME241001', full_name: 'Tanmay Bakshi', branch: 'MECH', semester: 5, section: 'M1', email: 'tanmay.b@university.edu', phone: '9876500021' },
  { enrollment_no: '0808ME241002', full_name: 'Umesh Jadhav', branch: 'MECH', semester: 5, section: 'M1', email: 'umesh.j@university.edu', phone: '9876500022' },
  { enrollment_no: '0808ME241003', full_name: 'Vaibhav Kulkarni', branch: 'MECH', semester: 5, section: 'M1', email: 'vaibhav.k@university.edu', phone: '9876500023' },
  { enrollment_no: '0808ME241004', full_name: 'Varun Dhawan', branch: 'MECH', semester: 5, section: 'M1', email: 'varun.d@university.edu', phone: '9876500024' },
  { enrollment_no: '0808ME241005', full_name: 'Yashvardhan Rao', branch: 'MECH', semester: 5, section: 'M1', email: 'yash.r@university.edu', phone: '9876500025' },
  { enrollment_no: '0808ME241006', full_name: 'Rohit Sharma', branch: 'MECH', semester: 5, section: 'M1', email: 'rohit.s@university.edu', phone: '9876500029' },

  // Artificial Intelligence & Data Science (AIML)
  { enrollment_no: '0808AI241001', full_name: 'Zoya Siddiqui', branch: 'AIML', semester: 5, section: 'AI', email: 'zoya.s@university.edu', phone: '9876500026' },
  { enrollment_no: '0808AI241002', full_name: 'Chirag Sethi', branch: 'AIML', semester: 5, section: 'AI', email: 'chirag.s@university.edu', phone: '9876500027' },
  { enrollment_no: '0808AI241003', full_name: 'Deepali Saxena', branch: 'AIML', semester: 5, section: 'AI', email: 'deepali.s@university.edu', phone: '9876500028' },
  { enrollment_no: '0808AI241004', full_name: 'Harsh Vardhan', branch: 'AIML', semester: 5, section: 'AI', email: 'harsh.v@university.edu', phone: '9876500030' },
  { enrollment_no: '0808AI241005', full_name: 'Meera Rajput', branch: 'AIML', semester: 5, section: 'AI', email: 'meera.r@university.edu', phone: '9876500031' },

  // Civil Engineering (CIVIL)
  { enrollment_no: '0808CE241001', full_name: 'Abhishek Pandey', branch: 'CIVIL', semester: 5, section: 'C1', email: 'abhishek.p@university.edu', phone: '9876500032' },
  { enrollment_no: '0808CE241002', full_name: 'Divya Khurana', branch: 'CIVIL', semester: 5, section: 'C1', email: 'divya.k@university.edu', phone: '9876500033' },
  { enrollment_no: '0808CE241003', full_name: 'Karan Johar', branch: 'CIVIL', semester: 5, section: 'C1', email: 'karan.j@university.edu', phone: '9876500034' },
  { enrollment_no: '0808CE241004', full_name: 'Pooja Hegde', branch: 'CIVIL', semester: 5, section: 'C1', email: 'pooja.h@university.edu', phone: '9876500035' },
  { enrollment_no: '0808CE241005', full_name: 'Siddharth Roy', branch: 'CIVIL', semester: 5, section: 'C1', email: 'siddharth.r@university.edu', phone: '9876500036' }
];

// Initial Faculty Members
const initialFaculty = [
  { faculty_id: 1, faculty_code: 'FAC-001', full_name: 'Dr. Vivek Shrivastava', designation: 'Professor & Controller of Examinations', role_type: 'Controller_of_Exams', reports_to_id: null, email: 'coe@university.edu', phone: '9826011223' },
  { faculty_id: 2, faculty_code: 'FAC-002', full_name: 'Prof. Preeti Agrawal', designation: 'Associate Professor & Chief Exam Moderator', role_type: 'Moderator', reports_to_id: 1, email: 'preeti.agrawal@university.edu', phone: '9826022334' },
  { faculty_id: 3, faculty_code: 'FAC-003', full_name: 'Prof. Neha Sharma', designation: 'Assistant Professor & Exam Invigilator', role_type: 'Invigilator', reports_to_id: 2, email: 'neha.sharma@university.edu', phone: '9826033445' },
  { faculty_id: 4, faculty_code: 'FAC-004', full_name: 'Prof. Rajesh Kumar', designation: 'Assistant Professor & Exam Invigilator', role_type: 'Invigilator', reports_to_id: 2, email: 'rajesh.kumar@university.edu', phone: '9826044556' },
  { faculty_id: 5, faculty_code: 'FAC-005', full_name: 'Prof. Amit Verma', designation: 'Assistant Professor & Exam Invigilator', role_type: 'Invigilator', reports_to_id: 2, email: 'amit.verma@university.edu', phone: '9826055667' }
];

// Initial Exams
const initialExams = [
  { exam_id: 1, subject_code: 'CS-501', subject_name: 'Database Management Systems', exam_date: '2026-11-10', shift_time: '10:00 AM - 01:00 PM', max_marks: 70, passing_marks: 23, academic_sem: 5 },
  { exam_id: 2, subject_code: 'IT-502', subject_name: 'Cloud Computing & DevOps', exam_date: '2026-11-12', shift_time: '10:00 AM - 01:00 PM', max_marks: 70, passing_marks: 23, academic_sem: 5 },
  { exam_id: 3, subject_code: 'ME-503', subject_name: 'Heat & Mass Transfer', exam_date: '2026-11-14', shift_time: '10:00 AM - 01:00 PM', max_marks: 70, passing_marks: 23, academic_sem: 5 },
  { exam_id: 4, subject_code: 'EC-504', subject_name: 'Digital Signal Processing', exam_date: '2026-11-17', shift_time: '02:00 PM - 05:00 PM', max_marks: 70, passing_marks: 23, academic_sem: 5 }
];

// Initial Halls with 2 seats per bench
const initialHalls = [
  { hall_id: 1, room_number: 'Hall 101 (Main Auditorium)', building_block: 'Block-A (Academic Wing)', rows_count: 4, cols_count: 5, seats_per_bench: 2, total_capacity: 40, invigilator_id: 3 },
  { hall_id: 2, room_number: 'Hall 202 (Science Complex)', building_block: 'Block-B (Computing Complex)', rows_count: 3, cols_count: 5, seats_per_bench: 2, total_capacity: 30, invigilator_id: 4 },
  { hall_id: 3, room_number: 'Room 303 (Seminar Hall)', building_block: 'Block-C (Technology Tower)', rows_count: 3, cols_count: 4, seats_per_bench: 2, total_capacity: 24, invigilator_id: 5 }
];

// Rich Initial Allocations: 32 Students allocated across Hall 101 & Hall 202 for Exam 1
// Interleaving CSE with IT (Benches 1-10 in Hall 101) and MECH with AIML (Benches 1-6 in Hall 202)
const initialAllocations = [
  // Hall 101: Bench 1-5 (Row 1)
  { allocation_id: 1, enrollment_no: '0808CS241091', exam_id: 1, hall_id: 1, row_no: 1, col_no: 1, bench_no: 1, seat_position: 'A', seat_label: 'R1-C1-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 2, enrollment_no: '0808IT241001', exam_id: 1, hall_id: 1, row_no: 1, col_no: 1, bench_no: 1, seat_position: 'B', seat_label: 'R1-C1-B', allocated_at: '2026-10-18 09:00:00' },

  { allocation_id: 3, enrollment_no: '0808CS241070', exam_id: 1, hall_id: 1, row_no: 1, col_no: 2, bench_no: 2, seat_position: 'A', seat_label: 'R1-C2-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 4, enrollment_no: '0808IT241002', exam_id: 1, hall_id: 1, row_no: 1, col_no: 2, bench_no: 2, seat_position: 'B', seat_label: 'R1-C2-B', allocated_at: '2026-10-18 09:00:00' },

  { allocation_id: 5, enrollment_no: '0808CS241071', exam_id: 1, hall_id: 1, row_no: 1, col_no: 3, bench_no: 3, seat_position: 'A', seat_label: 'R1-C3-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 6, enrollment_no: '0808IT241003', exam_id: 1, hall_id: 1, row_no: 1, col_no: 3, bench_no: 3, seat_position: 'B', seat_label: 'R1-C3-B', allocated_at: '2026-10-18 09:00:00' },

  { allocation_id: 7, enrollment_no: '0808CS241072', exam_id: 1, hall_id: 1, row_no: 1, col_no: 4, bench_no: 4, seat_position: 'A', seat_label: 'R1-C4-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 8, enrollment_no: '0808IT241004', exam_id: 1, hall_id: 1, row_no: 1, col_no: 4, bench_no: 4, seat_position: 'B', seat_label: 'R1-C4-B', allocated_at: '2026-10-18 09:00:00' },

  { allocation_id: 9, enrollment_no: '0808CS241075', exam_id: 1, hall_id: 1, row_no: 1, col_no: 5, bench_no: 5, seat_position: 'A', seat_label: 'R1-C5-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 10, enrollment_no: '0808IT241005', exam_id: 1, hall_id: 1, row_no: 1, col_no: 5, bench_no: 5, seat_position: 'B', seat_label: 'R1-C5-B', allocated_at: '2026-10-18 09:00:00' },

  // Hall 101: Bench 6-10 (Row 2)
  { allocation_id: 11, enrollment_no: '0808CS241078', exam_id: 1, hall_id: 1, row_no: 2, col_no: 1, bench_no: 6, seat_position: 'A', seat_label: 'R2-C1-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 12, enrollment_no: '0808IT241006', exam_id: 1, hall_id: 1, row_no: 2, col_no: 1, bench_no: 6, seat_position: 'B', seat_label: 'R2-C1-B', allocated_at: '2026-10-18 09:00:00' },

  { allocation_id: 13, enrollment_no: '0808CS241080', exam_id: 1, hall_id: 1, row_no: 2, col_no: 2, bench_no: 7, seat_position: 'A', seat_label: 'R2-C2-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 14, enrollment_no: '0808IT241007', exam_id: 1, hall_id: 1, row_no: 2, col_no: 2, bench_no: 7, seat_position: 'B', seat_label: 'R2-C2-B', allocated_at: '2026-10-18 09:00:00' },

  { allocation_id: 15, enrollment_no: '0808CS241082', exam_id: 1, hall_id: 1, row_no: 2, col_no: 3, bench_no: 8, seat_position: 'A', seat_label: 'R2-C3-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 16, enrollment_no: '0808IT241008', exam_id: 1, hall_id: 1, row_no: 2, col_no: 3, bench_no: 8, seat_position: 'B', seat_label: 'R2-C3-B', allocated_at: '2026-10-18 09:00:00' },

  { allocation_id: 17, enrollment_no: '0808CS241085', exam_id: 1, hall_id: 1, row_no: 2, col_no: 4, bench_no: 9, seat_position: 'A', seat_label: 'R2-C4-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 18, enrollment_no: '0808IT241009', exam_id: 1, hall_id: 1, row_no: 2, col_no: 4, bench_no: 9, seat_position: 'B', seat_label: 'R2-C4-B', allocated_at: '2026-10-18 09:00:00' },

  { allocation_id: 19, enrollment_no: '0808CS241088', exam_id: 1, hall_id: 1, row_no: 2, col_no: 5, bench_no: 10, seat_position: 'A', seat_label: 'R2-C5-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 20, enrollment_no: '0808IT241010', exam_id: 1, hall_id: 1, row_no: 2, col_no: 5, bench_no: 10, seat_position: 'B', seat_label: 'R2-C5-B', allocated_at: '2026-10-18 09:00:00' },

  // Hall 202: Bench 1-6 (Alternating MECH & AIML)
  { allocation_id: 21, enrollment_no: '0808ME241001', exam_id: 1, hall_id: 2, row_no: 1, col_no: 1, bench_no: 1, seat_position: 'A', seat_label: 'R1-C1-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 22, enrollment_no: '0808AI241001', exam_id: 1, hall_id: 2, row_no: 1, col_no: 1, bench_no: 1, seat_position: 'B', seat_label: 'R1-C1-B', allocated_at: '2026-10-18 09:00:00' },

  { allocation_id: 23, enrollment_no: '0808ME241002', exam_id: 1, hall_id: 2, row_no: 1, col_no: 2, bench_no: 2, seat_position: 'A', seat_label: 'R1-C2-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 24, enrollment_no: '0808AI241002', exam_id: 1, hall_id: 2, row_no: 1, col_no: 2, bench_no: 2, seat_position: 'B', seat_label: 'R1-C2-B', allocated_at: '2026-10-18 09:00:00' },

  { allocation_id: 25, enrollment_no: '0808ME241003', exam_id: 1, hall_id: 2, row_no: 1, col_no: 3, bench_no: 3, seat_position: 'A', seat_label: 'R1-C3-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 26, enrollment_no: '0808AI241003', exam_id: 1, hall_id: 2, row_no: 1, col_no: 3, bench_no: 3, seat_position: 'B', seat_label: 'R1-C3-B', allocated_at: '2026-10-18 09:00:00' },

  { allocation_id: 27, enrollment_no: '0808ME241004', exam_id: 1, hall_id: 2, row_no: 1, col_no: 4, bench_no: 4, seat_position: 'A', seat_label: 'R1-C4-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 28, enrollment_no: '0808AI241004', exam_id: 1, hall_id: 2, row_no: 1, col_no: 4, bench_no: 4, seat_position: 'B', seat_label: 'R1-C4-B', allocated_at: '2026-10-18 09:00:00' },

  { allocation_id: 29, enrollment_no: '0808ME241005', exam_id: 1, hall_id: 2, row_no: 1, col_no: 5, bench_no: 5, seat_position: 'A', seat_label: 'R1-C5-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 30, enrollment_no: '0808AI241005', exam_id: 1, hall_id: 2, row_no: 1, col_no: 5, bench_no: 5, seat_position: 'B', seat_label: 'R1-C5-B', allocated_at: '2026-10-18 09:00:00' },

  { allocation_id: 31, enrollment_no: '0808ME241006', exam_id: 1, hall_id: 2, row_no: 2, col_no: 1, bench_no: 6, seat_position: 'A', seat_label: 'R2-C1-A', allocated_at: '2026-10-18 09:00:00' },
  { allocation_id: 32, enrollment_no: '0808CE241001', exam_id: 1, hall_id: 2, row_no: 2, col_no: 1, bench_no: 6, seat_position: 'B', seat_label: 'R2-C1-B', allocated_at: '2026-10-18 09:00:00' }
];

// Rich Initial Marks (16 Candidates evaluated with 5 Borderline cases for demonstration)
const initialMarks = [
  { moderation_id: 1, enrollment_no: '0808CS241091', exam_id: 1, original_marks: 66.50, grace_marks: 0.00, moderated_marks: 66.50, moderator_id: 2, status: 'Approved', remarks: 'Outstanding academic paper', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 2, enrollment_no: '0808IT241001', exam_id: 1, original_marks: 20.50, grace_marks: 0.00, moderated_marks: 20.50, moderator_id: 2, status: 'Pending', remarks: 'Borderline fail - missing 2.5 marks', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 3, enrollment_no: '0808CS241070', exam_id: 1, original_marks: 21.00, grace_marks: 0.00, moderated_marks: 21.00, moderator_id: 2, status: 'Pending', remarks: 'Borderline fail - missing 2 marks', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 4, enrollment_no: '0808IT241002', exam_id: 1, original_marks: 54.00, grace_marks: 0.00, moderated_marks: 54.00, moderator_id: 2, status: 'Approved', remarks: 'Consistent high score', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 5, enrollment_no: '0808CS241071', exam_id: 1, original_marks: 19.50, grace_marks: 0.00, moderated_marks: 19.50, moderator_id: 2, status: 'Pending', remarks: 'Borderline fail - needs 3.5 marks grace', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 6, enrollment_no: '0808IT241003', exam_id: 1, original_marks: 47.50, grace_marks: 0.00, moderated_marks: 47.50, moderator_id: 2, status: 'Approved', remarks: 'Good analytical answers', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 7, enrollment_no: '0808CS241072', exam_id: 1, original_marks: 22.00, grace_marks: 0.00, moderated_marks: 22.00, moderator_id: 2, status: 'Pending', remarks: 'Borderline fail - missing 1 mark only', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 8, enrollment_no: '0808IT241004', exam_id: 1, original_marks: 61.00, grace_marks: 0.00, moderated_marks: 61.00, moderator_id: 2, status: 'Approved', remarks: 'Exemplary performance', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 9, enrollment_no: '0808CS241075', exam_id: 1, original_marks: 38.00, grace_marks: 0.00, moderated_marks: 38.00, moderator_id: 2, status: 'Approved', remarks: 'Satisfactory completion', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 10, enrollment_no: '0808IT241005', exam_id: 1, original_marks: 20.00, grace_marks: 0.00, moderated_marks: 20.00, moderator_id: 2, status: 'Pending', remarks: 'Borderline fail - missing 3 marks', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 11, enrollment_no: '0808ME241001', exam_id: 1, original_marks: 42.00, grace_marks: 0.00, moderated_marks: 42.00, moderator_id: 2, status: 'Approved', remarks: 'Sound conceptual clarity', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 12, enrollment_no: '0808AI241001', exam_id: 1, original_marks: 58.50, grace_marks: 0.00, moderated_marks: 58.50, moderator_id: 2, status: 'Approved', remarks: 'Strong implementation section', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 13, enrollment_no: '0808ME241002', exam_id: 1, original_marks: 33.00, grace_marks: 0.00, moderated_marks: 33.00, moderator_id: 2, status: 'Approved', remarks: 'Above passing grade', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 14, enrollment_no: '0808AI241002', exam_id: 1, original_marks: 45.00, grace_marks: 0.00, moderated_marks: 45.00, moderator_id: 2, status: 'Approved', remarks: 'Well-structured diagrams', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 15, enrollment_no: '0808CE241001', exam_id: 1, original_marks: 39.50, grace_marks: 0.00, moderated_marks: 39.50, moderator_id: 2, status: 'Approved', remarks: 'Good numerical accuracy', updated_at: '2026-10-18 09:00:00' },
  { moderation_id: 16, enrollment_no: '0808ME241003', exam_id: 1, original_marks: 49.00, grace_marks: 0.00, moderated_marks: 49.00, moderator_id: 2, status: 'Approved', remarks: 'Clear step-by-step logic', updated_at: '2026-10-18 09:00:00' }
];

// Rich Initial Audit Log
const initialAuditLog = [
  { log_id: 1, moderation_id: 1, enrollment_no: '0808CS241091', exam_id: 1, old_marks: 64.50, new_marks: 66.50, grace_applied: 2.00, old_status: 'Pending', new_status: 'Approved', modified_by_faculty: 2, action_timestamp: '2026-10-18 08:30:00' },
  { log_id: 2, moderation_id: 4, enrollment_no: '0808IT241002', exam_id: 1, old_marks: 52.00, new_marks: 54.00, grace_applied: 2.00, old_status: 'Pending', new_status: 'Approved', modified_by_faculty: 2, action_timestamp: '2026-10-18 08:45:00' },
  { log_id: 3, moderation_id: 8, enrollment_no: '0808IT241004', exam_id: 1, old_marks: 59.00, new_marks: 61.00, grace_applied: 2.00, old_status: 'Pending', new_status: 'Approved', modified_by_faculty: 2, action_timestamp: '2026-10-18 09:10:00' },
  { log_id: 4, moderation_id: 12, enrollment_no: '0808AI241001', exam_id: 1, old_marks: 56.50, new_marks: 58.50, grace_applied: 2.00, old_status: 'Pending', new_status: 'Approved', modified_by_faculty: 2, action_timestamp: '2026-10-18 09:15:00' }
];

// Live in-memory state store
const state = {
  faculty: JSON.parse(JSON.stringify(initialFaculty)),
  students: JSON.parse(JSON.stringify(initialStudents)),
  exams: JSON.parse(JSON.stringify(initialExams)),
  halls: JSON.parse(JSON.stringify(initialHalls)),
  allocations: JSON.parse(JSON.stringify(initialAllocations)),
  marks: JSON.parse(JSON.stringify(initialMarks)),
  auditLog: JSON.parse(JSON.stringify(initialAuditLog)),
  lastFacultyId: 5,
  lastExamId: 4,
  lastHallId: 3,
  lastAllocationId: 32,
  lastModerationId: 16,
  lastAuditId: 4
};

// Compute RGPV Grade
function fn_ComputeGrade(marks, max = 70) {
  if (max <= 0) return 'NA';
  const percentage = (marks / max) * 100.0;
  if (percentage >= 90.0) return 'O';
  if (percentage >= 80.0) return 'A+';
  if (percentage >= 70.0) return 'A';
  if (percentage >= 60.0) return 'B+';
  if (percentage >= 50.0) return 'B';
  if (percentage >= 33.0) return 'C';
  return 'F';
}

function getEngineStatus() {
  return {
    isSupabaseConnected,
    supabaseUrl: supabaseUrl ? supabaseUrl.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : null,
    engineName: isSupabaseConnected 
      ? 'Supabase Cloud (PostgreSQL 15)' 
      : 'Local High-Performance Relational Engine',
    tablesCount: 7,
    studentsCount: state.students.length,
    hallsCount: state.halls.length,
    examsCount: state.exams.length,
    allocationsCount: state.allocations.length
  };
}

function resetDatabaseState() {
  state.faculty = JSON.parse(JSON.stringify(initialFaculty));
  state.students = JSON.parse(JSON.stringify(initialStudents));
  state.exams = JSON.parse(JSON.stringify(initialExams));
  state.halls = JSON.parse(JSON.stringify(initialHalls));
  state.allocations = JSON.parse(JSON.stringify(initialAllocations));
  state.marks = JSON.parse(JSON.stringify(initialMarks));
  state.auditLog = JSON.parse(JSON.stringify(initialAuditLog));
  state.lastFacultyId = 5;
  state.lastExamId = 4;
  state.lastHallId = 3;
  state.lastAllocationId = 32;
  state.lastModerationId = 16;
  state.lastAuditId = 4;
  return {
    success: true,
    message: 'System database state successfully reset to initial seed values.',
    sqlExecuted: `TRUNCATE TABLE marks_audit_log;\nTRUNCATE TABLE marks_moderation;\nTRUNCATE TABLE seat_allocations;\n-- Restored seed records.`
  };
}

module.exports = {
  getSupabase: () => supabase,
  isSupabaseConnected: () => isSupabaseConnected,
  isLiveMySQL: () => false,
  initSupabase,
  syncFromSupabase,
  state,
  fn_ComputeGrade,
  getEngineStatus,
  resetDatabaseState
};
