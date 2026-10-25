-- =====================================================================
-- INSTITUTION: IPS Academy, Institute of Engineering & Science, Indore
-- DEPARTMENT : Department of Computer Science & Engineering (CSE)
-- STUDENT    : Darshan Jain | Enrollment: 0808CS241091 | Section: T3 (5th Sem)
-- GUIDE      : Prof. Preeti Agrawal
-- TOPIC      : University Examination & Moderation DBMS with Auto-Seat Allocation
-- SPEC       : 3NF Relational Schema, ACID Transactions, Views, Triggers,
--              Stored Procedures with Cursors, User-Defined Functions (UDF)
-- =====================================================================

DROP DATABASE IF EXISTS ips_exam_db;
CREATE DATABASE ips_exam_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ips_exam_db;

-- =====================================================================
-- TABLE 1: Faculty (Self-Join Hierarchy & Role Specialization)
-- Normalization: 3NF (No transitive dependencies; reports_to_id is a recursive FK)
-- =====================================================================
CREATE TABLE Faculty (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    designation VARCHAR(60) NOT NULL,
    role_type ENUM('Moderator', 'Invigilator', 'Controller_of_Exams') NOT NULL,
    reports_to_id INT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_faculty_reports_to FOREIGN KEY (reports_to_id)
        REFERENCES Faculty(faculty_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- TABLE 2: Students
-- Normalization: 3NF (enrollment_no is PK; all attributes depend solely on it)
-- =====================================================================
CREATE TABLE Students (
    enrollment_no VARCHAR(20) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    branch VARCHAR(20) NOT NULL DEFAULT 'CSE',
    semester INT NOT NULL DEFAULT 5 CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL DEFAULT 'T3',
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    academic_year VARCHAR(15) NOT NULL DEFAULT '2026-2027',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- TABLE 3: Exams
-- Normalization: 3NF
-- =====================================================================
CREATE TABLE Exams (
    exam_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20) NOT NULL UNIQUE,
    subject_name VARCHAR(100) NOT NULL,
    exam_date DATE NOT NULL,
    shift_time ENUM('10:00 AM - 01:00 PM', '02:00 PM - 05:00 PM') NOT NULL,
    max_marks INT NOT NULL DEFAULT 70 CHECK (max_marks > 0),
    passing_marks INT NOT NULL DEFAULT 23 CHECK (passing_marks > 0 AND passing_marks <= max_marks),
    academic_sem INT NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- TABLE 4: Exam_Halls
-- Normalization: 3NF
-- =====================================================================
CREATE TABLE Exam_Halls (
    hall_id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(30) NOT NULL UNIQUE,
    building_block VARCHAR(50) NOT NULL,
    rows_count INT NOT NULL DEFAULT 4 CHECK (rows_count > 0),
    cols_count INT NOT NULL DEFAULT 5 CHECK (cols_count > 0),
    total_capacity INT NOT NULL CHECK (total_capacity > 0),
    invigilator_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hall_invigilator FOREIGN KEY (invigilator_id)
        REFERENCES Faculty(faculty_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- TABLE 5: Seat_Allocations
-- Normalization: 3NF / BCNF (Composite unique constraints guarantee zero collision)
-- =====================================================================
CREATE TABLE Seat_Allocations (
    allocation_id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_no VARCHAR(20) NOT NULL,
    exam_id INT NOT NULL,
    hall_id INT NOT NULL,
    row_no INT NOT NULL CHECK (row_no > 0),
    col_no INT NOT NULL CHECK (col_no > 0),
    seat_label VARCHAR(15) NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alloc_student FOREIGN KEY (enrollment_no)
        REFERENCES Students(enrollment_no) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_alloc_exam FOREIGN KEY (exam_id)
        REFERENCES Exams(exam_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_alloc_hall FOREIGN KEY (hall_id)
        REFERENCES Exam_Halls(hall_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uk_student_exam UNIQUE (enrollment_no, exam_id),
    CONSTRAINT uk_hall_exam_seat UNIQUE (hall_id, exam_id, seat_label)
) ENGINE=InnoDB;

-- =====================================================================
-- TABLE 6: Marks_Moderation
-- Normalization: 3NF
-- =====================================================================
CREATE TABLE Marks_Moderation (
    moderation_id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_no VARCHAR(20) NOT NULL,
    exam_id INT NOT NULL,
    original_marks DECIMAL(5,2) NOT NULL CHECK (original_marks >= 0 AND original_marks <= 70),
    grace_marks DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (grace_marks >= 0 AND grace_marks <= 10),
    moderated_marks DECIMAL(5,2) NOT NULL CHECK (moderated_marks >= 0 AND moderated_marks <= 70),
    moderator_id INT NOT NULL,
    status ENUM('Pending', 'Grace_Applied', 'Approved', 'Flagged_Reval') NOT NULL DEFAULT 'Pending',
    remarks VARCHAR(255) DEFAULT 'Initial Evaluation',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_marks_student FOREIGN KEY (enrollment_no)
        REFERENCES Students(enrollment_no) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_marks_exam FOREIGN KEY (exam_id)
        REFERENCES Exams(exam_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_marks_moderator FOREIGN KEY (moderator_id)
        REFERENCES Faculty(faculty_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uk_student_exam_marks UNIQUE (enrollment_no, exam_id)
) ENGINE=InnoDB;

-- =====================================================================
-- TABLE 7: Marks_Audit_Log (Immutable Trigger-Driven Forensic Audit Trail)
-- Normalization: 3NF (Append-Only Event Store for ACID Audit Compliance)
-- =====================================================================
CREATE TABLE Marks_Audit_Log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    moderation_id INT NOT NULL,
    enrollment_no VARCHAR(20) NOT NULL,
    exam_id INT NOT NULL,
    old_marks DECIMAL(5,2) NOT NULL,
    new_marks DECIMAL(5,2) NOT NULL,
    grace_applied DECIMAL(5,2) NOT NULL,
    old_status VARCHAR(30) NOT NULL,
    new_status VARCHAR(30) NOT NULL,
    modified_by_faculty INT NOT NULL,
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_student FOREIGN KEY (enrollment_no)
        REFERENCES Students(enrollment_no) ON DELETE CASCADE,
    CONSTRAINT fk_audit_exam FOREIGN KEY (exam_id)
        REFERENCES Exams(exam_id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_faculty FOREIGN KEY (modified_by_faculty)
        REFERENCES Faculty(faculty_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =====================================================================
-- INDEXES FOR QUERY OPTIMIZATION & EXPLAIN DEMO
-- =====================================================================
CREATE INDEX idx_student_branch_sem ON Students(branch, semester, section);
CREATE INDEX idx_alloc_exam_hall ON Seat_Allocations(exam_id, hall_id);
CREATE INDEX idx_marks_exam_status ON Marks_Moderation(exam_id, status);
CREATE INDEX idx_audit_moderation ON Marks_Audit_Log(moderation_id);

-- =====================================================================
-- USER-DEFINED FUNCTION (UDF): fn_ComputeGrade
-- Returns letter grades according to RGPV academic grading rules
-- =====================================================================
DELIMITER //
CREATE FUNCTION fn_ComputeGrade(p_marks DECIMAL(5,2), p_max INT)
RETURNS VARCHAR(5)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_percentage DECIMAL(5,2);
    DECLARE v_grade VARCHAR(5);
    
    IF p_max <= 0 THEN
        RETURN 'NA';
    END IF;
    
    SET v_percentage = (p_marks / p_max) * 100.0;
    
    IF v_percentage >= 90.0 THEN
        SET v_grade = 'O';    -- Outstanding (10)
    ELSEIF v_percentage >= 80.0 THEN
        SET v_grade = 'A+';   -- Excellent (9)
    ELSEIF v_percentage >= 70.0 THEN
        SET v_grade = 'A';    -- Very Good (8)
    ELSEIF v_percentage >= 60.0 THEN
        SET v_grade = 'B+';   -- Good (7)
    ELSEIF v_percentage >= 50.0 THEN
        SET v_grade = 'B';    -- Above Average (6)
    ELSEIF v_percentage >= 33.0 THEN
        SET v_grade = 'C';    -- Average / Pass (5)
    ELSE
        SET v_grade = 'F';    -- Fail (0)
    END IF;
    
    RETURN v_grade;
END //
DELIMITER ;

-- =====================================================================
-- VIEW 1: v_StudentHallTicket
-- Joins 5 normalized entities to produce complete official Hall Tickets
-- =====================================================================
CREATE OR REPLACE VIEW v_StudentHallTicket AS
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
    h.building_block,
    h.room_number,
    sa.seat_label,
    sa.row_no,
    sa.col_no,
    sa.allocated_at,
    COALESCE(f.full_name, 'Exam Cell Observer') AS invigilator_name,
    COALESCE(f.faculty_code, 'FAC-EXAM') AS invigilator_code,
    COALESCE(f.phone, '0731-4014600') AS invigilator_contact
FROM Students s
INNER JOIN Seat_Allocations sa ON s.enrollment_no = sa.enrollment_no
INNER JOIN Exams e ON sa.exam_id = e.exam_id
INNER JOIN Exam_Halls h ON sa.hall_id = h.hall_id
LEFT JOIN Faculty f ON h.invigilator_id = f.faculty_id;

-- =====================================================================
-- VIEW 2: v_HallOccupancySummary
-- Aggregate View utilizing LEFT OUTER JOIN and GROUP BY for Live Capacity Analytics
-- =====================================================================
CREATE OR REPLACE VIEW v_HallOccupancySummary AS
SELECT 
    h.hall_id,
    h.room_number,
    h.building_block,
    h.rows_count,
    h.cols_count,
    h.total_capacity,
    sa.exam_id,
    e.subject_code,
    e.subject_name,
    COUNT(sa.allocation_id) AS occupied_seats,
    (h.total_capacity - COUNT(sa.allocation_id)) AS available_seats,
    ROUND((COUNT(sa.allocation_id) / h.total_capacity) * 100.0, 2) AS occupancy_percentage,
    f.full_name AS invigilator_name
FROM Exam_Halls h
LEFT JOIN Seat_Allocations sa ON h.hall_id = sa.hall_id
LEFT JOIN Exams e ON sa.exam_id = e.exam_id
LEFT JOIN Faculty f ON h.invigilator_id = f.faculty_id
GROUP BY 
    h.hall_id, h.room_number, h.building_block, h.rows_count, h.cols_count,
    h.total_capacity, sa.exam_id, e.subject_code, e.subject_name, f.full_name;

-- =====================================================================
-- TRIGGER 1: trg_CrossExamSeatConflict (BEFORE INSERT on Seat_Allocations)
-- Guard 1: Hall Capacity check
-- Guard 2: Cross-Exam Seat & Student Schedule Conflict check
-- =====================================================================
DELIMITER //
CREATE TRIGGER trg_CrossExamSeatConflict
BEFORE INSERT ON Seat_Allocations
FOR EACH ROW
BEGIN
    DECLARE v_hall_cap INT;
    DECLARE v_cur_alloc INT;
    DECLARE v_new_date DATE;
    DECLARE v_new_shift VARCHAR(30);
    DECLARE v_cross_hall_collision INT;
    DECLARE v_cross_student_collision INT;

    -- 1. Hall capacity guard
    SELECT total_capacity INTO v_hall_cap 
    FROM Exam_Halls 
    WHERE hall_id = NEW.hall_id;

    SELECT COUNT(*) INTO v_cur_alloc 
    FROM Seat_Allocations 
    WHERE hall_id = NEW.hall_id AND exam_id = NEW.exam_id;

    IF v_cur_alloc >= v_hall_cap THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TRIGGER BLOCKED: Exam Hall capacity full! Cannot allocate seat.';
    END IF;

    -- 2. Fetch new exam schedule
    SELECT exam_date, shift_time INTO v_new_date, v_new_shift 
    FROM Exams 
    WHERE exam_id = NEW.exam_id;

    -- Check if physical bench is occupied by ANY other exam on the same date and shift
    SELECT COUNT(*) INTO v_cross_hall_collision
    FROM Seat_Allocations sa2
    JOIN Exams e2 ON sa2.exam_id = e2.exam_id
    WHERE sa2.hall_id = NEW.hall_id
      AND sa2.seat_label = NEW.seat_label
      AND e2.exam_date = v_new_date
      AND e2.shift_time = v_new_shift
      AND sa2.exam_id != NEW.exam_id;

    IF v_cross_hall_collision > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TRIGGER BLOCKED: Cross-exam physical seat collision! Bench already occupied in this timeslot.';
    END IF;

    -- Check if student already has another exam scheduled at the same date and shift
    SELECT COUNT(*) INTO v_cross_student_collision
    FROM Seat_Allocations sa3
    JOIN Exams e3 ON sa3.exam_id = e3.exam_id
    WHERE sa3.enrollment_no = NEW.enrollment_no
      AND e3.exam_date = v_new_date
      AND e3.shift_time = v_new_shift
      AND sa3.exam_id != NEW.exam_id;

    IF v_cross_student_collision > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TRIGGER BLOCKED: Cross-exam student collision! Student already scheduled for another exam in this slot.';
    END IF;
END //
DELIMITER ;

-- =====================================================================
-- TRIGGER 2: trg_ValidateModerationMarks (BEFORE INSERT & BEFORE UPDATE on Marks_Moderation)
-- Automatically calculates moderated_marks = original_marks + grace_marks
-- Enforces policy: grace_marks <= 10.00 and moderated_marks <= max_marks (70)
-- =====================================================================
DELIMITER //
CREATE TRIGGER trg_ValidateModerationMarks_Insert
BEFORE INSERT ON Marks_Moderation
FOR EACH ROW
BEGIN
    DECLARE v_max_marks INT;

    SELECT max_marks INTO v_max_marks 
    FROM Exams 
    WHERE exam_id = NEW.exam_id;

    -- Enforce grace cap of 10.00
    IF NEW.grace_marks > 10.00 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TRIGGER BLOCKED: University policy caps grace marks at 10.00!';
    END IF;

    -- Calculate moderated marks
    SET NEW.moderated_marks = NEW.original_marks + NEW.grace_marks;

    -- Prevent exceeding max marks
    IF NEW.moderated_marks > v_max_marks THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TRIGGER BLOCKED: Moderated marks cannot exceed maximum subject marks (70)!';
    END IF;
END //

CREATE TRIGGER trg_ValidateModerationMarks_Update
BEFORE UPDATE ON Marks_Moderation
FOR EACH ROW
BEGIN
    DECLARE v_max_marks INT;

    SELECT max_marks INTO v_max_marks 
    FROM Exams 
    WHERE exam_id = NEW.exam_id;

    IF NEW.grace_marks > 10.00 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TRIGGER BLOCKED: University policy caps grace marks at 10.00!';
    END IF;

    SET NEW.moderated_marks = NEW.original_marks + NEW.grace_marks;

    IF NEW.moderated_marks > v_max_marks THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'TRIGGER BLOCKED: Moderated marks cannot exceed maximum subject marks (70)!';
    END IF;
END //
DELIMITER ;

-- =====================================================================
-- TRIGGER 3: trg_MarksAuditLog (AFTER UPDATE on Marks_Moderation)
-- Automatically inserts audit record for forensic traceability
-- =====================================================================
DELIMITER //
CREATE TRIGGER trg_MarksAuditLog
AFTER UPDATE ON Marks_Moderation
FOR EACH ROW
BEGIN
    IF (OLD.grace_marks != NEW.grace_marks OR OLD.moderated_marks != NEW.moderated_marks OR OLD.status != NEW.status) THEN
        INSERT INTO Marks_Audit_Log (
            moderation_id,
            enrollment_no,
            exam_id,
            old_marks,
            new_marks,
            grace_applied,
            old_status,
            new_status,
            modified_by_faculty,
            action_timestamp
        ) VALUES (
            NEW.moderation_id,
            NEW.enrollment_no,
            NEW.exam_id,
            OLD.moderated_marks,
            NEW.moderated_marks,
            NEW.grace_marks,
            OLD.status,
            NEW.status,
            NEW.moderator_id,
            NOW()
        );
    END IF;
END //
DELIMITER ;

-- =====================================================================
-- STORED PROCEDURE 1: sp_AutoAllocateSeats
-- Features: Nested Cursors, Transaction Control, Error Handling
-- =====================================================================
DELIMITER //
CREATE PROCEDURE sp_AutoAllocateSeats(
    IN p_exam_id INT,
    OUT p_allocated_count INT,
    OUT p_message VARCHAR(255)
)
proc_body: BEGIN
    -- Loop variables
    DECLARE v_done_students INT DEFAULT FALSE;
    DECLARE v_done_halls INT DEFAULT FALSE;
    DECLARE v_cur_enrollment VARCHAR(20);
    DECLARE v_hall_id INT;
    DECLARE v_rows INT;
    DECLARE v_cols INT;
    DECLARE v_cap INT;
    DECLARE v_curr_row INT;
    DECLARE v_curr_col INT;
    DECLARE v_seat_label VARCHAR(15);
    DECLARE v_seats_in_hall INT;
    
    -- Cursor for unallocated students
    DECLARE cur_students CURSOR FOR
        SELECT s.enrollment_no
        FROM Students s
        WHERE s.enrollment_no NOT IN (
            SELECT sa.enrollment_no 
            FROM Seat_Allocations sa 
            WHERE sa.exam_id = p_exam_id
        )
        ORDER BY s.enrollment_no ASC;
        
    -- Cursor for exam halls
    DECLARE cur_halls CURSOR FOR
        SELECT hall_id, rows_count, cols_count, total_capacity
        FROM Exam_Halls
        ORDER BY hall_id ASC;
        
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done_students = TRUE;
    
    -- ACID Exception Handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_allocated_count = 0;
        SET p_message = 'ERROR: Database exception caught during allocation. Transaction rolled back!';
    END;

    SET p_allocated_count = 0;

    -- Validate exam exists
    IF (SELECT COUNT(*) FROM Exams WHERE exam_id = p_exam_id) = 0 THEN
        SET p_message = 'ERROR: Specified Exam ID does not exist.';
        LEAVE proc_body;
    END IF;

    START TRANSACTION;

    OPEN cur_students;
    OPEN cur_halls;

    hall_loop: LOOP
        FETCH cur_halls INTO v_hall_id, v_rows, v_cols, v_cap;
        IF v_done_students THEN
            LEAVE hall_loop;
        END IF;

        SET v_curr_row = 1;
        SET v_curr_col = 1;
        SET v_seats_in_hall = 0;

        -- Iterate seats in this hall
        row_loop: WHILE v_curr_row <= v_rows DO
            SET v_curr_col = 1;
            col_loop: WHILE v_curr_col <= v_cols DO
                IF v_seats_in_hall >= v_cap THEN
                    LEAVE row_loop;
                END IF;

                SET v_seat_label = CONCAT('R', v_curr_row, '-C', v_curr_col);

                -- Check if this bench is already occupied in this hall for this exam
                IF NOT EXISTS (
                    SELECT 1 FROM Seat_Allocations 
                    WHERE hall_id = v_hall_id AND exam_id = p_exam_id AND seat_label = v_seat_label
                ) THEN
                    FETCH cur_students INTO v_cur_enrollment;
                    IF v_done_students THEN
                        LEAVE hall_loop;
                    END IF;

                    INSERT INTO Seat_Allocations (
                        enrollment_no, exam_id, hall_id, row_no, col_no, seat_label, allocated_at
                    ) VALUES (
                        v_cur_enrollment, p_exam_id, v_hall_id, v_curr_row, v_curr_col, v_seat_label, NOW()
                    );

                    SET p_allocated_count = p_allocated_count + 1;
                    SET v_seats_in_hall = v_seats_in_hall + 1;
                END IF;

                SET v_curr_col = v_curr_col + 1;
            END WHILE col_loop;
            SET v_curr_row = v_curr_row + 1;
        END WHILE row_loop;

    END LOOP hall_loop;

    CLOSE cur_halls;
    CLOSE cur_students;

    COMMIT;
    SET p_message = CONCAT('SUCCESS: Successfully allocated ', p_allocated_count, ' students into exam halls.');
END //
DELIMITER ;

-- =====================================================================
-- STORED PROCEDURE 2: sp_AutoModerateBorderline
-- Features: ACID Transaction, Row-Level Locking (FOR UPDATE), Borderline Grace
-- =====================================================================
DELIMITER //
CREATE PROCEDURE sp_AutoModerateBorderline(
    IN p_exam_id INT,
    IN p_max_grace_allowed DECIMAL(5,2),
    OUT p_upgraded_count INT
)
BEGIN
    DECLARE v_pass_marks INT DEFAULT 23;
    DECLARE v_min_eligible DECIMAL(5,2);

    -- Exception Handler with Rollback
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_upgraded_count = -1;
    END;

    SET p_upgraded_count = 0;

    -- Retrieve pass mark for the exam
    SELECT passing_marks INTO v_pass_marks 
    FROM Exams 
    WHERE exam_id = p_exam_id;

    -- Borderline threshold: [passing_marks - p_max_grace_allowed, passing_marks - 1]
    SET v_min_eligible = v_pass_marks - p_max_grace_allowed;

    START TRANSACTION;

    -- Create Savepoint
    SAVEPOINT sp_before_grace;

    -- Update eligible borderline failures using explicit calculation
    UPDATE Marks_Moderation
    SET 
        grace_marks = (v_pass_marks - original_marks),
        status = 'Grace_Applied',
        remarks = CONCAT('Auto-Moderated via Borderline Policy (Grace: +', (v_pass_marks - original_marks), ')')
    WHERE exam_id = p_exam_id
      AND original_marks >= v_min_eligible
      AND original_marks < v_pass_marks
      AND status != 'Approved';

    SET p_upgraded_count = ROW_COUNT();

    COMMIT;
END //
DELIMITER ;
