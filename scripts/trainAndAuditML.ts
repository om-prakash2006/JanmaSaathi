import fs from 'fs';
import path from 'path';

export interface UCIRow {
  id: number;
  age: number;
  systolicBP: number;
  diastolicBP: number;
  bloodSugar: number; // mmol/L
  bodyTemp: number; // °F
  heartRate: number; // bpm
  riskLevel: 'Low' | 'Moderate' | 'High';
  targetIndex: number; // 0: Low, 1: Moderate, 2: High
  groupId: number; // Unique ID per 6-feature profile
  rawHeartRate: number;
}

export interface MetricResults {
  accuracy: number;
  balancedAccuracy: number;
  macroF1: number;
  perClass: {
    [key in 'Low' | 'Moderate' | 'High']: {
      precision: number;
      recall: number;
      f1: number;
      support: number;
    };
  };
  confusionMatrix: number[][]; // 3x3 [actual][predicted]
}

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

const CSV_PATH = path.join(process.cwd(), 'public/assets/aistudio/Maternal_Health_Risk_Data_Set_a1f70257.csv');
const ARTIFACT_PATH = path.join(process.cwd(), 'src/ml/model_v1.0.0.json');
const REPORT_PATH = path.join(process.cwd(), 'src/ml/evaluation_report.json');

// 1. Load dataset and compute profile groups
export function loadAndGroupDataset(): {
  rows: UCIRow[];
  auditSummary: {
    totalRows: number;
    uniqueCompleteRows: number;
    uniqueFeatureProfiles: number;
    conflictingProfilesCount: number;
    ambiguousRowsCount: number;
    invalidHeartRateRowsCount: number;
  };
} {
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim().length > 0);

  const rawRows: {
    age: number;
    sbp: number;
    dbp: number;
    bs: number;
    temp: number;
    hr: number;
    risk: 'Low' | 'Moderate' | 'High';
    rawString: string;
    profileKey: string;
  }[] = [];

  const exactRowSet = new Set<string>();
  const profileToLabels = new Map<string, string[]>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    if (cols.length < 7) continue;

    const age = parseFloat(cols[0]);
    const sbp = parseFloat(cols[1]);
    const dbp = parseFloat(cols[2]);
    const bs = parseFloat(cols[3]);
    const temp = parseFloat(cols[4]);
    const hr = parseFloat(cols[5]);

    const rawRisk = cols[6].toLowerCase();
    let risk: 'Low' | 'Moderate' | 'High' = 'Low';
    if (rawRisk.includes('high')) risk = 'High';
    else if (rawRisk.includes('mid') || rawRisk.includes('moderate')) risk = 'Moderate';

    const rawString = `${age},${sbp},${dbp},${bs},${temp},${hr},${risk}`;
    const profileKey = `${age}_${sbp}_${dbp}_${bs}_${temp}_${hr}`;

    exactRowSet.add(rawString);

    if (!profileToLabels.has(profileKey)) {
      profileToLabels.set(profileKey, []);
    }
    profileToLabels.get(profileKey)!.push(risk);

    rawRows.push({ age, sbp, dbp, bs, temp, hr, risk, rawString, profileKey });
  }

  // Profile Group IDs
  const profileKeyToGroupId = new Map<string, number>();
  let groupCounter = 0;

  let conflictingProfilesCount = 0;
  let ambiguousRowsCount = 0;

  profileToLabels.forEach((labels, pKey) => {
    profileKeyToGroupId.set(pKey, groupCounter++);
    const uniqueLabs = new Set(labels);
    if (uniqueLabs.size > 1) {
      conflictingProfilesCount++;
      ambiguousRowsCount += labels.length;
    }
  });

  let invalidHeartRateRowsCount = 0;

  const datasetRows: UCIRow[] = rawRows.map((r, idx) => {
    if (r.hr <= 10) invalidHeartRateRowsCount++;

    return {
      id: idx,
      age: r.age,
      systolicBP: r.sbp,
      diastolicBP: r.dbp,
      bloodSugar: r.bs,
      bodyTemp: r.temp,
      heartRate: r.hr,
      riskLevel: r.risk,
      targetIndex: r.risk === 'Low' ? 0 : r.risk === 'Moderate' ? 1 : 2,
      groupId: profileKeyToGroupId.get(r.profileKey)!,
      rawHeartRate: r.hr,
    };
  });

  return {
    rows: datasetRows,
    auditSummary: {
      totalRows: datasetRows.length,
      uniqueCompleteRows: exactRowSet.size,
      uniqueFeatureProfiles: profileToLabels.size,
      conflictingProfilesCount,
      ambiguousRowsCount,
      invalidHeartRateRowsCount,
    },
  };
}

// Gini Impurity with Optional Class Weights
function calculateWeightedGini(classCounts: number[], classWeights: number[]): number {
  let weightedTotal = 0;
  for (let c = 0; c < classCounts.length; c++) {
    weightedTotal += classCounts[c] * classWeights[c];
  }
  if (weightedTotal === 0) return 0;

  let sumSq = 0;
  for (let c = 0; c < classCounts.length; c++) {
    const p = (classCounts[c] * classWeights[c]) / weightedTotal;
    sumSq += p * p;
  }
  return 1 - sumSq;
}

let nodeCounter = 0;

export function trainAuditedDecisionTree(
  data: UCIRow[],
  featureNames: string[],
  maxDepth = 5,
  minSamplesSplit = 10,
  classWeights = [1.0, 1.0, 1.0], // [Low, Moderate, High]
  currentDepth = 0
): DecisionNode {
  const nodeId = ++nodeCounter;
  const numClasses = 3;
  const classCounts = [0, 0, 0];
  for (const item of data) {
    classCounts[item.targetIndex]++;
  }
  const total = data.length;
  const gini = calculateWeightedGini(classCounts, classWeights);

  // Majority class weighted
  let maxWeightedCount = -1;
  let majorityClass = 0;
  for (let c = 0; c < numClasses; c++) {
    const wCount = classCounts[c] * classWeights[c];
    if (wCount > maxWeightedCount) {
      maxWeightedCount = wCount;
      majorityClass = c;
    }
  }

  const classLabels: ('Low' | 'Moderate' | 'High')[] = ['Low', 'Moderate', 'High'];

  if (currentDepth >= maxDepth || total < minSamplesSplit || gini === 0) {
    return {
      id: nodeId,
      isLeaf: true,
      prediction: classLabels[majorityClass],
      classCounts,
      samples: total,
      gini,
    };
  }

  let bestGiniGain = -1;
  let bestFeature = -1;
  let bestThreshold = 0;
  let bestLeftData: UCIRow[] = [];
  let bestRightData: UCIRow[] = [];

  const numFeatures = featureNames.length;

  for (let f = 0; f < numFeatures; f++) {
    const featureGetter = (r: UCIRow) =>
      f === 0
        ? r.age
        : f === 1
        ? r.systolicBP
        : f === 2
        ? r.diastolicBP
        : f === 3
        ? r.bloodSugar
        : f === 4
        ? r.bodyTemp
        : r.heartRate;

    const vals = Array.from(new Set(data.map(featureGetter))).sort((a, b) => a - b);
    if (vals.length < 2) continue;

    for (let i = 0; i < vals.length - 1; i++) {
      const threshold = (vals[i] + vals[i + 1]) / 2;
      const left = data.filter((r) => featureGetter(r) <= threshold);
      const right = data.filter((r) => featureGetter(r) > threshold);

      if (left.length === 0 || right.length === 0) continue;

      const leftCounts = [0, 0, 0];
      for (const d of left) leftCounts[d.targetIndex]++;
      const leftGini = calculateWeightedGini(leftCounts, classWeights);

      const rightCounts = [0, 0, 0];
      for (const d of right) rightCounts[d.targetIndex]++;
      const rightGini = calculateWeightedGini(rightCounts, classWeights);

      const weightedGini = (left.length / total) * leftGini + (right.length / total) * rightGini;
      const giniGain = gini - weightedGini;

      if (giniGain > bestGiniGain) {
        bestGiniGain = giniGain;
        bestFeature = f;
        bestThreshold = threshold;
        bestLeftData = left;
        bestRightData = right;
      }
    }
  }

  if (bestFeature === -1 || bestGiniGain <= 1e-6) {
    return {
      id: nodeId,
      isLeaf: true,
      prediction: classLabels[majorityClass],
      classCounts,
      samples: total,
      gini,
    };
  }

  const leftChild = trainAuditedDecisionTree(
    bestLeftData,
    featureNames,
    maxDepth,
    minSamplesSplit,
    classWeights,
    currentDepth + 1
  );
  const rightChild = trainAuditedDecisionTree(
    bestRightData,
    featureNames,
    maxDepth,
    minSamplesSplit,
    classWeights,
    currentDepth + 1
  );

  return {
    id: nodeId,
    isLeaf: false,
    featureIndex: bestFeature,
    featureName: featureNames[bestFeature],
    threshold: Number(bestThreshold.toFixed(2)),
    left: leftChild,
    right: rightChild,
    prediction: classLabels[majorityClass],
    classCounts,
    samples: total,
    gini,
  };
}

// Compute Metrics Function
export function computeMetrics(confusion: number[][], counts: { Low: number; Moderate: number; High: number }): MetricResults {
  let totalCorrect = 0;
  let totalSamples = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === j) totalCorrect += confusion[i][j];
      totalSamples += confusion[i][j];
    }
  }

  const accuracy = totalSamples > 0 ? totalCorrect / totalSamples : 0;
  const classLabels: ('Low' | 'Moderate' | 'High')[] = ['Low', 'Moderate', 'High'];

  const perClass = {
    Low: { precision: 0, recall: 0, f1: 0, support: counts.Low },
    Moderate: { precision: 0, recall: 0, f1: 0, support: counts.Moderate },
    High: { precision: 0, recall: 0, f1: 0, support: counts.High },
  };

  let sumRecall = 0;
  let sumF1 = 0;

  classLabels.forEach((label, c) => {
    const tp = confusion[c][c];
    let fp = 0;
    let fn = 0;
    for (let i = 0; i < 3; i++) {
      if (i !== c) {
        fp += confusion[i][c];
        fn += confusion[c][i];
      }
    }

    const prec = tp + fp > 0 ? tp / (tp + fp) : 0;
    const rec = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;

    perClass[label] = {
      precision: Number(prec.toFixed(4)),
      recall: Number(rec.toFixed(4)),
      f1: Number(f1.toFixed(4)),
      support: counts[label],
    };

    sumRecall += rec;
    sumF1 += f1;
  });

  return {
    accuracy: Number(accuracy.toFixed(4)),
    balancedAccuracy: Number((sumRecall / 3).toFixed(4)),
    macroF1: Number((sumF1 / 3).toFixed(4)),
    perClass,
    confusionMatrix: confusion,
  };
}

// Execute GroupKFold Cross Validation
export function runGroupKFoldCV(
  rows: UCIRow[],
  maxDepth = 5,
  minSamplesSplit = 10,
  classWeights = [1.0, 1.0, 1.0],
  excludeInvalidHR = true
): MetricResults {
  // Preprocessing: Filter or Fold-Isolated Impute
  let datasetToUse = rows;
  if (excludeInvalidHR) {
    datasetToUse = rows.filter((r) => r.heartRate > 10);
  }

  // Get unique group IDs
  const uniqueGroupIds = Array.from(new Set(datasetToUse.map((r) => r.groupId)));
  const kFolds = 5;
  const groupFolds: Set<number>[] = Array.from({ length: kFolds }, () => new Set());

  uniqueGroupIds.forEach((gid, idx) => {
    groupFolds[idx % kFolds].add(gid);
  });

  const featureNames = ['Age', 'SystolicBP', 'DiastolicBP', 'Blood Sugar', 'Body Temp', 'Heart Rate'];
  const confusion = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  const counts = { Low: 0, Moderate: 0, High: 0 };
  datasetToUse.forEach((r) => counts[r.riskLevel]++);

  for (let fold = 0; fold < kFolds; fold++) {
    const testGroups = groupFolds[fold];

    // Fold-Isolated Split
    const rawTrain = datasetToUse.filter((r) => !testGroups.has(r.groupId));
    const rawTest = datasetToUse.filter((r) => testGroups.has(r.groupId));

    // Fold-Isolated Imputation if not excluded
    const foldTrain = rawTrain.map((r) => ({ ...r }));
    const foldTest = rawTest.map((r) => ({ ...r }));

    if (!excludeInvalidHR) {
      // Calculate median HR strictly inside training fold
      const validTrainHRs = foldTrain.filter((r) => r.rawHeartRate > 10).map((r) => r.rawHeartRate);
      validTrainHRs.sort((a, b) => a - b);
      const foldMedianHR = validTrainHRs[Math.floor(validTrainHRs.length / 2)] || 70;

      foldTrain.forEach((r) => {
        if (r.heartRate <= 10) r.heartRate = foldMedianHR;
      });
      foldTest.forEach((r) => {
        if (r.heartRate <= 10) r.heartRate = foldMedianHR;
      });
    }

    const tree = trainAuditedDecisionTree(foldTrain, featureNames, maxDepth, minSamplesSplit, classWeights);

    for (const testRow of foldTest) {
      let node = tree;
      const featArr = [
        testRow.age,
        testRow.systolicBP,
        testRow.diastolicBP,
        testRow.bloodSugar,
        testRow.bodyTemp,
        testRow.heartRate,
      ];

      while (!node.isLeaf) {
        const val = featArr[node.featureIndex!];
        if (val <= node.threshold!) node = node.left!;
        else node = node.right!;
      }

      const predLabel = node.prediction || 'Low';
      const predIdx = predLabel === 'Low' ? 0 : predLabel === 'Moderate' ? 1 : 2;
      confusion[testRow.targetIndex][predIdx]++;
    }
  }

  return computeMetrics(confusion, counts);
}

// Run Main Script
export function runMainAudit() {
  const { rows, auditSummary } = loadAndGroupDataset();

  console.log('=== DATASET DUPLICATE & LABEL AMBIGUITY AUDIT ===');
  console.log('1. Total CSV Rows:', auditSummary.totalRows);
  console.log('2. Unique Complete Rows (6 features + label):', auditSummary.uniqueCompleteRows);
  console.log('3. Duplicate Complete Rows:', auditSummary.totalRows - auditSummary.uniqueCompleteRows);
  console.log('4. Unique 6-Feature Profiles:', auditSummary.uniqueFeatureProfiles);
  console.log('5. Profiles with CONFLICTING Labels:', auditSummary.conflictingProfilesCount);
  console.log('6. Total Ambiguous Rows in Conflicting Profiles:', auditSummary.ambiguousRowsCount);
  console.log('7. Invalid Heart Rate Rows (<= 10 bpm):', auditSummary.invalidHeartRateRowsCount);

  console.log('\n=== MODEL COMPARISON UNDER GROUP-AWARE (LEAK-FREE) CROSS-VALIDATION ===');

  const dtUnpruned = runGroupKFoldCV(rows, 6, 5, [1.0, 1.0, 1.0], true);
  const dtPruned = runGroupKFoldCV(rows, 4, 15, [1.0, 1.0, 1.0], true);
  const dtBalancedModerate = runGroupKFoldCV(rows, 5, 10, [1.0, 1.8, 1.2], true); // Boost Moderate Risk weight

  console.log('\n--- 1. Unpruned Decision Tree (maxDepth=6) [GroupKFold] ---');
  console.log(`  Accuracy: ${(dtUnpruned.accuracy * 100).toFixed(2)}% | Balanced Acc: ${(dtUnpruned.balancedAccuracy * 100).toFixed(2)}% | Macro F1: ${(dtUnpruned.macroF1 * 100).toFixed(2)}%`);
  console.log('  Per-Class:', dtUnpruned.perClass);
  console.log('  Confusion:', dtUnpruned.confusionMatrix);

  console.log('\n--- 2. Pruned Decision Tree (maxDepth=4) [GroupKFold] ---');
  console.log(`  Accuracy: ${(dtPruned.accuracy * 100).toFixed(2)}% | Balanced Acc: ${(dtPruned.balancedAccuracy * 100).toFixed(2)}% | Macro F1: ${(dtPruned.macroF1 * 100).toFixed(2)}%`);
  console.log('  Per-Class:', dtPruned.perClass);
  console.log('  Confusion:', dtPruned.confusionMatrix);

  console.log('\n--- 3. Class-Weighted Moderate-Boosting Decision Tree (maxDepth=5, weights=[1.0, 1.8, 1.2]) [GroupKFold] ---');
  console.log(`  Accuracy: ${(dtBalancedModerate.accuracy * 100).toFixed(2)}% | Balanced Acc: ${(dtBalancedModerate.balancedAccuracy * 100).toFixed(2)}% | Macro F1: ${(dtBalancedModerate.macroF1 * 100).toFixed(2)}%`);
  console.log('  Per-Class:', dtBalancedModerate.perClass);
  console.log('  Confusion:', dtBalancedModerate.confusionMatrix);

  // Train final production model using Class-Weighted Decision Tree
  const featureNames = ['Age', 'SystolicBP', 'DiastolicBP', 'Blood Sugar', 'Body Temp', 'Heart Rate'];
  const validRows = rows.filter((r) => r.heartRate > 10);
  const finalTree = trainAuditedDecisionTree(validRows, featureNames, 5, 10, [1.0, 1.8, 1.2]);

  const modelArtifact = {
    modelVersion: '1.0.1-audited',
    preprocessingVersion: '1.0.1',
    trainedAt: new Date().toISOString(),
    featureNames,
    classLabels: ['Low', 'Moderate', 'High'],
    imputationPolicy: 'Fold-isolated median imputation for training; Live inference strictly validates heart rate range [30, 200] bpm without silent replacement.',
    auditSummary,
    metrics: {
      decisionTreeUnpruned: dtUnpruned,
      decisionTreePruned: dtPruned,
      decisionTreeClassWeighted: dtBalancedModerate,
    },
    selectedModel: 'ClassWeightedDecisionTree',
    treeRoot: finalTree,
  };

  fs.writeFileSync(ARTIFACT_PATH, JSON.stringify(modelArtifact, null, 2));
  fs.writeFileSync(REPORT_PATH, JSON.stringify(modelArtifact.metrics, null, 2));

  console.log(`\nUpdated Audited Model Artifact saved to: ${ARTIFACT_PATH}`);
}

runMainAudit();
