# LandPredict AI

LandPredict AI is a land acquisition and infrastructure delay prediction platform built around a FastAPI backend, MongoDB data layer, machine learning models, and a static HTML/JavaScript frontend.

The project is structured as a working prototype for monitoring land acquisition risk, project delays, statutory milestones, and key project data for infrastructure corridors.

## Project overview

This repository currently contains:

- A Python backend for authentication, project APIs, prediction endpoints, and automation logic
- A static frontend dashboard and project management screens
- A machine learning pipeline for delay classification and duration estimation
- Seeded project and portal data for local demo usage
- MongoDB initialization scripts for default users, sample projects, and portal metadata

## Tech stack

- Python 3.10+
- FastAPI
- MongoDB with PyMongo
- Pandas / NumPy
- scikit-learn
- Joblib
- HTML / CSS / JavaScript
- Uvicorn

## Repository structure

```text
.
├── backend/
│   ├── automation_service.py
│   ├── db.py
│   └── server.py
├── frontend/
│   ├── Analytics.css
│   ├── Analytics.html
│   ├── Analytics.js
│   ├── aiPrediction.css
│   ├── aiPrediction.html
│   ├── aiPrediction.js
│   ├── automationHub.css
│   ├── automationHub.js
│   ├── createProject.css
│   ├── createProject.html
│   ├── createProject.js
│   ├── dashboard.css
│   ├── dashboard.html
│   ├── dashboard.js
│   ├── details.css
│   ├── details.html
│   ├── details.js
│   ├── gisMap.css
│   ├── gisMap.html
│   ├── gisMap.js
│   ├── land_acquisition_dataset-5.csv
│   ├── login.css
│   ├── login.html
│   ├── login.js
│   ├── projects.css
│   ├── projects.html
│   ├── projects.js
│   ├── reports.css
│   ├── reports.html
│   ├── reports.js
│   ├── settings.css
│   ├── settings.html
│   ├── settings.js
│   ├── sharedAuth.css
│   ├── sharedAuth.js
│   ├── signup.html
│   ├── signup.js
│   └── style.css
├── ml_pipeline/
│   ├── models/
│   └── train_model.py
├── .gitignore
├── index.html
├── README.md
├── render.yaml
├── requirements.txt
├── test_platform.py
└── backend/server.py
```

## Current application features

The current project includes:

- User authentication and role-based access control
- Project creation, listing, update, and deletion flows
- Delay prediction API using trained classification and regression models
- Dashboard and analytics pages for project performance reviews
- GIS and map-based project views
- Project report generation UI and data export support
- Automated portal and status sync logic for land acquisition-related metadata
- Seed data for departments, users, project records, and portal registry

## Machine learning module

The ML pipeline is implemented in [ml_pipeline/train_model.py](ml_pipeline/train_model.py). It trains:

- A classification model to predict whether a project is delayed
- A regression model to estimate delay duration in days
- A preprocessing pipeline for categorical and numerical features

The trained artifacts are saved in [ml_pipeline/models](ml_pipeline/models):

- classifier.joblib
- regressor.joblib
- preprocessor.joblib
- model_metadata.json

## Backend API

The API entry point is [backend/server.py](backend/server.py). It exposes endpoints such as:

- /api/health
- /api/auth/login
- /api/auth/signup
- /api/projects
- /api/predict
- /api/automation/*

The app also serves the frontend directly from the project root and from the frontend directory.

## Local setup

### 1. Clone the repo

```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Create and activate a virtual environment

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

On macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set environment variables

The app reads MongoDB settings from environment variables such as:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/landpredict
CORS_ORIGINS=http://127.0.0.1:8000,http://localhost:8000
```

If MONGODB_URI is not set, the project falls back to the default local MongoDB connection settings defined in [backend/db.py](backend/db.py).

### 5. Start the app

```bash
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
```

Then open:

```text
http://127.0.0.1:8000/
```

The app also serves pages such as:

- /dashboard.html
- /projects.html
- /analytics.html
- /gisMap.html
- /aiPrediction.html
- /reports.html
- /login.html

## Default demo accounts

The database initializer seeds default users in [backend/db.py](backend/db.py). These are the current demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@landpredict.gov.in | Admin@123 |
| CALA Project Director | cala.morth@gov.in | Cala@123 |
| Revenue Inspector | revenue.officer@gov.in | Revenue@123 |
| Public Auditor | auditor@sih.gov.in | Auditor@123 |
| Administrator | shivvar70878@gmail.com | shiv@7087 |

## Notes

- The project is currently configured as a local/demo platform with seeded datasets and default database records.
- Pretrained ML models are included in the repository, but they can be retrained by running the training script in [ml_pipeline/train_model.py](ml_pipeline/train_model.py).
- If MongoDB is unavailable, the backend still starts but database-backed endpoints may be limited or return connection errors.

## License

This project is currently structured as an internal demo/prototype application and does not include a formal production license file. Update as needed for your deployment or institutional usage requirements.

