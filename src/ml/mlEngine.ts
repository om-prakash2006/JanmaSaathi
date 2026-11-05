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
  inputValue: number;
  condition: string;
  threshold: number;
  unit: string;
  impact: 'increases_risk' | 'lowers_risk' | 'neutral';
  description: string;
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
  modelVersion: string;
  preprocessingVersion: string;
  explanationMethod: string;
  limitationsNote: string;
  isProvisional?: boolean;
}

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

  let currentNode = node;

  while (!currentNode.isLeaf) {
    const fIdx = currentNode.featureIndex!;
    const fName = featureNames[fIdx];
    const val = featureArr[fIdx];
    const thresh = currentNode.threshold!;
    const unit = featureUnits[fIdx];

    if (val <= thresh) {
      decisionPath.push(`${fName} (${val} ${unit}) ≤ ${thresh} ${unit}`);

      if (fName === 'Blood Sugar' && thresh >= 7.5) {
        contributingFeatures.push({
          featureName: fName,
          inputValue: val,
          condition: `≤ ${thresh}`,
          threshold: thresh,
          unit,
          impact: 'lowers_risk',
          description: `Blood sugar level (${val} ${unit}) evaluated below node threshold (≤ ${thresh} ${unit}).`,
        });
      } else if (fName === 'SystolicBP' && thresh >= 130) {
        contributingFeatures.push({
          featureName: fName,
          inputValue: val,
          condition: `≤ ${thresh}`,
          threshold: thresh,
          unit,
          impact: 'lowers_risk',
          description: `Systolic blood pressure (${val} ${unit}) evaluated below high-risk threshold (≤ ${thresh} ${unit}).`,
        });
      } else {
        contributingFeatures.push({
          featureName: fName,
          inputValue: val,
          condition: `≤ ${thresh}`,
          threshold: thresh,
          unit,
          impact: 'neutral',
          description: `${fName} (${val} ${unit}) satisfied decision node threshold (≤ ${thresh} ${unit}).`,
        });
      }

      currentNode = currentNode.left!;
    } else {
      decisionPath.push(`${fName} (${val} ${unit}) > ${thresh} ${unit}`);

      let desc = `${fName} (${val} ${unit}) exceeds decision node threshold (${thresh} ${unit}).`;
      if (fName === 'Blood Sugar') {
        desc = `Elevated blood sugar (${val} ${unit}) exceeds decision boundary (${thresh} ${unit}).`;
      } else if (fName === 'SystolicBP') {
        desc = `Elevated systolic pressure (${val} ${unit}) exceeds decision boundary (${thresh} ${unit}).`;
      } else if (fName === 'Age') {
        desc = `Maternal age (${val} years) is in an elevated risk monitoring bracket (> ${thresh} years).`;
      }

      contributingFeatures.push({
        featureName: fName,
        inputValue: val,
        condition: `> ${thresh}`,
        threshold: thresh,
        unit,
        impact: 'increases_risk',
        description: desc,
      });

      currentNode = currentNode.right!;
    }
  }

  const leafCounts = currentNode.classCounts || [0, 0, 0];
  const totalLeafSamples = currentNode.samples || 1;
  const predictedCategory = currentNode.prediction || 'Low';

  return {
    predictedCategory,
    terminalLeafSamples: totalLeafSamples,
    leafClassDistribution: {
      Low: leafCounts[0],
      Moderate: leafCounts[1],
      High: leafCounts[2],
    },
    distributionNote:
      'Uncalibrated empirical training-sample count at terminal decision leaf. This represents training data prevalence, NOT clinical certainty.',
    decisionPath,
    contributingFeatures,
    modelVersion,
    preprocessingVersion: '1.0.1',
    explanationMethod: 'Decision Path Tree Analysis',
    limitationsNote:
      'This machine-learning classification is derived from statistical patterns in the 6-feature UCI benchmark dataset under group-aware cross-validation. It is an assistive screening aid and NOT a medical diagnosis. Independent clinical observations (haemoglobin, bleeding, swelling, fetal movement) must be evaluated separately by qualified medical personnel.',
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
      isProvisional: true,
    },
  };
}
