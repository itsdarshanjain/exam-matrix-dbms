-- =====================================================================
-- UNIVERSITY EXAMINATION & SEATING MANAGEMENT SYSTEM (EXAMMATRIX ERP)
-- PostgreSQL / Supabase Schema Definition
-- Features: 3NF Normalization, Foreign Key Cascades, Views, Triggers,
--           2-Seater Anti-Cheating Spatial Bench Constraint
-- =====================================================================

-- Clean Slate (Optional for reset)
-- DROP TABLE IF EXISTS marks_audit_log CASCADE;
-- DROP TABLE IF EXISTS marks_moderation CASCADE;
-- DROP TABLE IF EXISTS seat_allocations CASCADE;
-- DROP TABLE IF EXISTS exam_halls CASCADE;
-- DROP TABLE IF EXISTS exams CASCADE;
-- DROP TABLE IF EXISTS students CASCADE;
-- DROP TABLE IF EXISTS faculty CASCADE;

-- =====================================================================
-- TABLE 1: Faculty (Invigilators, Moderators, Examination Cell)
-- =====================================================================
CREATE TABLE IF NOT EXISTS faculty (
    faculty_id SERIAL PRIMARY KEY,
    faculty_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    designation VARCHAR(60) NOT NULL,
    role_type VARCHAR(30) NOT NULL CHECK (role_type IN ('Moderator', 'Invigilator', 'Controller_of_Exams')),
    reports_to_id INT REFERENCES faculty(faculty_id) ON DELETE SET NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLE 2: Students (Multi-Branch: CSE, IT, MECH, CIVIL, AIML)
-- =====================================================================
CREATE TABLE IF NOT EXISTS students (
    enrollment_no VARCHAR(25) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    branch VARCHAR(25) NOT NULL,
    semester INT NOT NULL DEFAULT 5 CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2026-2027',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLE 3: Exams (Exam Schedule, Courses, Shift Timings)
-- =====================================================================
CREATE TABLE IF NOT EXISTS exams (
    exam_id SERIAL PRIMARY KEY,
    subject_code VARCHAR(20) NOT NULL UNIQUE,
    subject_name VARCHAR(100) NOT NULL,
    exam_date DATE NOT NULL,
    shift_time VARCHAR(40) NOT NULL CHECK (shift_time IN ('10:00 AM - 01:00 PM', '02:00 PM - 05:00 PM')),
    max_marks INT NOT NULL DEFAULT 70 CHECK (max_marks > 0),
    passing_marks INT NOT NULL DEFAULT 23 CHECK (passing_marks > 0 AND passing_marks <= max_marks),
    academic_sem INT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLE 4: Exam_Halls (Physical Rooms, Benches, Rows, Columns, Capacity)
-- =====================================================================
CREATE TABLE IF NOT EXISTS exam_halls (
    hall_id SERIAL PRIMARY KEY,
    room_number VARCHAR(40) NOT NULL UNIQUE,
    building_block VARCHAR(60) NOT NULL,
    rows_count INT NOT NULL DEFAULT 4 CHECK (rows_count > 0),
    cols_count INT NOT NULL DEFAULT 5 CHECK (cols_count > 0),
    seats_per_bench INT NOT NULL DEFAULT 2 CHECK (seats_per_bench IN (1, 2)),
    total_capacity INT NOT NULL CHECK (total_capacity > 0),
    invigilator_id INT REFERENCES faculty(faculty_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLE 5: Seat_Allocations (2D Classroom Bench Mapping with Seat A / Seat B)
-- =====================================================================
CREATE TABLE IF NOT EXISTS seat_allocations (
    allocation_id SERIAL PRIMARY KEY,
    enrollment_no VARCHAR(25) NOT NULL REFERENCES students(enrollment_no) ON DELETE CASCADE,
    exam_id INT NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
    hall_id INT NOT NULL REFERENCES exam_halls(hall_id) ON DELETE RESTRICT,
    row_no INT NOT NULL CHECK (row_no > 0),
    col_no INT NOT NULL CHECK (col_no > 0),
    bench_no INT NOT NULL CHECK (bench_no > 0),
    seat_position VARCHAR(5) NOT NULL CHECK (seat_position IN ('A', 'B', 'S')), -- A: Left, B: Right, S: Single
    seat_label VARCHAR(20) NOT NULL, -- e.g., 'R1-C1-A', 'B1-A'
    allocated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_student_exam UNIQUE (enrollment_no, exam_id),
    CONSTRAINT uk_hall_exam_seat UNIQUE (hall_id, exam_id, seat_label)
);

-- =====================================================================
-- TABLE 6: Marks_Moderation (Evaluation & Borderline Grace System)
-- =====================================================================
CREATE TABLE IF NOT EXISTS marks_moderation (
    moderation_id SERIAL PRIMARY KEY,
    enrollment_no VARCHAR(25) NOT NULL REFERENCES students(enrollment_no) ON DELETE CASCADE,
    exam_id INT NOT NULL REFERENCES exams(exam_id) ON DELETE CASCADE,
    original_marks NUMERIC(5,2) NOT NULL CHECK (original_marks >= 0 AND original_marks <= 70),
    grace_marks NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (grace_marks >= 0 AND grace_marks <= 10),
    moderated_marks NUMERIC(5,2) NOT NULL CHECK (moderated_marks >= 0 AND moderated_marks <= 70),
    moderator_id INT REFERENCES faculty(faculty_id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Grace_Applied', 'Approved', 'Flagged_Reval')),
    remarks VARCHAR(255) DEFAULT 'Initial Evaluation',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_student_exam_marks UNIQUE (enrollment_no, exam_id)
);

-- =====================================================================
-- TABLE 7: Marks_Audit_Log (Forensic Audit Trail)
-- =====================================================================
CREATE TABLE IF NOT EXISTS marks_audit_log (
    log_id SERIAL PRIMARY KEY,
    moderation_id INT NOT NULL,
    enrollment_no VARCHAR(25) NOT NULL,
    exam_id INT NOT NULL,
    old_marks NUMERIC(5,2) NOT NULL,
    new_marks NUMERIC(5,2) NOT NULL,
    grace_applied NUMERIC(5,2) NOT NULL,
    old_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    modified_by_faculty INT,
    action_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- FUNCTION & TRIGGER 1: Prevent Same-Branch Students on Same Bench (Anti-Cheating)
-- =====================================================================
CREATE OR REPLACE FUNCTION trg_check_bench_branch_conflict()
RETURNS TRIGGER AS $$
DECLARE
    new_student_branch VARCHAR(25);
    existing_student_branch VARCHAR(25);
BEGIN
    -- Get branch of incoming student
    SELECT branch INTO new_student_branch FROM students WHERE enrollment_no = NEW.enrollment_no;

    -- Check if another student is already allocated to the same bench in the same exam
    SELECT s.branch INTO existing_student_branch
    FROM seat_allocations sa
    JOIN students s ON sa.enrollment_no = s.enrollment_no
    WHERE sa.exam_id = NEW.exam_id 
      AND sa.hall_id = NEW.hall_id 
      AND sa.row_no = NEW.row_no 
      AND sa.col_no = NEW.col_no
      AND sa.seat_position != NEW.seat_position
    LIMIT 1;

    -- If a student exists on the other seat of this bench, their branches MUST NOT be identical!
    IF existing_student_branch IS NOT NULL AND existing_student_branch = new_student_branch THEN
        RAISE EXCEPTION 'ANTI-CHEATING VIOLATION: Bench (% - Col %) already occupied by student from branch %. Cannot place two students from the same department on the same bench.',
            NEW.row_no, NEW.col_no, existing_student_branch;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_bench_branch_trigger ON seat_allocations;
CREATE TRIGGER check_bench_branch_trigger
BEFORE INSERT ON seat_allocations
FOR EACH ROW
EXECUTE FUNCTION trg_check_bench_branch_conflict();

-- =====================================================================
-- FUNCTION & TRIGGER 2: Room Capacity Overflow Guard
-- =====================================================================
CREATE OR REPLACE FUNCTION trg_check_room_capacity()
RETURNS TRIGGER AS $$
DECLARE
    max_cap INT;
    current_alloc INT;
BEGIN
    SELECT total_capacity INTO max_cap FROM exam_halls WHERE hall_id = NEW.hall_id;
    SELECT COUNT(*) INTO current_alloc FROM seat_allocations WHERE hall_id = NEW.hall_id AND exam_id = NEW.exam_id;

    IF current_alloc >= max_cap THEN
        RAISE EXCEPTION 'ROOM CAPACITY EXCEEDED: Room has strict maximum capacity of % students.', max_cap;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_capacity_trigger ON seat_allocations;
CREATE TRIGGER check_capacity_trigger
BEFORE INSERT ON seat_allocations
FOR EACH ROW
EXECUTE FUNCTION trg_check_room_capacity();

-- =====================================================================
-- FUNCTION & TRIGGER 3: Automatic Audit Log for Marks Update
-- =====================================================================
CREATE OR REPLACE FUNCTION trg_log_marks_moderation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.moderated_marks != NEW.moderated_marks OR OLD.status != NEW.status THEN
        INSERT INTO marks_audit_log (
            moderation_id, enrollment_no, exam_id,
            old_marks, new_marks, grace_applied,
            old_status, new_status, modified_by_faculty, action_timestamp
        ) VALUES (
            NEW.moderation_id, NEW.enrollment_no, NEW.exam_id,
            OLD.moderated_marks, NEW.moderated_marks, NEW.grace_marks,
            OLD.status, NEW.status, NEW.moderator_id, NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_marks_trigger ON marks_moderation;
CREATE TRIGGER log_marks_trigger
AFTER UPDATE ON marks_moderation
FOR EACH ROW
EXECUTE FUNCTION trg_log_marks_moderation();

-- =====================================================================
-- VIEW 1: Official Student Hall Ticket / Admit Card
-- =====================================================================
CREATE OR REPLACE VIEW v_student_hall_ticket AS
SELECT 
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
    h.room_number,
    h.building_block,
    sa.row_no,
    sa.col_no,
    sa.bench_no,
    sa.seat_position,
    sa.seat_label,
    f.full_name AS invigilator_name,
    f.faculty_code AS invigilator_code,
    mm.original_marks,
    mm.grace_marks,
    mm.moderated_marks,
    mm.status AS result_status
FROM students s
JOIN seat_allocations sa ON s.enrollment_no = sa.enrollment_no
JOIN exams e ON sa.exam_id = e.exam_id
JOIN exam_halls h ON sa.hall_id = h.hall_id
LEFT JOIN faculty f ON h.invigilator_id = f.faculty_id
LEFT JOIN marks_moderation mm ON s.enrollment_no = mm.enrollment_no AND e.exam_id = mm.exam_id;

-- =====================================================================
-- VIEW 2: Hall Occupancy Summary
-- =====================================================================
CREATE OR REPLACE VIEW v_hall_occupancy_summary AS
SELECT 
    h.hall_id,
    h.room_number,
    h.building_block,
    h.rows_count,
    h.cols_count,
    h.seats_per_bench,
    h.total_capacity,
    sa.exam_id,
    COUNT(sa.allocation_id) AS occupied_seats,
    (h.total_capacity - COUNT(sa.allocation_id)) AS available_seats,
    ROUND((COUNT(sa.allocation_id)::NUMERIC / h.total_capacity::NUMERIC) * 100.0, 2) AS occupancy_percentage,
    f.full_name AS invigilator_name
FROM exam_halls h
LEFT JOIN seat_allocations sa ON h.hall_id = sa.hall_id
LEFT JOIN faculty f ON h.invigilator_id = f.faculty_id
GROUP BY h.hall_id, h.room_number, h.building_block, h.rows_count, h.cols_count, h.seats_per_bench, h.total_capacity, sa.exam_id, f.full_name;

-- =====================================================================
-- SAMPLE SEED DATA (Multiple Branches for Real Testing)
-- =====================================================================
INSERT INTO faculty (faculty_code, full_name, designation, role_type, email, phone) VALUES
('FAC-001', 'Dr. Vivek Shrivastava', 'Professor & Controller of Examinations', 'Controller_of_Exams', 'coe@university.edu', '9826011223'),
('FAC-002', 'Prof. Preeti Agrawal', 'Associate Professor & Chief Exam Moderator', 'Moderator', 'preeti.agrawal@university.edu', '9826022334'),
('FAC-003', 'Prof. Neha Sharma', 'Assistant Professor & Exam Invigilator', 'Invigilator', 'neha.sharma@university.edu', '9826033445'),
('FAC-004', 'Prof. Rajesh Kumar', 'Assistant Professor & Exam Invigilator', 'Invigilator', 'rajesh.kumar@university.edu', '9826044556'),
('FAC-005', 'Prof. Amit Verma', 'Assistant Professor & Exam Invigilator', 'Invigilator', 'amit.verma@university.edu', '9826055667')
ON CONFLICT (faculty_code) DO NOTHING;

INSERT INTO exams (subject_code, subject_name, exam_date, shift_time, max_marks, passing_marks, academic_sem) VALUES
('CS-501', 'Database Management Systems', '2026-11-10', '10:00 AM - 01:00 PM', 70, 23, 5),
('IT-502', 'Cloud Computing & DevOps', '2026-11-12', '10:00 AM - 01:00 PM', 70, 23, 5),
('ME-503', 'Heat & Mass Transfer', '2026-11-14', '10:00 AM - 01:00 PM', 70, 23, 5),
('EC-504', 'Digital Signal Processing', '2026-11-17', '02:00 PM - 05:00 PM', 70, 23, 5)
ON CONFLICT (subject_code) DO NOTHING;

INSERT INTO exam_halls (room_number, building_block, rows_count, cols_count, seats_per_bench, total_capacity, invigilator_id) VALUES
('Hall 101 (Main Auditorium)', 'Block-A (Academic Wing)', 4, 5, 2, 40, 3),
('Hall 202 (Science Wing)', 'Block-B (Computing Complex)', 3, 5, 2, 30, 4),
('Room 303 (Seminar Hall)', 'Block-C (Technology Tower)', 3, 4, 2, 24, 5)
ON CONFLICT (room_number) DO NOTHING;

-- Seed Students across CSE, IT, MECH, AIML
INSERT INTO students (enrollment_no, full_name, branch, semester, section, email, phone) VALUES
-- CSE Students
('0808CS241091', 'Darshan Jain', 'CSE', 5, 'T3', 'darshan.jain@university.edu', '9826191091'),
('0808CS241070', 'Aarav Patel', 'CSE', 5, 'T3', 'aarav.patel@university.edu', '9876500001'),
('0808CS241071', 'Aditi Joshi', 'CSE', 5, 'T3', 'aditi.joshi@university.edu', '9876500002'),
('0808CS241072', 'Aman Sharma', 'CSE', 5, 'T3', 'aman.sharma@university.edu', '9876500003'),
('0808CS241075', 'Ananya Gupta', 'CSE', 5, 'T3', 'ananya.gupta@university.edu', '9876500004'),
('0808CS241078', 'Aniket Verma', 'CSE', 5, 'T3', 'aniket.verma@university.edu', '9876500005'),
('0808CS241080', 'Anushka Chouhan', 'CSE', 5, 'T3', 'anushka.c@university.edu', '9876500006'),
('0808CS241082', 'Aryan Sen', 'CSE', 5, 'T3', 'aryan.sen@university.edu', '9876500007'),
('0808CS241085', 'Ayush Rathore', 'CSE', 5, 'T3', 'ayush.r@university.edu', '9876500008'),
('0808CS241088', 'Bhavya Tiwari', 'CSE', 5, 'T3', 'bhavya.t@university.edu', '9876500009'),
-- IT Students
('0808IT241001', 'Ishaan Malhotra', 'IT', 5, 'A', 'ishaan.m@university.edu', '9876500011'),
('0808IT241002', 'Kavya Nair', 'IT', 5, 'A', 'kavya.n@university.edu', '9876500012'),
('0808IT241003', 'Manav Singhania', 'IT', 5, 'A', 'manav.s@university.edu', '9876500013'),
('0808IT241004', 'Niharika Roy', 'IT', 5, 'A', 'niharika.r@university.edu', '9876500014'),
('0808IT241005', 'Pooja Bhatt', 'IT', 5, 'A', 'pooja.b@university.edu', '9876500015'),
('0808IT241006', 'Prateek Deshmukh', 'IT', 5, 'A', 'prateek.d@university.edu', '9876500016'),
('0808IT241007', 'Riddhi Agarwal', 'IT', 5, 'A', 'riddhi.a@university.edu', '9876500017'),
('0808IT241008', 'Rishabh Mehta', 'IT', 5, 'A', 'rishabh.m@university.edu', '9876500018'),
('0808IT241009', 'Sanya Kapoor', 'IT', 5, 'A', 'sanya.k@university.edu', '9876500019'),
('0808IT241010', 'Shreyas Iyer', 'IT', 5, 'A', 'shreyas.i@university.edu', '9876500020'),
-- MECH Students
('0808ME241001', 'Tanmay Bakshi', 'MECH', 5, 'M1', 'tanmay.b@university.edu', '9876500021'),
('0808ME241002', 'Umesh Jadhav', 'MECH', 5, 'M1', 'umesh.j@university.edu', '9876500022'),
('0808ME241003', 'Vaibhav Kulkarni', 'MECH', 5, 'M1', 'vaibhav.k@university.edu', '9876500023'),
('0808ME241004', 'Varun Dhawan', 'MECH', 5, 'M1', 'varun.d@university.edu', '9876500024'),
('0808ME241005', 'Yashvardhan Rao', 'MECH', 5, 'M1', 'yash.r@university.edu', '9876500025'),
('0808ME241006', 'Rohit Sharma', 'MECH', 5, 'M1', 'rohit.s@university.edu', '9876500029'),
-- AIML Students
('0808AI241001', 'Zoya Siddiqui', 'AIML', 5, 'AI', 'zoya.s@university.edu', '9876500026'),
('0808AI241002', 'Chirag Sethi', 'AIML', 5, 'AI', 'chirag.s@university.edu', '9876500027'),
('0808AI241003', 'Deepali Saxena', 'AIML', 5, 'AI', 'deepali.s@university.edu', '9876500028'),
('0808AI241004', 'Harsh Vardhan', 'AIML', 5, 'AI', 'harsh.v@university.edu', '9876500030'),
('0808AI241005', 'Meera Rajput', 'AIML', 5, 'AI', 'meera.r@university.edu', '9876500031'),
-- CIVIL Students
('0808CE241001', 'Abhishek Pandey', 'CIVIL', 5, 'C1', 'abhishek.p@university.edu', '9876500032'),
('0808CE241002', 'Divya Khurana', 'CIVIL', 5, 'C1', 'divya.k@university.edu', '9876500033'),
('0808CE241003', 'Karan Johar', 'CIVIL', 5, 'C1', 'karan.j@university.edu', '9876500034'),
('0808CE241004', 'Pooja Hegde', 'CIVIL', 5, 'C1', 'pooja.h@university.edu', '9876500035'),
('0808CE241005', 'Siddharth Roy', 'CIVIL', 5, 'C1', 'siddharth.r@university.edu', '9876500036')
ON CONFLICT (enrollment_no) DO NOTHING;

-- Seed Allocations: 32 Students with Anti-Cheating Bench Separation across Hall 101 & Hall 202
INSERT INTO seat_allocations (enrollment_no, exam_id, hall_id, row_no, col_no, bench_no, seat_position, seat_label) VALUES
('0808CS241091', 1, 1, 1, 1, 1, 'A', 'R1-C1-A'),
('0808IT241001', 1, 1, 1, 1, 1, 'B', 'R1-C1-B'),
('0808CS241070', 1, 1, 1, 2, 2, 'A', 'R1-C2-A'),
('0808IT241002', 1, 1, 1, 2, 2, 'B', 'R1-C2-B'),
('0808CS241071', 1, 1, 1, 3, 3, 'A', 'R1-C3-A'),
('0808IT241003', 1, 1, 1, 3, 3, 'B', 'R1-C3-B'),
('0808CS241072', 1, 1, 1, 4, 4, 'A', 'R1-C4-A'),
('0808IT241004', 1, 1, 1, 4, 4, 'B', 'R1-C4-B'),
('0808CS241075', 1, 1, 1, 5, 5, 'A', 'R1-C5-A'),
('0808IT241005', 1, 1, 1, 5, 5, 'B', 'R1-C5-B'),
('0808CS241078', 1, 1, 2, 1, 6, 'A', 'R2-C1-A'),
('0808IT241006', 1, 1, 2, 1, 6, 'B', 'R2-C1-B'),
('0808CS241080', 1, 1, 2, 2, 7, 'A', 'R2-C2-A'),
('0808IT241007', 1, 1, 2, 2, 7, 'B', 'R2-C2-B'),
('0808CS241082', 1, 1, 2, 3, 8, 'A', 'R2-C3-A'),
('0808IT241008', 1, 1, 2, 3, 8, 'B', 'R2-C3-B'),
('0808CS241085', 1, 1, 2, 4, 9, 'A', 'R2-C4-A'),
('0808IT241009', 1, 1, 2, 4, 9, 'B', 'R2-C4-B'),
('0808CS241088', 1, 1, 2, 5, 10, 'A', 'R2-C5-A'),
('0808IT241010', 1, 1, 2, 5, 10, 'B', 'R2-C5-B'),
('0808ME241001', 1, 2, 1, 1, 1, 'A', 'R1-C1-A'),
('0808AI241001', 1, 2, 1, 1, 1, 'B', 'R1-C1-B'),
('0808ME241002', 1, 2, 1, 2, 2, 'A', 'R1-C2-A'),
('0808AI241002', 1, 2, 1, 2, 2, 'B', 'R1-C2-B'),
('0808ME241003', 1, 2, 1, 3, 3, 'A', 'R1-C3-A'),
('0808AI241003', 1, 2, 1, 3, 3, 'B', 'R1-C3-B'),
('0808ME241004', 1, 2, 1, 4, 4, 'A', 'R1-C4-A'),
('0808AI241004', 1, 2, 1, 4, 4, 'B', 'R1-C4-B'),
('0808ME241005', 1, 2, 1, 5, 5, 'A', 'R1-C5-A'),
('0808AI241005', 1, 2, 1, 5, 5, 'B', 'R1-C5-B'),
('0808ME241006', 1, 2, 2, 1, 6, 'A', 'R2-C1-A'),
('0808CE241001', 1, 2, 2, 1, 6, 'B', 'R2-C1-B')
ON CONFLICT (enrollment_no, exam_id) DO NOTHING;

-- Seed Marks Moderation
INSERT INTO marks_moderation (enrollment_no, exam_id, original_marks, grace_marks, moderated_marks, moderator_id, status, remarks) VALUES
('0808CS241091', 1, 66.50, 0.00, 66.50, 2, 'Approved', 'Outstanding academic paper'),
('0808IT241001', 1, 20.50, 0.00, 20.50, 2, 'Pending', 'Borderline fail - missing 2.5 marks'),
('0808CS241070', 1, 21.00, 0.00, 21.00, 2, 'Pending', 'Borderline fail - missing 2 marks'),
('0808IT241002', 1, 54.00, 0.00, 54.00, 2, 'Approved', 'Consistent high score'),
('0808CS241071', 1, 19.50, 0.00, 19.50, 2, 'Pending', 'Borderline fail - needs 3.5 marks grace'),
('0808IT241003', 1, 47.50, 0.00, 47.50, 2, 'Approved', 'Good analytical answers'),
('0808CS241072', 1, 22.00, 0.00, 22.00, 2, 'Pending', 'Borderline fail - missing 1 mark only'),
('0808IT241004', 1, 61.00, 0.00, 61.00, 2, 'Approved', 'Exemplary performance'),
('0808CS241075', 1, 38.00, 0.00, 38.00, 2, 'Approved', 'Satisfactory completion'),
('0808IT241005', 1, 20.00, 0.00, 20.00, 2, 'Pending', 'Borderline fail - missing 3 marks'),
('0808ME241001', 1, 42.00, 0.00, 42.00, 2, 'Approved', 'Sound conceptual clarity'),
('0808AI241001', 1, 58.50, 0.00, 58.50, 2, 'Approved', 'Strong implementation section'),
('0808ME241002', 1, 33.00, 0.00, 33.00, 2, 'Approved', 'Above passing grade'),
('0808AI241002', 1, 45.00, 0.00, 45.00, 2, 'Approved', 'Well-structured diagrams'),
('0808CE241001', 1, 39.50, 0.00, 39.50, 2, 'Approved', 'Good numerical accuracy'),
('0808ME241003', 1, 49.00, 0.00, 49.00, 2, 'Approved', 'Clear step-by-step logic')
ON CONFLICT (enrollment_no, exam_id) DO NOTHING;

-- Seed Marks Audit Log
INSERT INTO marks_audit_log (moderation_id, enrollment_no, exam_id, old_marks, new_marks, grace_applied, old_status, new_status, modified_by_faculty) VALUES
(1, '0808CS241091', 1, 64.50, 66.50, 2.00, 'Pending', 'Approved', 2),
(4, '0808IT241002', 1, 52.00, 54.00, 2.00, 'Pending', 'Approved', 2),
(8, '0808IT241004', 1, 59.00, 61.00, 2.00, 'Pending', 'Approved', 2),
(12, '0808AI241001', 1, 56.50, 58.50, 2.00, 'Pending', 'Approved', 2);

-- =====================================================================
-- PERMISSIONS: Ensure all tables allow read/write access via API
-- =====================================================================
ALTER TABLE faculty DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_halls DISABLE ROW LEVEL SECURITY;
ALTER TABLE seat_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE marks_moderation DISABLE ROW LEVEL SECURITY;
ALTER TABLE marks_audit_log DISABLE ROW LEVEL SECURITY;


