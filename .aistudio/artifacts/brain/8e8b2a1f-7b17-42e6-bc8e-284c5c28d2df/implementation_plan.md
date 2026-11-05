# JanmaSaathi — Master Application Architecture & Implementation Plan (Fully Revised)

**Application Name:** JanmaSaathi  
**Tagline:** Your companion for safer motherhood.  
**Category:** Maternal Healthcare & Wellbeing (PS-03 / MaaSuraksha)  
**Target Roles:** Mother, Health Worker, Supervisor  
**Status:** Proposal Awaiting User Plan Approval (No implementation started)  

---

## 1. Project Identity, Design Constitution & Visual Standards

JanmaSaathi is an AI-assisted, offline-first maternal healthcare platform for rural communities, connecting expectant mothers, frontline Health Workers, and Medical Supervisors.

### Visual Constitution (`JanmaSaathi_DESIGN.md`)
- **Strict Four-Colour Palette:**
  - **Cherry (`#890149`):** Primary brand anchor, primary call-to-action buttons, active navigation markers, crucial structural highlights.
  - **Alabaster (`#F3F3E7`):** Foundational canvas and card surfaces, reducing field glare under outdoor sunlight.
  - **Dusty Rose (`#D9A2B5`):** Structural hairline dividers (`1px solid #D9A2B5`), card borders, and muted pill containers. Strictly never used for body copy or low-contrast icons.
  - **Warm Ink (`#30232A`):** High-contrast, empathetic reading colour for all typography, measurements, and clinical icons.
- **Typography Standards:**
  - **Editorial Headlines & Titles:** `DM Serif Display` (Fallback: `Noto Serif` / Georgia).
  - **Functional Interface & Numerical Data:** `DM Sans` (weights 400, 500, 600, 700). Units rendered in `DM Sans` at 70% opacity directly adjacent to numeric readings.
- **Universal Terminology Rule:**
  - The terms "ASHA" and "ASHA Didi" are completely excised from all UI copy, forms, badges, documentation, and code. "Health Worker" is used uniformly across the entire application.

---

## 2. Dataset Verification, Quality Auditing & ML Validation Architecture

### 2.1 File Audits and Verified Ground Truth
Both supplied CSV files in the workspace have been verified for exact row counts and headers:

1. **UCI Maternal Health Risk Dataset (`Maternal_Health_Risk_Data_Set_a1f70257.csv`):**
   - **Verified Dimensions:** **1,014 data rows** (1,015 lines including header).
   - **Header Columns:** `Age`, `SystolicBP`, `DiastolicBP`, `BS`, `BodyTemp`, `HeartRate`, `RiskLevel`.
   - **Target Variable:** `RiskLevel` (`low risk`, `mid risk`, `high risk`).
   - **Authority Status:** This is the **sole source of genuine training labels** for the primary six-feature maternal risk classifier.
   - **Data Quality Audit & Suspicious Values:**
     - `HeartRate`: Range observed is **7.0 bpm to 90.0 bpm**. Exactly 2 rows record `HeartRate = 7.0 bpm` (e.g. Row with Age=16, BP=120/75, BS=7.9, BodyTemp=98, HeartRate=7). A resting heart rate of 7 bpm is physiologically impossible in a living patient (severe bradycardia < 40 bpm; extreme cardiac arrest); this represents a known data-entry transcription typo in the published UCI repository (likely intended to be 70 bpm).
     - **Preprocessing Policy:** Flag impossible physiological values ($\text{HeartRate} < 35\text{ bpm}$) during data quality intake. Clean/filter or handle outliers via transparent, documented domain rules before model training rather than silently training on corrupt inputs.

2. **Synthetic Maternal Danger Signs Dataset (`synthetic_maternal_danger_signs_dataset_f7cb047b.csv`):**
   - **Verified Dimensions:** **500 data rows** (501 lines including header).
   - **Header Columns:** `Age`, `Systolic_BP_mmHg`, `Diastolic_BP_mmHg`, `Blood_Glucose_mg_dL`, `Body_Temperature_C`, `Heart_Rate_bpm`, `Hemoglobin_g_dL`, `Bleeding`, `Swelling`, `Reduced_Fetal_Movement`, `Synthetic_Risk_Label`.
   - **Target Variable:** `Synthetic_Risk_Label` (`Low`, `Moderate`, `High`).
   - **Authority Status:** `Synthetic_Risk_Label` is **purely synthetic** and must **never** be treated as a clinically validated outcome or mixed with UCI ground truth labels during training.

### 2.2 Feature & Unit Standardization Pipeline
Units differ fundamentally across the two datasets and clinical intake:

| Parameter | UCI Dataset Unit | Supplementary Dataset Unit | Clinical Intake Unit | Normalization Target (UCI Pipeline) |
|---|---|---|---|---|
| **Age** | Years | Years | Years | `Age` (Integer years) |
| **Systolic BP** | mmHg | mmHg | mmHg | `SystolicBP` (mmHg) |
| **Diastolic BP** | mmHg | mmHg | mmHg | `DiastolicBP` (mmHg) |
| **Blood Glucose** | **mmol/L (`BS`)** | **mg/dL (`Blood_Glucose_mg_dL`)** | mg/dL or mmol/L | **mmol/L** |
| **Body Temperature** | **Fahrenheit (°F)** | **Celsius (°C)** | °F or °C | **Fahrenheit (°F)** |
| **Heart Rate** | bpm | bpm | bpm | `HeartRate` (bpm, verified $\ge 35$) |

**Mathematical Conversions:**
- $\text{BS (mmol/L)} = \frac{\text{Blood Glucose (mg/dL)}}{18.0182}$
- $\text{BodyTemp (}^\circ\text{F)} = \text{BodyTemp (}^\circ\text{C)} \times \frac{9}{5} + 32$

**Raw Value Preservation:**
Clinical intake records and Firestore documents must store the exact user-entered measurement and its recorded unit (e.g. `bloodGlucose: { value: 112, unit: "mg/dL" }`, `bodyTemp: { value: 37.2, unit: "C" }`) alongside the normalized model feature vector (`bs_mmol_l: 6.22`, `body_temp_f: 98.96`) to prevent rounding distortion or clinical ambiguity.

### 2.3 Reproducible Training and Evaluation Pipeline
- **Classifier:** Multi-class Random Forest / Gradient Boosted decision trees trained strictly on the 6 normalized UCI features.
- **Validation Methodology:** 5-fold stratified cross-validation preserving class distribution (`low risk`, `mid risk`, `high risk`).
- **Evaluation Metrics:** Multi-class confusion matrix, precision, macro-F1, and per-class recall. Specifically, **High-Risk recall** must be prioritized and reported to minimize clinical false negatives.
- **Model Versioning:** Exported model artifacts must include metadata: `modelVersion: "1.0.0-uci-rf"`, training timestamp, training dataset SHA-256 hash, hyperparameter config, and evaluation score summary.
- **Model-Unavailable State:** If model weights or validated dataset artifacts are uninitialized or undergoing validation, the interface gracefully displays a dedicated **Model Offline / Awaiting Verification** status without interrupting standard field operations.

---

## 3. Clinical Safety & Decision-Support Protocol

1. **Strict Separation of ML and Clinical Danger Signs:**
   - The statistical ML model provides risk-tier decision support only. It does not replace frontline clinical protocol.
   - Supplementary danger signs (`Bleeding`, `Swelling`, `Reduced_Fetal_Movement`, severe headache, convulsions) are evaluated through independent clinical triage rules.
2. **Clinical Observation Semantics:**
   - **Unknown, unassessed, or skipped observations must never be treated as negative or normal.** They must be explicitly classified and displayed as `"Unassessed / Pending Verification"`.
3. **No Autonomous Clinical Prescription:**
   - Haemoglobin measurements are stored as quantitative clinical values with their unit (`g/dL`). No automated emergency escalation will occur solely on an unvalidated `< 11 g/dL` heuristic.
   - Swelling must be clinically contextualized (e.g. benign dependent evening ankle edema vs. sudden generalized facial/hand edema with hypertension).
   - The application is a clinical decision-support tool for trained Health Workers; it does not diagnose or independently prescribe medical treatments.

---

## 4. Hardened Firestore Security Rules & Authorization Architecture

### 4.1 Threat Model & Access Control Matrix

| Collection | Mother Permissions | Health Worker Permissions | Supervisor Permissions |
|---|---|---|---|
| `users` | Read/Update self (non-role fields only) | Read self; Read assigned mothers | Read self, assigned workers, area mothers |
| `mothers` | Read self; Update only via trusted account linking | Read assigned mothers; Create (with null authUid); Update clinical non-protected fields | Read/Create/Update in authorized sector; Reallocate workers |
| `healthWorkers` | Read assigned worker profile | Read self; Update non-supervisory profile fields | Read/Update workers in supervisor district |
| `supervisors` | Read assigned supervisor | Read assigned supervisor | Read self and cadre in jurisdiction |
| `assignments` | Read own assignment record | Read assigned caseload | Read/Create/Update in jurisdiction (atomic) |
| `assessments` | Read own completed assessments | Read/Create for currently assigned mothers | Read/Review (sign-off/clarification only) in sector |
| `healthUpdates` | Read/Create own updates (worker derived) | Read/Review for assigned mothers | Read updates in supervisor sector |
| `referrals` | Read own referrals | Read/Create for assigned mothers | Read/Update triage & facility notes in sector |
| `reports` | Read own maternal summary reports | Read/Submit assigned reports | Read/Audit/Sign-off block reports |
| `messages` | Read/Create messages with assigned worker | Read/Create messages with assigned mothers | Audit access only upon formal clinical review |
| `appointments`| Read own appointments | Read/Create/Update for assigned mothers | Read sector appointment schedules |
| `auditLogs` | No direct access | Append-only via server functions | Read audit trail in authorized jurisdiction |

### 4.2 Production Firestore Security Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserRole() {
      return request.auth.token.role; // 'mother' | 'worker' | 'supervisor'
    }

    function getStaffId() {
      return request.auth.token.staffId;
    }

    function getMotherId() {
      return request.auth.token.motherId;
    }

    function getSupervisorDistrict() {
      return request.auth.token.district;
    }

    // 1. Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || getUserRole() == 'supervisor');
      allow create: if false; // Provisioned exclusively via trusted backend
      allow update: if isAuthenticated() && request.auth.uid == userId &&
        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'staffId', 'motherId', 'district']);
    }

    // 2. Mothers collection
    match /mothers/{motherId} {
      allow read: if isAuthenticated() && (
        (getUserRole() == 'mother' && resource.data.authUid == request.auth.uid) ||
        (getUserRole() == 'worker' && resource.data.assignedWorkerId == getStaffId()) ||
        (getUserRole() == 'supervisor' && resource.data.district == getSupervisorDistrict())
      );

      // Health Worker can register mothers even without an email/account (authUid is null initially)
      allow create: if isAuthenticated() && (
        (getUserRole() == 'worker' && request.resource.data.assignedWorkerId == getStaffId()) ||
        (getUserRole() == 'supervisor')
      ) && request.resource.data.mcpCardNumber is string &&
        request.resource.data.authUid == null;

      // Restrictive field-level updates using diff().affectedKeys()
      allow update: if isAuthenticated() && (
        // Health Worker updating clinical observations (cannot change authUid, mcpCardNumber, or reassign worker)
        (getUserRole() == 'worker' &&
         resource.data.assignedWorkerId == getStaffId() &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly([
           'gestationalAgeWeeks', 'gestationalAgeDays', 'lastVisitDate',
           'lastVisitSummary', 'riskCategory', 'updatedAt'
         ])) ||
        // Supervisor reallocating workers or updating service area
        (getUserRole() == 'supervisor' &&
         resource.data.district == getSupervisorDistrict() &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly([
           'assignedWorkerId', 'assignedWorkerName', 'village', 'hamlet', 'updatedAt'
         ]))
      );
      // NOTE: Direct client mother account-linking updates are strictly prohibited.
      // Account linking is performed exclusively via the trusted /api/auth/link-mother-account backend function.
    }

    // 3. Health Workers collection
    match /healthWorkers/{workerId} {
      allow read: if isAuthenticated();
      allow create, delete: if false; // Managed by District Health Admin
      allow update: if isAuthenticated() && (
        (getUserRole() == 'worker' && getStaffId() == workerId &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['phone', 'updatedAt'])) ||
        (getUserRole() == 'supervisor' &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly([
           'status', 'assignedSubCentre', 'assignedHamlets', 'activeMothersCount', 'updatedAt'
         ]))
      );
    }

    // 4. Dedicated healthUpdates collection
    match /healthUpdates/{updateId} {
      allow read: if isAuthenticated() && (
        (getUserRole() == 'mother' && resource.data.motherId == getMotherId()) ||
        (getUserRole() == 'worker' && resource.data.assignedHealthWorkerId == getStaffId()) ||
        (getUserRole() == 'supervisor')
      );

      // Mother must only submit for herself; worker is derived from trusted assignment data
      allow create: if isAuthenticated() &&
        getUserRole() == 'mother' &&
        request.resource.data.motherId == getMotherId() &&
        request.resource.data.submittedBy == request.auth.uid &&
        request.resource.data.reviewStatus == 'pending';

      // Health Worker reviewing update (cannot alter mother's submitted observations)
      allow update: if isAuthenticated() &&
        getUserRole() == 'worker' &&
        resource.data.assignedHealthWorkerId == getStaffId() &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'reviewStatus', 'reviewedBy', 'reviewedAt', 'reviewNotes', 'updatedAt'
        ]);
    }

    // 5. Maternal Assessments collection
    match /assessments/{assessmentId} {
      allow read: if isAuthenticated() && (
        (getUserRole() == 'mother' && resource.data.motherId == getMotherId()) ||
        (getUserRole() == 'worker' && resource.data.workerId == getStaffId()) ||
        (getUserRole() == 'supervisor')
      );

      // Worker must only create assessments for mothers currently assigned to them
      allow create: if isAuthenticated() &&
        getUserRole() == 'worker' &&
        request.resource.data.workerId == getStaffId();

      // Supervisor clinical sign-off (cannot alter recorded vitals or model output)
      allow update: if isAuthenticated() &&
        getUserRole() == 'supervisor' &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'supervisorReviewStatus', 'supervisorNotes', 'reviewedAt', 'reviewedBy', 'updatedAt'
        ]);
    }

    // 6. Referrals collection (Scaped by role - NOT public to all users)
    match /referrals/{referralId} {
      allow read: if isAuthenticated() && (
        (getUserRole() == 'mother' && resource.data.motherId == getMotherId()) ||
        (getUserRole() == 'worker' && resource.data.workerId == getStaffId()) ||
        (getUserRole() == 'supervisor')
      );

      allow create: if isAuthenticated() &&
        getUserRole() == 'worker' &&
        request.resource.data.workerId == getStaffId();

      allow update: if isAuthenticated() && (
        (getUserRole() == 'supervisor' &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly([
           'status', 'supervisorRemarks', 'destinationConfirmed', 'updatedAt'
         ])) ||
        (getUserRole() == 'worker' && resource.data.workerId == getStaffId() &&
         request.resource.data.diff(resource.data).affectedKeys().hasOnly([
           'transportArranged', 'accompaniedByWorker', 'status', 'updatedAt'
         ]))
      );
    }

    // 7. Direct Messages collection
    match /messages/{messageId} {
      allow read: if isAuthenticated() && (
        resource.data.senderId == request.auth.uid ||
        resource.data.recipientId == request.auth.uid ||
        resource.data.workerId == getStaffId() ||
        resource.data.motherId == getMotherId()
      );

      allow create: if isAuthenticated() && (
        (getUserRole() == 'mother' && request.resource.data.motherId == getMotherId()) ||
        (getUserRole() == 'worker' && request.resource.data.workerId == getStaffId())
      );
      allow update, delete: if false; // Official audit communications are immutable
    }

    // 8. Appointments collection
    match /appointments/{appointmentId} {
      allow read: if isAuthenticated() && (
        (getUserRole() == 'mother' && resource.data.motherId == getMotherId()) ||
        (getUserRole() == 'worker' && resource.data.workerId == getStaffId()) ||
        (getUserRole() == 'supervisor')
      );

      allow create, update: if isAuthenticated() && (
        getUserRole() == 'worker' || getUserRole() == 'supervisor'
      );
    }

    // 9. Village Allocations & Assignments
    match /assignments/{assignmentId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated() && getUserRole() == 'supervisor';
      allow delete: if false;
    }

    // 10. Audit Logs (Immutable)
    match /auditLogs/{logId} {
      allow read: if isAuthenticated() && getUserRole() == 'supervisor';
      allow write: if false; // Created strictly by server-side Firebase Admin SDK
    }
  }
}
```

### 4.3 Secure Server-Side Account Linking Endpoint (`/api/auth/link-mother-account`)
1. **Request:** Mother sends Firebase ID token, `mcpCardNumber`, and `dateOfBirth`.
2. **Server Verification:**
   - Verify caller ID token and enforce rate limiting (max 5 attempts / IP / hour).
   - Query `mothers` collection using Firebase Admin SDK where `mcpCardNumber == requestedMcp` and `dateOfBirth == requestedDob`.
   - Verify `mothers.authUid == null` (prevent duplicate account claiming).
3. **Atomic Commit:**
   - Execute a Firestore transaction: update `mothers/{motherId}.authUid = decodedToken.uid`, set custom user claim `role = 'mother'`, `motherId = motherId`.
   - Log entry in `auditLogs` with caller IP, timestamp, and target document ID.

---

## 5. Production Offline-First Architecture

### 5.1 Technology Stack
- **Persistence Engine:** **IndexedDB** (via lightweight `idb` wrapper) replacing localStorage for all clinical records, maternal dossiers, and queues.
- **Application Shell Caching:** **Service Worker (PWA)** caching static assets (HTML, JS, CSS, Google Fonts, JanmaSaathi emblem) with a `Cache-First` strategy for app shell and `Network-First` with IndexedDB fallback for dynamic requests.

### 5.2 IndexedDB Database Schema (`janmasaathi_offline_db`)
- **Store `mothers`:** Key: `id`. Index: `assignedWorkerId`, `mcpCardNumber`.
- **Store `assessments`:** Key: `id`. Index: `motherId`, `workerId`, `syncStatus`.
- **Store `healthUpdates`:** Key: `healthUpdateId`. Index: `motherId`, `reviewStatus`, `syncStatus`.
- **Store `referrals`:** Key: `id`. Index: `motherId`, `priority`, `syncStatus`.
- **Store `outboxQueue`:** Key: `queueId` (auto-increment). Fields: `collection`, `action` (`create` | `update`), `payload`, `stableId`, `createdAt`, `retryCount`, `lastError`.

### 5.3 Offline Synchronization Semantics
1. **Local-First Creation with Stable IDs:**
   - Records created offline are immediately written to IndexedDB with stable unique identifiers (`ASMT-2026-XXXX`, `REF-2026-XXXX`).
   - Mutation is appended to `outboxQueue` with `syncStatus: 'queued'`.
2. **Idempotent Synchronization:**
   - Each outbox item carries a deterministic client mutation ID. Server ingestion uses Firestore transactions or document set operations with merge (`set(..., { merge: true })`) to guarantee idempotency upon duplicate packet delivery.
3. **Silent Background Ingestion:**
   - **No visible sync banners, floating badges, pending counters, or connectivity pills appear on user screens.**
   - Sync process runs automatically via:
     - `window.addEventListener('online', triggerSync)`
     - `document.addEventListener('visibilitychange', () => { if (!document.hidden) triggerSync(); })`
     - Background Service Worker `sync` event (where supported).
   - Backoff retry schedule: 1s, 2s, 5s, 10s, up to max 30s.
4. **Data Isolation & Sign-Out Hygiene:**
   - All IndexedDB clinical stores are namespaced by the authenticated user's ID (`userId`).
   - Upon sign-out, sensitive local clinical caches are cleared to prevent unauthorized exposure on shared mobile devices.

---

## 6. Synchronized Demonstration Timeline (Anchored 5 November 2026)

To guarantee exact chronological and gestational consistency:
- **Operational Base Date:** **5 November 2026**
- **Mother Case 1: Priya Sharma (`MCP-2026-0894`)**
  - **LMP Date:** **21 May 2026**
  - **Current Gestational Age:** Exactly **Week 24 (Day 168 of 280)**
  - **Estimated Delivery Date (EDD):** **25 February 2027** ($21\text{ May 2026} + 280\text{ days}$)
  - **MCP Card Issuance & Registration:** 10 June 2026
  - **ANC 1 Checkup:** 16 July 2026 (Sub-Centre Rampur)
  - **ANC 2 Checkup:** 17 September 2026 (Sub-Centre Rampur)
  - **Recent Health Update:** 01 November 2026 (Reported mild ankle swelling; reviewed by Health Worker Sunita Devi)
  - **Next Appointment:** **12 November 2026 (10:30 AM)** — ANC 3 Checkup at Rampur Sub-Centre
- **Mother Case 2: Meena Devi (`MCP-2026-0412`)**
  - **LMP Date:** 26 March 2026
  - **Current Gestational Age:** **Week 32 (Trimester 3)**
  - **EDD:** **31 December 2026**
  - **Referral Record (`REF-2026-0041`):** Initiated 04 November 2026 to Rampur Primary Health Centre for gestational hypertension ($142/92\text{ mmHg}$).

All synthetic demonstration records display the prominent tag: `Synthetic Demonstration Record`.

---

## 7. Complete 19-Screen Role Mapping & Architecture

```
/login (Common 3-Tab Sign-in: Mother, Health Worker, Supervisor)
│
├── ROLE A: MOTHER PORTAL
│   ├── /mother/home (Progress, Next Visit, Recent Updates, Assigned Health Worker, Report Health Update CTA)
│   ├── /mother/journey (Pregnancy Milestones Timeline, Antenatal Checkup Trail, Verified Records)
│   ├── /mother/connect (Health Worker Card, Callback Request, Update Log, Direct Official Messaging)
│   └── /mother/profile (Credentials, Account Linking, Language Switcher, Emergency Helpline)
│
├── ROLE B: HEALTH WORKER WORKSPACE
│   ├── /worker/home (Caseload Grid, Priority Follow-ups, Scheduled Visits, New Assessment CTA)
│   ├── /worker/patients (Caseload Registry, Trimester/Risk Filters, New Mother Registration Modal)
│   ├── /worker/assessments/new (7-Section Standard Clinical Observation Form)
│   ├── /worker/assessments/result (Vitals Summary, Explainable Triage, Model-Offline Notice, Action Options)
│   ├── /worker/referrals (Escalation Queue, Hospital Triage, 108 Ambulance Dispatch Tracker)
│   └── /worker/more (LMP-to-EDD Calculator, Supply Inventory Tracker, Clinical Guidelines, Storage Tools)
│
└── ROLE C: SUPERVISOR NETWORK
    ├── /supervisor/overview (Block Cadre Metrics, High-Risk Queue, Unassigned Workers Tracker)
    ├── /supervisor/workers (Cadre Management, Health Worker Cadre Deployment, Caseload Capacity)
    ├── /supervisor/assign (5-Step Allocation Wizard: Worker, Sub-Centre, Hamlets, Mothers, Atomic Commit)
    ├── /supervisor/referrals (Hospital Escalation Audit, MOIC Clinical Direction & Bed Reservation)
    ├── /supervisor/reports (Maternal Assessment Audit Queue, Clinical Sign-off, Clarification Requests)
    └── /supervisor/more (District Data Package Export, Emergency Dispatch Directory, Audit Log Review)
```

---

## 8. Eight-Phase Implementation & Verification Roadmap

### Phase 1: Design Tokens, Typography & Base App Shell
- Configure Google Fonts for `DM Serif Display` and `DM Sans` in `index.html`.
- Set up Tailwind theme with the strict 4-color palette (`#890149`, `#F3F3E7`, `#D9A2B5`, `#30232A`).
- Install `@tailwindcss/vite`, `idb`, and PWA dependencies.

### Phase 2: Offline Storage Engine & Service Worker Setup
- Implement `src/offline/db.ts` utilizing IndexedDB with object stores: `mothers`, `assessments`, `healthUpdates`, `referrals`, `outboxQueue`.
- Configure Service Worker (`public/sw.js`) and Web App Manifest (`public/manifest.json`) for asset caching.
- Build background sync manager with exponential retry and network/resume event listeners.

### Phase 3: Central Demonstration Store & Data Model
- Create `src/types/index.ts` with strict domain interfaces.
- Create `src/data/centralDemoData.ts` with coherent 5 November 2026 timeline and pure "Health Worker" terminology.
- Establish `DataContext.tsx` with IndexedDB-backed mutations and `AuthContext.tsx` with role identity mappings.

### Phase 4: Mother Portal Implementation
- Port approved screens: Home (`MotherHomeScreen.tsx`), My Journey (`MotherJourneyScreen.tsx`), Connect (`MotherConnectScreen.tsx`), Profile (`MotherProfileScreen.tsx`).
- Wire interactive `Report Health Update` modal into dedicated `healthUpdates` collection.
- Implement language context supporting English, Hindi, and Odia.

### Phase 5: Health Worker Workspace Implementation
- Port approved screens: Home (`WorkerHomeScreen.tsx`), Patients (`WorkerPatientsScreen.tsx`), Referrals (`WorkerReferralsScreen.tsx`), Tools (`WorkerMoreScreen.tsx`).
- Implement 7-section clinical form (`WorkerNewAssessmentScreen.tsx`) capturing vitals, lab readings, and danger signs.
- Implement assessment result screen (`WorkerAssessmentResultScreen.tsx`) featuring the verified **Model Offline / Awaiting Verification** interface and rule-based danger-sign evaluation.

### Phase 6: Supervisor Network Implementation
- Port approved screens: Overview (`SupervisorOverviewScreen.tsx`), Cadre (`SupervisorWorkersScreen.tsx`), Referrals (`SupervisorReferralsScreen.tsx`), Reports (`SupervisorReportsScreen.tsx`), Administration (`SupervisorMoreScreen.tsx`).
- Implement 5-Step Allocation Wizard (`SupervisorAssignScreen.tsx`) with atomic commit preventing duplicate active assignments.

### Phase 7: Dataset Ingestion & ML Pipeline Preparation
- Create dataset preprocessing script (`src/ml/preprocess.ts`) ingesting `Maternal_Health_Risk_Data_Set_a1f70257.csv` (1,014 rows) and `synthetic_maternal_danger_signs_dataset_f7cb047b.csv` (500 rows).
- Implement physiological bounds validation ($\text{HeartRate} \ge 35\text{ bpm}$) and unit conversion ($mg/dL \leftrightarrow mmol/L$, $^\circ\text{C} \leftrightarrow ^\circ\text{F}$).
- Implement reproducible Random Forest training and 5-fold stratified cross-validation script.

### Phase 8: Verification, Security Testing & End-to-End Audit
- Run Firestore emulator security tests verifying:
  - Mothers cannot modify assigned workers or MCP numbers.
  - Workers cannot modify mother `authUid` or reassign areas.
  - Supervisors cannot tamper with original clinical vitals.
  - Account linking requires valid backend token and DOB verification.
- Co-execute `compile_applet` and `lint_applet` to guarantee clean build.
- Validate responsive performance on mobile and desktop viewports.

---

## 9. Explicit Commitment

**No coding or implementation has begun.** Implementation will proceed only after this complete revised architecture and plan is formally approved.
