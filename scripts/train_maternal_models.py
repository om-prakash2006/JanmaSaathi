import csv
import math
import json

def load_uci():
    rows = []
    with open('public/assets/aistudio/Maternal_Health_Risk_Data_Set_a1f70257.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append({
                'Age': float(r['Age']),
                'SystolicBP': float(r['SystolicBP']),
                'DiastolicBP': float(r['DiastolicBP']),
                'BS': float(r['BS']),
                'BodyTemp': float(r['BodyTemp']),
                'HeartRate': float(r['HeartRate']),
                'RiskLevel': r['RiskLevel'].strip().lower()
            })
    return rows

def load_danger():
    rows = []
    with open('public/assets/aistudio/synthetic_maternal_danger_signs_dataset_f7cb047b.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append({
                'Age': float(r['Age']),
                'SystolicBP': float(r['Systolic_BP_mmHg']),
                'DiastolicBP': float(r['Diastolic_BP_mmHg']),
                'BS': float(r['Blood_Glucose_mg_dL']),
                'BodyTemp': float(r['Body_Temperature_C']),
                'HeartRate': float(r['Heart_Rate_bpm']),
                'Hemoglobin': float(r['Hemoglobin_g_dL']),
                'Bleeding': 1.0 if r['Bleeding'].strip().lower() in ['yes', '1', 'true'] else 0.0,
                'Swelling': 1.0 if r['Swelling'].strip().lower() in ['yes', '1', 'true'] else 0.0,
                'ReducedFetalMovement': 1.0 if r['Reduced_Fetal_Movement'].strip().lower() in ['yes', '1', 'true'] else 0.0,
                'RiskLevel': r['Synthetic_Risk_Label'].strip().lower()
            })
    return rows

uci_data = load_uci()
danger_data = load_danger()

print(f"UCI dataset loaded: {len(uci_data)} records")
print(f"Danger signs dataset loaded: {len(danger_data)} records")

# Target classes
uci_classes = sorted(list(set(r['RiskLevel'] for r in uci_data)))
danger_classes = sorted(list(set(r['RiskLevel'] for r in danger_data)))

print("UCI classes:", uci_classes)
print("Danger classes:", danger_classes)

# Count class frequencies
uci_counts = {}
for r in uci_data:
    uci_counts[r['RiskLevel']] = uci_counts.get(r['RiskLevel'], 0) + 1
print("UCI class distribution:", uci_counts)

danger_counts = {}
for r in danger_data:
    danger_counts[r['RiskLevel']] = danger_counts.get(r['RiskLevel'], 0) + 1
print("Danger class distribution:", danger_counts)
