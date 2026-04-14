# 🏙️ City Guard — Smart City Governance & Traffic Platform

> **A full-stack, AI-powered mobile platform that bridges the gap between citizens and their city administration — turning complaints into action, and data into decisions.**

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [The Problem We Solve](#-the-problem-we-solve)
3. [Who Is This For? (Target Audience)](#-who-is-this-for)
4. [How It Works — Complete Workflow](#-how-it-works--complete-workflow)
5. [System Architecture](#-system-architecture)
6. [Tech Stack (Deep Dive)](#-tech-stack-deep-dive)
7. [Applications Breakdown](#-applications-breakdown)
   - [App-Governance (Citizen & Admin App)](#app-governance-citizen--admin-app)
   - [App-Traffic (Commuter App)](#app-traffic-commuter-app)
   - [Backend API Server](#backend-api-server)
8. [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
9. [AI Integration](#-ai-integration--gemini-powered-features)
10. [Database Models](#-database-models)
11. [API Endpoints Reference](#-api-endpoints-reference)
12. [Report Lifecycle (Full State Machine)](#-report-lifecycle--state-machine)
13. [Points & Gamification System](#-points--gamification-system)
14. [Notification System](#-notification-system)
15. [Security Architecture](#-security-architecture)
16. [Zonal Model (AMC System)](#-zonal-model--amc-system)
17. [Running the Project Locally](#-running-the-project-locally)
18. [Environment Variables](#-environment-variables)
19. [Future Roadmap](#-future-roadmap)
20. [Known Limitations & Technical Debt](#-known-limitations--technical-debt)

---

## 🌐 Project Overview

**City Guard** is a **monorepo** containing two React Native mobile applications and one Node.js/Express backend server — all designed to create a transparent, efficient, and accountable city governance system.

The platform is modeled on the **AMC (Ahmedabad Municipal Corporation)** zonal governance structure but is architected to be deployable for any city in India or elsewhere.

### Core Philosophy

> "Don't just report a pothole — track it from complaint to completion, with AI verification at every step."

City Guard creates a **closed-loop accountability system** where:
- Citizens report issues with photo evidence
- AI verifies the relevance of submitted images
- Officers review and assign tasks in their zone
- Contractors carry out field repairs and submit completion proof
- AI verifies the completion photo for fraud prevention
- Officers close the task and citizens receive points + can rate the work
- Commissioners see everything via a real-time command center

---

## ❗ The Problem We Solve

| Problem | How City Guard Solves It |
|---------|--------------------------|
| Citizens have **no visibility** into what happens to their complaints | Real-time status tracking from `pending` → `closed` |
| Complaints are **lost in phone calls or paper forms** | Digital submission with photo, GPS coordinates, zone, and category |
| **Fraudulent or irrelevant reports** waste officer time | **Gemini AI** verifies that submitted images match the reported category |
| **Fake completion reports** by contractors | Gemini AI validates contractor "after" images for quality and relevance |
| Officers are **overwhelmed** without zone/department filtering | Officers only see tasks in their assigned **zone** and **department** |
| **No accountability** for slow resolution | SLA (72-hour) tracking, `isLate` flag, and citizen ratings |
| City administration has **no data-driven insights** | Commissioner dashboard with charts, heatmaps, PDF audit reports |
| Citizens have **no incentive** to report issues | **Gamification**: 50 points per resolved report, visible leaderboard |
| Commuters are **unaware of road blocks** during construction | App-Traffic shows live roadblock data on an interactive map |
| **No emergency broadcast system** | Commissioner can push city-wide emergency notifications instantly |

---

## 👥 Who Is This For?

### 1. 🧑‍💼 Citizens
Everyday residents of a city who encounter infrastructure problems — a pothole on their street, garbage overflowing their neighborhood, a broken streetlight, or a burst water pipe. They need a **simple, trustworthy way** to report issues and know those reports matter.

### 2. 👮 Zone Officers (Government Staff)
Municipal officers assigned to specific geographic zones (e.g., Central, North, East) and departments (Road, Water, Waste, Electricity). They are the **field supervisors** who review reports, claim ownership, and manage contractors.

### 3. 🔧 Contractors (Field Workers / Companies)
Specialized workers assigned to fix reported issues — road repair crews, waste management teams, electrical workers, water utility teams. They need a **mobile tool** to view their task queue, update work status, and submit completion proof.

### 4. 👨‍⚖️ Commissioner (Top Authority)
The city's senior administrator who needs a **bird's-eye view** of the entire city — all zones, all departments, real-time status, analytics, and the ability to send emergency alerts.

### 5. 🚗 Commuters (Traffic App Users)
Drivers and daily commuters who need to know about **active roadblocks** and construction work happening in the city so they can route around them.

### 6. 👁️ General Public (Guest View)
Any citizen who wants to browse resolved issues in the city without creating an account — building transparency and trust.

---

## ⚙️ How It Works — Complete Workflow

### Governance Workflow (End-to-End)

```
CITIZEN                    OFFICER                    CONTRACTOR             COMMISSIONER
   │                          │                            │                      │
   │ 1. Opens app, takes       │                            │                      │
   │    photo of issue         │                            │                      │
   │                          │                            │                      │
   │ 2. Fills report form:     │                            │                      │
   │    - Title                │                            │                      │
   │    - Description          │                            │                      │
   │    - Category             │                            │                      │
   │    - GPS Location         │                            │                      │
   │                          │                            │                      │
   │ 3. Uploads photo to       │                            │                      │
   │    Cloudinary             │                            │                      │
   │                          │                            │                      │
   │ 4. POST /reports/create   │                            │                      │
   │    ──────────────────► BACKEND                         │                      │
   │                     AI verifies image                  │                      │
   │                     matches category                   │                      │
   │                     (Gemini 2.5 Flash)                 │                      │
   │                          │                            │                      │
   │ ◄─ If NO: Rejected ───────│                            │                      │
   │ ◄─ If YES: Saved as       │                            │                      │
   │    status: 'pending'      │                            │                      │
   │                          │                            │                      │
   │                    5. Officer sees                     │                      │
   │                       pending reports                  │                      │
   │                       (filtered by their              │                      │
   │                       zone + department)              │                      │
   │                          │                            │                      │
   │                    6. Officer claims task              │                      │
   │                       PUT /reports/claim/:id           │                      │
   │                       status → 'assigned'              │                      │
   │                          │                            │                      │
   │ ◄── NOTIFICATION ─────────│                            │                      │
   │    "Claimed by officer"   │                            │                      │
   │                          │                            │                      │
   │                    7. Officer assigns to              │                      │
   │                       contractor                       │                      │
   │                       PUT /assign-contractor/:id       │                      │
   │                       status → 'assigned_to_contractor'│                      │
   │                          │                            │                      │
   │ ◄── NOTIFICATION ─────────│                            │                      │
   │    "Contractor is on      │                            │                      │
   │     the way"              │                            │                      │
   │                          │              8. Contractor sees                   │
   │                          │                 their task queue                  │
   │                          │                 GET /reports/contractor            │
   │                          │                            │                      │
   │                          │              9. Contractor does the               │
   │                          │                 work on-site                      │
   │                          │                            │                      │
   │                          │             10. Contractor uploads                │
   │                          │                 "after" photo                     │
   │                          │                 + materials used                  │
   │                          │                 + labor hours                     │
   │                          │                            │                      │
   │                          │             11. POST /complete/:id                │
   │                          │                 ──────────► BACKEND               │
   │                          │                            AI verifies            │
   │                          │                            after-photo            │
   │                          │                            quality                │
   │                          │                            SLA check (72hrs)      │
   │                          │                            status →               │
   │                          │                          'completed_pending_review'│
   │                          │                            │                      │
   │                   12. Officer reviews                  │                      │
   │                       before + after photos            │                      │
   │                       + resource form                  │                      │
   │                          │                            │                      │
   │                   13a. APPROVE:                        │                      │
   │                        PUT /close/:id                  │                      │
   │                        status → 'closed'               │                      │
   │                        +50 points to citizen           │                      │
   │                          │                            │                      │
   │ ◄── NOTIFICATION ─────────│                            │                      │
   │    "+50 points! Please    │                            │                      │
   │     rate the work"        │                            │                      │
   │                          │                            │                      │
   │   14. Citizen rates       │                            │                      │
   │       the work (1-5★)     │                            │                      │
   │       1★ → REOPENS task  │                            │                      │
   │          back to pending  │                            │                      │
   │                          │                            │                      │
   │                   13b. REJECT:                         │                      │
   │                        PUT /reject/:id                 │                      │
   │                        status → back to               │                      │
   │                        'assigned_to_contractor'        │                      │
   │                        with rejection note             │                      │
   │                          │              ◄── NOTIFICATION                     │
   │                          │                  "Your work was rejected           │
   │                          │                   Reason: ..."                    │
   │                          │                            │                      │
   │                          │                    ────────────────────────►      │
   │                          │                    Commissioner sees all          │
   │                          │                    in real-time analytics         │
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CITY GUARD MONOREPO                 │
│                                                         │
│  ┌─────────────────┐      ┌─────────────────┐           │
│  │  app-governance  │      │   app-traffic   │           │
│  │  (React Native)  │      │  (React Native) │           │
│  │                  │      │                 │           │
│  │  Citizens        │      │  Commuters      │           │
│  │  Officers        │      │  (Read-only     │           │
│  │  Contractors     │      │   road data)    │           │
│  │  Commissioner    │      │                 │           │
│  └────────┬─────────┘      └────────┬────────┘           │
│           │                         │                   │
│           └─────────┬───────────────┘                   │
│                     │ HTTP/REST API                     │
│                     ▼                                   │
│         ┌───────────────────────┐                        │
│         │   Express.js Backend  │                        │
│         │                       │                        │
│         │  /api/auth            │                        │
│         │  /api/reports         │                        │
│         │  /api/notifications   │                        │
│         │  /api/admin           │                        │
│         │  /api/upload          │                        │
│         │  /api/traffic         │                        │
│         │                       │                        │
│         │  ┌─────────────────┐  │                        │
│         │  │ Auth Middleware  │  │                        │
│         │  │ JWT Validation  │  │                        │
│         │  └─────────────────┘  │                        │
│         └──────┬────────────────┘                        │
│                │                                        │
│      ┌─────────┼──────────┐                             │
│      ▼         ▼          ▼                             │
│  MongoDB   Cloudinary  Gemini AI                        │
│  Atlas     (Media)     (Google)                         │
│  (Database)            (Vision API)                     │
└─────────────────────────────────────────────────────────┘
```

### Data Flow Layers

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Presentation** | React Native + Expo Router | Mobile UI for all user roles |
| **State** | React Hook State + AsyncStorage | Local state and token persistence |
| **Transport** | Axios + JWT Bearer Token | Authenticated API communication |
| **API** | Express.js REST | Business logic routing |
| **Auth** | JWT + bcryptjs | Token-based authentication |
| **Database** | MongoDB Atlas + Mongoose | Persistent data storage |
| **Media** | Cloudinary | Image upload, hosting, CDN |
| **AI** | Google Gemini 2.5 Flash | Vision-based image verification |
| **Email** | Nodemailer (Gmail/Ethereal) | Password reset OTP delivery |
| **Notifications** | Expo Notifications + DB | Push + in-app notifications |

---

## 🛠️ Tech Stack (Deep Dive)

### Frontend — React Native (Expo)

| Package | Version | Why We Use It |
|---------|---------|--------------|
| `expo` | ~54.0.33 | Managed workflow, OTA updates, EAS builds |
| `expo-router` | ~6.0.23 | File-based routing (similar to Next.js) — each screen is a file in `/app` |
| `react-native` | 0.81.5 | Core mobile framework |
| `react` | 19.1.0 | UI rendering |
| `nativewind` | ^4.2.2 | Tailwind CSS utility classes in React Native |
| `tailwindcss` | ^4.2.1 | Utility-first CSS framework |
| `lucide-react-native` | ^0.576.0 | Premium icon set (400+ icons) |
| `axios` | ^1.13.6 | Promise-based HTTP client with interceptors |
| `@react-native-async-storage/async-storage` | 2.2.0 | Persistent JWT token storage |
| `expo-image-picker` | ~17.0.10 | Native camera & gallery access |
| `expo-location` | ~19.0.8 | GPS coordinates for report geolocation |
| `react-native-maps` | 1.20.1 | Google Maps integration (heatmaps, roadblocks) |
| `react-native-chart-kit` | ^6.12.0 | Bar charts, pie/donut charts for analytics |
| `expo-notifications` | ~0.32.16 | Push notification handling |
| `expo-print` | ^55.0.8 | PDF generation for audit reports |
| `expo-sharing` | ^55.0.11 | Share generated PDFs |
| `react-native-reanimated` | ~4.1.1 | Smooth 60fps animations |
| `@react-native-picker/picker` | 2.11.1 | Native dropdown pickers |

### Backend — Node.js

| Package | Version | Why We Use It |
|---------|---------|--------------|
| `express` | ^5.2.1 | Web framework for REST API |
| `mongoose` | ^9.2.1 | MongoDB ODM with schema validation |
| `bcryptjs` | ^3.0.3 | Password hashing (salt rounds: 10) |
| `jsonwebtoken` | ^9.0.3 | JWT signing and verification |
| `@google/generative-ai` | ^0.24.1 | Gemini AI SDK for image verification |
| `cloudinary` | ^2.9.0 | Cloud image storage & CDN |
| `multer` | ^2.0.2 | Multipart form data / file uploads |
| `nodemailer` | ^8.0.4 | Email for password reset OTP |
| `cors` | ^2.8.6 | Cross-Origin Resource Sharing |
| `dotenv` | ^17.3.1 | Environment variable management |
| `axios` | ^1.13.6 | Fetch images server-side for AI verification |
| `nodemon` | ^3.1.14 | Auto-restart server on file changes (dev) |

### Infrastructure

| Service | Provider | Purpose |
|---------|----------|---------|
| **Database** | MongoDB Atlas (Cloud) | Managed NoSQL database |
| **Media Storage** | Cloudinary | Image CDN, resizing, transformations |
| **AI Vision** | Google Gemini 2.5 Flash | Image relevance verification |
| **Maps** | Google Maps (via react-native-maps) | Interactive maps + heatmaps |
| **Email** | Gmail SMTP / Ethereal | Password reset flow |

---

## 📱 Applications Breakdown

### App-Governance: Citizen & Admin App

The main governance application handles **6 distinct user roles** from a single codebase. Role-based routing sends every user to their appropriate dashboard upon login.

#### Screen Inventory

| Screen File | Role | Purpose |
|-------------|------|---------|
| `index.js` | All | **Login screen** — email/password auth, role-detection, JWT storage |
| `register.jsx` | All | **Registration** — name, email, password, role selection |
| `forgot_password.jsx` | All | Step 1: Enter email to receive OTP |
| `reset_password.jsx` | All | Step 2: Enter OTP + new password |
| `home.js` | All | **Smart Router** — reads JWT, routes to correct dashboard |
| `citizen_dashboard.jsx` | Citizen | Report list, points, stats, quick-action buttons |
| `create_report.jsx` | Citizen | **Full report creation** — photo picker, geocoding, AI submission |
| `citizen_reports.jsx` | Citizen | View all my submitted reports with status badges |
| `notifications.jsx` | Citizen | In-app notification bell with read/unread states |
| `profile.jsx` | Citizen | Profile photo, name, phone, password change |
| `public_view.jsx` | Guest | Browse resolved reports without logging in |
| `officer_dashboard.jsx` | Officer | Stats cards, pending task count, active tasks |
| `review_tasks.jsx` | Officer | **Review queue** — approve/reject completed reports with before/after images |
| `officer_notifications.jsx` | Officer | Officer-specific alert inbox |
| `officer_profile.jsx` | Officer | Officer profile management |
| `officer_complete_profile.jsx` | Officer | First-login profile completion wizard |
| `contractor_dashboard.jsx` | Contractor | Dispatcher — routes to department-specific dashboard |
| `contractor_road.jsx` | Contractor | Road department task hub |
| `contractor_waste.jsx` | Contractor | Waste management task hub |
| `contractor_electricity.jsx` | Contractor | Electrical works task hub |
| `contractor_profile.jsx` | Contractor | Contractor profile + department badge |
| `assigned_tasks.jsx` | Contractor | **Active work queue** — claim and complete tasks |
| `resource_form.jsx` | Contractor | Submit completion form — materials, labor hours, after-photo |
| `resolved_tasks.jsx` | Contractor | Completed work history |
| `commissioner_dashboard.jsx` | Commissioner | **Command center** — charts, heatmap, emergency broadcast, PDF report |

#### Key Frontend Logic

- **JWT Decoding**: App reads the token from AsyncStorage, decodes the role, and navigates accordingly on launch.
- **API Interceptors**: All requests automatically attach `Authorization: Bearer <token>` header.
- **Focus Refresh**: `useFocusEffect` + `useCallback` ensures data refreshes every time a screen is navigated back to (no stale data).
- **Role-Specific API Filters**: The backend automatically filters reports by the officer's zone and department — the frontend doesn't need to implement this logic.
- **Optimistic UI**: Forms disable submit buttons immediately on press to prevent double-submission.

---

### App-Traffic: Commuter App

A **dedicated, lightweight application** for daily commuters, separate from governance so the two apps can be independently deployed and managed.

#### Screen Inventory

| Screen | Purpose |
|--------|---------|
| `(tabs)/index.tsx` | **Interactive roadblock map** — shows all active construction zones/road blocks with GeoJSON LineString data from the backend, overlaid on Google Maps |
| `(tabs)/explore.tsx` | Browse upcoming/active road-block listings in list format |
| `(tabs)/alerts.tsx` | City-wide traffic alerts broadcast by the Commissioner or system |
| `(auth)/` | Login screen for registered commuters |

#### Traffic-Specific Data

Contractors can register road segments under active construction using a **GeoJSON LineString** model:
- **Partial block**: One lane accessible 
- **Full block**: Road completely closed
- **Expected end date**: Shown to commuters for planning

---

### Backend API Server

A **single Express.js server** serving both apps from a shared MongoDB database. The separation of governance and traffic data is achieved via the `appType` field on the User model (`'governance'` or `'traffic'`).

#### Route Groups

| Prefix | File | Description |
|--------|------|-------------|
| `/api/auth` | `authRoutes.js` | Register, login, profile, password management |
| `/api/reports` | `reportRoutes.js` | Full report CRUD + role-specific queries |
| `/api/notifications` | `notificationRoutes.js` | Fetch, mark-read, broadcast notifications |
| `/api/upload` | `uploadRoutes.js` | Cloudinary image upload handler |
| `/api/admin` | `adminRoutes.js` | One-time seeding & administrative operations |
| `/api/traffic` | `traffic.js` | Roadblock creation and map data queries |

#### Auth Middleware (`protect`)
Every protected route runs through JWT middleware that:
1. Extracts the `Authorization: Bearer <token>` header
2. Verifies signature with `JWT_SECRET`
3. Decodes `{ id, name, role, appType }` into `req.user`
4. Returns `401 Unauthorized` if token is missing, expired, or tampered with

---

## 🔐 Role-Based Access Control (RBAC)

```
Role            App Type     Capabilities
──────────      ────────     ──────────────────────────────────────────
citizen         governance   Submit reports, track status, rate work, earn points
officer         governance   Claim pending reports, assign to contractors, review/close
contractor      governance   View assigned tasks, upload completion proof, resource form
commissioner    governance   View ALL data, analytics, broadcast alerts, generate PDF
commuter        traffic      View roadblocks on map, check alerts
admin           governance   System management (seeding via admin API)
```

**Zone-based isolation for officers:**
- Each officer is assigned to one of **7 zones**: Central, West, North West, South West, North, South, East
- Officers only see pending reports **in their zone** + **their department(s)**
- This prevents information overload and misrouting

**Department-based isolation for contractors:**
- Each contractor belongs to one or more departments: `Road`, `Waste`, `Water`, `Electricity`
- Officers can only assign a report to contractors **matching the report's category**
- This prevents a waste contractor from being assigned electrical work

---

## 🤖 AI Integration — Gemini-Powered Features

City Guard integrates **Google Gemini 2.5 Flash Vision** at two critical checkpoints.

### Checkpoint 1: Report Submission Verification
**Route:** `POST /api/reports/create`

**Process:**
1. Backend downloads the uploaded image from Cloudinary via URL
2. Converts to Base64 for Gemini Vision API
3. Sends prompt: *"Does this image show a city infrastructure issue related to category: [category]? Answer Yes or No."*
4. If **No** → HTTP 400 returned, report is **NOT saved**
5. If **Yes** → Report saved to database with `status: 'pending'`

**Why this matters:** Prevents fake/spam reports like a selfie submitted as a "water leak" — saves officers time and maintains data quality.

### Checkpoint 2: Contractor Completion Verification
**Route:** `POST /api/reports/complete/:id`

**Process:**
1. Backend downloads contractor's uploaded "after" photo
2. Converts to Base64 for Gemini Vision API
3. Sends stricter prompt: *"Is this a valid repair photo? If image is mostly black, blurred, a selfie, or lacks infrastructure details, answer No. Otherwise Yes."*
4. If **No** → HTTP 400, contractor informed to retake photo
5. If **Yes** → Report status updated to `completed_pending_review`

**SLA Tracking (alongside AI check):**
- `createdAt` time is compared against current time
- If > **72 hours** elapsed → `isLate: true` flag on the report
- Commissioner/Officer can filter for overdue tasks

---

## 🗃️ Database Models

### User Model

```javascript
{
  name: String,           // Display name
  email: String,          // Unique identifier
  password: String,       // bcryptjs hash (10 salt rounds)
  role: Enum[             // Access level
    'citizen', 'officer', 'admin',
    'commuter', 'contractor', 'commissioner'
  ],
  appType: Enum['governance', 'traffic'],  // Which app this user belongs to
  zone: String,           // Officer's geographic zone assignment
  department: [String],   // Officer/Contractor department(s): Road, Waste, Water, Electricity
  points: Number,         // Citizen gamification points (default: 0)
  phone: String,          // Optional contact number
  profilePhoto: String,   // Cloudinary URL
  isProfileComplete: Boolean, // First-login profile wizard completion
  resetPasswordToken: String, // 6-digit OTP for password reset
  resetPasswordExpire: Date   // OTP expiry (10 minutes)
}
```

### Report Model

```javascript
{
  citizenId: ObjectId → User,  // Reporter
  title: String,
  description: String,
  category: Enum['Road', 'Waste', 'Water', 'Electricity', 'Other'],
  location: {
    latitude: Number,
    longitude: Number,
    locality: String,          // Human-readable locality name
    zone: Enum[7 zones]        // Which city zone this falls in
  },
  imageUrl: String,            // Cloudinary URL of "before" photo
  afterImage: String,          // Cloudinary URL of "after" photo (contractor upload)
  status: Enum[                // Current lifecycle state
    'pending',                 // Submitted, waiting for officer
    'assigned',                // Officer claimed it
    'assigned_to_contractor',  // Officer assigned to contractor
    'completed_pending_review',// Contractor submitted proof, officer to review
    'resolved',                // Officer resolved (legacy flow)
    'closed',                  // Officer approved, citizen notified
    'rejected'                 // Officer rejected contractor work
  ],
  assignedTo: ObjectId → User,  // Officer ID
  contractorId: String,         // Contractor User ID
  materialsUsed: String,        // What the contractor used
  laborHours: Number,           // How many hours it took
  completionTime: Date,         // When contractor marked complete
  isLate: Boolean,              // Did it exceed 72-hour SLA?
  rating: Number,               // Citizen star rating (1-5)
  reopened: Boolean,            // Was this report reopened via 1-star rating?
  rejectionNote: String         // Officer's rejection reason
}
```

### Notification Model

```javascript
{
  userId: ObjectId → User,  // Who receives this notification
  message: String,          // Notification text
  type: Enum[
    'point_earned',          // Gamification event
    'report_update',         // Status change
    'general',               // General message
    'system_alert'           // Emergency/system broadcast
  ],
  isRead: Boolean
}
```

### RoadBlock Model (Traffic App)

```javascript
{
  contractor: ObjectId → User,  // Who registered this roadblock
  location: {
    type: 'LineString',          // GeoJSON for map rendering
    coordinates: [[lng, lat]]    // Start + end of blocked road segment
  },
  title: String,                 // e.g., "Metro Pillar Construction"
  description: String,
  severity: Enum['Partial', 'Full'],  // Lane partial block vs full closure
  expectedEndDate: Date
  // Index: 2dsphere for geo-spatial queries
}
```

---

## 🔌 API Endpoints Reference

### Auth Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register new user (any role) |
| POST | `/login` | ❌ | Login, returns JWT token |
| POST | `/forgot-password` | ❌ | Send 6-digit OTP to email |
| POST | `/reset-password` | ❌ | Verify OTP, set new password |
| GET | `/profile` | ✅ | Get current user's profile |
| PUT | `/complete-profile` | ✅ | Update phone, photo, name |
| PUT | `/update-password` | ✅ | Change password (requires current password) |

### Report Routes (`/api/reports`)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/create` | ✅ | Citizen | Submit report + AI verify + save |
| GET | `/my-reports` | ✅ | Citizen | Get own submitted reports |
| GET | `/all-pending` | ✅ | Officer | Pending reports in officer's zone+dept |
| GET | `/my-assigned` | ✅ | Officer | Reports assigned to this officer |
| GET | `/my-resolved` | ✅ | Officer | Reports resolved by this officer |
| GET | `/contractor` | ✅ | Contractor | Reports assigned to this contractor |
| GET | `/officer-stats` | ✅ | Officer | Performance stats (resolved, efficiency) |
| GET | `/contractors/:category` | ✅ | Officer | List contractors for a category |
| GET | `/pending-review` | ✅ | Officer | Completed tasks waiting for review |
| GET | `/review-stats` | ✅ | Officer | Review queue stats |
| GET | `/my-history` | ✅ | Any | Closed task history (role-filtered) |
| GET | `/all` | ✅ | Commissioner | ALL reports across all zones |
| GET | `/all-history` | ✅ | Commissioner | All resolved/closed reports |
| GET | `/public/all-history` | ❌ | Public | Resolved reports (no auth required) |
| PUT | `/claim/:id` | ✅ | Officer | Officer claims a pending report |
| PUT | `/assign-contractor/:id` | ✅ | Officer | Assign to contractor |
| PUT | `/resolve/:id` | ✅ | Officer | Legacy: mark as resolved |
| PUT | `/close/:id` | ✅ | Officer | Approve contractor work, close report |
| PUT | `/rate/:id` | ✅ | Citizen | Rate closed report (1★ = reopen) |
| PUT | `/reject/:id` | ✅ | Officer | Reject contractor work with note |
| POST | `/complete/:id` | ✅ | Contractor | Submit completion + AI verify afterImage |

### Notification Routes (`/api/notifications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ | Get current user's notifications |
| PUT | `/:id/read` | ✅ | Mark notification as read |
| POST | `/broadcast` | ✅ | Commissioner sends city-wide alert |

### Upload Routes (`/api/upload`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Upload image to Cloudinary, returns URL |

### Admin Routes (`/api/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/init-amc-system` | ❌ | One-time DB wipe + seed 7 officers + 4 contractors |

### Traffic Routes (`/api/traffic`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/roadblocks` | ✅ | Contractor registers a road block |
| GET | `/roadblocks` | ❌ | Public: get all active roadblocks |

---

## 🔄 Report Lifecycle — State Machine

```
                    ┌─────────────────────────┐
                    │         PENDING          │ ◄─────────────────────────────┐
                    │  (AI verified, waiting   │                               │
                    │   for officer to claim)  │                               │
                    └────────────┬─────────────┘                               │
                                 │ Officer claims (PUT /claim/:id)             │
                                 ▼                                             │
                    ┌─────────────────────────┐                               │
                    │        ASSIGNED          │                               │
                    │  (Officer owns it,       │                               │
                    │   finding contractor)    │                               │
                    └────────────┬─────────────┘                               │
                                 │ Officer assigns (PUT /assign-contractor/:id)│
                                 ▼                                             │
                    ┌─────────────────────────┐                               │
                    │  ASSIGNED_TO_CONTRACTOR  │ ◄─────────────┐              │
                    │  (Contractor doing work) │               │              │
                    └────────────┬─────────────┘               │              │
                                 │ Contractor submits           │              │
                                 │ (POST /complete/:id)         │              │
                                 ▼                              │              │
                    ┌─────────────────────────┐                │              │
                    │  COMPLETED_PENDING_REVIEW│                │              │
                    │  (Officer must verify    │                │              │
                    │   before/after photos)   │                │              │
                    └──────────┬──────────────┘                │              │
                               │                               │              │
              ┌────────────────┤                               │              │
              │   Approve       │   Reject                      │              │
              ▼                 ▼                               │              │
  ┌──────────────┐    ┌──────────────────┐                     │              │
  │    CLOSED    │    │  Back to         │─────────────────────┘              │
  │  +50 points  │    │  ASSIGNED_TO_    │                                    │
  │  to citizen  │    │  CONTRACTOR      │                                    │
  │  Citizen can │    │  + rejection note│                                    │
  │  rate (1-5★) │    └──────────────────┘                                    │
  └──────┬───────┘                                                            │
         │                                                                    │
         │ Citizen rates 1★                                                   │
         └────────────────────────────────────────────────────────────────────┘
                                (Report reopened, assignedTo cleared)
```

---

## 🎮 Points & Gamification System

City Guard uses a points system to incentivize citizen participation in city governance.

| Event | Points Awarded |
|-------|---------------|
| Report resolved & closed by officer | **+50 points** |

**How points accumulate:**
1. Citizen submits a valid report (AI-verified)
2. The full workflow completes (assigned → contractor → reviewed → closed)
3. `User.points += 50` is applied atomically via MongoDB `$inc` operator
4. Citizen receives a notification: *"Your report was verified and closed! You've earned 50 points."*

**Display:**
- Points are shown prominently on the Citizen Dashboard
- Profile screen shows total accumulated points
- (Future) leaderboard to compare with other citizens in the same zone

**Accountability via Ratings:**
If a citizen rates resolved work as **1 star**, the report is **automatically reopened** — reset to `pending` status with `reopened: true` flag, clearing the previous officer and contractor assignment. This creates an accountability loop where poor work cannot simply be rubber-stamped.

---

## 🔔 Notification System

City Guard implements a **dual-layer notification system**:

### Layer 1: Database Notifications (In-App Bell)
Stored in MongoDB, retrieved via `GET /api/notifications`. These persist until read and are displayed in the notification screen with read/unread state.

| Trigger Event | Recipient | Message |
|--------------|-----------|---------|
| Officer claims report | Citizen | "Your complaint has been claimed by the [Zone] Officer!" |
| Contractor assigned | Citizen | "A Contractor has been assigned and is on the way!" |
| Task completed by contractor | Officer | "Task in [locality] resolved by Contractor and ready for review." |
| Task closed by officer | Citizen | "Your report '[title]' verified and closed! +50 points. Please rate." |
| Work rejected by officer | Contractor | "Your submission for '[title]' was rejected. Reason: [reason]." |

### Layer 2: Emergency Broadcast (Commissioner)
Commissioner can compose and push a plain-text **emergency notification** to ALL citizens simultaneously via `POST /api/notifications/broadcast`. Use cases:
- Natural disaster warnings
- Major infrastructure failures
- Evacuation notices
- Planned city-wide maintenance

---

## 🔒 Security Architecture

### Authentication
- **JWT Tokens** signed with `JWT_SECRET` from environment variables
- Token expiry: **30 days**
- Client stores token in `AsyncStorage` (encrypted on device)
- All sensitive API routes protected by `protect` middleware

### Password Security
- Passwords **never stored in plain text**
- bcryptjs with **10 salt rounds** (~100ms hash time — resistant to brute force)
- Password reset via **6-digit OTP** sent to registered email
- OTP expires after **10 minutes**

### Authorization Guards
- Officers cannot see reports from other zones (server-side filter)
- Contractors cannot submit completion for tasks not assigned to them (ID check)
- Citizens cannot rate reports that aren't closed or aren't theirs
- Officers cannot close reports that aren't in `completed_pending_review` status

### AI Fraud Prevention
Dual-checkpoint AI verification (on submission AND on completion) prevents:
- Spam/fake reports flooding officer queues
- Contractors submitting random/stock photos as completion proof

---

## 🗺️ Zonal Model — AMC System

The governance system is modeled on the **Ahmedabad Municipal Corporation (AMC)** 7-zone structure:

| Zone | Example Areas (Ahmedabad) |
|------|--------------------------|
| Central | City center, Lal Darwaza |
| West | Navrangpura, Paldi |
| North West | Bodakdev, Thaltej, Gota |
| South West | Satellite, Prahladnagar |
| North | Sabarmati, Chandkheda |
| South | Maninagar, Vatwa |
| East | Naroda, Odhav |

**Pre-seeded System Accounts** (via `POST /api/admin/init-amc-system`):
- 7 Zonal Officers (one per zone, all departments enabled)
- 4 Specialized Contractors: Road, Waste, Water, Electricity
- All seeded with password: `123456` (should be changed in production)

---

## 🚀 Running the Project Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- Google Gemini API key
- Expo CLI (`npm install -g expo-cli`)
- Android emulator or physical device with Expo Go app

### Step 1: Clone & Install

```bash
# Root dependencies
cd SmartCity
npm install

# Backend
cd backend
npm install
```

### Step 2: Configure Backend Environment

Create `backend/.env`:
```env
PORT=8080
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/smartcity
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
GEMINI_API_KEY=your_google_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SMTP_EMAIL=your_gmail@gmail.com
SMTP_PASSWORD=your_gmail_app_password
FROM_NAME=CityGuard
FROM_EMAIL=noreply@cityguard.com
```

### Step 3: Start Backend

```bash
cd backend
npm start   # runs: nodemon server.js
```

Server will be at: `http://localhost:8080`
Health check: `GET http://localhost:8080/health`

### Step 4: Seed the Database

```bash
# Initialize the full AMC zonal system (resets and seeds)
curl -X POST http://localhost:8080/api/admin/init-amc-system

# Or seed individual components:
node backend/seedCommissioner.js
node backend/seedContractors.js
node backend/seedDummyReports.js
```

### Step 5: Configure API URL in Apps

In both `app-governance/services/api.js` and `app-traffic/services/api.js`:
```javascript
const API_BASE_URL = 'http://<YOUR_LOCAL_IP>:8080/api';
// Use your machine's local IP (not localhost) when testing on a physical device
```

### Step 6: Start Apps

```bash
# Governance App
cd app-governance
npx expo start

# Traffic App (in separate terminal)
cd app-traffic
npx expo start
```

Scan the QR code with **Expo Go** on your device, or press `a` for Android emulator.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 8080) |
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Secret key for JWT signing |
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `SMTP_EMAIL` | No | Gmail address for password reset |
| `SMTP_PASSWORD` | No | Gmail App Password (not regular password) |
| `FROM_NAME` | No | Email sender name (default: SmartCity) |
| `FROM_EMAIL` | No | Email sender address |

> **Note:** If `SMTP_EMAIL` is not set, the system falls back to Ethereal (test email service) — password reset will log a preview URL to the console instead of sending a real email.

---

## 🔭 Future Roadmap

### Phase 2 — Enhanced Intelligence
- [ ] **AI Priority Scoring**: Gemini analyzes severity from photo (cracked road vs fully collapsed drain) and auto-tags urgency
- [ ] **Natural Language Report Parsing**: Citizen speaks into mic; AI fills out the report form from speech
- [ ] **Predictive Maintenance Heatmaps**: ML model predicts which zones will have issues next month based on historical patterns
- [ ] **Duplicate Report Detection**: AI checks if a very similar issue has already been reported in the same location

### Phase 3 — Platform Expansion
- [ ] **Web Dashboard** (React.js): Full commissioner & officer web portal for desktop use
- [ ] **Multilingual Support**: Hindi, Gujarati localization for broader accessibility
- [ ] **WhatsApp Bot Integration**: Citizens report issues via WhatsApp — bot creates reports automatically
- [ ] **Offline Mode**: PWA-style caching so reports can be created without internet and synced later

### Phase 4 — Advanced Features
- [ ] **IoT Sensor Integration**: Smart sensors (flood sensors, pothole detectors) auto-generate reports
- [ ] **Contractor GPS Tracking**: Real-time location of contractor en route, visible to citizen
- [ ] **Biometric Auth**: TouchID / FaceID for officer and contractor login
- [ ] **Department Leaderboard**: Gamification extended to departments — which zone+dept has best resolution rates?
- [ ] **Citizen Community Forum**: Upvote existing reports, add comments, attach additional photos
- [ ] **Budget Tracking**: Officers log cost per repair; Commissioner sees city-wide expenditure analytics
- [ ] **SLA Escalation Engine**: If a report hasn't been claimed in 24 hours, auto-notify senior officers
- [ ] **E2E Encryption**: End-to-end encrypted communications between roles

### Phase 5 — Scaling & Enterprise
- [ ] **Multi-City Deployment**: Tenant-aware architecture supporting multiple cities from one codebase
- [ ] **Government API Integration**: Connect with official AMC/municipality APIs for real-time zone data
- [ ] **Public API**: Allow third-party apps (news websites, smart city portals) to access anonymized city data
- [ ] **Expo EAS Build Pipeline**: Automated CI/CD for app store deployments
- [ ] **Real-time WebSockets**: Live dashboard updates without page refresh (Socket.io)

---

## ⚠️ Known Limitations & Technical Debt

| Issue | Impact | Fix Planned |
|-------|--------|-------------|
| Commissioner analytics use hardcoded chart data (not DB-computed) | Analytics not fully real-time | Phase 2: Aggregation pipelines |
| No API rate limiting | Potential abuse/spam | Add `express-rate-limit` |
| Admin init route has no authentication | Security risk if exposed publicly | Protect with admin secret header |
| SLA is hardcoded to 72 hours for all categories | Different issues need different SLAs | Per-category SLA configuration |
| No real-time push (only polling + DB notifications) | Officers miss urgent updates | WebSocket or Firebase Cloud Messaging |
| Map in Commissioner dashboard shows Ahmedabad coordinates hardcoded | Not portable | Make coordinates configurable per deployment |
| No unit or integration tests | Regressions possible | Jest + Supertest test suite |
| JWT tokens cannot be revoked before expiry | Security concern if token stolen | Token blacklist / refresh token pattern |
| Cloudinary upload in app does not validate file size | Large uploads possible | Client-side size check + Cloudinary limits |

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Total Screens (Governance) | 26 |
| Total Screens (Traffic) | 4 |
| API Endpoints | 28+ |
| Database Models | 4 |
| User Roles | 6 |
| City Zones | 7 |
| Report Status States | 7 |
| AI Verification Points | 2 |
| Notification Types | 4 |

---

## 👨‍💻 Architecture Decisions & Rationale

### Why React Native + Expo?
- Single codebase for iOS and Android
- Expo managed workflow reduces native build complexity
- Expo Router provides web-like file-based navigation
- Rich ecosystem of Expo modules (location, camera, notifications)

### Why MongoDB over PostgreSQL?
- Report documents have variable, nested structure (location, resource form data)
- Officer zones and departments are flexible arrays
- Geospatial indexing (`2dsphere`) for roadblock queries
- Flexible schema allows adding fields without migrations

### Why Two Separate Apps?
- `app-governance` and `app-traffic` serve fundamentally different users with different use cases
- Independent deployment to app stores
- Different update cycles — traffic data is more real-time
- Keeps governance app focused on core reporting workflow

### Why Gemini 2.5 Flash (not GPT or other)?
- Google's Vision API has excellent infrastructure image recognition
- Flash model is fast and cost-effective for per-request verification
- Seamless Node.js integration via `@google/generative-ai` SDK
- Competitive accuracy for the use case

---

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

*Built with ❤️ for smarter, more accountable cities.*
