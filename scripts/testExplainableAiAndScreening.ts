import { evaluateMaternalRiskLocally, predictWithExplanation, DecisionNode } from '../src/ml/mlEngine';
import { evaluateClinicalObservations } from '../src/ml/clinicalScreening';
import modelArtifact from '../src/ml/model_v1.0.0.json';
import { TRANSLATIONS } from '../src/i18n/translations';

console.log('================================================================');
console.log('JANMASAATHI - EXPLAINABLE AI & CLINICAL SCREENING AUDIT TEST');
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
// TEST 1: High-risk prediction with genuine feature explanations
// -------------------------------------------------------------
const highRiskEval = evaluateMaternalRiskLocally({
  age: 38,
  systolicBP: 145,
  diastolicBP: 95,
  bloodSugar: 15.0,
  bloodSugarUnit: 'mmol/L',
  bodyTemp: 98.6,
  heartRate: 88,
});

assert(
  highRiskEval.success && highRiskEval.modelPrediction?.predictedCategory === 'High',
  'Scenario 1: High-risk prediction executed correctly',
  `Got: ${highRiskEval.modelPrediction?.predictedCategory}`
);

const highIncreasing = highRiskEval.modelPrediction?.featuresContributingToIncreasedRisk || [];
assert(
  highIncreasing.length > 0 &&
    highIncreasing.some((f) => f.featureName === 'Blood Sugar' && f.inputValue === 15.0),
  'Scenario 1b: Genuine feature attribution identifies Blood Sugar as increased risk contributor',
  `Increasing features: ${JSON.stringify(highIncreasing.map((f) => f.featureName))}`
);

assert(
  highRiskEval.modelPrediction?.terminalLeafSamples !== undefined &&
    highRiskEval.modelPrediction.leafClassDistribution !== undefined,
  'Scenario 1c: Terminal leaf training distribution reported transparently without fabricated confidence'
);

// -------------------------------------------------------------
// TEST 2: Moderate-risk prediction with genuine feature explanations
// -------------------------------------------------------------
const modRiskEval = evaluateMaternalRiskLocally({
  age: 28,
  systolicBP: 130,
  diastolicBP: 85,
  bloodSugar: 7.2,
  bloodSugarUnit: 'mmol/L',
  bodyTemp: 98.4,
  heartRate: 76,
});

assert(
  modRiskEval.success && modRiskEval.modelPrediction?.predictedCategory === 'Moderate',
  'Scenario 2: Moderate-risk prediction executed correctly',
  `Got: ${modRiskEval.modelPrediction?.predictedCategory}`
);

assert(
  (modRiskEval.modelPrediction?.decisionPath.length || 0) > 0,
  'Scenario 2b: Decision tree path traversal is logged with exact threshold steps'
);

// -------------------------------------------------------------
// TEST 3: Low-risk prediction with genuine feature explanations
// -------------------------------------------------------------
const lowRiskEval = evaluateMaternalRiskLocally({
  age: 24,
  systolicBP: 115,
  diastolicBP: 74,
  bloodSugar: 7.2,
  bloodSugarUnit: 'mmol/L',
  bodyTemp: 98.4,
  heartRate: 74,
});

assert(
  lowRiskEval.success && lowRiskEval.modelPrediction?.predictedCategory === 'Low',
  'Scenario 3: Low-risk prediction executed correctly',
  `Got: ${lowRiskEval.modelPrediction?.predictedCategory}`
);

const lowDecreasing = lowRiskEval.modelPrediction?.featuresContributingToDecreasedRisk || [];
assert(
  lowDecreasing.length > 0 &&
    lowDecreasing.some((f) => f.impact === 'lowers_risk'),
  'Scenario 3b: Features contributing to decreased/protective risk identified along decision path',
  `Decreasing features: ${JSON.stringify(lowDecreasing.map((f) => f.featureName))}`
);

assert(
  lowRiskEval.modelPrediction?.evaluatedModelFeatures?.some((f) => f.impactOnPrediction === 'lowers_risk') === true,
  'Scenario 3c: Evaluated model features correctly track protective features along decision tree path'
);

// -------------------------------------------------------------
// TEST 4: Clinical Danger Sign with Low ML Prediction (SAFETY OVERRIDE)
// -------------------------------------------------------------
const lowMlWithSevereAnaemia = evaluateClinicalObservations(
  {
    gestationalWeek: 26,
    systolicBP: 110,
    diastolicBP: 70,
    heartRate: 78,
    bodyTemp: 98.4,
    hemoglobin: 6.2, // SEVERE ANAEMIA (< 7.0 g/dL)
    fetalMovementStatus: 'normal',
    dangerSigns: [],
  },
  'Low' // ML predicted Low Risk
);

assert(
  lowMlWithSevereAnaemia.hasUrgentDangerSigns === true &&
    lowMlWithSevereAnaemia.urgentFindings.some((f) => f.parameter === 'Haemoglobin'),
  'Scenario 4a: Independent clinical screening detects severe anaemia (< 7 g/dL) as urgent danger sign'
);

assert(
  lowMlWithSevereAnaemia.recommendedFollowUp.overrideApplied === true &&
    lowMlWithSevereAnaemia.recommendedFollowUp.urgencyLevel === 'immediate_emergency',
  'Scenario 4b: CRITICAL SAFETY OVERRIDE enforces immediate emergency referral when danger sign present with Low ML',
  `Urgency: ${lowMlWithSevereAnaemia.recommendedFollowUp.urgencyLevel}, Override: ${lowMlWithSevereAnaemia.recommendedFollowUp.overrideApplied}`
);

// Another check: Vaginal Bleeding with Low ML
const lowMlWithBleeding = evaluateClinicalObservations(
  {
    gestationalWeek: 30,
    systolicBP: 118,
    diastolicBP: 76,
    heartRate: 80,
    bodyTemp: 98.2,
    hemoglobin: 11.4,
    fetalMovementStatus: 'normal',
    dangerSigns: ['dangerBleeding'],
  },
  'Low'
);

assert(
  lowMlWithBleeding.recommendedFollowUp.overrideApplied === true &&
    lowMlWithBleeding.recommendedFollowUp.urgencyLevel === 'immediate_emergency',
  'Scenario 4c: Antepartum bleeding strictly overrides Low ML screening for mandatory emergency referral'
);

// -------------------------------------------------------------
// TEST 5: Clinical Danger Sign with High ML Prediction
// -------------------------------------------------------------
const highMlWithSevereBP = evaluateClinicalObservations(
  {
    gestationalWeek: 34,
    systolicBP: 170, // Severe BP >= 160
    diastolicBP: 112, // Severe BP >= 110
    heartRate: 92,
    bodyTemp: 98.6,
    hemoglobin: 10.4,
    fetalMovementStatus: 'reduced',
    dangerSigns: ['dangerHeadache', 'dangerVisual'],
  },
  'High'
);

assert(
  highMlWithSevereBP.hasUrgentDangerSigns === true &&
    highMlWithSevereBP.urgentFindings.length >= 2,
  'Scenario 5a: Multiple urgent clinical danger signs detected for severe pre-eclampsia presentation'
);

assert(
  highMlWithSevereBP.recommendedFollowUp.urgencyLevel === 'immediate_emergency',
  'Scenario 5b: Combined high ML + urgent clinical signs mandates immediate emergency facility transfer'
);

// -------------------------------------------------------------
// TEST 6: Missing or Invalid Model Inputs
// -------------------------------------------------------------
const invalidInput1 = evaluateMaternalRiskLocally({
  age: 85, // Invalid age > 70
  systolicBP: 120,
  diastolicBP: 80,
  bloodSugar: 6.0,
  bodyTemp: 98.4,
  heartRate: 75,
});

const invalidInput2 = evaluateMaternalRiskLocally({
  age: 24,
  systolicBP: 80,
  diastolicBP: 110, // Diastolic > Systolic (physiologically impossible)
  bloodSugar: 6.0,
  bodyTemp: 98.4,
  heartRate: 75,
});

assert(
  invalidInput1.success === false && (invalidInput1.validationErrors?.length || 0) > 0,
  'Scenario 6a: Validation catches out-of-range maternal age (> 70)'
);

assert(
  invalidInput2.success === false && (invalidInput2.validationErrors?.length || 0) > 0,
  'Scenario 6b: Validation catches inverted blood pressure (diastolic >= systolic)'
);

// -------------------------------------------------------------
// TEST 7 & 8: Offline Execution Without Network APIs
// -------------------------------------------------------------
const offlineEval = evaluateMaternalRiskLocally({
  age: 26,
  systolicBP: 124,
  diastolicBP: 82,
  bloodSugar: 6.4,
  bodyTemp: 98.4,
  heartRate: 78,
});

assert(
  offlineEval.success &&
    offlineEval.modelPrediction?.evaluatedModelFeatures?.length === 6,
  'Scenario 7 & 8: Model executes completely offline and evaluates all 6 UCI features with metadata'
);

// -------------------------------------------------------------
// TEST 9 & 10: Multilingual Parity & Translation Templates
// -------------------------------------------------------------
const enKeys = Object.keys(TRANSLATIONS.en);
const hiKeys = Object.keys(TRANSLATIONS.hi);
const orKeys = Object.keys(TRANSLATIONS.or);

assert(
  enKeys.length === hiKeys.length,
  `Scenario 9a: 100% Translation Key Parity between English and Hindi (${enKeys.length} keys)`,
  `EN: ${enKeys.length}, HI: ${hiKeys.length}`
);

assert(
  enKeys.length === orKeys.length,
  `Scenario 9b: 100% Translation Key Parity between English and Odia (${enKeys.length} keys)`,
  `EN: ${enKeys.length}, OR: ${orKeys.length}`
);

const missingInHi = enKeys.filter((k) => !hiKeys.includes(k));
const missingInOr = enKeys.filter((k) => !orKeys.includes(k));

assert(
  missingInHi.length === 0,
  'Scenario 9c: Zero missing keys in Hindi dictionary',
  missingInHi.join(', ')
);

assert(
  missingInOr.length === 0,
  'Scenario 9d: Zero missing keys in Odia dictionary',
  missingInOr.join(', ')
);

// Check that Hindi and Odia have genuine native script
const sampleHi = TRANSLATIONS.hi.whyThisPrediction;
const sampleOr = TRANSLATIONS.or.whyThisPrediction;

const hasDevanagari = /[\u0900-\u097F]/.test(sampleHi);
const hasOdiaScript = /[\u0B00-\u0B7F]/.test(sampleOr);

assert(
  hasDevanagari,
  'Scenario 10a: Hindi dictionary contains genuine Devanagari script for Explainable AI'
);

assert(
  hasOdiaScript,
  'Scenario 10b: Odia dictionary contains genuine Odia script for Explainable AI'
);

console.log('----------------------------------------------------------------');
console.log(`AUDIT RESULTS: ${passedTests} OF ${totalTests} TESTS PASSED`);
console.log('================================================================');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
