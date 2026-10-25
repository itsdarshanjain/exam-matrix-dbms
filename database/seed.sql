-- =====================================================================
-- INSTITUTION: IPS Academy, Institute of Engineering & Science, Indore
-- DEPARTMENT : Department of Computer Science & Engineering (CSE)
-- SEED DATA  : IPS Academy CSE 5th Semester Section T3
-- STUDENT    : Darshan Jain (0808CS241091) + 24 Classmates
-- GUIDE      : Prof. Preeti Agrawal (Chief Exam Moderator)
-- =====================================================================

USE ips_exam_db;

-- Clear previous records in foreign-key safe order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Marks_Audit_Log;
TRUNCATE TABLE Marks_Moderation;
TRUNCATE TABLE Seat_Allocations;
TRUNCATE TABLE Exam_Halls;
TRUNCATE TABLE Exams;
TRUNCATE TABLE Students;
TRUNCATE TABLE Faculty;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- 1. SEED FACULTY (Hierarchical Self-Join Structure)
-- =====================================================================
INSERT INTO Faculty (faculty_id, faculty_code, full_name, designation, role_type, reports_to_id, email, phone) VALUES
(1, 'FAC-001', 'Dr. Vivek Shrivastava', 'Professor & Controller of Examinations', 'Controller_of_Exams', NULL, 'coe@ipsacademy.org', '9826011223'),
(2, 'FAC-002', 'Prof. Preeti Agrawal', 'Associate Professor & Chief Exam Moderator', 'Moderator', 1, 'preeti.agrawal@ipsacademy.org', '9826022334'),
(3, 'FAC-003', 'Prof. Neha Sharma', 'Assistant Professor & Exam Invigilator', 'Invigilator', 2, 'neha.sharma@ipsacademy.org', '9826033445'),
(4, 'FAC-004', 'Prof. Rajesh Kumar', 'Assistant Professor & Exam Invigilator', 'Invigilator', 2, 'rajesh.kumar@ipsacademy.org', '9826044556'),
(5, 'FAC-005', 'Prof. Amit Verma', 'Assistant Professor & Exam Invigilator', 'Invigilator', 2, 'amit.verma@ipsacademy.org', '9826055667');

-- =====================================================================
-- 2. SEED STUDENTS (Darshan Jain 0808CS241091 + 24 Section T3 Classmates)
-- =====================================================================
INSERT INTO Students (enrollment_no, full_name, branch, semester, section, email, phone) VALUES
('0808CS241070', 'Aarav Patel', 'CSE', 5, 'T3', 'aarav.patel@ipsacademy.org', '9876500001'),
('0808CS241071', 'Aditi Joshi', 'CSE', 5, 'T3', 'aditi.joshi@ipsacademy.org', '9876500002'),
('0808CS241072', 'Aman Sharma', 'CSE', 5, 'T3', 'aman.sharma@ipsacademy.org', '9876500003'),
('0808CS241075', 'Ananya Gupta', 'CSE', 5, 'T3', 'ananya.gupta@ipsacademy.org', '9876500004'),
('0808CS241078', 'Aniket Verma', 'CSE', 5, 'T3', 'aniket.verma@ipsacademy.org', '9876500005'),
('0808CS241080', 'Anushka Chouhan', 'CSE', 5, 'T3', 'anushka.c@ipsacademy.org', '9876500006'),
('0808CS241082', 'Aryan Sen', 'CSE', 5, 'T3', 'aryan.sen@ipsacademy.org', '9876500007'),
('0808CS241085', 'Ayush Rathore', 'CSE', 5, 'T3', 'ayush.r@ipsacademy.org', '9876500008'),
('0808CS241088', 'Bhavya Tiwari', 'CSE', 5, 'T3', 'bhavya.t@ipsacademy.org', '9876500009'),
('0808CS241090', 'Chetan Malviya', 'CSE', 5, 'T3', 'chetan.m@ipsacademy.org', '9876500010'),
-- PRIMARY STUDENT RECORD
('0808CS241091', 'Darshan Jain', 'CSE', 5, 'T3', 'darshan.jain@ipsacademy.org', '9826191091'),
('0808CS241092', 'Deepak Yadav', 'CSE', 5, 'T3', 'deepak.yadav@ipsacademy.org', '9876500012'),
('0808CS241095', 'Devansh Soni', 'CSE', 5, 'T3', 'devansh.soni@ipsacademy.org', '9876500013'),
('0808CS241097', 'Divya Dubey', 'CSE', 5, 'T3', 'divya.dubey@ipsacademy.org', '9876500014'),
('0808CS241100', 'Gaurav Parmar', 'CSE', 5, 'T3', 'gaurav.parmar@ipsacademy.org', '9876500015'),
('0808CS241102', 'Harshita Mehra', 'CSE', 5, 'T3', 'harshita.m@ipsacademy.org', '9876500016'),
('0808CS241104', 'Ishita Trivedi', 'CSE', 5, 'T3', 'ishita.t@ipsacademy.org', '9876500017'),
('0808CS241106', 'Karan Jaiswal', 'CSE', 5, 'T3', 'karan.j@ipsacademy.org', '9876500018'),
('0808CS241108', 'Khushi Gehlot', 'CSE', 5, 'T3', 'khushi.g@ipsacademy.org', '9876500019'),
('0808CS241110', 'Manish Solanki', 'CSE', 5, 'T3', 'manish.s@ipsacademy.org', '9876500020'),
('0808CS241111', 'Neha Mandloi', 'CSE', 5, 'T3', 'neha.m@ipsacademy.org', '9876500021'),
('0808CS241112', 'Piyush Nema', 'CSE', 5, 'T3', 'piyush.n@ipsacademy.org', '9876500022'),
('0808CS241113', 'Pranjal Saxena', 'CSE', 5, 'T3', 'pranjal.s@ipsacademy.org', '9876500023'),
('0808CS241114', 'Rohan Upadhyay', 'CSE', 5, 'T3', 'rohan.u@ipsacademy.org', '9876500024'),
('0808CS241115', 'Tanvi Mahajan', 'CSE', 5, 'T3', 'tanvi.m@ipsacademy.org', '9876500025');

-- =====================================================================
-- 3. SEED EXAMS (4 Core 5th Sem Theory Subjects)
-- =====================================================================
INSERT INTO Exams (exam_id, subject_code, subject_name, exam_date, shift_time, max_marks, passing_marks, academic_sem) VALUES
(1, 'CS-501', 'Database Management Systems', '2026-11-10', '10:00 AM - 01:00 PM', 70, 23, 5),
(2, 'CS-502', 'Theory of Computation', '2026-11-12', '10:00 AM - 01:00 PM', 70, 23, 5),
(3, 'CS-503', 'Cyber Security & Forensic', '2026-11-14', '10:00 AM - 01:00 PM', 70, 23, 5),
(4, 'CS-504', 'Internet & Web Technology', '2026-11-17', '02:00 PM - 05:00 PM', 70, 23, 5);

-- =====================================================================
-- 4. SEED EXAM HALLS
-- =====================================================================
INSERT INTO Exam_Halls (hall_id, room_number, building_block, rows_count, cols_count, total_capacity, invigilator_id) VALUES
(1, 'Block-A Room 301', 'Block-A (Academic Complex)', 4, 5, 20, 3),
(2, 'Block-A Room 302', 'Block-A (Academic Complex)', 4, 5, 20, 4),
(3, 'Block-B Lab 104', 'Block-B (Computing Center)', 3, 5, 15, 5);

-- =====================================================================
-- 5. SEED INITIAL SEAT ALLOCATIONS FOR EXAM 1 (CS-501 DBMS)
-- 20 students in Room 301, remaining 5 students in Room 302
-- Note: Darshan Jain is assigned R1-C1 in Room 301!
-- =====================================================================
INSERT INTO Seat_Allocations (enrollment_no, exam_id, hall_id, row_no, col_no, seat_label) VALUES
-- Room 301 (First 20 students)
('0808CS241091', 1, 1, 1, 1, 'R1-C1'), -- DARSHAN JAIN
('0808CS241070', 1, 1, 1, 2, 'R1-C2'),
('0808CS241071', 1, 1, 1, 3, 'R1-C3'),
('0808CS241072', 1, 1, 1, 4, 'R1-C4'),
('0808CS241075', 1, 1, 1, 5, 'R1-C5'),

('0808CS241078', 1, 1, 2, 1, 'R2-C1'),
('0808CS241080', 1, 1, 2, 2, 'R2-C2'),
('0808CS241082', 1, 1, 2, 3, 'R2-C3'),
('0808CS241085', 1, 1, 2, 4, 'R2-C4'),
('0808CS241088', 1, 1, 2, 5, 'R2-C5'),

('0808CS241090', 1, 1, 3, 1, 'R3-C1'),
('0808CS241092', 1, 1, 3, 2, 'R3-C2'),
('0808CS241095', 1, 1, 3, 3, 'R3-C3'),
('0808CS241097', 1, 1, 3, 4, 'R3-C4'),
('0808CS241100', 1, 1, 3, 5, 'R3-C5'),

('0808CS241102', 1, 1, 4, 1, 'R4-C1'),
('0808CS241104', 1, 1, 4, 2, 'R4-C2'),
('0808CS241106', 1, 1, 4, 3, 'R4-C3'),
('0808CS241108', 1, 1, 4, 4, 'R4-C4'),
('0808CS241110', 1, 1, 4, 5, 'R4-C5'),

-- Room 302 (Remaining 5 students)
('0808CS241111', 1, 2, 1, 1, 'R1-C1'),
('0808CS241112', 1, 2, 1, 2, 'R1-C2'),
('0808CS241113', 1, 2, 1, 3, 'R1-C3'),
('0808CS241114', 1, 2, 1, 4, 'R1-C4'),
('0808CS241115', 1, 2, 1, 5, 'R1-C5');

-- Also seed Exam 2, 3, 4 for Darshan Jain so his Hall Ticket shows all scheduled papers
INSERT INTO Seat_Allocations (enrollment_no, exam_id, hall_id, row_no, col_no, seat_label) VALUES
('0808CS241091', 2, 1, 1, 1, 'R1-C1'), -- TOC
('0808CS241091', 3, 1, 1, 1, 'R1-C1'), -- Cyber Security
('0808CS241091', 4, 2, 1, 3, 'R1-C3'); -- Web Tech

-- =====================================================================
-- 6. SEED MARKS MODERATION (Realistic Marks with Borderline Failures for Viva Demo)
-- Passing marks is 23/70.
-- Borderline range: 18.00 to 22.00 (Eligible for auto-grace moderation)
-- Outright fail: < 18.00
-- =====================================================================
INSERT INTO Marks_Moderation (enrollment_no, exam_id, original_marks, grace_marks, moderated_marks, moderator_id, status, remarks) VALUES
-- DARSHAN JAIN: Outstanding high scores
('0808CS241091', 1, 64.50, 0.00, 64.50, 2, 'Approved', 'Outstanding analytical answers'),
('0808CS241091', 2, 61.00, 0.00, 61.00, 2, 'Approved', 'Excellent formal grammar proofs'),
('0808CS241091', 3, 66.00, 0.00, 66.00, 2, 'Approved', 'Flawless cryptography implementation'),
('0808CS241091', 4, 68.00, 0.00, 68.00, 2, 'Approved', 'Full stack project perfection'),

-- BORDERLINE FAILURE DEMO CASES FOR CS-501 (DBMS):
-- 18.5, 19.0, 20.0, 21.0, 22.0 marks (Can be upgraded live by CALL sp_AutoModerateBorderline)
('0808CS241070', 1, 20.50, 0.00, 20.50, 2, 'Pending', 'Borderline evaluation - viva review needed'),
('0808CS241071', 1, 48.00, 0.00, 48.00, 2, 'Approved', 'Consistent performance'),
('0808CS241072', 1, 21.00, 0.00, 21.00, 2, 'Pending', 'Borderline fail - missing 2 marks'),
('0808CS241075', 1, 55.50, 0.00, 55.50, 2, 'Approved', 'Strong relational algebra solutions'),
('0808CS241078', 1, 19.00, 0.00, 19.00, 2, 'Pending', 'Borderline fail - needs 4 marks grace'),
('0808CS241080', 1, 42.00, 0.00, 42.00, 2, 'Approved', 'Good SQL query concepts'),
('0808CS241082', 1, 22.00, 0.00, 22.00, 2, 'Pending', 'Borderline fail - missing 1 mark for pass'),
('0808CS241085', 1, 14.00, 0.00, 14.00, 2, 'Pending', 'Critically below pass mark - non-eligible'),
('0808CS241088', 1, 38.00, 0.00, 38.00, 2, 'Approved', 'Normal pass grade'),
('0808CS241090', 1, 18.50, 0.00, 18.50, 2, 'Pending', 'Borderline fail - 4.5 marks gap'),
('0808CS241092', 1, 52.00, 0.00, 52.00, 2, 'Approved', 'Satisfactory concurrency control theory'),
('0808CS241095', 1, 19.50, 0.00, 19.50, 2, 'Pending', 'Borderline fail - eligible for 3.5 grace'),
('0808CS241097', 1, 58.00, 0.00, 58.00, 2, 'Approved', 'Very good indexing and B+ Tree answer'),
('0808CS241100', 1, 31.00, 0.00, 31.00, 2, 'Approved', 'Passed safely'),
('0808CS241102', 1, 21.50, 0.00, 21.50, 2, 'Pending', 'Borderline fail - 1.5 marks needed'),
('0808CS241104', 1, 45.00, 0.00, 45.00, 2, 'Approved', 'Solid normal forms explanation'),
('0808CS241106', 1, 12.00, 0.00, 12.00, 2, 'Pending', 'Outright fail - insufficient attempts'),
('0808CS241108', 1, 36.50, 0.00, 36.50, 2, 'Approved', 'Passed'),
('0808CS241110', 1, 20.00, 0.00, 20.00, 2, 'Pending', 'Borderline fail - 3 marks needed'),
('0808CS241111', 1, 49.00, 0.00, 49.00, 2, 'Approved', 'Clear transaction isolation level'),
('0808CS241112', 1, 22.00, 0.00, 22.00, 2, 'Pending', 'Borderline fail - 1 mark needed'),
('0808CS241113', 1, 53.00, 0.00, 53.00, 2, 'Approved', 'Well explained ACID properties'),
('0808CS241114', 1, 19.00, 0.00, 19.00, 2, 'Pending', 'Borderline fail - 4 marks needed'),
('0808CS241115', 1, 41.00, 0.00, 41.00, 2, 'Approved', 'Passed comfortably');

-- Also seed some marks for other exams
INSERT INTO Marks_Moderation (enrollment_no, exam_id, original_marks, grace_marks, moderated_marks, moderator_id, status, remarks) VALUES
('0808CS241070', 2, 35.00, 0.00, 35.00, 2, 'Approved', 'TOC initial grading'),
('0808CS241071', 2, 44.00, 0.00, 44.00, 2, 'Approved', 'TOC initial grading'),
('0808CS241072', 2, 19.00, 0.00, 19.00, 2, 'Pending', 'TOC borderline'),
('0808CS241075', 2, 51.00, 0.00, 51.00, 2, 'Approved', 'TOC initial grading'),
('0808CS241070', 3, 40.00, 0.00, 40.00, 2, 'Approved', 'Cyber Sec grading'),
('0808CS241071', 3, 56.00, 0.00, 56.00, 2, 'Approved', 'Cyber Sec grading'),
('0808CS241070', 4, 38.00, 0.00, 38.00, 2, 'Approved', 'Web Tech grading'),
('0808CS241071', 4, 60.00, 0.00, 60.00, 2, 'Approved', 'Web Tech grading');

-- =====================================================================
-- 7. SEED INITIAL AUDIT LOG RECORD (Demonstrates Audit Trail)
-- =====================================================================
INSERT INTO Marks_Audit_Log (moderation_id, enrollment_no, exam_id, old_marks, new_marks, grace_applied, old_status, new_status, modified_by_faculty, action_timestamp) VALUES
(1, '0808CS241091', 1, 62.50, 64.50, 2.00, 'Pending', 'Approved', 2, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, '0808CS241091', 2, 60.00, 61.00, 1.00, 'Pending', 'Approved', 2, DATE_SUB(NOW(), INTERVAL 1 HOUR));
