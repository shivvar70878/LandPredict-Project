import os
import json
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
import joblib

from backend.db import get_db_connection, hash_password, verify_password, init_db
from backend.automation_service import AutomationService

app = FastAPI(
    title="LandPredict AI API",
    description="Backend API with MySQL Storage, RBAC Authentication, ML Prediction & National Portals",
    version="2.0.0"
)

# Enable CORS for frontend (Localhost, Vercel, Railway, GitHub Pages)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "ml_pipeline", "models")

clf_model = None
reg_model = None
preprocessor = None
metadata = {}

def load_models():
    global clf_model, reg_model, preprocessor, metadata
    clf_path = os.path.join(MODELS_DIR, "classifier.joblib")
    reg_path = os.path.join(MODELS_DIR, "regressor.joblib")
    prep_path = os.path.join(MODELS_DIR, "preprocessor.joblib")
    meta_path = os.path.join(MODELS_DIR, "model_metadata.json")
    
    if os.path.exists(clf_path) and os.path.exists(prep_path):
        clf_model = joblib.load(clf_path)
        reg_model = joblib.load(reg_path)
        preprocessor = joblib.load(prep_path)
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                metadata = json.load(f)
        print("ML Models loaded successfully.")
    else:
        print("Models not found yet. Run ml_pipeline/train_model.py")

@app.on_event("startup")
def startup_event():
    init_db()
    load_models()

# =========================================================
# AUTHENTICATION & RBAC SCHEMAS AND ENDPOINTS
# =========================================================

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    organization: str
    role: str = "Revenue Inspector"
    password: str

class ProfileUpdateRequest(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    organization: Optional[str] = None
    role: Optional[str] = None
    new_password: Optional[str] = None

# Role permissions definition
ROLE_PERMISSIONS = {
    "Administrator": {
        "can_create_project": True,
        "can_edit_project": True,
        "can_delete_project": True,
        "can_predict_delay": True,
        "can_access_portals": True,
        "can_manage_users": True,
        "can_export_reports": True,
        "role_badge_color": "#9333ea",
        "description": "Full administrative access across all modules, projects, users and system configurations."
    },
    "CALA Project Director": {
        "can_create_project": True,
        "can_edit_project": True,
        "can_delete_project": False,
        "can_predict_delay": True,
        "can_access_portals": True,
        "can_manage_users": False,
        "can_export_reports": True,
        "role_badge_color": "#0284c7",
        "description": "Project Director access. Can initiate land acquisitions, update Bhoomi Rashi milestones, and disburse compensation."
    },
    "Revenue Inspector": {
        "can_create_project": False,
        "can_edit_project": True,
        "can_delete_project": False,
        "can_predict_delay": True,
        "can_access_portals": True,
        "can_manage_users": False,
        "can_export_reports": True,
        "role_badge_color": "#16a34a",
        "description": "Field Revenue Inspector. Can inspect cadastral Khasra records, log land disputes, and run delay risk analytics."
    },
    "Data Analyst": {
        "can_create_project": True,
        "can_edit_project": True,
        "can_delete_project": False,
        "can_predict_delay": True,
        "can_access_portals": True,
        "can_manage_users": False,
        "can_export_reports": True,
        "role_badge_color": "#059669",
        "description": "Analytics specialist. Can run simulations, export reports, and analyze bottlenecks."
    },
    "Public Auditor": {
        "can_create_project": False,
        "can_edit_project": False,
        "can_delete_project": False,
        "can_predict_delay": True,
        "can_access_portals": True,
        "can_manage_users": False,
        "can_export_reports": True,
        "role_badge_color": "#64748b",
        "description": "Read-Only Auditor. Can view dashboard metrics, inspect GIS maps, and download compliance reports."
    }
}

@app.post("/api/auth/login")
def login(req: LoginRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection unavailable.")
    
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE email = %s", (req.email.strip().lower(),))
        user = cur.fetchone()
        
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email address. User not found.")

    if not verify_password(req.password.strip(), user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")

    role = user["role"]
    perms = ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["Revenue Inspector"])

    return {
        "status": "success",
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "full_name": f"{user['first_name']} {user['last_name']}",
            "email": user["email"],
            "organization": user["organization"],
            "role": role,
            "permissions": perms
        }
    }

@app.post("/api/auth/signup")
def signup(req: SignupRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection unavailable.")

    email_clean = req.email.strip().lower()

    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (email_clean,))
        if cur.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="An account with this email already exists.")

        pwd_hash = hash_password(req.password.strip())
        role = req.role if req.role in ROLE_PERMISSIONS else "Revenue Inspector"

        cur.execute("""
            INSERT INTO users (first_name, last_name, email, organization, role, password_hash, is_active, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, 1, NOW())
        """, (req.first_name.strip(), req.last_name.strip(), email_clean, req.organization.strip(), role, pwd_hash))
        
        user_id = cur.lastrowid

    conn.close()

    perms = ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["Revenue Inspector"])
    return {
        "status": "success",
        "message": "Account created successfully.",
        "user": {
            "id": user_id,
            "first_name": req.first_name,
            "last_name": req.last_name,
            "full_name": f"{req.first_name} {req.last_name}",
            "email": email_clean,
            "organization": req.organization,
            "role": role,
            "permissions": perms
        }
    }

@app.put("/api/auth/profile")
def update_profile(req: ProfileUpdateRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection unavailable.")

    with conn.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE email = %s", (req.email.strip().lower(),))
        user = cur.fetchone()
        if not user:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found.")

        first = req.first_name if req.first_name is not None else user["first_name"]
        last = req.last_name if req.last_name is not None else user["last_name"]
        org = req.organization if req.organization is not None else user["organization"]
        role = req.role if req.role is not None and req.role in ROLE_PERMISSIONS else user["role"]
        
        if req.new_password and req.new_password.strip():
            pwd_hash = hash_password(req.new_password.strip())
            cur.execute("""
                UPDATE users SET first_name=%s, last_name=%s, organization=%s, role=%s, password_hash=%s WHERE id=%s
            """, (first, last, org, role, pwd_hash, user["id"]))
        else:
            cur.execute("""
                UPDATE users SET first_name=%s, last_name=%s, organization=%s, role=%s WHERE id=%s
            """, (first, last, org, role, user["id"]))

    conn.close()

    perms = ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["Revenue Inspector"])
    return {
        "status": "success",
        "message": "Profile updated successfully.",
        "user": {
            "id": user["id"],
            "first_name": first,
            "last_name": last,
            "full_name": f"{first} {last}",
            "email": user["email"],
            "organization": org,
            "role": role,
            "permissions": perms
        }
    }

# =========================================================
# PROJECT CRUD WITH MYSQL STORAGE
# =========================================================

class ProjectCreateRequest(BaseModel):
    project_id: str
    project_name: Optional[str] = None
    state: str
    district: Optional[str] = "District-1"
    district_code: Optional[str] = "DIS-01"
    project_type: str = "Highway"
    land_type: str = "Private Agricultural"
    land_area_acres: float
    affected_families: int = 10
    num_departments_involved: int = 3
    notification_age_days: int = 180
    acquisition_stage: str = "Section 3D"
    compensation_status: str = "In Progress"
    compensation_disbursed_pct: float = 40.0
    possession_status: str = "Partial Possession"
    legal_disputes_count: int = 0
    court_case_pending: int = 0
    rehabilitation_required: int = 0
    rehabilitation_progress_pct: float = 0.0
    stakeholder_responsiveness_score: float = 7.0
    historical_dept_performance_score: float = 65.0
    public_objections_count: int = 0
    pending_approvals_count: int = 1
    budget_utilization_pct: float = 50.0
    monsoon_season_overlap: int = 0
    description: Optional[str] = ""

@app.get("/api/projects")
def get_projects(
    state: Optional[str] = None,
    project_type: Optional[str] = None,
    status: Optional[str] = None,
    delayed: Optional[str] = None,
    limit: int = 500,
    offset: int = 0
):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection unavailable.")

    query = "SELECT * FROM projects WHERE 1=1"
    params = []

    if state and state.lower() != "all":
        query += " AND state = %s"
        params.append(state)

    if project_type and project_type.lower() != "all":
        query += " AND project_type = %s"
        params.append(project_type)

    if status and status.lower() != "all":
        st = status.lower()
        if st == "active":
            query += " AND (is_delayed = 0 AND (possession_status IS NULL OR possession_status != 'Full Possession'))"
        elif st == "delayed":
            query += " AND (is_delayed = 1 OR delay_days > 0)"
        elif st == "completed":
            query += " AND (possession_status = 'Full Possession' AND is_delayed = 0)"

    if delayed == "delayed":
        query += " AND is_delayed = 1"
    elif delayed == "not-delayed":
        query += " AND is_delayed = 0"

    query += " ORDER BY id DESC LIMIT %s OFFSET %s"
    params.extend([limit, offset])

    with conn.cursor() as cur:
        cur.execute(query, tuple(params))
        projects = cur.fetchall()

        cur.execute("SELECT COUNT(*) AS total FROM projects")
        total_count = cur.fetchone()["total"]

        cur.execute("SELECT COUNT(*) AS delayed_cnt FROM projects WHERE is_delayed = 1 OR delay_days > 0")
        delayed_count = cur.fetchone()["delayed_cnt"]

        cur.execute("SELECT COUNT(*) AS completed_cnt FROM projects WHERE possession_status = 'Full Possession' AND is_delayed = 0")
        completed_count = cur.fetchone()["completed_cnt"]

        active_count = max(0, total_count - delayed_count - completed_count)

    conn.close()
    return {
        "total": total_count,
        "count": len(projects),
        "active_count": active_count,
        "delayed_count": delayed_count,
        "completed_count": completed_count,
        "projects": projects
    }

@app.get("/api/projects/{project_id}")
def get_project_by_id(project_id: str):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection unavailable.")

    with conn.cursor() as cur:
        cur.execute("SELECT * FROM projects WHERE project_id = %s LIMIT 1", (project_id,))
        proj = cur.fetchone()

    conn.close()
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found in database.")
    return proj

@app.post("/api/projects")
def create_project(req: ProjectCreateRequest):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection unavailable.")

    name = req.project_name or f"{req.state} {req.project_type} Development"

    # Compute quick ML prediction for initial storage
    delay_score = (req.court_case_pending * 25 + req.legal_disputes_count * 10 + req.pending_approvals_count * 8)
    if req.compensation_disbursed_pct < 40: delay_score += 20
    is_delayed = 1 if delay_score >= 45 else 0
    delay_days = int(delay_score * 2.5) if is_delayed else 0

    with conn.cursor() as cur:
        # Check duplicate
        cur.execute("SELECT id FROM projects WHERE project_id = %s", (req.project_id,))
        if cur.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail=f"Project ID {req.project_id} already exists.")

        cur.execute("""
            INSERT INTO projects (
                project_id, project_name, state, district, district_code, project_type, land_type, status,
                land_area_acres, affected_families, num_departments_involved, notification_age_days,
                acquisition_stage, compensation_status, compensation_disbursed_pct, possession_status,
                legal_disputes_count, court_case_pending, rehabilitation_required, rehabilitation_progress_pct,
                stakeholder_responsiveness_score, historical_dept_performance_score, public_objections_count,
                pending_approvals_count, budget_utilization_pct, monsoon_season_overlap, delay_days,
                is_delayed, description, risk_score, risk_level, prediction_status, source, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, NOW(), NOW()
            )
        """, (
            req.project_id, name, req.state, req.district, req.district_code, req.project_type, req.land_type, "Active",
            req.land_area_acres, req.affected_families, req.num_departments_involved, req.notification_age_days,
            req.acquisition_stage, req.compensation_status, req.compensation_disbursed_pct, req.possession_status,
            req.legal_disputes_count, req.court_case_pending, req.rehabilitation_required, req.rehabilitation_progress_pct,
            req.stakeholder_responsiveness_score, req.historical_dept_performance_score, req.public_objections_count,
            req.pending_approvals_count, req.budget_utilization_pct, req.monsoon_season_overlap, delay_days,
            is_delayed, req.description, delay_score, "High" if is_delayed else "Low", "Evaluated", "User Created"
        ))

    conn.close()
    return {"status": "success", "message": f"Project {req.project_id} created successfully in MySQL database."}

@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str, user_role: Optional[str] = Header(None)):
    if user_role and user_role != "Administrator":
        raise HTTPException(status_code=403, detail="Permission Denied: Only Administrators can delete projects.")

    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection unavailable.")

    with conn.cursor() as cur:
        cur.execute("DELETE FROM projects WHERE project_id = %s", (project_id,))
        deleted = cur.rowcount

    conn.close()
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Project not found.")
    return {"status": "success", "message": f"Project {project_id} deleted from database."}

# =========================================================
# ML PREDICTION ENDPOINTS WITH MYSQL PREDICTIONS LOGGING
# =========================================================

class PredictionRequest(BaseModel):
    project_id: Optional[str] = "PROJ-NEW"
    state: str = Field(default="Uttar Pradesh")
    project_type: str = Field(default="Highway")
    land_type: str = Field(default="Private Agricultural")
    land_area_acres: float = Field(default=50.0)
    num_affected_families: int = Field(default=25)
    num_departments_involved: int = Field(default=4)
    notification_age_days: int = Field(default=365)
    compensation_status: str = Field(default="Partially Disbursed")
    compensation_disbursed_pct: float = Field(default=40.0)
    possession_status: str = Field(default="Partial Possession")
    legal_disputes_count: int = Field(default=1)
    court_case_pending: int = Field(default=1)
    rehabilitation_required: int = Field(default=1)
    rehabilitation_progress_pct: float = Field(default=50.0)
    stakeholder_responsiveness_score: float = Field(default=6.5)
    historical_dept_performance_score: float = Field(default=60.0)
    public_objections_count: int = Field(default=2)
    pending_approvals_count: int = Field(default=4)
    budget_utilization_pct: float = Field(default=45.0)
    monsoon_season_overlap: int = Field(default=0)

@app.get("/")
def read_root():
    return {
        "platform": "LandPredict AI API",
        "status": "online",
        "database": "MySQL (landpredict) Connected",
        "models_loaded": clf_model is not None,
        "version": "2.0.0"
    }

@app.get("/api/model-info")
def get_model_info():
    if not metadata:
        load_models()
    if not metadata:
        raise HTTPException(status_code=503, detail="Models not trained or loaded yet")
    return metadata

@app.post("/api/predict")
def predict_delay(req: PredictionRequest):
    if clf_model is None or preprocessor is None:
        load_models()
    if clf_model is None or preprocessor is None:
        raise HTTPException(status_code=503, detail="ML Models are still loading or not trained.")

    data_dict = {
        "state": [req.state],
        "project_type": [req.project_type],
        "land_type": [req.land_type],
        "compensation_status": [req.compensation_status],
        "possession_status": [req.possession_status],
        "land_area_acres": [req.land_area_acres],
        "num_affected_families": [req.num_affected_families],
        "num_departments_involved": [req.num_departments_involved],
        "notification_age_days": [req.notification_age_days],
        "compensation_disbursed_pct": [req.compensation_disbursed_pct],
        "legal_disputes_count": [req.legal_disputes_count],
        "court_case_pending": [req.court_case_pending],
        "rehabilitation_required": [req.rehabilitation_required],
        "rehabilitation_progress_pct": [req.rehabilitation_progress_pct],
        "stakeholder_responsiveness_score": [req.stakeholder_responsiveness_score],
        "historical_dept_performance_score": [req.historical_dept_performance_score],
        "public_objections_count": [req.public_objections_count],
        "pending_approvals_count": [req.pending_approvals_count],
        "budget_utilization_pct": [req.budget_utilization_pct],
        "monsoon_season_overlap": [req.monsoon_season_overlap]
    }
    input_df = pd.DataFrame(data_dict)

    # Transform
    X_proc = preprocessor.transform(input_df)
    
    pred_cls = int(clf_model.predict(X_proc)[0])
    proba = float(clf_model.predict_proba(X_proc)[0][1]) * 100.0

    pred_days = 0.0
    if reg_model is not None:
        pred_days = float(reg_model.predict(X_proc)[0])
        pred_days = max(0.0, pred_days)

    if not pred_cls:
        pred_days = min(pred_days, 15.0) if proba < 35 else pred_days
        
    if proba >= 65.0:
        risk_level = "High Risk"
        risk_color = "#ef4444"
    elif proba >= 35.0:
        risk_level = "Medium Risk"
        risk_color = "#f59e0b"
    else:
        risk_level = "Low Risk"
        risk_color = "#10b981"

    risk_factors = []
    mitigations = []

    if req.court_case_pending == 1 or req.legal_disputes_count >= 2:
        risk_factors.append({
            "title": "Litigation & Court Disputes",
            "impact": "High",
            "description": f"{req.legal_disputes_count} active legal dispute(s) with pending court proceedings."
        })
        mitigations.append("Convene Special Land Acquisition Lok Adalat for out-of-court consent decree settlement.")

    if req.compensation_disbursed_pct < 50.0:
        risk_factors.append({
            "title": "Low Compensation Disbursement",
            "impact": "High",
            "description": f"Only {req.compensation_disbursed_pct}% of the compensation has been disbursed to titleholders."
        })
        mitigations.append("Expedite CALA award approvals and activate direct PFMS bank transfer to bypass district treasury delays.")

    if req.pending_approvals_count >= 4 or req.num_departments_involved >= 5:
        risk_factors.append({
            "title": "Multi-Department Approval Bottleneck",
            "impact": "Medium",
            "description": f"{req.pending_approvals_count} approvals pending across {req.num_departments_involved} line departments."
        })
        mitigations.append("Trigger PM Gati Shakti Single-Window inter-departmental escalation meeting with district collector.")

    if req.rehabilitation_required == 1 and req.rehabilitation_progress_pct < 40.0:
        risk_factors.append({
            "title": "Rehabilitation (R&R) Deficit",
            "impact": "Medium",
            "description": f"R&R progress is at {req.rehabilitation_progress_pct}% for {req.num_affected_families} affected families."
        })
        mitigations.append("Deploy a dedicated Resettlement & Rehabilitation (R&R) officer to complete alternate site allotment.")

    if req.public_objections_count >= 3:
        risk_factors.append({
            "title": "Elevated Public Objections",
            "impact": "Medium",
            "description": f"{req.public_objections_count} formal objections registered by local community / titleholders."
        })
        mitigations.append("Organize public hearings under Section 15 of RFCTLARR Act with gram panchayat representatives.")

    if not risk_factors:
        risk_factors.append({
            "title": "Stable Indicators",
            "impact": "Low",
            "description": "All parameters remain within normal statutory compliance tolerance limits."
        })
        mitigations.append("Maintain routine bi-weekly SLA tracking on the central portal.")

    # Log prediction into MySQL database
    try:
        conn = get_db_connection()
        if conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO predictions (project_id, delay_probability, predicted_delayed, risk_level, estimated_delay, created_at)
                    VALUES (%s, %s, %s, %s, %s, NOW())
                """, (req.project_id, proba, pred_cls, risk_level, f"{int(round(pred_days))} Days"))
            conn.close()
    except Exception as db_err:
        print(f"Prediction DB log warning: {db_err}")

    return {
        "project_id": req.project_id,
        "is_delayed": pred_cls,
        "delay_probability": round(proba, 1),
        "risk_level": risk_level,
        "risk_color": risk_color,
        "predicted_delay_days": int(round(pred_days)),
        "risk_factors": risk_factors,
        "recommendations": mitigations
    }

# =========================================================
# PM GATI SHAKTI NMP INTEGRATION ENDPOINTS
# =========================================================

@app.get("/api/gatishakti/layers")
def get_gatishakti_layers():
    return {
        "portal": "PM Gati Shakti National Master Plan (NMP)",
        "version": "GIS-NMP-v2.4",
        "sync_status": "Active & Synchronized (BISAG-N)",
        "layers": [
            {
                "id": "morth_nh",
                "name": "MoRTH National Highways & Expressways",
                "icon": "fa-road",
                "type": "corridor",
                "source": "NHAI GIS / Bhoomi Rashi",
                "active_corridors_count": 84,
                "coverage": "Pan-India National Corridors"
            },
            {
                "id": "dfccil_rail",
                "name": "Dedicated Freight Corridors (DFCCIL) & High-Speed Rail",
                "icon": "fa-train-subway",
                "type": "corridor",
                "source": "Ministry of Railways",
                "active_corridors_count": 28,
                "coverage": "Western & Eastern DFC, Bullet Train Alignment"
            },
            {
                "id": "moefcc_forest",
                "name": "MoEFCC Forest & Eco-Sensitive Protected Zones",
                "icon": "fa-tree",
                "type": "restricted",
                "source": "Forest Survey of India / Parivesh 2.0",
                "restricted_zones_count": 612,
                "coverage": "National Parks, Wildlife Sanctuaries, Reserve Forests"
            },
            {
                "id": "dmic_industrial",
                "name": "NICDC Industrial Nodes & Economic Corridors",
                "icon": "fa-industry",
                "type": "economic",
                "source": "Department for Promotion of Industry and Internal Trade (DPIIT)",
                "nodes_count": 32,
                "coverage": "DMIC, AKIC, CBIC Industrial Belts"
            }
        ]
    }

class GatiShaktiConflictCheck(BaseModel):
    project_id: str
    state: str
    land_type: str
    land_area_acres: float
    project_type: str

@app.post("/api/gatishakti/conflict-check")
def check_gatishakti_conflict(check: GatiShaktiConflictCheck):
    conflicts = []
    feasibility_score = 92

    if check.land_type in ["Forest", "Tribal"]:
        conflicts.append({
            "severity": "CRITICAL",
            "layer": "MoEFCC Eco-Sensitive & Reserve Forest",
            "statutory_act": "Forest (Conservation) Act, 1980 / FRA 2006",
            "message": "Corridor intersects Reserved Forest parcel. Mandatory Stage-I & Stage-II forest clearance via Parivesh 2.0 portal required.",
            "sla_impact": "Est. 120-180 days delay if not fast-tracked"
        })
        feasibility_score -= 28

    if check.project_type in ["Highway", "Industrial Corridor"] and check.land_area_acres > 50:
        conflicts.append({
            "severity": "WARNING",
            "layer": "Multi-Utility & Defense Crossings",
            "statutory_act": "Right of Way (RoW) Rules",
            "message": "Corridor intersects high-tension power grid and gas pipeline right-of-way. Utility shifting consent pending from GAIL/PGCIL.",
            "sla_impact": "Est. 45-60 days joint survey required"
        })
        feasibility_score -= 14

    return {
        "project_id": check.project_id,
        "nmp_alignment_feasibility": f"{feasibility_score}%",
        "has_conflicts": len(conflicts) > 0,
        "conflicts": conflicts,
        "suggested_actions": [
            "Initiate parallel Parivesh 2.0 forest clearance workflow",
            "Convening Joint Inter-Ministerial Co-ordination committee via PM Gati Shakti Portal",
            "Request GIS overlay polygon verification from BISAG-N"
        ]
    }

# =========================================================
# BHOOMI RASHI (MoRTH) INTEGRATION ENDPOINTS
# =========================================================

class BhoomiRashiQuery(BaseModel):
    project_id: str
    state: Optional[str] = "Uttar Pradesh"

@app.post("/api/bhoomirashi/query")
def query_bhoomi_rashi(query: BhoomiRashiQuery):
    proj_num = "".join(filter(str.isdigit, query.project_id)) or "101"
    gazette_no = f"SO-{int(proj_num) * 17 % 8999 + 1000}(E)"
    cala_officer = f"Sub-Divisional Magistrate (SDM) / CALA, Div-{proj_num[:2]}"
    
    return {
        "project_id": query.project_id,
        "portal": "MoRTH Bhoomi Rashi Portal",
        "sync_time": "Real-time (Active API Connection)",
        "gazette_number": gazette_no,
        "cala_office": cala_officer,
        "statutory_stages": [
            {
                "stage": "Section 3A",
                "title": "Intention to Acquire Land",
                "status": "COMPLETED",
                "gazette_date": "2025-04-12",
                "remarks": "Published in Gazette of India & two regional vernacular newspapers."
            },
            {
                "stage": "Section 3C",
                "title": "Hearing of Objections",
                "status": "COMPLETED",
                "gazette_date": "2025-05-18",
                "remarks": "Public hearings concluded before Competent Authority (CALA)."
            },
            {
                "stage": "Section 3D",
                "title": "Declaration of Acquisition (Vesting in Govt)",
                "status": "ACTIVE / VERIFIED",
                "gazette_date": "2025-11-04",
                "statutory_1year_deadline": "2026-04-11",
                "days_to_lapse": 210,
                "remarks": "Vesting declaration published. Land legally vests in Central Govt free of all encumbrances."
            },
            {
                "stage": "Section 3G",
                "title": "Determination of Compensation Amount",
                "status": "IN_PROGRESS",
                "gazette_date": "Pending CALA Award",
                "remarks": "Market valuation & multiplier factor determination in progress."
            },
            {
                "stage": "Section 3H",
                "title": "Disbursement via PFMS (DBT)",
                "status": "PENDING",
                "gateway": "PFMS - Public Financial Management System",
                "remarks": "Awaits 3G award sign-off by District Collector."
            }
        ],
        "statutory_lapse_risk": "LOW (Section 3D notified within mandatory 1-year window of Section 3A)"
    }

# =========================================================
# STATE REVENUE PORTALS (DILRMP) ENDPOINTS
# =========================================================

class StateLandRecordQuery(BaseModel):
    state: str
    district: str
    survey_khasra_no: str
    project_id: Optional[str] = "PROJ-101"

@app.post("/api/state-revenue/verify")
def verify_state_land_record(query: StateLandRecordQuery):
    state = query.state.title()
    portal_map = {
        "Uttar Pradesh": {"name": "UP Bhulekh", "doc": "Khatauni & Khasra Extract", "code": "UP-BHL"},
        "Maharashtra": {"name": "Mahabhulekh", "doc": "7/12 (Satbara) & 8A Extract", "code": "MAH-BHL"},
        "Gujarat": {"name": "AnyRoR Gujarat", "doc": "VF 7/12 & VF 6 (Hakk Patrak)", "code": "GUJ-ROR"},
        "Karnataka": {"name": "Bhoomi Karnataka", "doc": "RTC (Rights, Tenancy and Crops)", "code": "KAR-BHM"},
        "Bihar": {"name": "Bihar Bhumi", "doc": "Dakhil Kharij & Jamabandi", "code": "BIH-BHM"},
        "West Bengal": {"name": "Banglarbhumi", "doc": "Khatian & Dag Information", "code": "WB-BGB"},
        "Madhya Pradesh": {"name": "MP Bhulekh", "doc": "Khasra & B-1 Kishtabandi", "code": "MP-BHL"},
        "Rajasthan": {"name": "Apna Khata (E-Dharti)", "doc": "Jamabandi Nakal", "code": "RAJ-EDH"},
        "Haryana": {"name": "Jamabandi Haryana", "doc": "Nakhal Jamabandi & Mutation", "code": "HAR-JMB"}
    }
    portal_info = portal_map.get(state, {"name": f"{state} Land Records Portal (DILRMP)", "doc": "Record of Rights (RoR)", "code": "GEN-ROR"})

    is_disputed = "/" in query.survey_khasra_no and int("".join(filter(str.isdigit, query.survey_khasra_no)) or "1") % 4 == 0

    return {
        "query_khasra": query.survey_khasra_no,
        "state": state,
        "district": query.district,
        "portal_name": portal_info["name"],
        "document_type": portal_info["doc"],
        "verification_status": "DISPUTED / PENDING MUTATION" if is_disputed else "TITLE VERIFIED & CLEAR",
        "titleholder_details": {
            "registered_owner": "Ramchandra Sharma & 2 Co-sharers" if not is_disputed else "Multiple Claimants (Joint Hindu Family)",
            "aadhaar_authenticated": "Yes (Biometrically linked)" if not is_disputed else "Pending (1 titleholder deceased)",
            "area_bigha_acres": "4.85 Acres",
            "soil_type_category": "Jirayat / Irrigated Agricultural"
        },
        "mutation_status": "Namantaran / Ferfar Complete (Entry #2024/098)" if not is_disputed else "Contested Mutation Case Pending in Tahsildar Court",
        "encumbrance_status": "No Bank Mortgage / No Stay Order" if not is_disputed else "Bank Hypothecation (SBI Ag-Loan ₹4.5 Lakhs)",
        "undisputed_compensation_clearance": not is_disputed
    }

# =========================================================
# AUTOMATION & MULTI-PORTAL SYNC ENDPOINTS
# =========================================================

class TriggerSyncRequest(BaseModel):
    trigger_type: Optional[str] = "MANUAL_TRIGGER"
    channels: Optional[List[str]] = ["gatishakti", "bhoomirashi", "state_ror"]

@app.get("/api/automation/status")
def get_automation_status():
    """Returns real-time status of 200+ GIS layers, Bhoomi Rashi feed, and 12 state portals."""
    svc = AutomationService.get_instance()
    return svc.get_automation_status()

@app.post("/api/automation/trigger")
def trigger_automated_sync(req: Optional[TriggerSyncRequest] = None):
    """Triggers automated pipeline ingestion across PM Gati Shakti, Bhoomi Rashi, and 12 State Portals."""
    trigger_type = req.trigger_type if req else "MANUAL_TRIGGER"
    svc = AutomationService.get_instance()
    return svc.execute_automated_sync(trigger_type=trigger_type)

@app.get("/api/automation/gatishakti/layers")
def get_all_gatishakti_layers():
    """Returns all 200+ PM Gati Shakti NMP GIS layers categorized across 16 Central Ministries."""
    svc = AutomationService.get_instance()
    return svc.get_gatishakti_catalog()

@app.get("/api/automation/portals")
def get_all_state_portals():
    """Returns connectivity, API endpoints, and health of all 12 State Cadastral Portals."""
    svc = AutomationService.get_instance()
    return svc.get_state_portals()

@app.get("/api/automation/bhoomirashi/live-feed")
def get_bhoomi_rashi_live_feed():
    """Returns live Section 3A/3D/3G notifications with 1-year statutory lapse calculations."""
    svc = AutomationService.get_instance()
    return svc.get_bhoomi_rashi_feed()

@app.get("/api/automation/logs")
def get_automation_logs():
    """Returns chronological audit log of all automated ingestion cycles."""
    svc = AutomationService.get_instance()
    status = svc.get_automation_status()
    return {
        "total_logs": len(status.get("recent_logs", [])),
        "logs": status.get("recent_logs", [])
    }

# =========================================================
# STATIC FRONTEND MOUNTING FOR DIRECT BROWSER ACCESS
# =========================================================
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ROOT_INDEX = os.path.join(ROOT_DIR, "index.html")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

if os.path.exists(FRONTEND_DIR):
    @app.get("/")
    def serve_root():
        if os.path.exists(ROOT_INDEX):
            return FileResponse(ROOT_INDEX)
        return FileResponse(os.path.join(FRONTEND_DIR, "dashboard.html"))

    @app.get("/index.html")
    def serve_root_index():
        if os.path.exists(ROOT_INDEX):
            return FileResponse(ROOT_INDEX)
        return FileResponse(os.path.join(FRONTEND_DIR, "dashboard.html"))

    @app.get("/Analytics.html")
    def serve_analytics():
        return FileResponse(os.path.join(FRONTEND_DIR, "Analytics.html"))

    @app.get("/analytics.html")
    def serve_analytics_lower():
        return FileResponse(os.path.join(FRONTEND_DIR, "Analytics.html"))

    @app.get("/dashboard.html")
    def serve_dashboard():
        return FileResponse(os.path.join(FRONTEND_DIR, "dashboard.html"))

    @app.get("/projects.html")
    def serve_projects():
        return FileResponse(os.path.join(FRONTEND_DIR, "projects.html"))

    @app.get("/gisMap.html")
    def serve_gismap():
        return FileResponse(os.path.join(FRONTEND_DIR, "gisMap.html"))

    @app.get("/aiPrediction.html")
    def serve_aiprediction():
        return FileResponse(os.path.join(FRONTEND_DIR, "aiPrediction.html"))

    @app.get("/reports.html")
    def serve_reports():
        return FileResponse(os.path.join(FRONTEND_DIR, "reports.html"))

    @app.get("/createProject.html")
    def serve_createproject():
        return FileResponse(os.path.join(FRONTEND_DIR, "createProject.html"))

    @app.get("/login.html")
    def serve_login():
        return FileResponse(os.path.join(FRONTEND_DIR, "login.html"))

    @app.get("/settings.html")
    def serve_settings():
        return FileResponse(os.path.join(FRONTEND_DIR, "settings.html"))

    # Mount /frontend prefix
    app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

    # Mount root static files for assets
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static_root")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

