# FULL REBUILD PLAN — University Examination and Moderation DBMS

> **Student:** Darshan Jain | **Enrollment:** 0808CS241091 | **Section:** T3 (Sem 5)
> **Guide:** Prof. Preeti Agrawal | **College:** IPS Academy, Indore
> **Topic:** University Examination and Moderation DBMS with Auto-Seat Allocation

---

## WHAT EXISTS RIGHT NOW (Current State Analysis)

### Tech Stack
- **Frontend:** React (Vite) + Tailwind CSS + Lucide Icons
- **Backend:** Express.js (Node) on port 5000
- **Database:** MySQL 8.0 (with in-memory JS fallback when MySQL isnt running)
- **DB Name:** `ips_exam_db`

### Current Files Structure
```
DBMS Project/
  database/
    schema.sql          (593 lines - 7 tables, 2 views, 3 triggers, 2 SPs, 1 UDF, indexes)
    seed.sql            (seed data)
  backend/
    server.js           (Express server, port 5000)
    src/
      config/db.js    (232 lines - MySQL pool + full in-memory engine fallback)
      routes/api.js   (all API routes)
      controllers/
        allocationController.js
        analyticsController.js
        hallTicketController.js
        moderationController.js
  frontend/
    src/
      App.jsx         (main app with 4 tabs)
      index.css       (Tailwind + print styles)
      main.jsx
      components/
        Header.jsx
        SeatMatrixView.jsx
        HallTicketView.jsx
        ModerationView.jsx
        VivaExplorerView.jsx
        SqlXRayDrawer.jsx
        TriggerAlertModal.jsx
```

### Schema (7 Tables in 3NF)
1. **Faculty** - Self-join hierarchy (reports_to_id FK to itself)
2. **Students** - 25 CSE students
3. **Exams** - 4 subjects (CS-501 to CS-504)
4. **Exam_Halls** - 3 halls (Room 301, 302, Lab 104)
5. **Seat_Allocations** - Composite unique constraints
6. **Marks_Moderation** - Grace marks, status, moderator FK
7. **Marks_Audit_Log** - Immutable trigger-driven audit trail

### DB Objects
- **Views (2):** `v_StudentHallTicket` (5-table JOIN), `v_HallOccupancySummary` (aggregate)
- **Triggers (3):** `trg_CrossExamSeatConflict` (BEFORE INSERT), `trg_ValidateModerationMarks_Insert/Update` (BEFORE INSERT/UPDATE), `trg_MarksAuditLog` (AFTER UPDATE)
- **Stored Procedures (2):** `sp_AutoAllocateSeats` (nested cursors), `sp_AutoModerateBorderline` (ACID transaction with savepoints)
- **UDF (1):** `fn_ComputeGrade` (RGPV grading)
- **Indexes (4):** Composite indexes for query optimization

### Current 4 Tabs/Pages
1. **Seating Plan** - Auto-allocate via SP, view seat matrix grid, test trigger (overfill/collision)
2. **Hall Ticket** - Search enrollment to get admit card + grade card
3. **Moderation** - Auto-grace borderline students, manual grace editing, audit log table
4. **Viva Explorer** - 5 predefined queries (Self-Join, Outer Join, Division, 3NF Proof, EXPLAIN)

---

## PROBLEMS WITH CURRENT STATE

1. **Too click-and-done** - You click Assign Seats, done. Click Auto-Grace, done. Nothing more to show.
2. **No Dashboard/Landing page** - App jumps straight into a tab. No overview of what the system is.
3. **No ER Diagram page** - Cant explain your schema visually to mam.
4. **No login/role system** - Everything is open, no concept of admin vs student role.
5. **UI is functional but not impressive** - White cards on grey background, no wow animations, no hero section.
6. **SeatMatrixView.jsx is minified** - All code on single lines, hard to explain in viva.
7. **No About Project section** - Cant explain the DBMS concepts used to mam.
8. **SQL X-Ray drawer exists but no one knows** - Hidden at bottom, easy to miss.
9. **No data statistics/charts** - No visual analytics (pass/fail pie charts, grade distribution bars).
10. **The app doesnt TELL a story** - It should guide mam through: Heres the schema, heres how allocation works, heres how triggers protect data, heres audit trail, heres the result.

---

## THE FULL REBUILD PLAN

### GOAL: Make it showcase-worthy - impressive UI, every DBMS concept visible, can explain each thing to mam.

---

## PHASE 1: NEW LANDING/DASHBOARD PAGE (New Tab: Dashboard)

### What to build:
A beautiful **Dashboard** page that acts as the home/landing screen. This is the FIRST thing mam sees.

**File to modify:** `frontend/src/App.jsx`
**New file:** `frontend/src/components/DashboardView.jsx`

#### Dashboard sections:

1. **Hero Banner** - Large title: University Examination and Moderation DBMS, subtitle with student name, enrollment, guide name, college. Beautiful gradient background (dark indigo to violet). IPS Academy branding.

2. **Project Summary Cards** (4 cards in a grid):
   - 7 Tables in 3NF - Lists all tables
   - 3 Active Triggers - Lists trigger names
   - 2 Stored Procedures - SP names
   - 2 Views + 1 UDF - View and function names

3. **Live Database Stats** (fetched from API):
   - Total Students: 25
   - Total Exams: 4
   - Total Halls: 3 (Capacity: 55)
   - Seats Allocated: X
   - Marks Entered: X
   - Audit Log Events: X

4. **DBMS Concepts Used** - A visual list/grid showing all DBMS concepts with icons:
   - 3NF Normalization
   - ACID Transactions
   - Stored Procedures (with Cursors)
   - BEFORE and AFTER Triggers
   - Views (Multi-Table JOINs)
   - User-Defined Functions
   - Foreign Keys and Cascades
   - CHECK Constraints
   - Composite Unique Constraints
   - Self-Join (Recursive FK)
   - Indexes for Optimization
   - SAVEPOINT and Transaction Control
   - SIGNAL SQLSTATE Error Handling
   - Relational Division

5. **Quick Navigation Cards** - Beautiful cards linking to each tab with description:
   - Seating Plan - Auto-allocate seats using nested-cursor stored procedure
   - Hall Ticket - View and print admit cards from 5-table JOIN view
   - Moderation - Grace marks engine with ACID transactions and audit trail
   - Viva Explorer - Live relational algebra queries and EXPLAIN plans
   - ER Diagram - Visual schema with relationships
   - About Project - Full project explanation for viva

---

## PHASE 2: ER DIAGRAM PAGE (New Tab: Schema)

### What to build:
A visual ER Diagram page where you can show mam the entire database schema.

**New file:** `frontend/src/components/SchemaView.jsx`

#### Sections:

1. **Interactive ER Diagram** - Use a hand-crafted SVG or CSS-grid based diagram showing:
   - All 7 tables as boxes with columns listed
   - FK arrows connecting tables (color-coded)
   - Self-join arrow on Faculty table
   - PK highlighted in gold, FK highlighted in blue
   - Composite unique constraints noted

   > Since we cant use complex libraries easily, build this as a **styled HTML/CSS diagram** with colored boxes and connecting lines. Use absolute positioned divs with CSS borders/arrows, OR use an SVG element drawn inline.

2. **Table Details Accordion** - Click any table name to expand and see:
   - Column names, data types, constraints
   - Which FKs reference which table
   - ON DELETE / ON UPDATE behavior
   - CHECK constraints

3. **Normalization Proof Panel** - For each table, show:
   - Candidate Key
   - Functional Dependencies
   - All non-prime attributes are fully functionally dependent on the candidate key = 3NF

4. **Relationships Summary** - List of all relationships:
   - Faculty.reports_to_id to Faculty.faculty_id (Self-Join, 1:N)
   - Exam_Halls.invigilator_id to Faculty.faculty_id (N:1)
   - Seat_Allocations.enrollment_no to Students.enrollment_no (N:1)
   - etc.

---

## PHASE 3: ABOUT PROJECT PAGE (New Tab: About)

### What to build:
A dedicated page explaining the project end-to-end for viva defense.

**New file:** `frontend/src/components/AboutView.jsx`

#### Sections:

1. **Project Title and Metadata** - Official title, student details, guide details, college.

2. **Objective** - What problem does this solve? (Manual exam seat allocation is error-prone, marks moderation needs audit trail, etc.)

3. **DBMS Concepts Explained** - For each concept, a card with:
   - **What it is** (1-2 line theory)
   - **Where its used in this project** (specific table/SP/trigger name)
   - **Why it matters** (practical benefit)

   Concepts to cover:
   - Normalization (1NF to 2NF to 3NF)
   - ACID Properties
   - Stored Procedures with Cursors
   - Triggers (BEFORE/AFTER)
   - Views
   - User-Defined Functions
   - Indexes and Query Optimization
   - Foreign Keys and Referential Integrity
   - Transaction Control (START TRANSACTION, COMMIT, ROLLBACK, SAVEPOINT)
   - SIGNAL SQLSTATE (Custom Error Handling)

4. **System Architecture** - Simple diagram showing:
   ```
   [React Frontend] <-> [Express API] <-> [MySQL 8.0 (InnoDB)]
   ```

5. **Technology Stack** - Visual badges for React, Node.js, Express, MySQL, Tailwind CSS, Vite.

6. **How to Run** - Steps to set up and run the project.

---

## PHASE 4: UI OVERHAUL (Make it Premium and Beautiful)

### Changes across ALL files:

#### 4.1 - `frontend/src/index.css` (Major Overhaul)
Add these styles:

```css
/* Glassmorphism card style */
.glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Animated gradient border */
.gradient-border {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}
.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 2px;
  border-radius: 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899, #6366f1);
  background-size: 300% 300%;
  animation: gradientShift 4s ease infinite;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Hover lift animation */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(99, 102, 241, 0.15);
}

/* Stagger fade-in for grid items */
.stagger-fade > * {
  animation: fadeIn 0.4s ease-out both;
}
.stagger-fade > *:nth-child(1) { animation-delay: 0.05s; }
.stagger-fade > *:nth-child(2) { animation-delay: 0.1s; }
.stagger-fade > *:nth-child(3) { animation-delay: 0.15s; }
.stagger-fade > *:nth-child(4) { animation-delay: 0.2s; }
.stagger-fade > *:nth-child(5) { animation-delay: 0.25s; }
.stagger-fade > *:nth-child(6) { animation-delay: 0.3s; }

/* Subtle background pattern */
body {
  background-image: radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.03) 1px, transparent 0);
  background-size: 32px 32px;
}

/* Pulsing glow for important elements */
.glow-pulse {
  animation: glowPulse 2s ease-in-out infinite;
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.6); }
}
```

#### 4.2 - `frontend/index.html`
Add Google Fonts link in head:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<title>Examination Control System - DBMS Project | Darshan Jain | IPS Academy</title>
```

#### 4.3 - `frontend/src/components/Header.jsx` (Redesign)
- Add a **6th tab: Dashboard** (set as default active tab)
- Add a **6th tab: Schema** (ER Diagram)
- Add a **7th tab: About**
- Make Dashboard the default tab (useState('dashboard') in App.jsx)
- Keep the gradient header bar but make it slightly taller and more prominent
- Add a subtle animated gradient underline on active tab

#### 4.4 - `frontend/src/App.jsx`
- Import new components: DashboardView, SchemaView, AboutView
- Add new tab conditions:
  ```jsx
  {activeTab === 'dashboard' && <DashboardView ... />}
  {activeTab === 'schema' && <SchemaView />}
  {activeTab === 'about' && <AboutView />}
  ```
- Change default activeTab to 'dashboard'

---

## PHASE 5: ENHANCE EXISTING PAGES

### 5.1 - SeatMatrixView.jsx Improvements
- **Reformat the code** - Expand minified JSX to readable multi-line format
- **Add animation** - When seats get allocated, animate them appearing one by one (stagger fade)
- **Add a How it Works explainer section** at the top:
  > The stored procedure sp_AutoAllocateSeats uses nested cursors to iterate through halls and students. It places students in Row x Column grid positions, checking capacity via trigger trg_CrossExamSeatConflict.
- **Add seat count animation** - When numbers change, they animate (count up)

### 5.2 - HallTicketView.jsx Improvements
- **Reformat the code** - Expand minified JSX
- **Add IPS Academy logo area** (use a styled div with initials IPS in the header)
- **Make grade card more visual** - Add colored progress bars for each subjects marks
- **Add a View SQL mini-section** showing the exact 5-table JOIN view query

### 5.3 - ModerationView.jsx Improvements
- **Add a small chart/visual** - Bar chart showing grade distribution (O, A+, A, B+, B, C, F counts). Can be built with simple CSS bars:
  ```jsx
  // Simple CSS bar chart
  <div className="flex items-end gap-2 h-32">
    {grades.map(g => (
      <div key={g.grade} className="flex flex-col items-center gap-1">
        <span className="text-xs font-bold">{g.count}</span>
        <div className="w-8 bg-indigo-500 rounded-t" style={{ height: `${g.count / maxCount * 100}%` }} />
        <span className="text-xs font-mono">{g.grade}</span>
      </div>
    ))}
  </div>
  ```
- **Add pass/fail ratio ring** - A simple CSS circular progress showing pass percentage

### 5.4 - VivaExplorerView.jsx Improvements
- **Add syntax highlighting hints** - Color SQL keywords (SELECT, FROM, WHERE, JOIN) in the code block using simple span styling
- **Add Copy to Clipboard feedback animation**
- **Add a What this query does plain English explanation** for each query

### 5.5 - SqlXRayDrawer.jsx Improvements
- **Make it more visible** - Add a floating button at bottom-right corner that says SQL Monitor (3) with the count of queries executed
- **Add a small live indicator** - Pulsing green dot next to MySQL 8.0
- **Expand by default on first load** for 3 seconds, then collapse (to show mam it exists)

---

## PHASE 6: ADD ONE NEW MEANINGFUL FEATURE - Student Report Card PDF

### What to build:
A **Generate Report** button on the Hall Ticket / Grade Card page that generates a nicely formatted grade report using window.print() with special print CSS.

This already partially exists (print button), but enhance it:
- Make the print layout look like an **official university marksheet**
- Add college header, watermark text, signature lines
- Add Controller of Examinations and Chief Moderator signature placeholders

**Changes in:** `HallTicketView.jsx` + `index.css` (print media queries)

---

## PHASE 7: BACKEND - ADD DASHBOARD STATS API

**File to modify:** `backend/src/controllers/analyticsController.js`
**File to modify:** `backend/src/routes/api.js`

### New API endpoint:
```
GET /api/analytics/dashboard-stats
```

Returns:
```json
{
  "success": true,
  "data": {
    "totalStudents": 25,
    "totalExams": 4,
    "totalHalls": 3,
    "totalCapacity": 55,
    "totalAllocations": 28,
    "totalMarksEntries": 28,
    "totalAuditEvents": 2,
    "passCount": 14,
    "failCount": 11,
    "averageMarks": 35.7,
    "gradeDistribution": { "O": 1, "A+": 2, "A": 1, "B+": 3, "B": 4, "C": 4, "F": 10 }
  },
  "sqlExecuted": "SELECT COUNT(*) FROM Students; SELECT COUNT(*) FROM Exams; ..."
}
```

**Implementation:** Count from `db.state` arrays (in-memory engine).

---

## PHASE 8: ADD GRADE DISTRIBUTION API

**File to modify:** `backend/src/controllers/analyticsController.js`

### New API endpoint:
```
GET /api/analytics/grade-distribution?exam_id=1
```

Returns grade counts for a specific exam, computed using `fn_ComputeGrade`.

---

## COMPLETE FILE CHANGE LIST

### New Files to Create:
1. `frontend/src/components/DashboardView.jsx` - Dashboard/landing page
2. `frontend/src/components/SchemaView.jsx` - ER Diagram page
3. `frontend/src/components/AboutView.jsx` - About project page

### Files to Modify:
4. `frontend/src/App.jsx` - Add new tabs, change default to dashboard
5. `frontend/src/components/Header.jsx` - Add 3 new tabs (Dashboard, Schema, About)
6. `frontend/src/index.css` - Add glassmorphism, animations, gradient styles, enhanced print
7. `frontend/index.html` - Add Google Fonts, update title
8. `frontend/src/components/SeatMatrixView.jsx` - Reformat, add explainer
9. `frontend/src/components/HallTicketView.jsx` - Reformat, enhance print layout
10. `frontend/src/components/ModerationView.jsx` - Add grade distribution chart
11. `frontend/src/components/VivaExplorerView.jsx` - Add SQL keyword coloring
12. `frontend/src/components/SqlXRayDrawer.jsx` - Make more visible
13. `backend/src/controllers/analyticsController.js` - Add dashboard-stats and grade-distribution APIs
14. `backend/src/routes/api.js` - Add new routes

---

## DEMO SCRIPT - HOW TO SHOWCASE TO MAM (Step by Step)

### Step 1: Dashboard (2 min)
> Maam, this is our University Examination and Moderation DBMS. As you can see, the dashboard shows all 7 tables in 3NF, 3 triggers, 2 stored procedures, 2 views, and 1 UDF. The system manages complete exam lifecycle - from seat allocation to marks moderation to grade generation.

### Step 2: Schema/ER Diagram (3 min)
> Heres our ER diagram. We have 7 tables - Faculty has a self-join where reports_to_id references its own primary key, showing the examination committee hierarchy. Seat_Allocations has composite unique constraints to prevent double-booking. All tables are in 3NF - no transitive dependencies.

### Step 3: Seating Plan (3 min)
> Let me demonstrate the stored procedure. Ill select DBMS exam and click Assign Seats. The procedure sp_AutoAllocateSeats uses nested cursors - outer cursor for halls, inner cursor for students. It assigns Row x Column positions inside an ACID transaction.
>
> Now watch - Ill try to overfill a hall. *clicks Overfill button*
> See! The trigger trg_CrossExamSeatConflict fired SIGNAL SQLSTATE 45000 and rejected the insert. The database protects itself even if the application is bypassed.

### Step 4: Hall Ticket (2 min)
> This page uses the VIEW v_StudentHallTicket which JOINs 5 tables - Students, Seat_Allocations, Exams, Exam_Halls, and Faculty. Let me search my enrollment 0808CS241091 - heres my complete admit card with seat numbers, and heres my grade card using the UDF fn_ComputeGrade.

### Step 5: Moderation (3 min)
> This is the marks moderation engine. See the borderline students highlighted in amber - they scored between 18-22, just below the pass mark of 23.
>
> Ill run the stored procedure sp_AutoModerateBorderline with max grace cap of 5. *clicks Run Auto-Grace*
> See how it automatically gave grace marks to borderline students and the AFTER UPDATE trigger trg_MarksAuditLog created immutable audit records.
>
> Now let me try to give illegal grace of 15 marks. *clicks Test Trigger*
> Blocked! The BEFORE UPDATE trigger caps grace at 10.

### Step 6: Viva Explorer (2 min)
> Here are 5 live queries demonstrating relational algebra concepts - Self-Join to show faculty hierarchy, Outer Join to find unallocated students, Relational Division to find students in ALL exams, 3NF proof from constraints, and EXPLAIN plan showing index usage.

### Step 7: About Page (1 min)
> Finally, this page summarizes all DBMS concepts used - normalization, ACID, triggers, stored procedures, views, UDFs, indexes, and transaction control.

---

## UI DESIGN SPECIFICATIONS

### Color Palette
- **Primary:** Indigo-600 (#4f46e5) to Violet-600 (#7c3aed) gradient
- **Background:** #f8f9fb with subtle dot pattern
- **Cards:** White with border-slate-200, rounded-2xl (16px)
- **Accent:** Amber-400 for highlights (Darshans row, borderline students)
- **Success:** Emerald-600
- **Danger:** Rose-600
- **Text:** Slate-900 (headings), Slate-600 (body), Slate-400 (muted)

### Typography
- **Font:** Inter (Google Fonts)
- **Headings:** font-extrabold, tracking-tight
- **Body:** font-medium, text-sm
- **Mono:** font-mono (for SQL, enrollment numbers, marks)

### Card Design
- White background
- 1px border-slate-200
- rounded-2xl (16px border radius)
- Subtle shadow: shadow-sm
- Top gradient accent bar (2px) on feature cards: h-0.5 bg-gradient-to-r from-indigo-600 to-violet-600

### Animations
- Page transitions: fadeIn (0.35s ease-out)
- Card hover: translateY(-4px) + enhanced shadow
- Numbers: Count-up animation
- Staggered grid item appearance

---

## IMPORTANT IMPLEMENTATION NOTES

1. **Keep the in-memory engine** - The backend works with or without MySQL. Dont break this. All data comes from db.state arrays.

2. **Dont change schema.sql** - The schema is already excellent (7 tables, 3NF, all objects). Dont modify it.

3. **Dont add unnecessary packages** - Use only whats already installed (React, Tailwind, Lucide, Express, mysql2).

4. **Keep existing functionality working** - All current features (allocate, moderate, hall ticket, viva queries) must continue working.

5. **The ER Diagram should be hand-crafted HTML/CSS** - Dont try to install D3.js or any diagramming library. Use positioned divs with CSS borders and arrows, or inline SVG.

6. **Grade distribution chart should be pure CSS** - Simple flexbox bars, no chart library needed.

7. **Test after each phase** - Run `npm run dev` in frontend and `node server.js` in backend to verify.

8. **The Vite proxy is configured** - vite.config.js proxies /api to localhost:5000. Dont change this.

9. **Tailwind is configured** - tailwind.config.js extends colors with brand (mapped to indigo). Use existing Tailwind classes.

10. **Print styles exist** - The .no-print class hides elements during printing. Use it on non-essential UI elements.

---

## PRIORITY ORDER OF EXECUTION

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| P0 | Create DashboardView.jsx | First impression, wow factor | Medium |
| P0 | UI overhaul (index.css + animations) | Visual premium feel | Medium |
| P1 | Create SchemaView.jsx (ER Diagram) | Shows DBMS knowledge | High |
| P1 | Create AboutView.jsx | Explains concepts to mam | Medium |
| P1 | Update Header.jsx + App.jsx (new tabs) | Navigation | Low |
| P2 | Add dashboard-stats API | Data for dashboard | Low |
| P2 | Enhance ModerationView (grade chart) | Visual analytics | Low |
| P2 | Reformat SeatMatrixView | Code readability | Medium |
| P2 | Reformat HallTicketView | Code readability | Medium |
| P2 | Enhance SqlXRayDrawer visibility | Feature discovery | Low |
| P2 | Enhance print layout | Professional output | Low |
| P3 | Add SQL keyword coloring in VivaExplorer | Polish | Low |
| P3 | Update index.html (fonts, title) | SEO/fonts | Trivial |

---

## WHAT MAM WILL SEE AND BE IMPRESSED BY

1. **Beautiful professional UI** - Not a basic college project, looks like a real product
2. **Dashboard showing system overview** - Immediately understands the scope
3. **ER Diagram** - Can visually verify 3NF, relationships, constraints
4. **Live trigger demos** - Database rejecting invalid data in real-time
5. **Stored procedure execution** - Nested cursors allocating seats
6. **Audit trail** - Every marks change is logged (forensic traceability)
7. **Grade computation** - UDF computing RGPV grades
8. **5 relational algebra queries** - Self-join, outer join, division, 3NF proof, EXPLAIN
9. **Print-ready hall ticket** - Professional admit card
10. **Concepts page** - Every DBMS concept mapped to where its used in the project
11. **SQL X-Ray** - Shows the actual SQL being executed behind every click

> **Total DBMS concepts covered:** 3NF, ACID, Stored Procedures, Cursors, BEFORE/AFTER Triggers, Views, UDF, Indexes, Foreign Keys, Cascades, CHECK Constraints, Self-Join, Composite Unique, SAVEPOINT, SIGNAL SQLSTATE, Relational Division, Aggregate Functions, GROUP BY/HAVING, EXPLAIN Plan, Transaction Control.

---

## GIVE THIS ENTIRE PLAN TO THE NEXT AI MODEL

Tell it:

> Here is the complete plan for my DBMS project rebuild. Please execute it phase by phase. Start with Phase 1 (DashboardView.jsx), then Phase 7 (backend API), then Phase 4 (UI overhaul), then Phase 2 (SchemaView), then Phase 3 (AboutView), then Phase 5 (enhance existing pages). The project is at c:\Users\Darsh\OneDrive\Desktop\DBMS Project. Read all existing files first before making changes. Keep the in-memory engine working. Dont install new packages.
