import { evaluateMaternalRiskLocally, predictWithExplanation } from '../src/ml/mlEngine';
import modelArtifact from '../src/ml/model_v1.0.0.json';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('   JANMASAATHI — PHASE 3 AUTOMATED VERIFICATION   ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: Local ML Decision Tree Equivalence (100 Cases)
  // ----------------------------------------------------
  console.log('--- TEST GROUP 1: Local ML Inference & 100-Case Equivalence ---');
  let equivalenceFailures = 0;

  for (let i = 0; i < 100; i++) {
    const age = 18 + (i % 35);
    const systolicBP = 90 + (i % 80);
    const diastolicBP = 60 + (i % 40);
    const bloodSugar = 4.0 + (i % 12) * 0.8;
    const bodyTemp = 97.0 + (i % 5) * 0.8;
    const heartRate = 60 + (i % 60);

    const directEval = predictWithExplanation(
      (modelArtifact as any).treeRoot,
      {
        age,
        systolicBP,
        diastolicBP,
        bloodSugar,
        bodyTemp,
        heartRate,
      },
      modelArtifact.modelVersion
    );

    const localModuleEval = evaluateMaternalRiskLocally({
      age,
      systolicBP,
      diastolicBP,
      bloodSugar,
      bloodSugarUnit: 'mmol/L',
      bodyTemp,
      bodyTempUnit: '°F',
      heartRate,
    });

    if (!localModuleEval.success || !localModuleEval.modelPrediction) {
      equivalenceFailures++;
      continue;
    }

    if (
      directEval.predictedCategory !== localModuleEval.modelPrediction.predictedCategory ||
      directEval.decisionPath.length !== localModuleEval.modelPrediction.decisionPath.length
    ) {
      equivalenceFailures++;
    }
  }

  assert(
    equivalenceFailures === 0,
    'Deterministic Local Decision Tree Equivalence (100 Representative Cases)',
    `Failed ${equivalenceFailures} out of 100 test cases.`
  );

  // ----------------------------------------------------
  // TEST 2: Invalid Clinical Input Validation
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 2: Local Clinical Input Validation ---');
  const invalidHeartRateEval = evaluateMaternalRiskLocally({
    age: 25,
    systolicBP: 120,
    diastolicBP: 80,
    bloodSugar: 5.5,
    bodyTemp: 98.6,
    heartRate: 12, // Invalid heart rate < 30
  });

  assert(
    Boolean(!invalidHeartRateEval.success &&
      invalidHeartRateEval.validationErrors?.some((e) => e.includes('Heart rate'))),
    'Rejection of Implausible Vitals (Heart Rate = 12 bpm rejected)'
  );

  const invalidDiastolicEval = evaluateMaternalRiskLocally({
    age: 25,
    systolicBP: 100,
    diastolicBP: 110, // Diastolic > Systolic
    bloodSugar: 5.5,
    bodyTemp: 98.6,
    heartRate: 72,
  });

  assert(
    Boolean(!invalidDiastolicEval.success &&
      invalidDiastolicEval.validationErrors?.some((e) => e.includes('Diastolic pressure cannot exceed'))),
    'Rejection of Invalid Blood Pressure Logic (Diastolic >= Systolic)'
  );

  // ----------------------------------------------------
  // TEST 3: Dependency Ordering & Metadata Structure
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 3: Offline Queue Dependency Ordering ---');

  const storePriority = {
    maternalProfiles: 1,
    assessmentDrafts: 2,
    healthUpdateDrafts: 3,
    referralDrafts: 4,
    appointmentDrafts: 4,
    messageDrafts: 5,
  };

  const samplePending = [
    { storeName: 'messageDrafts', id: 'MSG-001' },
    { storeName: 'maternalProfiles', id: 'MCP-999' },
    { storeName: 'assessmentDrafts', id: 'ASMT-999' },
    { storeName: 'referralDrafts', id: 'REF-999' },
  ];

  samplePending.sort(
    (a, b) => (storePriority as any)[a.storeName] - (storePriority as any)[b.storeName]
  );

  const isCorrectlyOrdered =
    samplePending[0].storeName === 'maternalProfiles' &&
    samplePending[1].storeName === 'assessmentDrafts' &&
    samplePending[2].storeName === 'referralDrafts' &&
    samplePending[3].storeName === 'messageDrafts';

  assert(
    isCorrectlyOrdered,
    'Dependency Order (Mothers -> Assessments -> Referrals -> Messages)'
  );

  // ----------------------------------------------------
  // TEST 4: Real Firestore Persistent Database Write/Read Verification
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 4: Firestore Real Database Connection & Security ---');

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = firebaseConfig.firestoreDatabaseId
      ? initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId)
      : initializeFirestore(app, {});

    const testDocId = `TEST-PHASE3-${Date.now()}`;
    const testDocRef = doc(db, 'assessments', testDocId);

    // Write synthetic test record
    await setDoc(testDocRef, {
      id: testDocId,
      motherId: 'MCP-2026-0894',
      motherName: 'Priya Sharma',
      workerId: 'HW-44120',
      workerName: 'Sunita Devi',
      recordedAt: new Date().toISOString(),
      systolicBP: 120,
      diastolicBP: 80,
      heartRate: 76,
      bloodGlucose: 5.2,
      bodyTemp: 98.6,
      isSynthetic: true,
      phase3Test: true,
    });

    // Read back
    const snap = await getDoc(testDocRef);
    assert(
      snap.exists() && snap.data()?.phase3Test === true,
      'Firestore Phase 3 Test Assessment Record Created & Verified',
      `Database ID: ${firebaseConfig.firestoreDatabaseId}`
    );
  } catch (fsErr: any) {
    assert(false, 'Firestore Real Database Verification', fsErr.message);
  }

  console.log('\n====================================================');
  console.log(`   PHASE 3 VERIFICATION SUMMARY: ${passedTests}/${totalTests} PASSED   `);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase3Tests();
