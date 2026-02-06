# Academic Module - Methodology & Curriculum Builder

> **Version**: 1.0 | **Status**: Schema Complete ✅

---

## Overview

The Academic Module provides **two foundational builders** that schools must configure before creating courses:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ACADEMIC MODULE FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│        BUILDER 1: METHODOLOGY               BUILDER 2: ASSESSMENT            │
│       ┌─────────────────────┐              ┌─────────────────────┐          │
│       │ • Teaching Approach │              │ • Grading Scales    │          │
│       │ • Class Structures  │              │ • Assessment Types  │          │
│       │ • Homework Policies │              │ • Scoring Criteria  │          │
│       │ • Proficiency Levels│              │ • Rubrics           │          │
│       └──────────┬──────────┘              └──────────┬──────────┘          │
│                  │                                    │                      │
│                  └─────────────┬──────────────────────┘                      │
│                                │                                             │
│                                ▼                                             │
│                   ┌─────────────────────┐                                   │
│                   │   SCHOOL PROGRAMS   │                                   │
│                   │   (Course Catalog)  │                                   │
│                   └─────────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Schema Tables (16 new tables)

| Category | Tables |
|----------|--------|
| **Methodology** | `teachingMethodologies`, `classStructures`, `homeworkPolicies` |
| **Assessment** | `gradingScales`, `assessmentTypes`, `scoringCriteria` |
| **Rubrics** | `rubrics`, `rubricCriteria`, `rubricPerformanceLevels` |
| **Progression** | `proficiencyLevels` |
| **Programs** | `schoolPrograms`, `programUnits`, `programAssessmentWeights`, `programPassRequirements` |

---

## 📚 Builder 1: Methodology Setup

### Teaching Methodologies

Define the pedagogical approach for your school:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TEACHING METHODOLOGY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Name: "Communicative Approach with Task-Based Elements"                     │
│  Code: "TBL-COMM"                                                           │
│                                                                              │
│  Core Approach: TBL (Task-Based Learning)                                    │
│                                                                              │
│  Philosophy Statement:                                                       │
│  "Students learn best through meaningful communication and real-world       │
│   tasks. Language is a tool for communication, not an end in itself."       │
│                                                                              │
│  Key Principles:                                                             │
│  1. Communication over grammar drills                                        │
│  2. Meaningful context for all activities                                    │
│  3. Student-centered classroom                                               │
│  4. Error correction through modeling                                        │
│  5. Real-world task completion                                               │
│                                                                              │
│  Target Age Groups: ["teens", "adults"]                                      │
│  Target Proficiency: ["beginner", "intermediate", "advanced"]                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Supported Approaches

| Code | Approach | Description |
|------|----------|-------------|
| `tbl` | Task-Based Learning | Learning through real-world tasks |
| `pbl` | Project-Based Learning | Extended projects as learning vehicles |
| `ibl` | Inquiry-Based Learning | Student-led questioning and discovery |
| `cbl` | Competency-Based Learning | Mastery of specific competencies |
| `communicative` | Communicative Approach | Focus on communication over form |
| `direct_method` | Direct Method | Target language only, no translation |
| `audio_lingual` | Audio-Lingual Method | Pattern drilling and repetition |
| `grammar_translation` | Grammar-Translation | Traditional grammar focus |
| `total_physical` | Total Physical Response | Physical movement and commands |
| `suggestopedia` | Suggestopedia | Relaxed, suggestion-based learning |
| `silent_way` | Silent Way | Teacher silence, student discovery |
| `blended` | Blended Learning | Mix of online and in-person |
| `flipped` | Flipped Classroom | Content at home, practice in class |
| `montessori` | Montessori | Child-led, hands-on learning |
| `waldorf` | Waldorf/Steiner | Arts-integrated, developmental |
| `reggio_emilia` | Reggio Emilia | Project-based, child-directed |
| `hybrid` | Hybrid | Multiple approaches combined |
| `custom` | Custom | School-specific methodology |

---

### Class Structures

Define how individual classes are organized:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CLASS STRUCTURE: Standard 50min                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Duration: 50 minutes                                                        │
│                                                                              │
│  PHASES:                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 1. WARM-UP (5 min)                                                      ││
│  │    Engage students, activate prior knowledge                            ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ 2. PRESENTATION (15 min)              TTT: 30%                          ││
│  │    Introduce new content/language      STT: 70%                          ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ 3. PRACTICE (20 min)                                                    ││
│  │    Guided practice activities                                           ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ 4. PRODUCTION (8 min)                                                   ││
│  │    Free practice, real communication                                    ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ 5. WRAP-UP (2 min)                                                      ││
│  │    Review, preview next class                                           ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  Grouping: Mixed (whole class, pairs, small groups)                          │
│  Recommended Students: 6-12                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Grouping Types
- `whole_class` - Teacher-fronted activities
- `pairs` - Pair work
- `small_groups` - Groups of 3-4
- `individual` - Solo work
- `mixed` - Variety of groupings

---

### Homework Policies

Define homework expectations:

| Policy Type | Description |
|-------------|-------------|
| `required` | Homework is assigned and graded |
| `optional` | Encouraged but not mandatory |
| `none` | No homework given |
| `self_paced` | Student chooses their pace |
| `flipped` | Pre-class preparation required |

```javascript
{
  name: "Standard Homework",
  policyType: "required",
  frequencyType: "after_every_class",
  expectedTimeMinutes: 30,
  countsTowardsGrade: true,
  gradeWeightPercent: 10,
  allowsLateSubmission: true,
  latePenaltyPerDay: 5,        // -5% per day
  maxLateDays: 3,
  allowsRevision: true,
  maxRevisions: 1
}
```

---

## 📊 Builder 2: Assessment Setup

### Grading Scales

Define how students are scored:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GRADING SCALE: 0-10 Brazilian                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Type: Numeric (0-10)                                                        │
│  Passing Value: 6.0                                                          │
│                                                                              │
│  GRADE LEVELS:                                                               │
│  ┌───────┬──────────────────┬────────────┬────────────┬──────────┐          │
│  │ Code  │ Name             │ Min        │ Max        │ Color    │          │
│  ├───────┼──────────────────┼────────────┼────────────┼──────────┤          │
│  │ A     │ Excellent        │ 9.0        │ 10.0       │ 🟢       │          │
│  │ B     │ Good             │ 7.0        │ 8.99       │ 🔵       │          │
│  │ C     │ Satisfactory     │ 6.0        │ 6.99       │ 🟡       │          │
│  │ D     │ Needs Improvement│ 4.0        │ 5.99       │ 🟠       │          │
│  │ F     │ Failing          │ 0.0        │ 3.99       │ 🔴       │          │
│  └───────┴──────────────────┴────────────┴────────────┴──────────┘          │
│                                                                              │
│  Rounding: Nearest (1 decimal place)                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Scale Types

| Type | Example | Use Case |
|------|---------|----------|
| `numeric` | 0-10, 0-100 | Most common |
| `letter` | A, B, C, D, F | US-style |
| `percentage` | 0-100% | Direct percentage |
| `pass_fail` | Pass/Fail | Competency-based |
| `competency` | Developing/Proficient/Mastery | Standards-based |
| `descriptive` | Custom descriptors | Qualitative feedback |
| `points` | 0-1000 points | Gamified systems |

---

### Assessment Types

Define what kinds of assessments can be given:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ASSESSMENT TYPES                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  FORMATIVE (Ongoing, Low-Stakes)                                             │
│  ├── Quiz                                                                    │
│  ├── Homework                                                                │
│  ├── Participation                                                           │
│  └── Peer Review                                                             │
│                                                                              │
│  SUMMATIVE (End of Unit/Term, High-Stakes)                                   │
│  ├── Written Test                                                            │
│  ├── Oral Test                                                               │
│  ├── Final Exam                                                              │
│  └── Project                                                                 │
│                                                                              │
│  DIAGNOSTIC (Pre-Assessment)                                                 │
│  └── Placement Test                                                          │
│                                                                              │
│  PERFORMANCE (Practical Demonstration)                                       │
│  ├── Presentation                                                            │
│  ├── Role Play                                                               │
│  └── Lab Practical                                                           │
│                                                                              │
│  PORTFOLIO (Collection of Work)                                              │
│  └── Learning Portfolio                                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Assessment Categories

| Category | Purpose | Stakes |
|----------|---------|--------|
| `formative` | Ongoing feedback | Low |
| `summative` | End of unit/term | High |
| `diagnostic` | Pre-assessment | None |
| `self` | Self-assessment | None |
| `peer` | Peer assessment | Low |
| `portfolio` | Collection of work | Varies |
| `performance` | Practical demo | High |
| `standardized` | External tests | High |

---

### Scoring Criteria

Define what skills/competencies are assessed:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SCORING CRITERIA                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LANGUAGE SKILLS (Receptive & Productive)                                    │
│  ├── 👂 Listening                                                            │
│  ├── 📖 Reading                                                              │
│  ├── 🗣️ Speaking                                                             │
│  │   ├── Fluency                                                             │
│  │   ├── Pronunciation                                                       │
│  │   └── Accuracy                                                            │
│  └── ✍️ Writing                                                              │
│                                                                              │
│  LANGUAGE SYSTEMS                                                            │
│  ├── 📝 Grammar                                                              │
│  ├── 📚 Vocabulary                                                           │
│  └── 🎤 Pronunciation                                                        │
│                                                                              │
│  SOFT SKILLS                                                                 │
│  ├── Collaboration                                                           │
│  ├── Critical Thinking                                                       │
│  └── Creativity                                                              │
│                                                                              │
│  BEHAVIOR                                                                    │
│  ├── Participation                                                           │
│  └── Effort                                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Rubrics

Detailed scoring guidelines for assessments:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ANALYTIC RUBRIC: Speaking Assessment - Intermediate             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Total Points: 20                                                            │
│                                                                              │
│  ┌─────────────┬──────────┬──────────┬──────────┬──────────┬──────────────┐ │
│  │ Criterion   │ 4-Excell │ 3-Prof   │ 2-Devel  │ 1-Emerg  │ Weight       │ │
│  ├─────────────┼──────────┼──────────┼──────────┼──────────┼──────────────┤ │
│  │ Fluency     │ Natural  │ Minor    │ Frequent │ Very     │ 25%          │ │
│  │             │ pace     │ hesit.   │ pauses   │ broken   │              │ │
│  ├─────────────┼──────────┼──────────┼──────────┼──────────┼──────────────┤ │
│  │ Accuracy    │ Rare     │ Some     │ Frequent │ Many     │ 25%          │ │
│  │             │ errors   │ errors   │ errors   │ errors   │              │ │
│  ├─────────────┼──────────┼──────────┼──────────┼──────────┼──────────────┤ │
│  │ Vocabulary  │ Rich,    │ Good     │ Limited  │ Very     │ 25%          │ │
│  │             │ varied   │ variety  │ range    │ basic    │              │ │
│  ├─────────────┼──────────┼──────────┼──────────┼──────────┼──────────────┤ │
│  │ Pronunciation│ Clear,  │ Minor    │ Some     │ Hard to  │ 25%          │ │
│  │             │ natural  │ issues   │ problems │ understand│             │ │
│  └─────────────┴──────────┴──────────┴──────────┴──────────┴──────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Rubric Types

| Type | Description |
|------|-------------|
| `analytic` | Multiple criteria scored separately |
| `holistic` | Single overall score |
| `single_point` | Describes proficiency, assessed against it |
| `checklist` | Yes/No checklist items |

---

## 📈 Proficiency Levels

Define student progression levels:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PROFICIENCY LEVELS (CEFR-Aligned)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────┬────────────────────┬────────────┬──────────────────┐            │
│  │ Level  │ Name               │ CEFR       │ Est. Hours       │            │
│  ├────────┼────────────────────┼────────────┼──────────────────┤            │
│  │ 1      │ Starter            │ Pre-A1     │ 0-50             │            │
│  ├────────┼────────────────────┼────────────┼──────────────────┤            │
│  │ 2      │ Beginner           │ A1         │ 50-100           │            │
│  ├────────┼────────────────────┼────────────┼──────────────────┤            │
│  │ 3      │ Elementary         │ A2         │ 100-200          │            │
│  ├────────┼────────────────────┼────────────┼──────────────────┤            │
│  │ 4      │ Pre-Intermediate   │ B1         │ 200-350          │            │
│  ├────────┼────────────────────┼────────────┼──────────────────┤            │
│  │ 5      │ Intermediate       │ B1+        │ 350-500          │            │
│  ├────────┼────────────────────┼────────────┼──────────────────┤            │
│  │ 6      │ Upper-Intermediate │ B2         │ 500-700          │            │
│  ├────────┼────────────────────┼────────────┼──────────────────┤            │
│  │ 7      │ Advanced           │ C1         │ 700-900          │            │
│  ├────────┼────────────────────┼────────────┼──────────────────┤            │
│  │ 8      │ Proficient         │ C2         │ 900+             │            │
│  └────────┴────────────────────┴────────────┴──────────────────┘            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📖 School Programs

After setting up methodology and assessment, schools can create programs:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SCHOOL PROGRAM                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Name: "English for Adults - Intermediate"                                   │
│  Code: ENG-ADT-INT                                                          │
│                                                                              │
│  FOUNDATION:                                                                 │
│  ├── Methodology: TBL-Communicative                                         │
│  ├── Class Structure: Standard 50min                                         │
│  ├── Homework Policy: Required (After every class)                           │
│  └── Grading Scale: 0-10 Brazilian                                           │
│                                                                              │
│  PROFICIENCY:                                                                │
│  ├── Prerequisite: A2 (Elementary)                                           │
│  └── Target: B1 (Pre-Intermediate)                                           │
│                                                                              │
│  DURATION:                                                                   │
│  ├── Weeks: 24                                                               │
│  ├── Classes/Week: 2                                                         │
│  ├── Hours/Class: 1.5                                                        │
│  └── Total Hours: 72                                                         │
│                                                                              │
│  TARGET:                                                                     │
│  ├── Audience: Adults (18+)                                                  │
│  └── Modality: In-person                                                     │
│                                                                              │
│  PRICING:                                                                    │
│  ├── Base Price: R$ 2.400,00                                                │
│  └── Materials: R$ 350,00                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Program Units (Curriculum)

```
Unit 1: "Getting Started Again"
├── Estimated Hours: 6
├── Estimated Classes: 4
├── Topics: ["Introductions refresh", "Present tenses review", "Describing routines"]
├── Objectives: ["Reactivate prior knowledge", "Build classroom confidence"]
└── Has Assessment: ✅ (Unit Quiz)

Unit 2: "Telling Stories"
├── Estimated Hours: 8
├── Estimated Classes: 5
├── Topics: ["Past simple", "Past continuous", "Narrative sequencing"]
├── Objectives: ["Tell personal stories", "Understand narratives"]
└── Has Assessment: ✅ (Oral Presentation)
```

### Assessment Weights

```
┌────────────────────────────────────────────────────────┐
│              PROGRAM ASSESSMENT WEIGHTS                 │
├──────────────────────────────┬─────────┬───────────────┤
│ Assessment Type              │ Weight  │ Count         │
├──────────────────────────────┼─────────┼───────────────┤
│ Participation                │ 10%     │ Ongoing       │
│ Homework                     │ 10%     │ Per class     │
│ Unit Quizzes                 │ 20%     │ 6 (drop 1)    │
│ Oral Presentations           │ 20%     │ 2             │
│ Midterm Project              │ 15%     │ 1             │
│ Final Exam                   │ 25%     │ 1             │
├──────────────────────────────┼─────────┼───────────────┤
│ TOTAL                        │ 100%    │               │
└──────────────────────────────┴─────────┴───────────────┘
```

### Pass Requirements

```
To PASS this program, students must:
✅ Minimum Grade: 6.0 overall
✅ Minimum Attendance: 75%
✅ Pass Final Exam: 5.0+
✅ Complete All Homework: Yes
```

---

## 📱 UI Pages Needed

### Admin Setup
| Page | Path | Purpose |
|------|------|---------|
| Methodology Builder | `/admin/academico/metodologia` | Configure teaching approach |
| Class Structures | `/admin/academico/estruturas` | Define class phases |
| Homework Policies | `/admin/academico/tarefas` | Set homework rules |
| Grading Scales | `/admin/academico/notas` | Configure grading |
| Assessment Types | `/admin/academico/avaliacoes` | Define assessment types |
| Scoring Criteria | `/admin/academico/criterios` | Set up skills/competencies |
| Rubric Builder | `/admin/academico/rubricas` | Create rubrics |
| Proficiency Levels | `/admin/academico/niveis` | Configure progression |

### Program Management
| Page | Path | Purpose |
|------|------|---------|
| Programs Catalog | `/admin/academico/programas` | Manage programs |
| Program Builder | `/admin/academico/programas/novo` | Create new program |
| Program Details | `/admin/academico/programas/[id]` | Edit program & units |

---

## 🔗 Integration with Other Modules

### Academic → Enrollment
```
Student enrolls in:
  schoolProgram → creates enrollment record → assigns to class
```

### Academic → Teacher Workload
```
Teacher assigned to classes based on:
  proficiency levels they can teach
  methodologies they're trained in
```

### Academic → Progress Tracking
```
Student grades recorded using:
  grading scale → assessment types → scoring criteria → rubrics
```

---

## 📦 Service Delivery Module (15 new tables)

The **Service Delivery Module** is where the actual teaching happens. After programs are created, schools can:
1. Create class groups
2. Assign teachers
3. Set schedules
4. Enroll students
5. Track attendance
6. Record grades

### Schema Tables

| Category | Tables |
|----------|--------|
| **Classes** | `classGroups`, `classEnrollments` |
| **Teachers** | `teacherAssignments`, `teacherWorkload` |
| **Scheduling** | `programClassSchedules`, `programClassSessions` |
| **Attendance** | `attendanceRecords` |
| **Assessments** | `studentAssessments`, `studentGrades` |
| **Grades** | `gradebookEntries` |
| **Homework** | `homeworkAssignments`, `homeworkSubmissions` |
| **Progression** | `studentProgressions` |

---

### Class Groups

A **Class Group** is a cohort of students studying a program together:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLASS GROUP                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Name: "English Intermediate A - Evening"                                    │
│  Code: ENG-INT-A-EVE                                                        │
│                                                                              │
│  Program: English for Adults - Intermediate                                  │
│  Term: 2026 Semester 1                                                      │
│  Proficiency Level: A2 (Elementary)                                          │
│                                                                              │
│  CAPACITY:                                                                   │
│  ├── Max: 15 students                                                        │
│  ├── Min: 3 students                                                         │
│  └── Current: 8 students                                                     │
│                                                                              │
│  DATES:                                                                      │
│  ├── Start: 2026-02-03                                                       │
│  └── End: 2026-07-15                                                         │
│                                                                              │
│  DEFAULT ROOM: Sala 3                                                        │
│  MODALITY: In-person                                                         │
│  STATUS: Active                                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Status Flow
```
planned → open_enrollment → active → completed
                            ↓
                        cancelled
```

---

### Teacher Assignments

Teachers can be assigned to classes with different roles:

| Role | Description |
|------|-------------|
| `primary` | Main teacher responsible |
| `assistant` | Supporting teacher |
| `substitute` | Temporary replacement |
| `observer` | Training/observation |

```javascript
{
  classGroupId: "eng-int-a-eve",
  teacherId: "maria-silva",
  role: "primary",
  hoursPerWeek: 3,
  payRatePerHour: 7500  // R$ 75,00/hour
}
```

---

### Weekly Schedules

Define when classes happen:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              WEEKLY SCHEDULE: English Intermediate A                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MON  TUE  WED  THU  FRI  SAT  SUN                                          │
│                                                                              │
│   ●         ●                                                               │
│  19:00    19:00                                                             │
│  20:30    20:30                                                             │
│                                                                              │
│  Room: Sala 3    Teacher: Maria Silva                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Class Sessions

Each individual meeting is a **Session**:

```
Session #24 - Tuesday, March 15, 2026
├── Scheduled: 19:00 - 20:30
├── Actual: 19:02 - 20:35
├── Room: Sala 3
├── Teacher: Maria Silva
├── Unit: Unit 3 - Past Tenses
├── Topic: "Telling Stories"
├── Students: 7 present, 1 absent
└── Status: ✅ Completed
```

### Session Statuses
| Status | Description |
|--------|-------------|
| `scheduled` | Upcoming |
| `in_progress` | Currently happening |
| `completed` | Finished |
| `cancelled` | Won't happen |
| `rescheduled` | Moved to new date |
| `holiday` | No class (holiday) |

---

### Attendance Tracking

Track who attended each session:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              ATTENDANCE - Session #24 (March 15, 2026)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┬──────────┬──────────────┬───────────────────────────┐ │
│  │ Student          │ Status   │ Time         │ Notes                     │ │
│  ├──────────────────┼──────────┼──────────────┼───────────────────────────┤ │
│  │ João Santos      │ ✅ Present│ 18:58        │                           │ │
│  │ Ana Costa        │ ✅ Present│ 19:00        │                           │ │
│  │ Pedro Lima       │ ⚠️ Late  │ 19:15 (+15m) │ Traffic                   │ │
│  │ Maria Oliveira   │ ❌ Absent│              │                           │ │
│  │ Carlos Ferreira  │ 📋 Excused│             │ Medical (verified ✓)      │ │
│  │ Lucia Mendes     │ 🚪 Left   │ 19:00-20:00  │ Work emergency            │ │
│  └──────────────────┴──────────┴──────────────┴───────────────────────────┘ │
│                                                                              │
│  Present: 4    Late: 1    Absent: 1    Excused: 1    Left Early: 1          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Attendance Statuses
| Status | Description |
|--------|-------------|
| `present` | Attended full class |
| `absent` | Did not attend |
| `late` | Arrived late |
| `excused` | Absent with valid excuse |
| `left_early` | Left before class ended |

### Excuse Types
- `medical` - Doctor's note
- `family` - Family emergency
- `work` - Work obligation
- `travel` - Out of town
- `other` - Other reason

---

### Student Grades

Record scores on assessments:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STUDENT GRADE                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Assessment: Unit 3 Speaking Test                                            │
│  Student: João Santos                                                        │
│                                                                              │
│  SCORES:                                                                     │
│  ├── Raw Score: 85 / 100                                                     │
│  ├── Percentage: 85%                                                         │
│  └── Letter Grade: B                                                         │
│                                                                              │
│  RUBRIC BREAKDOWN:                                                           │
│  ├── Fluency: 21/25 (84%)                                                    │
│  ├── Accuracy: 20/25 (80%)                                                   │
│  ├── Vocabulary: 23/25 (92%)                                                 │
│  └── Pronunciation: 21/25 (84%)                                              │
│                                                                              │
│  Feedback: "Great vocabulary range! Work on past tense accuracy."            │
│                                                                              │
│  Graded by: Maria Silva                                                      │
│  Graded at: March 18, 2026                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Gradebook (Aggregated)

Running totals per student:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│            GRADEBOOK - English Intermediate A (João Santos)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ATTENDANCE                         GRADES                                   │
│  ├── Total Sessions: 24            ├── Assessments: 4 / 6                   │
│  ├── Attended: 22 (92%)            ├── Current Grade: 8.2                   │
│  ├── Absent: 1                     ├── Letter Grade: B                      │
│  ├── Excused: 1                    └── Status: Passing ✅                    │
│  └── Status: Good ✅                                                         │
│                                                                              │
│  HOMEWORK                           PARTICIPATION                            │
│  ├── Assigned: 12                  └── Score: 9.0 / 10                      │
│  ├── Completed: 11                                                           │
│  └── Rate: 92% ✅                                                            │
│                                                                              │
│  OVERALL STATUS: In Progress                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Teacher Workload

Track teacher hours daily:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│            TEACHER WORKLOAD - Maria Silva (March 15, 2026)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SESSIONS                           STUDENTS                                 │
│  ├── Scheduled: 4                  ├── Total: 42                            │
│  ├── Completed: 4                  └── Attended: 38                         │
│  └── Cancelled: 0                                                           │
│                                                                              │
│  HOURS                              COMPENSATION                             │
│  ├── Scheduled: 6.0h               ├── Payable Hours: 6.0h                  │
│  └── Actual: 6.2h                  └── Amount: R$ 450,00                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Student Progression

Track when students advance levels:

```
PROGRESSION RECORD
├── Student: João Santos
├── From: A2 (Elementary)
├── To: B1 (Pre-Intermediate)
├── Date: July 20, 2026
├── Based On: Class Completion
├── Class: English Intermediate A
├── Final Grade: 8.5
├── Approved By: Coordinator
└── Notes: "Excellent progress, ready for B1"
```

---

## 📱 UI Pages Needed

### Academic Setup (Admin)
| Page | Path |
|------|------|
| Class Groups | `/admin/academico/turmas` |
| Create Class | `/admin/academico/turmas/nova` |
| Class Details | `/admin/academico/turmas/[id]` |
| Schedule Builder | `/admin/academico/turmas/[id]/horarios` |
| Teacher Assignments | `/admin/academico/turmas/[id]/professores` |

### Teacher Portal
| Page | Path |
|------|------|
| My Classes | `/professor/turmas` |
| Class View | `/professor/turmas/[id]` |
| Session View | `/professor/turmas/[id]/aula/[sessionId]` |
| Take Attendance | `/professor/turmas/[id]/aula/[sessionId]/chamada` |
| Gradebook | `/professor/turmas/[id]/notas` |
| Enter Grades | `/professor/avaliacoes/[id]/lancar` |
| My Workload | `/professor/carga-horaria` |

### Student Portal
| Page | Path |
|------|------|
| My Classes | `/aluno/turmas` |
| Class View | `/aluno/turmas/[id]` |
| My Grades | `/aluno/notas` |
| My Attendance | `/aluno/frequencia` |
| My Homework | `/aluno/tarefas` |

---

## 🔄 Complete Flow

```
1. SETUP METHODOLOGY
   ↓
2. SETUP ASSESSMENTS
   ↓
3. CREATE PROGRAM
   ├── Define units
   ├── Set grade weights
   └── Set pass requirements
   ↓
4. CREATE CLASS GROUP
   ├── Assign to program
   ├── Set term/dates
   └── Set capacity
   ↓
5. ASSIGN TEACHERS
   ├── Primary teacher
   └── Assistants (optional)
   ↓
6. SET SCHEDULE
   ├── Days of week
   ├── Times
   └── Rooms
   ↓
7. ENROLL STUDENTS
   ↓
8. GENERATE SESSIONS
   (System creates session for each scheduled date)
   ↓
9. DELIVER CLASSES
   ├── Teacher takes attendance
   ├── Teacher logs content
   └── Teacher assigns homework
   ↓
10. ASSESS STUDENTS
    ├── Create assessments
    ├── Grade students
    └── Provide feedback
    ↓
11. FINALIZE GRADES
    ├── Calculate final grade
    ├── Determine pass/fail
    └── Progress students to next level
```

---

*Academic + Service Delivery Modules Complete! The full educational infrastructure is now in place.*

