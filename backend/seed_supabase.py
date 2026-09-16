"""
LandPredict AI: Supabase & PostgreSQL Cloud Data Migration & Seeder Tool
Project ID: kfeicdqlhgrrogjlbitl
Endpoint: https://kfeicdqlhgrrogjlbitl.supabase.co
"""

import os
import sys
import csv
import json
import argparse
import urllib.request
import urllib.error

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://kfeicdqlhgrrogjlbitl.supabase.co").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "sb_publishable_dDAcKIH-RLMvJcudttbPZw_JYRJPezX")
REST_BASE = f"{SUPABASE_URL}/rest/v1"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def check_table_exists(table_name: str) -> bool:
    url = f"{REST_BASE}/{table_name}?limit=1"
    req = urllib.request.Request(url, headers=HEADERS, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            return resp.status in (200, 206)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "PGRST205" in body or e.code == 404:
            return False
        return False
    except Exception as e:
        print(f"[Supabase] Error checking table '{table_name}': {e}")
        return False

def seed_users():
    print("\n--- 1. Seeding Users (RBAC) ---")
    default_users = [
        {
            "first_name": "Admin",
            "last_name": "User",
            "email": "admin@landpredict.gov.in",
            "organization": "Ministry of Road Transport & Highways",
            "role": "Administrator",
            "password_hash": "e6378e904b77f2ef8bc667107bfefeb4a1936c6a4d70ecce0dff5606d50ffec6",
            "is_active": 1
        },
        {
            "first_name": "CALA",
            "last_name": "Director",
            "email": "cala.morth@gov.in",
            "organization": "NHAI CALA Division",
            "role": "CALA Project Director",
            "password_hash": "f0907d8d266ff85223c72d6ef8d4b31a1961250280eb4c29774620f4c1eb02c7",
            "is_active": 1
        },
        {
            "first_name": "Revenue",
            "last_name": "Inspector",
            "email": "revenue.officer@gov.in",
            "organization": "State Revenue Department",
            "role": "Revenue Inspector",
            "password_hash": "67d14d24177d7fae29cbe26dbbfa1bcfae5c3e66bb1df42f1f00880ca51d2f97",
            "is_active": 1
        },
        {
            "first_name": "Public",
            "last_name": "Auditor",
            "email": "auditor@sih.gov.in",
            "organization": "Smart India Hackathon Evaluation",
            "role": "Public Auditor",
            "password_hash": "3781559868fb8d59fa9da86f1e292025624778ae9ea4518bf97b539c0ad146e2",
            "is_active": 1
        },
        {
            "first_name": "Shiv",
            "last_name": "Verma",
            "email": "shivvar70878@gmail.com",
            "organization": "IIMT / LandPredict",
            "role": "Administrator",
            "password_hash": "71e72e8bc5ee3f3176fa1c3aa4e71958b438ea22f87ee866f272a561168f8045",
            "is_active": 1
        }
    ]

    url = f"{REST_BASE}/users"
    headers = {**HEADERS, "Prefer": "resolution=merge-duplicates"}
    data_bytes = json.dumps(default_users).encode("utf-8")
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"  [OK] Seeded {len(default_users)} users into Supabase 'users' table (HTTP {resp.status}).")
            return True
    except urllib.error.HTTPError as e:
        print(f"  [!] Failed to seed users: HTTP {e.code} - {e.read().decode()}")
        return False
    except Exception as e:
        print(f"  [!] User seed exception: {e}")
        return False

def seed_portals():
    print("\n--- 2. Seeding 12 State Land Revenue Portals ---")
    state_portals = [
        {"id": "portal_up", "state": "Uttar Pradesh", "portal_name": "UP Bhulekh & BhuNaksha", "department": "Revenue Board UP", "portal_url": "https://upbhulekh.gov.in", "status": "ONLINE", "latency_ms": 38, "total_parcels": "2.4 Cr"},
        {"id": "portal_mh", "state": "Maharashtra", "portal_name": "Mahabhulekh & MahaBhunaksha", "department": "Revenue & Forest Dept MH", "portal_url": "https://bhulekh.mahabhumi.gov.in", "status": "ONLINE", "latency_ms": 42, "total_parcels": "3.1 Cr"},
        {"id": "portal_gj", "state": "Gujarat", "portal_name": "AnyROR Anywhere", "department": "Revenue Department Gujarat", "portal_url": "https://anyror.gujarat.gov.in", "status": "ONLINE", "latency_ms": 34, "total_parcels": "1.8 Cr"},
        {"id": "portal_ka", "state": "Karnataka", "portal_name": "Bhoomi & Dishaank", "department": "Revenue Department Karnataka", "portal_url": "https://landrecords.karnataka.gov.in", "status": "ONLINE", "latency_ms": 48, "total_parcels": "1.6 Cr"},
        {"id": "portal_br", "state": "Bihar", "portal_name": "Bihar Bhumi Dakhil Kharij", "department": "Dept of Revenue & Land Reforms", "portal_url": "https://biharbhumi.bihar.gov.in", "status": "ONLINE", "latency_ms": 52, "total_parcels": "1.9 Cr"},
        {"id": "portal_wb", "state": "West Bengal", "portal_name": "BanglarBhumi", "department": "Land & Land Reforms Dept WB", "portal_url": "https://banglarbhumi.gov.in", "status": "ONLINE", "latency_ms": 45, "total_parcels": "2.2 Cr"},
        {"id": "portal_mp", "state": "Madhya Pradesh", "portal_name": "MP Bhulekh", "department": "Revenue Dept Madhya Pradesh", "portal_url": "https://mpbhulekh.gov.in", "status": "ONLINE", "latency_ms": 36, "total_parcels": "2.0 Cr"},
        {"id": "portal_rj", "state": "Rajasthan", "portal_name": "Apna Khata (E-Dharti)", "department": "Revenue Board Rajasthan", "portal_url": "https://apnakhata.rajasthan.gov.in", "status": "ONLINE", "latency_ms": 41, "total_parcels": "1.7 Cr"},
        {"id": "portal_ap", "state": "Andhra Pradesh", "portal_name": "Meebhoomi Adangal", "department": "Revenue Department AP", "portal_url": "https://meebhoomi.ap.gov.in", "status": "ONLINE", "latency_ms": 39, "total_parcels": "1.5 Cr"},
        {"id": "portal_tn", "state": "Tamil Nadu", "portal_name": "Tamil Nilam Patta Chitta", "department": "Survey & Settlement Dept TN", "portal_url": "https://eservices.tn.gov.in", "status": "ONLINE", "latency_ms": 44, "total_parcels": "1.4 Cr"},
        {"id": "portal_od", "state": "Odisha", "portal_name": "Bhulekh Odisha", "department": "Revenue & Disaster Management", "portal_url": "https://bhulekh.ori.nic.in", "status": "ONLINE", "latency_ms": 50, "total_parcels": "1.2 Cr"},
        {"id": "portal_ts", "state": "Telangana", "portal_name": "Dharani Integrated Land Record", "department": "Registration & Stamps Dept TS", "portal_url": "https://dharani.telangana.gov.in", "status": "ONLINE", "latency_ms": 37, "total_parcels": "1.3 Cr"}
    ]

    url = f"{REST_BASE}/portal_registry"
    headers = {**HEADERS, "Prefer": "resolution=merge-duplicates"}
    data_bytes = json.dumps(state_portals).encode("utf-8")
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"  [OK] Seeded {len(state_portals)} portals into Supabase 'portal_registry' table (HTTP {resp.status}).")
            return True
    except urllib.error.HTTPError as e:
        print(f"  [!] Failed to seed portals: HTTP {e.code} - {e.read().decode()}")
        return False
    except Exception as e:
        print(f"  [!] Portals seed exception: {e}")
        return False

def seed_projects(limit: int = 350):
    print("\n--- 3. Seeding Corridor Projects from National Dataset ---")
    csv_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "land_acquisition_dataset-5.csv")
    if not os.path.exists(csv_path):
        print(f"  [!] Dataset file not found at {csv_path}")
        return False

    records = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, r in enumerate(reader):
            if i >= limit:
                break
            proj_id = r.get("project_id") or f"LAP-{10000+i}"
            is_del = int(r.get("is_delayed", 0) or 0)
            del_days = int(float(r.get("delay_days", 0) or 0))
            
            records.append({
                "project_id": proj_id,
                "project_name": f"{r.get('state', 'National')} {r.get('project_type', 'Infrastructure')} Corridor {r.get('district_code', '')}",
                "state": r.get("state", "Uttar Pradesh"),
                "district": r.get("district_code", "Central"),
                "district_code": r.get("district_code", "DIST-01"),
                "project_type": r.get("project_type", "Highway"),
                "land_type": r.get("land_type", "Private Agricultural"),
                "status": "Delayed" if is_del == 1 else "Active",
                "land_area_acres": float(r.get("land_area_acres", 50) or 50),
                "affected_families": int(r.get("num_affected_families", 20) or 20),
                "num_departments_involved": int(r.get("num_departments_involved", 3) or 3),
                "notification_age_days": int(r.get("notification_age_days", 300) or 300),
                "acquisition_stage": "Section 3D",
                "compensation_status": r.get("compensation_status", "Partially Disbursed"),
                "compensation_disbursed_pct": float(r.get("compensation_disbursed_pct", 50) or 50),
                "possession_status": r.get("possession_status", "Partial Possession"),
                "legal_disputes_count": int(r.get("legal_disputes_count", 0) or 0),
                "court_case_pending": int(r.get("court_case_pending", 0) or 0),
                "rehabilitation_required": int(r.get("rehabilitation_required", 0) or 0),
                "rehabilitation_progress_pct": float(r.get("rehabilitation_progress_pct", 0) or 0),
                "stakeholder_responsiveness_score": float(r.get("stakeholder_responsiveness_score", 5) or 5),
                "historical_dept_performance_score": float(r.get("historical_dept_performance_score", 50) or 50),
                "public_objections_count": int(r.get("public_objections_count", 0) or 0),
                "pending_approvals_count": int(r.get("pending_approvals_count", 0) or 0),
                "budget_utilization_pct": float(r.get("budget_utilization_pct", 50) or 50),
                "monsoon_season_overlap": int(r.get("monsoon_season_overlap", 0) or 0),
                "delay_days": del_days,
                "is_delayed": is_del,
                "description": "Seeded from National Land Acquisition Dataset",
                "risk_score": float(del_days) / 10.0 if del_days > 0 else 5.0,
                "risk_level": "High" if is_del == 1 else "Low",
                "prediction_status": "Evaluated",
                "source": "Dataset"
            })

    # Batch insert in chunks of 50
    chunk_size = 50
    total_seeded = 0
    url = f"{REST_BASE}/projects"
    headers = {**HEADERS, "Prefer": "resolution=merge-duplicates"}

    print(f"  Uploading {len(records)} projects in batches of {chunk_size}...")
    for start in range(0, len(records), chunk_size):
        chunk = records[start:start+chunk_size]
        data_bytes = json.dumps(chunk).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                total_seeded += len(chunk)
                print(f"    Batch {start//chunk_size + 1}: uploaded {len(chunk)} projects (Total: {total_seeded})")
        except urllib.error.HTTPError as e:
            print(f"    [!] Batch error at {start}: HTTP {e.code} - {e.read().decode()}")
            return False
        except Exception as e:
            print(f"    [!] Exception at {start}: {e}")
            return False

    print(f"  [OK] Successfully seeded all {total_seeded} projects into Supabase 'projects' table.")
    return True

def verify_supabase():
    print("==================================================================")
    print("  LandPredict AI: Supabase & PostgreSQL Cloud Verification")
    print(f"  Project Reference: {SUPABASE_URL}")
    print("==================================================================")

    tables = ["users", "projects", "portal_registry", "automation_sync_logs", "predictions"]
    all_ready = True

    for t in tables:
        exists = check_table_exists(t)
        status_str = "[OK] Ready" if exists else "[!] Missing (PGRST205: Not in schema cache)"
        print(f"  - Table '{t}': {status_str}")
        if not exists:
            all_ready = False

    if not all_ready:
        print("\n" + "="*66)
        print("  ACTION REQUIRED IN SUPABASE DASHBOARD:")
        print("  1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/kfeicdqlhgrrogjlbitl")
        print("  2. Navigate to 'SQL Editor' in the left sidebar.")
        print("  3. Copy and paste the entire contents of:")
        print("     backend/supabase_schema.sql")
        print("  4. Click 'RUN' to execute the PostgreSQL DDL script.")
        print("  5. Re-run this seeder script:")
        print("     python backend/seed_supabase.py")
        print("="*66 + "\n")
    else:
        print("\n  [SUCCESS] All 5 tables are provisioned and accessible in Supabase PostgreSQL!")
    return all_ready

def main():
    parser = argparse.ArgumentParser(description="LandPredict AI Supabase Data Migration & Seeder")
    parser.add_argument("--verify", action="store_true", help="Verify Supabase tables status")
    parser.add_argument("--seed", action="store_true", help="Seed all tables")
    args = parser.parse_args()

    ready = verify_supabase()
    if args.verify and not args.seed:
        return

    if not ready:
        print("Tables have not been created yet in Supabase. Please run supabase_schema.sql in the Supabase SQL Editor first.")
        return

    seed_users()
    seed_portals()
    seed_projects()
    print("\n[Done] Supabase data seeding routine finished.")

if __name__ == "__main__":
    main()

