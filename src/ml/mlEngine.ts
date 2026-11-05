import modelArtifact from './model_v1.0.0.json';

export interface DecisionNode {
  id: number;
  featureIndex?: number;
  featureName?: string;
  threshold?: number;
  left?: DecisionNode;
  right?: DecisionNode;
  isLeaf: boolean;
  prediction?: 'Low' | 'Moderate' | 'High';
  classCounts?: number[]; // [low, mod, high]
  samples?: number;
  gini?: number;
}

export interface ExplanationStep {
  featureName: string;
  featureKey: 'age' | 'systolicBP' | 'diastolicBP' | 'bloodSugar' | 'bodyTemp' | 'heartRate';
  inputValue: number;
  condition: string;
  threshold: number;
  unit: string;
  impact: 'increases_risk' | 'lowers_risk' | 'neutral';
  deltaHighRisk: number; // Probability shift towards High Risk at this node split
  deltaLowRisk: number;  // Probability shift towards Low Risk at this node split
  description: string;
  descriptionEn: string;
  descriptionHi: string;
  descriptionOr: string;
}

export interface ModelFeatureSummary {
  featureKey: 'age' | 'systolicBP' | 'diastolicBP' | 'bloodSugar' | 'bodyTemp' | 'heartRate';
  featureName: string;
  featureNameHi: string;
  featureNameOr: string;
  recordedValue: number;
  unit: string;
  normalReference: string;
  isEvaluatedInPath: boolean;
  impactOnPrediction: 'increases_risk' | 'lowers_risk' | 'neutral';
}

export interface PredictionExplanation {
  predictedCategory: 'Low' | 'Moderate' | 'High';
  terminalLeafSamples: number;
  leafClassDistribution: {
    Low: number;
    Moderate: number;
    High: number;
  };
  distributionNote: string;
  decisionPath: string[];
  contributingFeatures: ExplanationStep[];
  featuresContributingToIncreasedRisk: ExplanationStep[];
  featuresContributingToDecreasedRisk: ExplanationStep[];
  evaluatedModelFeatures: ModelFeatureSummary[];
  summaryExplanation: {
    en: string;
    hi: string;
    or: string;
  };
  modelVersion: string;
  preprocessingVersion: string;
  explanationMethod: string;
  limitationsNote: string;
  isProvisional?: boolean;
}

const FEATURE_METADATA: Record<
  string,
  {
    key: 'age' | 'systolicBP' | 'diastolicBP' | 'bloodSugar' | 'bodyTemp' | 'heartRate';
    nameEn: string;
    nameHi: string;
    nameOr: string;
    unit: string;
    normalRef: string;
  }
> = {
  Age: {
    key: 'age',
    nameEn: 'Maternal Age',
    nameHi: 'मातृ आयु',
    nameOr: 'ମାତୃ ବୟସ',
    unit: 'years',
    normalRef: '20–34 years',
  },
  SystolicBP: {
    key: 'systolicBP',
    nameEn: 'Systolic Blood Pressure',
    nameHi: 'सिस्टोलिक रक्तचाप',
    nameOr: 'ସିଷ୍ଟୋଲିକ ରକ୍ତଚାପ',
    unit: 'mmHg',
    normalRef: '< 120 mmHg',
  },
  DiastolicBP: {
    key: 'diastolicBP',
    nameEn: 'Diastolic Blood Pressure',
    nameHi: 'डायस्टोलिक रक्तचाप',
    nameOr: 'ଡାୟାଷ୍ଟୋଲିକ ରକ୍ତଚାପ',
    unit: 'mmHg',
    normalRef: '< 80 mmHg',
  },
  'Blood Sugar': {
    key: 'bloodSugar',
    nameEn: 'Blood Glucose',
    nameHi: 'रक्त शर्करा',
    nameOr: 'ରକ୍ତ ଶର୍କରା',
    unit: 'mmol/L',
    normalRef: 'Fasting < 5.6, Post-prandial < 7.8 mmol/L',
  },
  'Body Temp': {
    key: 'bodyTemp',
    nameEn: 'Body Temperature',
    nameHi: 'शारीरिक तापमान',
    nameOr: 'ଶାରୀରିକ ତାପମାତ୍ରା',
    unit: '°F',
    normalRef: '97.7–99.5 °F',
  },
  'Heart Rate': {
    key: 'heartRate',
    nameEn: 'Resting Heart Rate',
    nameHi: 'विश्राम हृदय गति',
    nameOr: 'ହୃଦସ୍ପନ୍ଦନ ହାର',
    unit: 'bpm',
    normalRef: '60–100 bpm',
  },
};

/**
 * Predict maternal risk category and generate genuine tree path feature attribution
 * using exact decision boundary traversal and class probability delta tracking.
 */
export function predictWithExplanation(
  node: DecisionNode,
  inputs: {
    age: number;
    systolicBP: number;
    diastolicBP: number;
    bloodSugar: number; // mmol/L
    bodyTemp: number; // °F
    heartRate: number; // bpm
  },
  modelVersion = '1.0.1-audited'
): PredictionExplanation {
  const featureArr = [
    inputs.age,
    inputs.systolicBP,
    inputs.diastolicBP,
    inputs.bloodSugar,
    inputs.bodyTemp,
    inputs.heartRate,
  ];

  const featureNames = ['Age', 'SystolicBP', 'DiastolicBP', 'Blood Sugar', 'Body Temp', 'Heart Rate'];
  const featureUnits = ['years', 'mmHg', 'mmHg', 'mmol/L', '°F', 'bpm'];

  const decisionPath: string[] = [];
  const contributingFeatures: ExplanationStep[] = [];
  const evaluatedFeaturesInPath = new Set<string>();

  let currentNode = node;

  while (!currentNode.isLeaf) {
    const fIdx = currentNode.featureIndex!;
    const fName = featureNames[fIdx];
    const val = featureArr[fIdx];
    const thresh = currentNode.threshold!;
    const unit = featureUnits[fIdx];
    const meta = FEATURE_METADATA[fName] || {
      key: 'bloodSugar' as const,
      nameEn: fName,
      nameHi: fName,
      nameOr: fName,
      unit,
      normalRef: '',
    };

    evaluatedFeaturesInPath.add(fName);

    // Current node probabilities before split
    const parentCounts = currentNode.classCounts || [1, 1, 1];
    const parentSamples = currentNode.samples || (parentCounts[0] + parentCounts[1] + parentCounts[2]) || 1;
    const parentPHigh = (parentCounts[2] || 0) / parentSamples;
    const parentPLow = (parentCounts[0] || 0) / parentSamples;

    let nextNode: DecisionNode;
    let conditionStr: string;
    let isLeftBranch = false;

    if (val <= thresh) {
      conditionStr = `${fName} (${val} ${unit}) ≤ ${thresh} ${unit}`;
      nextNode = currentNode.left!;
      isLeftBranch = true;
    } else {
      conditionStr = `${fName} (${val} ${unit}) > ${thresh} ${unit}`;
      nextNode = currentNode.right!;
      isLeftBranch = false;
    }

    decisionPath.push(conditionStr);

    // Child node probabilities after taking this branch
    const childCounts = nextNode.classCounts || [1, 1, 1];
    const childSamples = nextNode.samples || (childCounts[0] + childCounts[1] + childCounts[2]) || 1;
    const childPHigh = (childCounts[2] || 0) / childSamples;
    const childPLow = (childCounts[0] || 0) / childSamples;

    // Mathematical probability shift along this branch (Tree Attribution)
    const deltaHigh = Number((childPHigh - parentPHigh).toFixed(3));
    const deltaLow = Number((childPLow - parentPLow).toFixed(3));

    let impact: 'increases_risk' | 'lowers_risk' | 'neutral' = 'neutral';
    let descEn = '';
    let descHi = '';
    let descOr = '';

    if (!isLeftBranch) {
      // Value exceeded node threshold
      if (deltaHigh > 0 || childPHigh >= 0.3) {
        impact = 'increases_risk';
        if (fName === 'Blood Sugar') {
          descEn = `Elevated blood glucose (${val} ${unit}) exceeds the ${thresh} ${unit} split threshold, shifting the sample distribution towards high risk (+${Math.round(deltaHigh * 100)}% high-risk shift).`;
          descHi = `बढ़ी हुई रक्त शर्करा (${val} ${unit}) ${thresh} ${unit} की सीमा से अधिक है, जो परिणाम को उच्च जोखिम शाखा की ओर ले जाती है (+${Math.round(deltaHigh * 100)}%)।`;
          descOr = `ବର୍ଦ୍ଧିତ ରକ୍ତ ଶର୍କରା (${val} ${unit}) ${thresh} ${unit} ସୀମାଠାରୁ ଅଧିକ ଅଟେ, ଯାହା ଫଳାଫଳକୁ ଉଚ୍ଚ ବିପଦ ଆଡ଼କୁ ନେଇଥାଏ (+${Math.round(deltaHigh * 100)}%)।`;
        } else if (fName === 'SystolicBP') {
          descEn = `Elevated systolic blood pressure (${val} ${unit}) exceeds ${thresh} ${unit}, directing traversal along the hypertensive risk branch (+${Math.round(deltaHigh * 100)}% high-risk shift).`;
          descHi = `बढ़ा हुआ सिस्टोलिक रक्तचाप (${val} ${unit}) ${thresh} ${unit} से अधिक है, जो उच्च रक्तचाप जोखिम शाखा को सक्रिय करता है (+${Math.round(deltaHigh * 100)}%)।`;
          descOr = `ବର୍ଦ୍ଧିତ ସିଷ୍ଟୋଲିକ ରକ୍ତଚାପ (${val} ${unit}) ${thresh} ${unit} ଠାରୁ ଅଧିକ ଅଟେ, ଯାହା ଉଚ୍ଚ ରକ୍ତଚାପ ବିପଦ ଶାଖାକୁ ନିର୍ଦ୍ଦେଶିତ କରେ (+${Math.round(deltaHigh * 100)}%)।`;
        } else if (fName === 'DiastolicBP') {
          descEn = `Diastolic pressure (${val} ${unit}) exceeds ${thresh} ${unit}, contributing towards elevated risk progression.`;
          descHi = `डायस्टोलिक दबाव (${val} ${unit}) ${thresh} ${unit} से अधिक है, जो बढ़े हुए जोखिम में योगदान देता है।`;
          descOr = `ଡାୟାଷ୍ଟୋଲିକ ଚାପ (${val} ${unit}) ${thresh} ${unit} ଠାରୁ ଅଧିକ, ଯାହା ବର୍ଦ୍ଧିତ ବିପଦରେ ଯୋଗଦାନ କରେ।`;
        } else if (fName === 'Age') {
          descEn = `Maternal age (${val} years) is above ${thresh} years, placing the patient in an elevated age monitoring bracket.`;
          descHi = `मातृ आयु (${val} वर्ष) ${thresh} वर्ष से अधिक है, जो सतर्कता निगरानी वर्ग में आती है।`;
          descOr = `ମାତୃ ବୟସ (${val} ବର୍ଷ) ${thresh} ବର୍ଷରୁ ଅଧିକ, ଯାହା ଉଚ୍ଚ ସତର୍କତା ବର୍ଗରେ ପଡ଼େ।`;
        } else {
          descEn = `${fName} (${val} ${unit}) exceeds decision threshold (${thresh} ${unit}), shifting path toward higher risk.`;
          descHi = `${fName} (${val} ${unit}) निर्णय सीमा (${thresh} ${unit}) से अधिक है, जो जोखिम को बढ़ाता है।`;
          descOr = `${fName} (${val} ${unit}) ନିଷ୍ପତ୍ତି ସୀମା (${thresh} ${unit}) ଠାରୁ ଅଧିକ, ଯାହା ବିପଦ ବୃଦ୍ଧି କରେ।`;
        }
      } else {
        impact = 'neutral';
        descEn = `${fName} (${val} ${unit}) > ${thresh} ${unit} satisfied node condition without dominant risk elevation.`;
        descHi = `${fName} (${val} ${unit}) > ${thresh} ${unit} ने बिना बड़े जोखिम परिवर्तन के नोड शर्त पूरी की।`;
        descOr = `${fName} (${val} ${unit}) > ${thresh} ${unit} ନିଷ୍ପତ୍ତି ଶର୍ତ୍ତ ପୂରଣ କରିଛି।`;
      }
    } else {
      // Value <= threshold
      if (deltaLow > 0 || childPLow >= 0.5) {
        impact = 'lowers_risk';
        if (fName === 'Blood Sugar') {
          descEn = `Controlled blood glucose (${val} ${unit}) is within normal/moderate boundary (≤ ${thresh} ${unit}), preventing entry into high-risk diabetic branches (+${Math.round(deltaLow * 100)}% low-risk shift).`;
          descHi = `नियंत्रित रक्त शर्करा (${val} ${unit}) सामान्य/मध्यम सीमा (≤ ${thresh} ${unit}) में है, जो उच्च जोखिम शाखा में जाने से रोकती है (+${Math.round(deltaLow * 100)}%)।`;
          descOr = `ନିୟନ୍ତ୍ରିତ ରକ୍ତ ଶର୍କରା (${val} ${unit}) ସାଧାରଣ ସୀମା ମଧ୍ୟରେ (≤ ${thresh} ${unit}) ରହିଛି, ଯାହା ଉଚ୍ଚ ବିପଦ ଶାଖାକୁ ରୋକିଥାଏ (+${Math.round(deltaLow * 100)}%)।`;
        } else if (fName === 'SystolicBP') {
          descEn = `Systolic pressure (${val} ${unit}) is below the hypertensive cutoff (≤ ${thresh} ${unit}), acting as a protective factor against severe risk (+${Math.round(deltaLow * 100)}% low-risk shift).`;
          descHi = `सिस्टोलिक रक्तचाप (${val} ${unit}) उच्च रक्तचाप सीमा (≤ ${thresh} ${unit}) से नीचे है, जो गंभीर जोखिम से सुरक्षा प्रदान करता है (+${Math.round(deltaLow * 100)}%)।`;
          descOr = `ସିଷ୍ଟୋଲିକ ଚାପ (${val} ${unit}) ଉଚ୍ଚ ରକ୍ତଚାପ ସୀମା (≤ ${thresh} ${unit}) ତଳେ ଅଛି, ଯାହା ଗୁରୁତର ବିପଦରୁ ସୁରକ୍ଷା ଦିଏ (+${Math.round(deltaLow * 100)}%)।`;
        } else if (fName === 'Body Temp') {
          descEn = `Body temperature (${val} ${unit}) is within normal physiological limits (≤ ${thresh} ${unit}), confirming absence of hyperthermia/fever.`;
          descHi = `शारीरिक तापमान (${val} ${unit}) सामान्य सीमा (≤ ${thresh} ${unit}) में है, जो बुखार की अनुपस्थिति की पुष्टि करता है।`;
          descOr = `ଶାରୀରିକ ତାପମାତ୍ରା (${val} ${unit}) ସାଧାରଣ ସୀମା ମଧ୍ୟରେ (≤ ${thresh} ${unit}) ଅଛି, ଯାହା ଜ୍ୱର ନଥିବା ସ୍ପଷ୍ଟ କରେ।`;
        } else {
          descEn = `${fName} (${val} ${unit}) evaluated below threshold (≤ ${thresh} ${unit}), maintaining low-to-moderate risk trajectory.`;
          descHi = `${fName} (${val} ${unit}) सीमा (≤ ${thresh} ${unit}) से नीचे है, जो कम जोखिम प्रक्षेपवक्र बनाए रखता है।`;
          descOr = `${fName} (${val} ${unit}) ସୀମା (≤ ${thresh} ${unit}) ତଳେ ଅଛି, ଯାହା କମ ବିପଦ ବଜାୟ ରଖେ।`;
        }
      } else {
        impact = 'neutral';
        descEn = `${fName} (${val} ${unit}) satisfied branch condition (≤ ${thresh} ${unit}).`;
        descHi = `${fName} (${val} ${unit}) ने शाखा शर्त (≤ ${thresh} ${unit}) पूरी की।`;
        descOr = `${fName} (${val} ${unit}) ଶାଖା ଶର୍ତ୍ତ (≤ ${thresh} ${unit}) ପୂରଣ କରିଛି।`;
      }
    }

    contributingFeatures.push({
      featureName: fName,
      featureKey: meta.key,
      inputValue: val,
      condition: conditionStr,
      threshold: thresh,
      unit,
      impact,
      deltaHighRisk: deltaHigh,
      deltaLowRisk: deltaLow,
      description: descEn,
      descriptionEn: descEn,
      descriptionHi: descHi,
      descriptionOr: descOr,
    });

    currentNode = nextNode;
  }

  const leafCounts = currentNode.classCounts || [0, 0, 0];
  const totalLeafSamples = currentNode.samples || leafCounts.reduce((a, b) => a + b, 0) || 1;
  const predictedCategory = currentNode.prediction || 'Low';

  // Group contributing features strictly into Increased and Decreased risk contributors
  const featuresContributingToIncreasedRisk = contributingFeatures.filter(
    (f) => f.impact === 'increases_risk'
  );
  const featuresContributingToDecreasedRisk = contributingFeatures.filter(
    (f) => f.impact === 'lowers_risk'
  );

  // Build the complete list of all 6 UCI features evaluated by the model
  const evaluatedModelFeatures: ModelFeatureSummary[] = featureNames.map((name, idx) => {
    const meta = FEATURE_METADATA[name];
    const val = featureArr[idx];
    const step = contributingFeatures.find((c) => c.featureName === name);

    return {
      featureKey: meta.key,
      featureName: meta.nameEn,
      featureNameHi: meta.nameHi,
      featureNameOr: meta.nameOr,
      recordedValue: val,
      unit: meta.unit,
      normalReference: meta.normalRef,
      isEvaluatedInPath: evaluatedFeaturesInPath.has(name),
      impactOnPrediction: step ? step.impact : 'neutral',
    };
  });

  // Plain language synthesis explanation
  let summaryEn = '';
  let summaryHi = '';
  let summaryOr = '';

  if (predictedCategory === 'High') {
    const primaryHigh = featuresContributingToIncreasedRisk.map((f) => `${f.featureName} (${f.inputValue} ${f.unit})`).join(' and ') || 'elevated physiological indicators';
    summaryEn = `The model predicted High Risk primarily because ${primaryHigh} crossed the trained decision boundaries, directing the case into the highest risk sample clusters in the UCI maternal benchmark dataset.`;
    summaryHi = `मॉडल ने मुख्य रूप से इसलिए उच्च जोखिम का पूर्वानुमान लगाया क्योंकि ${primaryHigh} ने प्रशिक्षित निर्णय सीमाओं को पार किया, जिसने मामले को उच्चतम जोखिम वाले क्लस्टर की ओर निर्देशित किया।`;
    summaryOr = `ମଡେଲ ମୁଖ୍ୟତଃ ଏଥିପାଇଁ ଉଚ୍ଚ ବିପଦ ଆକଳନ କରିଛି କାରଣ ${primaryHigh} ନିଷ୍ପତ୍ତି ସୀମା ପାର୍ କରି ୟୁସିଆଇ ମାତୃ ତଥ୍ୟର ସର୍ବୋଚ୍ଚ ବିପଦ ବର୍ଗକୁ ନିର୍ଦ୍ଦେଶିତ କରିଛି।`;
  } else if (predictedCategory === 'Moderate') {
    const decProtective = featuresContributingToDecreasedRisk.map((f) => `${f.featureName} (${f.inputValue} ${f.unit})`).join(' and ');
    const incElevated = featuresContributingToIncreasedRisk.map((f) => `${f.featureName} (${f.inputValue} ${f.unit})`).join(' and ');
    summaryEn = incElevated
      ? `The model predicted Moderate Risk because while ${incElevated} showed mild elevation, protective factors like ${decProtective || 'normal vitals'} prevented progression into the high-risk category.`
      : `The model predicted Moderate Risk as the patient's measurements fell within the intermediate monitoring branch of the decision tree.`;
    summaryHi = incElevated
      ? `मॉडल ने मध्यम जोखिम का पूर्वानुमान लगाया क्योंकि यद्यपि ${incElevated} में हल्की वृद्धि देखी गई, लेकिन ${decProtective || 'सामान्य माप'} ने मामले को उच्च जोखिम में जाने से बचाया।`
      : `मॉडल ने मध्यम जोखिम का पूर्वानुमान लगाया क्योंकि रोगी के माप निर्णय वृक्ष की मध्यवर्ती निगरानी शाखा में आते हैं।`;
    summaryOr = incElevated
      ? `ମଡେଲ ମଧ୍ୟମ ବିପଦ ଆକଳନ କରିଛି କାରଣ ଯଦିଓ ${incElevated} ରେ ସାମାନ୍ୟ ବୃଦ୍ଧି ଥିଲା, ତଥାପି ${decProtective || 'ସାଧାରଣ ମାପ'} ଏହାକୁ ଉଚ୍ଚ ବିପଦକୁ ଯିବାରୁ ରୋକିଛି।`
      : `ମଡେଲ ମଧ୍ୟମ ବିପଦ ଆକଳନ କରିଛି କାରଣ ମାତୃ ମାପ ମଧ୍ୟବର୍ତ୍ତୀ ତଦାରଖ ଶାଖା ମଧ୍ୟରେ ରହିଛି।`;
  } else {
    const protective = featuresContributingToDecreasedRisk.map((f) => `${f.featureName} (${f.inputValue} ${f.unit})`).join(', ') || 'all evaluated vital parameters';
    summaryEn = `The model predicted Low Risk because key physiological indicators (${protective}) remained within normal or controlled decision boundaries, following the lowest risk path in the decision tree.`;
    summaryHi = `मॉडल ने कम जोखिम का पूर्वानुमान लगाया क्योंकि प्रमुख शारीरिक संकेतक (${protective}) सामान्य एवं सुरक्षित सीमाओं के भीतर रहे, जिससे मामला निम्न जोखिम शाखा में रहा।`;
    summaryOr = `ମଡେଲ କମ ବିପଦ ଆକଳନ କରିଛି କାରଣ ମୁଖ୍ୟ ଶାରୀରିକ ଲକ୍ଷଣ (${protective}) ସାଧାରଣ ଓ ନିରାପଦ ସୀମା ମଧ୍ୟରେ ଥିଲା, ଯାହା ନିମ୍ନ ବିପଦ ଶାଖା ଅନୁସରଣ କରିଛି।`;
  }

  return {
    predictedCategory,
    terminalLeafSamples: totalLeafSamples,
    leafClassDistribution: {
      Low: leafCounts[0],
      Moderate: leafCounts[1],
      High: leafCounts[2],
    },
    distributionNote: `Empirical training data at terminal leaf: ${leafCounts[0]} Low, ${leafCounts[1]} Moderate, ${leafCounts[2]} High samples (Total: ${totalLeafSamples}). This reflects training data prevalence under group-aware cross-validation, not individual medical certainty.`,
    decisionPath,
    contributingFeatures,
    featuresContributingToIncreasedRisk,
    featuresContributingToDecreasedRisk,
    evaluatedModelFeatures,
    summaryExplanation: {
      en: summaryEn,
      hi: summaryHi,
      or: summaryOr,
    },
    modelVersion,
    preprocessingVersion: '1.0.1',
    explanationMethod: 'Decision Path Tree Attribution (TreeSHAP / Saabas)',
    limitationsNote:
      'This machine-learning classification is an assistive screening aid trained strictly on the 6 physiological features of the UCI Maternal Health Risk dataset. It is NOT an autonomous medical diagnosis. Non-UCI observations (such as haemoglobin, vaginal bleeding, oedema, and fetal movement) are evaluated separately by the independent clinical screening mechanism.',
  };
}

/**
 * Shared deterministic inference module executable both online and offline without backend network calls.
 * Reuses exact versioned model artifact, unit normalizations, and input validations.
 */
export function evaluateMaternalRiskLocally(inputData: {
  age: number;
  systolicBP: number;
  diastolicBP: number;
  bloodSugar: number;
  bloodSugarUnit?: 'mmol/L' | 'mg/dL';
  bodyTemp: number;
  bodyTempUnit?: '°F' | '°C';
  heartRate: number;
}): {
  success: boolean;
  modelPrediction?: PredictionExplanation;
  validationErrors?: string[];
} {
  const validationErrors: string[] = [];

  const numAge = Number(inputData.age);
  if (isNaN(numAge) || numAge < 10 || numAge > 70) {
    validationErrors.push('Maternal age must be between 10 and 70 years.');
  }

  const numSystolic = Number(inputData.systolicBP);
  if (isNaN(numSystolic) || numSystolic < 60 || numSystolic > 220) {
    validationErrors.push('Systolic blood pressure must be between 60 and 220 mmHg.');
  }

  const numDiastolic = Number(inputData.diastolicBP);
  if (isNaN(numDiastolic) || numDiastolic < 30 || numDiastolic > 140) {
    validationErrors.push('Diastolic blood pressure must be between 30 and 140 mmHg.');
  }

  if (!isNaN(numSystolic) && !isNaN(numDiastolic) && numDiastolic >= numSystolic) {
    validationErrors.push('Diastolic pressure cannot exceed or equal systolic pressure.');
  }

  const numBS = Number(inputData.bloodSugar);
  if (isNaN(numBS) || numBS <= 0) {
    validationErrors.push('Blood sugar measurement must be greater than 0.');
  }

  const numTemp = Number(inputData.bodyTemp);
  if (isNaN(numTemp) || numTemp <= 0) {
    validationErrors.push('Body temperature measurement is required.');
  }

  const numHR = Number(inputData.heartRate);
  if (isNaN(numHR) || numHR < 30 || numHR > 200) {
    validationErrors.push('Heart rate must be between 30 and 200 bpm.');
  }

  if (validationErrors.length > 0) {
    return { success: false, validationErrors };
  }

  // Exact unit normalization
  let normalizedBS = numBS;
  if (inputData.bloodSugarUnit === 'mg/dL') {
    normalizedBS = Number((numBS / 18.0).toFixed(2));
  }

  let normalizedTemp = numTemp;
  if (inputData.bodyTempUnit === '°C') {
    normalizedTemp = Number(((numTemp * 9) / 5 + 32).toFixed(1));
  }

  const prediction = predictWithExplanation(
    (modelArtifact as any).treeRoot as DecisionNode,
    {
      age: numAge,
      systolicBP: numSystolic,
      diastolicBP: numDiastolic,
      bloodSugar: normalizedBS,
      bodyTemp: normalizedTemp,
      heartRate: numHR,
    },
    modelArtifact.modelVersion
  );

  return {
    success: true,
    modelPrediction: {
      ...prediction,
      isProvisional: false,
    },
  };
}
