# System Architecture Update Document: StudentWorks (v2.0)
**Core Philosophy:** *Freedom + Commitment = Trust*
**Target Platform:** Institut Desain dan Bisnis (IDB) Bali
**Update Version:** 2.0.0 (Upgrade from v1.0.0 MVP)
## 1. Executive Summary & Core Value Shift
Following strategic insights from industry professionals, the core architectural value of **StudentWorks** is shifting away from a restrictive administrative system to an autonomy-driven **Trust-Guarantee Platform**.
The primary barrier in the student freelancing ecosystem is mutual uncertainty: clients doubt student availability during high-stress academic windows, while students face rigid timelines that risk their academic performance.
This update dismantles the absolute restrictions of the previous **"Safe Zone"** feature. It implements a new operational equation throughout the application layer:
 1. **For Clients (MSMEs/Startups):** Complete freedom to dictate project-specific parameters, custom Service Level Agreements (SLAs), and screening processes.
 2. **For Students (Mahasiswa):** Total freedom to apply for and accept projects at any point in the academic cycle (including tight exam weeks), balanced with total accountability for their academic performance and platform reputation.
## 2. Updated Conceptual System Architecture
The v2.0 framework removes hard constraint gates and establishes an **Autonomous Commitment Verification** engine.
```
+-----------------------------------------------------------------+
|                        STUDENTWORKS v2.0                        |
+-----------------------------------------------------------------+
|                                                                 |
|     [ CLIENTS / MSMEs ]                   [ STUDENTS / TALENTS ]|
|   - Freedom to Dictate Rules            - Freedom to Apply Always|
|   - Custom SLAs & Screenings            - Self-Managed Schedule  |
|              |                                     |            |
|              +-----------------+-------------------+            |
|                                |                                |
|                                v                                |
|                  +----------------------------+                 |
|                  |   SMART COMMITMENT GATE    |                 |
|                  +----------------------------+                 |
|                                |                                |
|                                v                                |
|                  +----------------------------+                 |
|                  |    MUTUAL RISK WORKSPACE   |                 |
|                  +----------------------------+                 |
|                                |                                |
|                                v                                |
|                  +----------------------------+                 |
|                  | COMMITMENT SCORE ENGINE    |                 |
|                  |  (Account Suspension Lock) |                 |
|                  +----------------------------+                 |
+-----------------------------------------------------------------+

```
## 3. Transitional Logic: "Safe Zone" to "Danger Zone"
The historical academic_calendar mechanism, which hard-blocked applications during exam ranges via globalSafeZone, is entirely decommissioned. It is replaced by the **Danger Zone Framework**.
 * **Global Variable Renaming:** res.locals.globalSafeZone is changed to res.locals.globalDangerZone.
 * **Decoupled Enforcement:** When globalDangerZone evaluates to TRUE, application flows remain unblocked. Instead, contextual risk data is broadcasted to both sides of the marketplace to enable objective risk assessment.
## 4. Database Schema Refinement (db/migrate.js)
To facilitate decentralization and record behavioral accountability, the SQLite database schema requires structural modification. Run the following script additions in db/migrate.js:
```sql
-- 1. Upgrade projects table with custom client expectations
ALTER TABLE projects ADD COLUMN custom_sla_rules TEXT NOT NULL DEFAULT 'Maintain proactive communication and fulfill output requirements.';
ALTER TABLE projects ADD COLUMN requires_test BOOLEAN DEFAULT 0;

-- 2. Upgrade job_applications to capture explicit student digital signatures
ALTER TABLE job_applications ADD COLUMN commitment_signed BOOLEAN DEFAULT 0;

-- 3. Upgrade student_profiles to support automated behavioral suspension locks
ALTER TABLE student_profiles ADD COLUMN is_suspended BOOLEAN DEFAULT 0;
ALTER TABLE student_profiles ADD COLUMN suspended_until TIMESTAMP DEFAULT NULL;
ALTER TABLE student_profiles ADD COLUMN trust_score REAL DEFAULT 100.0;

-- 4. Establish new behavioral logging table for real-time reputational tracking
CREATE TABLE commitment_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    metric_name VARCHAR NOT NULL, -- e.g., 'Danger Zone Milestone Default', 'Punctual Delivery'
    score_impact REAL NOT NULL,    -- Negative multipliers for Danger Zone failures
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

```
## 5. Feature Flow & Logic Updates
### 5.1 Client Project Management Flow (routes/klien.js)
 * **Job Posting:** The creation endpoint (POST /proyek/baru) is updated to accept text input for custom_sla_rules alongside standard fields. The system acts strictly as a persistent record-keeper of these rules.
 * **Risk Metric Transparency:** When viewing applicant rosters within a globalDangerZone window, the client dashboard renders applicant statuses with an adaptive visibility banner detailing whether the candidate chose to apply despite active university examinations.
### 5.2 Student Application Flow & "Smart Commitment Gate" (routes/mahasiswa.js)
 * **The Lock Mechanism:** When a student submits a project request via POST /proyek/lamar, the system checks for globalDangerZone. If true, the system checks for explicit payload parameters validating that commitment_signed == 1.
 * **Self-Determination Logic:** The route will reject requests missing the commitment parameter but allows smooth database insertions for students who explicitly accept accountability.
### 5.3 Commitment Strike System (Automatic Sanctions)
If a student accepts a contract during an active exam window and defaults on milestones or receives verified client escalations for delays, the system executes automated penance operations via background execution:
 * **Exponential Reputational Deduction:** The system deducts **-25.0 points** from the profile's cumulative trust_score (compared to standard off-season penalties of -10.0 points).
 * **14-Day Account Suspension:** The profile sets is_suspended = 1 and calculates suspended_until to exactly +14 days from the breach moment. This hard-blocks access to the job marketplace to enforce academic focus.
 * **Permanent Public Badge:** The student’s public card logs a structural indicator tracking failures during exams, visible to subsequent hiring clients.
## 6. UI/UX Copywriting Specifications (UI String Specs)
### 6.1 Client Interface Alerts (views/klien/)
#### Detail Profile Assessment Banner (Active Danger Zone)
> ⚠️ **Danger Zone Alert (Active Exam Window)**
> *"This talent is currently navigating university midterms/finals. StudentWorks maintains complete freedom of contract—you are free to hire them. However, we recommend aligning your communications and delivery expectations accordingly. Their obligations remain structurally bound by their explicit digital signature."*
> 
#### New Project Creation Instruction View (proyek-baru.ejs)
> 💡 **Strategic Allocation Tip:**
> *"IDB Bali academic calendar indicates an active [Exam Session Name] until [End Date]. If your project demands high-intensity availability or short-window updates, consider extending milestone buffers or explicitly declaring your parameters in your Custom SLA rules field below."*
> 
### 6.2 Student Interface Alerts (views/mahasiswa/)
#### Smart Commitment Pop-up Dialog (proyek.ejs)
> 🚨 **CRITICAL RISK WARNING: Active Exam Window**
> *"Attention! IDB Bali is currently running official institutional examinations. By submitting an application for this project, you are stepping into an active Danger Zone where your academic schedules clash directly with external project deadlines.*
> *Evaluate your capacity with absolute honesty:*
>  * *Can your study schedule accommodate these specific client delivery standards?*
>  * *Is your preparation window secure against these project deadlines?*
> *You possess the absolute freedom to apply. However, failure to meet delivery standards under these conditions triggers immediate automated platform penalties:*
>  * **-25 Trust Points:** *Severe long-term reduction in profile discovery ranking.*
>  * **14-Day Hard Freeze:** *Immediate system-wide lockout from applying to new projects to force academic recovery.*
>  * **Permanent Default Badge:** *A visible record of exam-window failure displayed to all future clients.*
> 🔲 *[Checkbox]* I certify that I have analyzed my exam schedules, balanced my workload wisely, and voluntarily assume full accountability for my academic standing and platform reputation.*
> **[ Confirm Application & Pledge Reputation ]**
> 
## 7. Testing Checklist
 * [ ] **Danger Zone Activation:** Admin schedules an exam window; verify res.locals.globalDangerZone switches to TRUE without disabling student application inputs.
 * [ ] **SLA Input Persistence:** Client submits specialized workspace parameters; verify data writes properly to projects.custom_sla_rules.
 * [ ] **Commitment Gate Bypass Rejection:** Execute POST /proyek/lamar during a Danger Zone window without passing commitment_signed = 1; verify server returns error structure.
 * [ ] **Automated Suspension Enforcement:** Simulate a project delivery failure inside the Danger Zone; verify the application updates the student's trust_score down by 25 points, flips is_suspended to true, and sets a 14-day lockout window.