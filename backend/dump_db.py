import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import pymysql
from backend.db import get_db_connection

def generate_dump(output_path="backend/database_dump.sql"):
    conn = get_db_connection()
    if not conn:
        print("Error: Could not connect to MySQL database.")
        return False

    with conn.cursor(pymysql.cursors.DictCursor) as cur:
        with open(output_path, "w", encoding="utf-8") as out:
            out.write("-- =========================================================\n")
            out.write("-- LandPredict AI: Complete MySQL Database Dump\n")
            out.write("-- Ministry of Road Transport & Highways\n")
            out.write("-- =========================================================\n\n")
            out.write("SET FOREIGN_KEY_CHECKS=0;\n")
            out.write("CREATE DATABASE IF NOT EXISTS `landpredict` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n")
            out.write("USE `landpredict`;\n\n")

            tables = ["users", "projects", "portal_registry", "automation_sync_logs", "predictions"]

            # Table schemas
            for t in tables:
                cur.execute(f"SHOW CREATE TABLE `{t}`")
                row = cur.fetchone()
                if row and "Create Table" in row:
                    out.write(f"DROP TABLE IF EXISTS `{t}`;\n")
                    out.write(f"{row['Create Table']};\n\n")

            # Data rows
            for t in ["users", "portal_registry", "automation_sync_logs", "projects"]:
                cur.execute(f"SELECT * FROM `{t}`")
                rows = cur.fetchall()
                if not rows:
                    continue

                cols = list(rows[0].keys())
                col_names = ", ".join([f"`{c}`" for c in cols])
                out.write(f"-- Data for table `{t}` ({len(rows)} records)\n")
                out.write(f"INSERT INTO `{t}` ({col_names}) VALUES\n")

                val_lines = []
                for r in rows:
                    vals = []
                    for c in cols:
                        v = r[c]
                        if v is None:
                            vals.append("NULL")
                        elif isinstance(v, (int, float)):
                            vals.append(str(v))
                        elif isinstance(v, bool):
                            vals.append("1" if v else "0")
                        else:
                            escaped = str(v).replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r")
                            vals.append(f"'{escaped}'")
                    row_str = ", ".join(vals)
                    val_lines.append(f"  ({row_str})")

                out.write(",\n".join(val_lines))
                out.write(";\n\n")

            out.write("SET FOREIGN_KEY_CHECKS=1;\n")
            out.write("-- End of Dump\n")

    print(f"Database dump generated successfully: {output_path}")
    return True

if __name__ == "__main__":
    generate_dump()
