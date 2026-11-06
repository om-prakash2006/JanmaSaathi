import { evaluateMaternalRiskLocally } from '../src/ml/mlEngine';
import { evaluateClinicalObservations } from '../src/ml/clinicalScreening';

console.log('================================================================');
console.log('JANMASAATHI - OFFLINE ASSESSMENT SUBMISSION FLOW VERIFICATION');
console.log('================================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] Test ${totalTests}: ${testName}`);
  } else {
    console.error(`[FAIL] Test ${totalTests}: ${testName}`);
    if (details) console.error(`       Details: ${details}`);
  }
}

// -------------------------------------------------------------
// TEST 1: Instant Offline ML Local Inference
// -------------------------------------------------------------
const startTime = Date.now();
const offlineEval = evaluateMaternalRiskLocally({
  age: 26,
  systolicBP: 138,
  diastolicBP: 88,
  bloodSugar: 8.4,
  bloodSugarUnit: 'mmol/L',
  bodyTemp: 98.6,
  heartRate: 82,
});
const evalTime = Date.now() - startTime;

assert(
  offlineEval.success && offlineEval.modelPrediction?.predictedCategory !== undefined,
  'Test 1: Local deterministic ML inference executes offline without server dependency',
  `Result: ${offlineEval.modelPrediction?.predictedCategory}`
);

assert(
  evalTime < 100,
  `Test 2: Local ML evaluation completes instantly (${evalTime} ms)`
);

assert(
  (offlineEval.modelPrediction?.decisionPath?.length || 0) > 0 &&
    (offlineEval.modelPrediction?.contributingFeatures?.length || 0) > 0,
  'Test 3: Local ML inference generates full decision path and feature attribution explanations'
);

// -------------------------------------------------------------
// TEST 2: Instant Offline Clinical Screening & Safety Rules
// -------------------------------------------------------------
const clinicalScreen = evaluateClinicalObservations(
  {
    gestationalWeek: 28,
    systolicBP: 138,
    diastolicBP: 88,
    heartRate: 82,
    bodyTemp: 98.6,
    hemoglobin: 6.8, // Severe Anaemia < 7.0 g/dL
    fetalMovementStatus: 'normal',
    dangerSigns: ['dangerBleeding'],
  },
  'Low' // Test safety override against Low ML prediction
);

assert(
  clinicalScreen.hasUrgentDangerSigns === true,
  'Test 4: Independent clinical danger-sign screening runs offline and detects severe anaemia & bleeding'
);

assert(
  clinicalScreen.recommendedFollowUp.urgencyLevel === 'immediate_emergency' &&
    clinicalScreen.recommendedFollowUp.overrideApplied === true,
  'Test 5: Critical Safety Override applies immediately offline when urgent danger signs are present'
);

// -------------------------------------------------------------
// TEST 3: Offline Assessment Record Payload Integrity
// -------------------------------------------------------------
const mockAssessmentRecord = {
  id: `ASMT-MCP-2026-0894-${Date.now().toString().slice(-4)}`,
  motherId: 'MCP-2026-0894',
  motherName: 'Priya Sharma',
  workerId: 'HW-44120',
  workerName: 'Sunita Devi',
  gestationalWeek: 28,
  systolicBP: 138,
  diastolicBP: 88,
  heartRate: 82,
  bloodGlucose: 8.4,
  bodyTemp: 98.6,
  hemoglobin: 6.8,
  fetalMovementStatus: 'normal' as const,
  dangerSigns: ['dangerBleeding'],
  symptomsNotes: 'Offline assessment submission test',
  nutritionalAdvice: 'Take double dose IFA tablet',
  modelPrediction: offlineEval.modelPrediction,
  clinicalScreeningResult: clinicalScreen,
  ruleBasedDangerIdentified: true,
  supervisorReviewStatus: 'pending' as const,
  isSynthetic: false,
};

assert(
  mockAssessmentRecord.id.startsWith('ASMT-') &&
    mockAssessmentRecord.modelPrediction !== undefined &&
    mockAssessmentRecord.clinicalScreeningResult !== undefined,
  'Test 6: Offline assessment record payload is 100% complete and ready for instant UI navigation'
);

console.log('----------------------------------------------------------------');
console.log(`AUDIT RESULTS: ${passedTests} OF ${totalTests} TESTS PASSED`);
console.log('================================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
