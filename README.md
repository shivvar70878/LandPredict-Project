# 🏛️ LandPredict AI: Intelligent Land Acquisition & Infrastructure Delay Prediction Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase%20Cloud-336791?style=flat&logo=postgresql)](https://supabase.com)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-ML%20Pipeline-F7931E?style=flat&logo=scikit-learn)](https://scikit-learn.org)
[![PM Gati Shakti](https://img.shields.io/badge/PM%20Gati%20Shakti-NMP%20Synced-16a34a?style=flat)](#)
[![MoRTH Bhoomi Rashi](https://img.shields.io/badge/MoRTH-Bhoomi%20Rashi%203A%2F3D%2F3G-0284c7?style=flat)](#)

> **Enterprise AI platform built for the Ministry of Road Transport & Highways (MoRTH) & National Infrastructure Pipeline.**
> Combines Machine Learning, PM Gati Shakti NMP GIS intelligence, Bhoomi Rashi statutory milestones, and State Revenue Records (RoR) to predict, mitigate, and monitor infrastructure land acquisition bottlenecks.

---

## 🌟 Key Features

1. **🤖 Dual Machine Learning Pipeline**:
   - **Risk Classification**: Random Forest Classifier predicting project delay probability (`accuracy: ~87%`, `AUC: ~0.91`).
   - **Duration Regression**: Gradient Boosting Regressor predicting statutory delay in days (`MAE: ~22 days`).
   - **Feature Importance**: Evaluates 15 core risk dimensions (legal disputes, forest/ESZ clearance, PFMS DBT disbursal progress, public objections, monsoon seasonality).

2. **🛰️ PM Gati Shakti NMP GIS Hub**:
   - 200+ GIS layers synced across Forest, Eco-Sensitive Zones (ESZ), Coastal Regulation Zones (CRZ), Rivers, and Railway Crossings.
   - Interactive Leaflet.js mapping with automated spatial buffer intersection checks.

3. **📜 MoRTH Bhoomi Rashi Statutory Tracker**:
   - Real-time statutory tracking under the National Highways Act, 1956:
     - **Section 3A**: Notification of intention to acquire.
     - **Section 3C**: Hearing of public objections.
     - **Section 3D**: Declaration of acquisition (with strict 1-year statutory lapse countdown).
     - **Section 3G**: Land compensation determination & CALA award.
     - **Section 3H**: Direct Benefit Transfer (DBT) via PFMS.

4. **🗺️ State Revenue RoR Hub (DILRMP)**:
   - Synchronized with 12 state land portals (UP Bhulekh, Mahabhulekh, Bhoomi Karnataka, Dharani Telangana, BanglarBhumi, Meebhoomi, etc.).
   - Instant Khasra / Survey parcel title verification and dispute detection.

5. **🛡️ Enterprise RBAC (Role-Based Access Control)**:
   - **Administrator**: Full platform access, project creation, deletion, and role management.
   - **CALA Project Director**: Project authoring, Bhoomi Rashi workflow, and compensation award approvals.
   - **Revenue Inspector**: Khasra survey audits, dispute logging, and delay predictions.
   - **Public Auditor**: Read-only access to corridors, GIS maps, and analytics exports.

6. **🔔 Real-Time Notification Engine**:
   - Live relative time updates (`Just now`, `45s ago`, `2m ago`).
   - Automatic streaming of statutory lapse alerts, High Court interim stays, and PFMS clearance batches every 45 seconds.
   - Interactive category filtering (Statutory, Legal, Finance, GIS).

7. **📊 Advanced Analytics & Reporting**:
   - Dynamic charts powered by Chart.js (State distributions, Stage funnels, Budget vs. Expenditure).
   - Real-time multi-filter queries across 300+ corridors.
   - One-click CSV and PDF report export.

---

## 🏗️ Architecture

```
Project/
├── backend/
│   ├── server.py              # FastAPI application & REST API endpoints
│   ├── db.py                  # PostgreSQL & Supabase Cloud adapter + seed utilities
│   ├── seed_supabase.py       # Supabase data migration & seeder tool
│   ├── supabase_schema.sql    # PostgreSQL schema DDL for Supabase
│   ├── automation_service.py  # PM Gati Shakti, Bhoomi Rashi & RoR engines
├── frontend/
│   ├── dashboard.html / .js   # Main Executive KPI Dashboard
│   ├── Analytics.html / .js   # Multi-variable analytics & visual charts
│   ├── gisMap.html / .js      # PM Gati Shakti 200+ layer GIS map
│   ├── projects.html / .js    # Project inventory & filtering
│   ├── createProject.html     # Statutory corridor onboarding form
│   ├── aiPrediction.html      # What-If ML delay simulation tool
│   ├── reports.html / .js     # Audit export & generation
│   ├── settings.html / .js    # Role management & portal health
│   ├── details.html / .js     # Granular corridor inspection
│   ├── sharedAuth.js / .css   # Universal RBAC & Real-Time Notification Engine
│   └── land_acquisition_dataset-5.csv # 300+ benchmark corridor records
├── ml_pipeline/
│   ├── train_model.py         # Model training & hyperparameter tuning
│   └── models/                # Serialized Joblib pipelines & metadata
├── requirements.txt           # Python dependencies
└── .gitignore                 # Version control exclusions
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **PostgreSQL 15+ or Supabase Cloud**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

### 2. Create Virtual Environment & Install Dependencies
```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Database (PostgreSQL & Supabase Cloud)

LandPredict AI connects natively to **Supabase Cloud PostgreSQL** (Project ID: `kfeicdqlhgrrogjlbitl`).

1. **Execute Schema in Supabase**:
   - Open your [Supabase Dashboard](https://supabase.com/dashboard/project/kfeicdqlhgrrogjlbitl) &rarr; **SQL Editor**.
   - Copy and execute `backend/supabase_schema.sql` to create all 5 tables and RLS policies.

2. **Seed Corridor Records & Default Portals**:
   ```bash
   python backend/seed_supabase.py --verify
   python backend/seed_supabase.py --seed
   ```

3. **(Optional) Local PostgreSQL / Connection String**:
   You can also set custom environment variables:
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/landpredict"
   # Or Supabase credentials:
   export SUPABASE_URL="https://kfeicdqlhgrrogjlbitl.supabase.co"
   export SUPABASE_KEY="sb_publishable_dDAcKIH-RLMvJcudttbPZw_JYRJPezX"
   ```

### 4. Train ML Models (Optional)
The pre-trained models are already included under `ml_pipeline/models/`. If you wish to retrain:
```bash
python ml_pipeline/train_model.py
```

### 5. Launch the Application
```bash
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
```

Open your browser and navigate to:
```
http://127.0.0.1:8000/dashboard.html
```

---

## 👥 Default Demo Credentials

You can log in directly or switch roles dynamically using the **Profile Dropdown** in the top navigation bar:

| Role | Email | Permissions |
| :--- | :--- | :--- |
| **Administrator** | `shivvar70878@gmail.com` | Full Administrative & System Access |
| **CALA Project Director** | `cala.morth@gov.in` | Project Creation, Bhoomi Rashi Milestones, Compensation |
| **Revenue Inspector** | `revenue.officer@gov.in` | Survey Auditing, Khasra Parcel Inspection, AI Simulation |
| **Public Auditor** | `auditor@sih.gov.in` | Read-Only Access to Metrics, GIS Maps & Reports |

---

## 📜 License
Developed for the **Ministry of Road Transport & Highways (MoRTH)**.
Distributed under the MIT License.

