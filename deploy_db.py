#!/usr/bin/env python3
"""
================================================================================
LandPredict AI: MySQL Database Deployment & Cloud Migration Tool
Ministry of Road Transport & Highways (MoRTH)
================================================================================

Usage:
  # 1. Test current configured MySQL connection:
  python deploy_db.py --status

  # 2. Deploy & migrate to a remote cloud MySQL database using a connection URL:
  python deploy_db.py --url "mysql://user:password@host.railway.app:3306/railway"

  # 3. Deploy using individual parameters:
  python deploy_db.py --host your-mysql-host.com --port 3306 --user root --password mypass --database landpredict

  # 4. Generate a fresh database SQL dump file:
  python deploy_db.py --dump
================================================================================
"""

import os
import sys
import argparse
import pymysql
from urllib.parse import urlparse, parse_qs

# Ensure root directory is on sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from backend.db import get_connection_params, get_db_connection, init_db, test_connection
from backend.dump_db import generate_dump

def print_banner():
    print("=" * 75)
    print("  LandPredict AI - MySQL Database Deployment & Cloud Migration Tool")
    print("  Ministry of Road Transport & Highways (MoRTH) & Gati Shakti Hub")
    print("=" * 75)

def check_status():
    print_banner()
    params = get_connection_params()
    host = params.get("host")
    port = params.get("port")
    user = params.get("user")
    db = params.get("database")
    ssl_active = "Yes (REQUIRED)" if "ssl" in params else "No"
    
    print(f"\n[Target Configuration]")
    print(f"  - Host:     {host}:{port}")
    print(f"  - User:     {user}")
    print(f"  - Database: {db}")
    print(f"  - SSL:      {ssl_active}")
    print("-" * 75)

    print("\n[Connecting to MySQL Server...]")
    success, info = test_connection()

    if not success:
        print(f"[FAIL] Connection Failed: {info}")
        print("\nTroubleshooting Tips:")
        print("  1. Verify your MySQL server is running.")
        print("  2. If using Cloud MySQL (Aiven, TiDB, Railway, AWS), ensure SSL is enabled.")
        print("  3. Check host, port, user, password, and database parameters in .env.")
        return False

    print(f"[OK] Connection Successful!")
    print(f"  - MySQL Version: {info.get('version')}")
    print(f"  - Current DB:    {info.get('database')}")
    print(f"  - Tables found:  {len(info.get('tables', []))} tables")

    conn = get_db_connection()
    if conn:
        with conn.cursor() as cur:
            print("\n[Database Table Row Counts]")
            for t in ["users", "projects", "portal_registry", "automation_sync_logs", "predictions"]:
                try:
                    cur.execute(f"SELECT COUNT(*) AS cnt FROM `{t}`")
                    cnt = cur.fetchone()["cnt"]
                    print(f"  - {t:<22} : {cnt:>6} records")
                except Exception:
                    print(f"  - {t:<22} : [Not Created Yet]")
        conn.close()

    print("=" * 75)
    return True

def deploy_remote(host, port, user, password, database, ssl_mode=None):
    print_banner()
    print(f"\n[Target Remote MySQL]")
    print(f"  - Host:     {host}:{port}")
    print(f"  - User:     {user}")
    print(f"  - Database: {database}")

    # Set environment variables for backend.db
    os.environ["DB_HOST"] = str(host)
    os.environ["DB_PORT"] = str(port)
    os.environ["DB_USER"] = str(user)
    os.environ["DB_PASSWORD"] = str(password)
    os.environ["DB_NAME"] = str(database)
    if ssl_mode:
        os.environ["MYSQL_SSL"] = str(ssl_mode)

    print("\n[Step 1/3] Ensuring target database exists...")
    # Connect without specific DB first to run CREATE DATABASE IF NOT EXISTS
    root_params = {
        "host": host,
        "port": int(port),
        "user": user,
        "password": password,
        "charset": "utf8mb4",
        "cursorclass": pymysql.cursors.DictCursor,
        "autocommit": True,
        "connect_timeout": 10
    }
    if ssl_mode or host not in ("127.0.0.1", "localhost", "0.0.0.0"):
        root_params["ssl"] = {"ssl_mode": "REQUIRED"}

    try:
        root_conn = pymysql.connect(**root_params)
        with root_conn.cursor() as cur:
            cur.execute(f"CREATE DATABASE IF NOT EXISTS `{database}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        root_conn.close()
        print(f"  [OK] Database `{database}` confirmed/created.")
    except Exception as e:
        print(f"  [NOTE] Could not run root CREATE DATABASE ({e}). Continuing assuming database exists.")

    print("\n[Step 2/3] Running Schema Migrations and Initial Seeding...")
    success = init_db()
    if not success:
        print("[FAIL] Migration failed.")
        return False

    print("\n[Step 3/3] Verifying remote database status...")
    check_status()
    print("\n[SUCCESS] Deployment completed successfully!")
    return True

def main():
    parser = argparse.ArgumentParser(description="LandPredict AI MySQL Database Deployment Tool")
    parser.add_argument("--status", action="store_true", help="Check status of configured MySQL database")
    parser.add_argument("--dump", action="store_true", help="Generate fresh backend/database_dump.sql")
    parser.add_argument("--url", type=str, help="MySQL connection URL (e.g. mysql://user:pass@host:3306/dbname)")
    parser.add_argument("--host", type=str, help="Target MySQL host")
    parser.add_argument("--port", type=int, default=3306, help="Target MySQL port (default 3306)")
    parser.add_argument("--user", type=str, help="Target MySQL user")
    parser.add_argument("--password", type=str, help="Target MySQL password")
    parser.add_argument("--database", type=str, default="landpredict", help="Target MySQL database name")
    parser.add_argument("--ssl", type=str, default="REQUIRED", help="SSL mode (default REQUIRED for cloud)")

    args = parser.parse_args()

    if args.dump:
        print_banner()
        print("\nGenerating fresh database dump...")
        generate_dump()
        return

    if args.url:
        parsed = urlparse(args.url)
        q = parse_qs(parsed.query)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 3306
        user = parsed.username or "root"
        password = parsed.password or ""
        database = parsed.path.lstrip("/") if parsed.path else "landpredict"
        ssl_mode = q.get("ssl-mode", [args.ssl])[0]
        deploy_remote(host, port, user, password, database, ssl_mode)
        return

    if args.host and args.user:
        deploy_remote(args.host, args.port, args.user, args.password or "", args.database, args.ssl)
        return

    # Default action if no deploy flags passed: print status
    check_status()

if __name__ == "__main__":
    main()
