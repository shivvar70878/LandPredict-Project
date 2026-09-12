import os
import json
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    mean_absolute_error, mean_squared_error, r2_score
)

def train_and_export():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "land_acquisition_dataset-5.csv")
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    
    print(f"Loading dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)
    print(f"Loaded {len(df)} records with columns: {list(df.columns)}")
    
    # Target variables
    target_cls = "is_delayed"
    target_reg = "delay_days"
    
    # Feature subsets
    cat_features = ["state", "project_type", "land_type", "compensation_status", "possession_status"]
    num_features = [
        "land_area_acres", "num_affected_families", "num_departments_involved",
        "notification_age_days", "compensation_disbursed_pct", "legal_disputes_count",
        "court_case_pending", "rehabilitation_required", "rehabilitation_progress_pct",
        "stakeholder_responsiveness_score", "historical_dept_performance_score",
        "public_objections_count", "pending_approvals_count", "budget_utilization_pct",
        "monsoon_season_overlap"
    ]
    
    # Drop rows where target is null or missing
    df_clean = df.dropna(subset=[target_cls, target_reg]).copy()
    
    X = df_clean[cat_features + num_features]
    y_cls = df_clean[target_cls].astype(int)
    y_reg = df_clean[target_reg].astype(float)
    
    print(f"Class distribution for is_delayed:\n{y_cls.value_counts(normalize=True)}")
    print(f"Regression stats for delay_days:\n{y_reg.describe()}")
    
    # Split
    X_train, X_test, y_cls_train, y_cls_test, y_reg_train, y_reg_test = train_test_split(
        X, y_cls, y_reg, test_size=0.2, random_state=42, stratify=y_cls
    )
    
    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features)
        ]
    )
    
    # Fit preprocessor
    print("Fitting preprocessor...")
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    
    # Get feature names
    cat_encoder = preprocessor.named_transformers_["cat"]
    encoded_cat_names = list(cat_encoder.get_feature_names_out(cat_features))
    all_feature_names = num_features + encoded_cat_names
    
    # 1. Classification Model (Predicts is_delayed & delay probability)
    print("Training Classification Model (Random Forest)...")
    clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=14,
        min_samples_split=4,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1
    )
    clf.fit(X_train_proc, y_cls_train)
    
    y_cls_pred = clf.predict(X_test_proc)
    y_cls_proba = clf.predict_proba(X_test_proc)[:, 1]
    
    acc = float(accuracy_score(y_cls_test, y_cls_pred))
    prec = float(precision_score(y_cls_test, y_cls_pred, zero_division=0))
    rec = float(recall_score(y_cls_test, y_cls_pred, zero_division=0))
    f1 = float(f1_score(y_cls_test, y_cls_pred, zero_division=0))
    auc = float(roc_auc_score(y_cls_test, y_cls_proba))
    
    print("\n--- Classifier Evaluation ---")
    print(f"Accuracy : {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall   : {rec:.4f}")
    print(f"F1-Score : {f1:.4f}")
    print(f"ROC-AUC  : {auc:.4f}")
    
    # 2. Regression Model (Predicts delay_days for delayed projects)
    # Train regressor on all data or delayed projects
    print("\nTraining Regression Model (Gradient Boosting)...")
    reg = GradientBoostingRegressor(
        n_estimators=150,
        learning_rate=0.08,
        max_depth=5,
        random_state=42
    )
    reg.fit(X_train_proc, y_reg_train)
    
    y_reg_pred = reg.predict(X_test_proc)
    y_reg_pred = np.clip(y_reg_pred, 0, None)  # No negative delay days
    
    mae = float(mean_absolute_error(y_reg_test, y_reg_pred))
    rmse = float(np.sqrt(mean_squared_error(y_reg_test, y_reg_pred)))
    r2 = float(r2_score(y_reg_test, y_reg_pred))
    
    print("\n--- Regressor Evaluation ---")
    print(f"MAE  : {mae:.2f} days")
    print(f"RMSE : {rmse:.2f} days")
    print(f"R²   : {r2:.4f}")
    
    # Feature Importances (Classification)
    importances = clf.feature_importances_
    feat_imp = sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)
    top_features = [{"feature": f, "importance": round(float(imp), 4)} for f, imp in feat_imp[:15]]
    
    print("\nTop 10 Delay Predictors:")
    for f in top_features[:10]:
        print(f"  - {f['feature']}: {f['importance'] * 100:.2f}%")
        
    # Save Models and Preprocessor
    joblib.dump(clf, os.path.join(models_dir, "classifier.joblib"))
    joblib.dump(reg, os.path.join(models_dir, "regressor.joblib"))
    joblib.dump(preprocessor, os.path.join(models_dir, "preprocessor.joblib"))
    
    metadata = {
        "dataset_size": len(df_clean),
        "num_features": num_features,
        "cat_features": cat_features,
        "feature_names": all_feature_names,
        "top_features": top_features,
        "metrics": {
            "classification": {
                "accuracy": round(acc, 4),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1": round(f1, 4),
                "roc_auc": round(auc, 4)
            },
            "regression": {
                "mae_days": round(mae, 2),
                "rmse_days": round(rmse, 2),
                "r2": round(r2, 4)
            }
        },
        "states": sorted(df_clean["state"].dropna().unique().tolist()),
        "project_types": sorted(df_clean["project_type"].dropna().unique().tolist()),
        "land_types": sorted(df_clean["land_type"].dropna().unique().tolist()),
        "compensation_statuses": sorted(df_clean["compensation_status"].dropna().unique().tolist()),
        "possession_statuses": sorted(df_clean["possession_status"].dropna().unique().tolist())
    }
    
    with open(os.path.join(models_dir, "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"\nAll models and metadata successfully saved to: {models_dir}")
    return metadata

if __name__ == "__main__":
    train_and_export()

