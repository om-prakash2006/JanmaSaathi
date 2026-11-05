import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

async function testPhase2() {
  console.log('====================================================');
  console.log('JANMASAATHI — PHASE 2 END-TO-END VERIFICATION TEST');
  console.log('====================================================\n');

  // Test 1 & 2 & 3: Dataset, Model Training & Evaluation Artifacts
  console.log('1. Checking Dataset Inspection & Model Artifacts...');
  const modelPath = path.resolve(process.cwd(), 'src/ml/model_v1.0.0.json');
  const reportPath = path.resolve(process.cwd(), 'src/ml/evaluation_report.json');

  if (!fs.existsSync(modelPath) || !fs.existsSync(reportPath)) {
    throw new Error('Model or evaluation report artifact missing!');
  }

  const artifact = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

  console.log('  Model Version:', artifact.modelVersion);
  console.log('  Trained At:', artifact.trainedAt);
  console.log('  CV Accuracy:', (report.accuracy * 100).toFixed(2) + '%');
  console.log('  CV Balanced Accuracy:', (report.balancedAccuracy * 100).toFixed(2) + '%');
  console.log('  CV Macro F1:', (report.macroF1 * 100).toFixed(2) + '%');
  console.log('  High Risk Class Recall:', (report.perClass.High.recall * 100).toFixed(2) + '%');

  // Test 4 & 5: Genuine Prediction Request & Explanation Generation
  console.log('\n2. Testing Genuine Prediction & Explanation API (/api/predict)...');
  const predRes = await fetch('http://localhost:3000/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      age: 32,
      systolicBP: 142,
      diastolicBP: 92,
      bloodSugar: 8.8,
      bloodSugarUnit: 'mmol/L',
      bodyTemp: 98.6,
      bodyTempUnit: '°F',
      heartRate: 78,
      supplementaryObservations: {
        haemoglobinGdl: 10.2,
        bleeding: false,
        swelling: 'Mild',
        reducedFetalMovement: false,
        clinicalNotes: 'End-to-end verification test assessment.',
      },
    }),
  });

  const predData = await predRes.json();
  if (!predData.success || !predData.modelPrediction) {
    throw new Error('Prediction request failed: ' + JSON.stringify(predData));
  }

  console.log('  Predicted Risk Category:', predData.modelPrediction.riskCategory);
  console.log('  Confidence Score:', predData.modelPrediction.confidenceScore);
  console.log('  Decision Path Steps:', predData.modelPrediction.decisionPath);
  console.log('  Contributing Features Count:', predData.modelPrediction.contributingFeatures.length);

  // Test 6: Invalid & Incomplete Inputs
  console.log('\n3. Testing Invalid & Incomplete Inputs Validation...');
  const invalidRes = await fetch('http://localhost:3000/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      age: 100, // Invalid
      systolicBP: 80,
      diastolicBP: 110, // Invalid diastolic > systolic
      bloodSugar: -5, // Invalid
    }),
  });

  const invalidData = await invalidRes.json();
  if (invalidRes.status !== 400 || !invalidData.validationErrors) {
    throw new Error('Invalid input check failed to reject!');
  }
  console.log('  Invalid input correctly rejected (HTTP 400). Validation Errors:', invalidData.validationErrors.length);

  // Test 8 & 9: Firebase Assessment Persistence & History Retrieval
  console.log('\n4. Testing Firestore Assessment Persistence & History Retrieval...');
  const config = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId);

  const testAsmId = `ASM-2026-TEST-${Date.now().toString().slice(-4)}`;
  const asmDocRef = doc(db, 'assessments', testAsmId);

  await setDoc(asmDocRef, {
    id: testAsmId,
    motherId: 'MCP-2026-9042',
    motherName: '[DEMO-TEST] Shanti Devi',
    workerId: 'HW-44120',
    workerName: 'Sunita Devi',
    recordedAt: '05 Nov 2026',
    gestationalWeek: 18,
    systolicBP: 142,
    diastolicBP: 92,
    heartRate: 78,
    bloodGlucose: 8.8,
    bodyTemp: 98.6,
    hemoglobin: 10.2,
    fetalMovementStatus: 'normal',
    dangerSigns: ['Severe swelling'],
    symptomsNotes: 'Phase 2 end-to-end testing evaluation.',
    nutritionalAdvice: 'IFA compliance, daily hydration.',
    originalMeasurements: predData.originalMeasurements,
    normalizedModelInputs: predData.normalizedModelInputs,
    modelPrediction: predData.modelPrediction,
    featureExplanations: predData.modelPrediction.contributingFeatures,
    supplementaryDangerObservations: predData.supplementaryObservations,
    modelVersion: '1.0.0',
    preprocessingVersion: '1.0.0',
    explanationMethod: 'Decision Path Tree Analysis',
    assessedAt: new Date().toISOString(),
    ruleBasedDangerIdentified: true,
    ruleBasedAlertDetails: ['Elevated Blood Pressure (142/92 mmHg)'],
    supervisorReviewStatus: 'pending',
    isSynthetic: true,
  });

  console.log('  Firestore setDoc SUCCESS for Assessment:', testAsmId);

  const retrievedSnap = await getDoc(asmDocRef);
  if (!retrievedSnap.exists()) {
    throw new Error('Retrieved assessment record not found in Firestore!');
  }

  const retrievedData = retrievedSnap.data();
  console.log('  Firestore getDoc SUCCESS! Category:', retrievedData.modelPrediction?.riskCategory);
  console.log('  Stored Decision Path Steps:', retrievedData.modelPrediction?.decisionPath?.length);
  console.log('  Stored Feature Explanations:', retrievedData.featureExplanations?.length);

  console.log('\n====================================================');
  console.log('ALL PHASE 2 END-TO-END VERIFICATION TESTS PASSED!');
  console.log('====================================================');
  process.exit(0);
}

testPhase2().catch((err) => {
  console.error('Phase 2 Test Execution Error:', err);
  process.exit(1);
});
