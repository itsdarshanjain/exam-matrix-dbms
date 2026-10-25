# 📋 INSTRUCTIONS & MASTER PROMPT FOR CLAUDE (WEB CHAT)

To generate the most exhaustive, technically rigorous, high-scoring DBMS Major Project Report that strictly follows the format sent by your faculty guide (Mam), follow these simple steps:

---

## 🚀 STEP-BY-STEP INSTRUCTIONS

1. **Open Claude Website**: Go to [claude.ai](https://claude.ai) and start a fresh chat (use Claude 3.7 Sonnet or Claude 3.5 Sonnet / Opus).
2. **Upload the Two Files**:
   * File 1: `dbms project report format july 2026.docx` (The format document from Mam)
   * File 2: `PROJECT_CONTEXT_FOR_CLAUDE_REPORT.md` (The comprehensive technical context document we generated)
3. **Copy & Paste the Master Prompt Below** into the Claude prompt box and press **Enter**.

---

## 📝 MASTER PROMPT TO PASTE INTO CLAUDE

```text
Act as a Senior Professor of Computer Science & Engineering and an expert technical author specializing in Relational Database Management Systems (RDBMS).

I have uploaded two files:
1. `dbms project report format july 2026.docx`: The official project report format prescribed by my faculty guide (Prof. Preeti Agrawal) at IPS Academy Indore.
2. `PROJECT_CONTEXT_FOR_CLAUDE_REPORT.md`: The complete technical architecture, normalized schema, SQL triggers, stored procedures, algorithms, class structures, and UI breakdown of my project "ExamMatrix ERP - University Examination & Moderation DBMS with Auto-Seat Allocation".

### YOUR MISSION:
Generate the COMPLETE, EXHAUSTIVE, ACADEMICALLY RIGOROUS, AND PUBLICATION-GRADE MAJOR DBMS PROJECT REPORT. It must strictly adhere to the exact format, chapter headings, and numbering provided in `dbms project report format july 2026.docx`.

### MANDATORY REPORT STRUCTURE TO FOLLOW:

1. COVER / TITLE PAGE:
   - Institute: IPS ACADEMY INDORE
   - Department: INSTITUTE OF ENGINEERING & SCIENCE COMPUTER SCIENCE & ENGINEERING DEPARTMENT
   - Session: Project Report (2026-27)
   - Subject: Database Management System (CS-501)
   - Project Title: University Examination & Moderation DBMS with Auto-Seat Allocation (ExamMatrix ERP)
   - Submitted by: Darshan Jain (Enrollment Number: 0808CS241091)
   - Semester & Section: 5th Semester, CSE Section T3
   - Under the Guidance of: Prof. Preeti Agrawal (Associate Professor & Chief Exam Moderator)

2. CHAPTER 1: INTRODUCTION
   - 1.1 Overview (Provide a deep, academic overview explaining why pure relational databases with engine-level triggers, 3NF normalization, spatial seating algorithms, and forensic audit logging are superior to ORMs and NoSQL for university examination cells).

3. CHAPTER 2: PROBLEM IDENTIFICATION & FEASIBILITY ANALYSIS
   - 2.1 Problem Domain (Analyze examination logistics, spatial copying on dual benches, capacity overflows, manual grace marks corruption, and lack of forensic auditability).
   - 2.2 Solution Domain (Explain multi-queue round-robin branch interleaving, database engine triggers with SQLSTATE '45000', ACID stored procedures with savepoints, and append-only audit logs).
   - 2.3 Need & Scope (Detail statutory RGPV compliance, administrative efficiency, in-scope features, and out-of-scope boundaries).
   - 2.4 Platform Specification:
     * Hardware Specification (Processor, RAM, NVMe SSD, Display, Network).
     * Software Specification (PostgreSQL 15 / MySQL 8.0, Node.js 24, Express 4.21, React 18, Vite 5.4, Tailwind CSS 3.4, Dotenv, Postman).
     * Complete Feasibility Analysis (Technical Feasibility, Operational Feasibility, Economic Feasibility, Schedule Feasibility).

4. CHAPTER 3: SYSTEM DESIGN
   - 3.1 ER Diagram:
     * Entity definitions for all 7 normalized relations (Faculty, Students, Exams, Exam_Halls, Seat_Allocations, Marks_Moderation, Marks_Audit_Log).
     * Primary keys, foreign keys, constraints (CHECK, UNIQUE).
     * Relationships, cardinalities (1:N, recursive unary hierarchy, composite unique keys).
     * Mathematical Normalization Proof (1NF, 2NF, 3NF, BCNF).
     * Provide both a clean Mermaid ER Diagram and an ASCII Relational Schema table.
   - 3.2 Class Diagram:
     * Object-Oriented Domain Model showing classes for Student, Faculty, Exam, ExamHall, SeatAllocation, MarksModeration, MarksAuditLog, plus Controllers and Services.
     * Full member attributes (visibility +/-), method signatures, and multi-class associations.
     * Provide a comprehensive Mermaid Class Diagram and a textual description of methods and dependencies.
   - 3.3 Application Interface:
     * Deep architectural and UI/UX breakdown of all 6 application views:
       1. Executive Dashboard (Key performance metrics, RGPV grade distribution, live health).
       2. 2D Anti-Cheating Seat Matrix (Hall occupancy progress bars, 2D bench grid with Seat A/B, color-coded branch badges, anti-cheat validation tags, trigger test buttons).
       3. Students Management Directory (CRUD operations, search/filter, CSV batch import).
       4. Exam Halls Management (Room dimensions, capacity calculations, invigilator assignments).
       5. Official Student Admit Card / Hall Ticket (University seal, candidate photo block, schedule table, allocated bench label, invigilator signature block, @media print A4 layout).
       6. Marks Moderation & Forensic Audit Trail (Borderline grace procedure sp_AutoModerateBorderline, manual review modal, immutable audit log table).
     * Describe the Live SQL X-Ray Drawer (real-time query latency and transaction states) and the Trigger Alert Interception Modal (SQLSTATE '45000').

5. CHAPTER 4: CONCLUSIONS
   - Thoroughly synthesize the academic, relational, and administrative triumphs of the system, emphasizing zero-ORM pure SQL integrity, 100% ACID compliance, and real-world deployment viability.

6. CHAPTER 5: LIMITATIONS & FUTURE ENHANCEMENTS
   - Limitations (Non-rectangular hall geometry, static branch ratios, absence of hardware biometrics).
   - Future Enhancements (IoT RFID smart turnstiles, AI genetic algorithm for proctor scheduling, blockchain-backed cryptographic audit ledger, mobile PWA).

7. APPENDIX / TECHNICAL SQL ARTIFACTS:
   - Full DDL schema for all 7 tables.
   - Complete PL/pgSQL & MySQL Trigger definitions (trg_check_bench_branch_conflict, trg_check_room_capacity, trg_log_marks_moderation).
   - Complete Stored Procedure (sp_AutoModerateBorderline) and UDF (fn_ComputeGrade).
   - Multi-table joined Relational Views (v_student_hall_ticket, v_hall_occupancy_summary).

### WRITING GUIDELINES:
- Write in full, highly formal academic English suitable for university evaluation.
- No placeholders like "[insert text here]" or "[etc.]". Every single section must be fully written out in complete detail.
- Present data dictionaries, technology stacks, and feasibility parameters in clear Markdown tables.
- Render all diagrams using clean Mermaid code blocks and ASCII representations.
- Keep the tone scholarly, authoritative, and deeply grounded in database internals.
```
