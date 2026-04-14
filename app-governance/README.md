# 🏛️ CityGuard: Urban Governance & Accountability System

## 🌐 Overview
CityGuard is a comprehensive, professional-grade urban governance platform designed to bridge the gap between citizens and municipal authorities. Modeled after the **Ahmedabad Municipal Corporation (AMC)** workflow, it enhances transparency, citizen engagement, and administrative efficiency through data-driven accountability.

---

## 🚀 Essential Features

### 🛠️ Core Governance Logic
* **Intelligent Issue Reporting:** Citizens report urban issues (e.g., potholes, sanitation) with automatic **GPS-to-Zone mapping** across 7 municipal zones.
* **Specialized Workflows:** Dedicated dashboards for **Citizens, Zonal Officers, and Contractors** to ensure tasks move through the proper chain of command.
* **Real-Time Tracking:** A visual "Step-Tracker" allowing residents to monitor complaints from "Reported" to "Closed" in real-time.

### 🛡️ Accountability & Anti-Fraud (WOW Features)
* **GPS Geofencing:** Contractors are physically restricted from marking a task as "Resolved" unless they are within **50 meters** of the incident site.
* **Side-by-Side Verification:** Mandatory "Before vs. After" photo evidence required for every repair, ensuring high-quality work.
* **SLA Performance Timers:** Automated 24h/48h/72h countdowns that flag overdue tasks to senior officials.

### 📊 Administrative Intelligence
* **Commissioner’s Command Center:** An executive dashboard featuring **Zonal Heatmaps** (Red/Green complaint density) and performance leaderboards.
* **Audit-Ready Reporting:** One-click **PDF Report Generation** detailing materials used, labor hours, and photographic proof for municipal audits.
* **Public Transparency Portal:** A "Guest View" for the public to see resolved issues and city-wide progress without needing an account.

---

## 👥 Stakeholders

### 🏘️ Citizens & Residents
Primary users who report issues, view public resource allocation, and provide **1-5 Star Ratings** on the quality of municipal repairs.

### 👔 Zonal Officers & Mayor’s Office
Middle-management responsible for claiming reports, assigning them to the correct specialized contractors, and verifying the completed work.

### 🏗️ Municipal Departments & Contractors
Specialized teams (Roads, Water, Electricity, Waste) who receive geofenced work orders, navigate via integrated Google Maps, and log resources used.

### 📈 City Commissioner & Admin
High-level supervisors who monitor city-wide performance metrics, manage budget reports via the Open Data Portal, and issue **Emergency Broadcasts** during disasters.

---

## ⚙️ Technical Stack
* **Frontend:** React Native & Expo (Cross-platform iOS/Android)
* **Backend:** Node.js & Express (Scalable REST API)
* **Database:** MongoDB Atlas (NoSQL Document Store)
* **Intelligence:** Google Reverse Geocoding & Haversine Distance Logic
* **Visualization:** React Native Chart Kit & Interactive Heatmaps

---

## 📂 Project Structure
```text
CityGuard-System/
├── backend/            # Unified API, Auth, Zonal Logic & PDF Generators
├── app-governance/     # Mobile App (Citizen, Officer, Contractor, Commissioner)
├── components/         # Shared UI: TaskCards, Heatmaps, ProgressTrackers
└── package.json        # Project Configuration
