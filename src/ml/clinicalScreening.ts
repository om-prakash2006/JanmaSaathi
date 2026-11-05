/**
 * Independent Clinical Danger-Sign Screening Engine
 * 
 * Evaluates non-ML clinical observations (Haemoglobin, Vaginal Bleeding,
 * Oedema/Swelling, Fetal Movement, Convulsions, Severe Headache, Fever, etc.)
 * according to validated Government of India MoHFW and WHO Antenatal Care (ANC) protocols.
 * 
 * CRITICAL SAFETY PRINCIPLE:
 * This mechanism operates independently from the UCI 6-feature ML model.
 * A Low Risk ML prediction NEVER overrides an acute clinical danger sign.
 */

export interface ClinicalObservationInputs {
  gestationalWeek: number;
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
  bodyTemp: number;
  hemoglobin?: number;
  fundalHeight?: number;
  fetalHeartRate?: number;
  fetalMovementStatus: 'normal' | 'reduced' | 'absent';
  dangerSigns: string[];
  symptomsNotes?: string;
}

export interface ClinicalFinding {
  id: string;
  category: 'urgent' | 'concerning' | 'normal';
  parameter: string;
  recordedValue: string;
  findingTitleKey: string;
  findingTitleEn: string;
  findingTitleHi: string;
  findingTitleOr: string;
  descriptionKey: string;
  descriptionEn: string;
  descriptionHi: string;
  descriptionOr: string;
  clinicalGuidelineRef: string;
}

export interface ClinicalScreeningResult {
  urgentFindings: ClinicalFinding[];
  concerningFindings: ClinicalFinding[];
  normalFindings: ClinicalFinding[];
  hasUrgentDangerSigns: boolean;
  hasConcerningObservations: boolean;
  recommendedFollowUp: {
    urgencyLevel: 'immediate_emergency' | 'consult_24_48h' | 'followup_7d' | 'routine_anc';
    actionTitleKey: string;
    actionTitleEn: string;
    actionTitleHi: string;
    actionTitleOr: string;
    protocolNoteKey: string;
    protocolNoteEn: string;
    protocolNoteHi: string;
    protocolNoteOr: string;
    overrideApplied: boolean;
  };
}

/**
 * Perform independent clinical danger-sign screening on maternal observations.
 * @param inputs Clinical observations from assessment form
 * @param mlRiskCategory Predicted risk category from ML model ('Low' | 'Moderate' | 'High')
 */
export function evaluateClinicalObservations(
  inputs: ClinicalObservationInputs,
  mlRiskCategory: 'Low' | 'Moderate' | 'High' = 'Low'
): ClinicalScreeningResult {
  const urgentFindings: ClinicalFinding[] = [];
  const concerningFindings: ClinicalFinding[] = [];
  const normalFindings: ClinicalFinding[] = [];

  const rawSigns = inputs.dangerSigns || [];
  const signLower = rawSigns.map((s) => s.toLowerCase());

  // 1. HAEMOGLOBIN (WHO & MoHFW India Maternal Anaemia Guidelines)
  const hb = typeof inputs.hemoglobin === 'number' ? inputs.hemoglobin : null;
  if (hb !== null && !isNaN(hb)) {
    if (hb < 7.0) {
      urgentFindings.push({
        id: 'hb-severe-anaemia',
        category: 'urgent',
        parameter: 'Haemoglobin',
        recordedValue: `${hb} g/dL`,
        findingTitleKey: 'ruleSevereAnaemiaTitle',
        findingTitleEn: 'Severe Maternal Anaemia (Hb < 7.0 g/dL)',
        findingTitleHi: 'गंभीर मातृ एनीमिया (हीमोग्लोबिन < 7.0 g/dL)',
        findingTitleOr: 'ଗୁରୁତର ମାତୃ ରକ୍ତହୀନତା (ହିମୋଗ୍ଲୋବିନ < ୭.୦ g/dL)',
        descriptionKey: 'ruleSevereAnaemia',
        descriptionEn: `Recorded haemoglobin is ${hb} g/dL (severely low). Increases risk of maternal heart failure, shock, and severe postpartum hemorrhage. Mandatory emergency referral for parenteral iron or transfusion.`,
        descriptionHi: `दर्ज हीमोग्लोबिन ${hb} g/dL है (अत्यधिक कम)। मातृ हृदय गति रुकने और गंभीर प्रसवोत्तर रक्तस्राव का जोखिम। तत्काल आपातकालीन रेफरल अनिवार्य है।`,
        descriptionOr: `ଦର୍ଜ ହିମୋଗ୍ଲୋବିନ ${hb} g/dL ଅଟେ (ଅତ୍ୟନ୍ତ କମ)। ମାତୃ ହୃଦୟ ବିଫଳତା ଏବଂ ପ୍ରସବପର ରକ୍ତସ୍ରାବର ଅଧିକ ଆଶଙ୍କା। ଜରୁରୀକାଳୀନ ରେଫରାଲ ବାଧ୍ୟତାମୂଳକ।`,
        clinicalGuidelineRef: 'MoHFW Anemia Mukt Bharat & WHO ANC Guidelines',
      });
    } else if (hb >= 7.0 && hb < 11.0) {
      concerningFindings.push({
        id: 'hb-moderate-anaemia',
        category: 'concerning',
        parameter: 'Haemoglobin',
        recordedValue: `${hb} g/dL`,
        findingTitleKey: 'ruleModerateAnaemiaTitle',
        findingTitleEn: 'Mild-to-Moderate Anaemia (Hb 7.0–10.9 g/dL)',
        findingTitleHi: 'हल्का से मध्यम एनीमिया (हीमोग्लोबिन 7.0–10.9 g/dL)',
        findingTitleOr: 'ମଧ୍ୟମ ରକ୍ତହୀନତା (ହିମୋଗ୍ଲୋବିନ ୭.୦–୧୦.୯ g/dL)',
        descriptionKey: 'ruleModerateAnaemia',
        descriptionEn: `Recorded haemoglobin is ${hb} g/dL. Requires therapeutic double-dose IFA supplementation, dietary counselling, and repeat Hb re-check in 14 days.`,
        descriptionHi: `दर्ज हीमोग्लोबिन ${hb} g/dL है। चिकित्सीय डबल-डोज़ आईएफए अनुपूरण और 14 दिनों में पुनः जांच की आवश्यकता है।`,
        descriptionOr: `ଦର୍ଜ ହିମୋଗ୍ଲୋବିନ ${hb} g/dL ଅଟେ। ଉଚ୍ଚ ମାତ୍ରାର ଆଇଏଫଏ ବଟିକା ଏବଂ ୧୪ ଦିନ ପରେ ପୁନଃ ପରୀକ୍ଷା ଆବଶ୍ୟକ।`,
        clinicalGuidelineRef: 'MoHFW Maternal Health Protocol',
      });
    } else {
      normalFindings.push({
        id: 'hb-normal',
        category: 'normal',
        parameter: 'Haemoglobin',
        recordedValue: `${hb} g/dL`,
        findingTitleKey: 'ruleNormalHbTitle',
        findingTitleEn: 'Normal Haemoglobin (≥ 11.0 g/dL)',
        findingTitleHi: 'सामान्य हीमोग्लोबिन (≥ 11.0 g/dL)',
        findingTitleOr: 'ସାଧାରଣ ହିମୋଗ୍ଲୋବିନ (≥ ୧୧.୦ g/dL)',
        descriptionKey: 'ruleNormalHb',
        descriptionEn: `Haemoglobin level (${hb} g/dL) is adequate for pregnancy. Continue standard daily prophylactic IFA tablet with iron-rich foods.`,
        descriptionHi: `हीमोग्लोबिन स्तर (${hb} g/dL) गर्भावस्था के लिए पर्याप्त है। दैनिक रोगनिरोधी आईएफए गोली जारी रखें।`,
        descriptionOr: `ହିମୋଗ୍ଲୋବିନ ସ୍ତର (${hb} g/dL) ଗର୍ଭାବସ୍ଥା ପାଇଁ ସଠିକ ଅଟେ। ଦୈନିକ ନିୟମିତ ଆଇଏଫଏ ବଟିକା ଜାରି ରଖନ୍ତୁ।`,
        clinicalGuidelineRef: 'WHO Antenatal Care Recommendations',
      });
    }
  }

  // 2. VAGINAL BLEEDING (Obstetric Emergency)
  const hasBleeding = signLower.some(
    (s) => s.includes('bleeding') || s.includes('dangerbleeding') || s.includes('blood')
  );
  if (hasBleeding) {
    urgentFindings.push({
      id: 'danger-bleeding',
      category: 'urgent',
      parameter: 'Vaginal Bleeding',
      recordedValue: 'Reported Present',
      findingTitleKey: 'ruleBleedingTitle',
      findingTitleEn: 'Antepartum Vaginal Bleeding',
      findingTitleHi: 'प्रसवपूर्व योनि से रक्तस्राव',
      findingTitleOr: 'ପ୍ରସବପୂର୍ବ ଯୋନିପଥରୁ ରକ୍ତସ୍ରାବ',
      descriptionKey: 'ruleBleeding',
      descriptionEn:
        'Vaginal bleeding at any stage of pregnancy is an acute obstetric emergency (suspected placenta praevia or placental abruption). Immediate facility transfer required.',
      descriptionHi:
        'गर्भावस्था के किसी भी चरण में योनि से रक्तस्राव एक गंभीर प्रसूति आपातकाल है। तत्काल अस्पताल स्थानांतरण आवश्यक है।',
      descriptionOr:
        'ଗର୍ଭାବସ୍ଥାର ଯେକୌଣସି ସମୟରେ ରକ୍ତସ୍ରାବ ଏକ ଗୁରୁତର ଜରୁରୀକାଳୀନ ଅବସ୍ଥା। ତୁରନ୍ତ ଡାକ୍ତରଖାନା ନେବା ଆବଶ୍ୟକ।',
      clinicalGuidelineRef: 'Emergency Obstetric and Newborn Care (EmONC)',
    });
  }

  // 3. SEVERE BLOOD PRESSURE / HYPERTENSION
  const sys = inputs.systolicBP;
  const dia = inputs.diastolicBP;
  if (sys >= 160 || dia >= 110) {
    urgentFindings.push({
      id: 'bp-severe-hypertension',
      category: 'urgent',
      parameter: 'Blood Pressure',
      recordedValue: `${sys}/${dia} mmHg`,
      findingTitleKey: 'ruleSevereBPTitle',
      findingTitleEn: 'Severe Gestational Hypertension (BP ≥ 160/110 mmHg)',
      findingTitleHi: 'गंभीर गर्भकालीन उच्च रक्तचाप (बीपी ≥ 160/110 mmHg)',
      findingTitleOr: 'ଗୁରୁତର ଗର୍ଭକାଳୀନ ଉଚ୍ଚ ରକ୍ତଚାପ (ବିପି ≥ ୧୬୦/୧୧୦ mmHg)',
      descriptionKey: 'ruleSevereBP',
      descriptionEn: `Critically elevated blood pressure (${sys}/${dia} mmHg). Severe pre-eclampsia / stroke risk. Requires immediate emergency anti-hypertensive therapy and monitoring.`,
      descriptionHi: `गंभीर रूप से बढ़ा हुआ रक्तचाप (${sys}/${dia} mmHg)। गंभीर प्री-एक्लेम्पसिया का जोखिम। तत्काल आपातकालीन चिकित्सा आवश्यक है।`,
      descriptionOr: `ଅତ୍ୟଧିକ ବର୍ଦ୍ଧିତ ରକ୍ତଚାପ (${sys}/${dia} mmHg)। ପ୍ରି-ଏକ୍ଲାମ୍ପସିଆର ଗୁରୁତର ବିପଦ। ତୁରନ୍ତ ଜରୁରୀକାଳୀନ ଚିକିତ୍ସା ଆବଶ୍ୟକ।`,
      clinicalGuidelineRef: 'MoHFW India Hypertensive Disorders in Pregnancy Protocol',
    });
  } else if (sys >= 140 || dia >= 90) {
    concerningFindings.push({
      id: 'bp-mild-hypertension',
      category: 'concerning',
      parameter: 'Blood Pressure',
      recordedValue: `${sys}/${dia} mmHg`,
      findingTitleKey: 'ruleMildBPTitle',
      findingTitleEn: 'Gestational Hypertension (BP 140–159/90–109 mmHg)',
      findingTitleHi: 'गर्भकालीन उच्च रक्तचाप (बीपी 140–159/90–109 mmHg)',
      findingTitleOr: 'ଗର୍ଭକାଳୀନ ଉଚ୍ଚ ରକ୍ତଚାପ (ବିପି ୧୪୦–୧୫୯/୯୦–୧୦୯ mmHg)',
      descriptionKey: 'ruleMildBP',
      descriptionEn: `Elevated blood pressure (${sys}/${dia} mmHg) requires medical officer consultation within 24–48 hours, urine albumin test, and close monitoring.`,
      descriptionHi: `बढ़ा हुआ रक्तचाप (${sys}/${dia} mmHg)। 24-48 घंटों के भीतर चिकित्सा अधिकारी से परामर्श और मूत्र एल्बुमिन परीक्षण आवश्यक है।`,
      descriptionOr: `ବର୍ଦ୍ଧିତ ରକ୍ତଚାପ (${sys}/${dia} mmHg)। ୨୪-୪୮ ଘଣ୍ଟା ମଧ୍ୟରେ ଡାକ୍ତରୀ ପରାମର୍ଶ ଏବଂ ପରିସ୍ରା ଆଲବୁମିନ ପରୀକ୍ଷା ଆବଶ୍ୟକ।`,
      clinicalGuidelineRef: 'National Health Mission Gestational Hypertension Guidelines',
    });
  } else {
    normalFindings.push({
      id: 'bp-normal',
      category: 'normal',
      parameter: 'Blood Pressure',
      recordedValue: `${sys}/${dia} mmHg`,
      findingTitleKey: 'ruleNormalBPTitle',
      findingTitleEn: 'Normal Blood Pressure (< 140/90 mmHg)',
      findingTitleHi: 'सामान्य रक्तचाप (< 140/90 mmHg)',
      findingTitleOr: 'ସାଧାରଣ ରକ୍ତଚାପ (< ୧୪୦/୯୦ mmHg)',
      descriptionKey: 'ruleNormalBP',
      descriptionEn: `Blood pressure (${sys}/${dia} mmHg) is within normal physiological antenatal parameters.`,
      descriptionHi: `रक्तचाप (${sys}/${dia} mmHg) प्रसवपूर्व सामान्य शारीरिक सीमा के भीतर है।`,
      descriptionOr: `ରକ୍ତଚାପ (${sys}/${dia} mmHg) ପ୍ରସବପୂର୍ବ ସାଧାରଣ ସୀମା ମଧ୍ୟରେ ଅଛି।`,
      clinicalGuidelineRef: 'MoHFW Routine ANC Protocol',
    });
  }

  // 4. FETAL MOVEMENT
  const movement = inputs.fetalMovementStatus;
  if (movement === 'absent') {
    urgentFindings.push({
      id: 'fetal-movement-absent',
      category: 'urgent',
      parameter: 'Fetal Movement',
      recordedValue: 'Absent',
      findingTitleKey: 'ruleAbsentMovementTitle',
      findingTitleEn: 'Absent Fetal Movement',
      findingTitleHi: 'भ्रूण की गति अनुपस्थित',
      findingTitleOr: 'ଗର୍ଭସ୍ଥ ଶିଶୁର କୌଣସି ଚଳପ୍ରଚଳ ନାହିଁ',
      descriptionKey: 'ruleAbsentMovement',
      descriptionEn:
        'Cessation of fetal movement is a critical emergency indicator of acute fetal distress or compromise. Immediate transfer for cardiotocography (NST) and ultrasound.',
      descriptionHi:
        'भ्रूण की गति का न होना तीव्र भ्रूण संकट का आपातकालीन संकेत है। तत्काल अल्ट्रासाउंड और सीटीजी हेतु अस्पताल रेफर करें।',
      descriptionOr:
        'ଶିଶୁର ଚଳପ୍ରଚଳ ବନ୍ଦ ହେବା ଏକ ଜରୁରୀକାଳୀନ ଚେତାବନୀ। ତୁରନ୍ତ ଅଲଟ୍ରାସାଉଣ୍ଡ ଏବଂ ଏନଏସଟି ପରୀକ୍ଷା ପାଇଁ ନିଅନ୍ତୁ।',
      clinicalGuidelineRef: 'RCOG & WHO Fetal Movement Assessment Protocols',
    });
  } else if (movement === 'reduced') {
    concerningFindings.push({
      id: 'fetal-movement-reduced',
      category: 'concerning',
      parameter: 'Fetal Movement',
      recordedValue: 'Reduced',
      findingTitleKey: 'ruleReducedMovementTitle',
      findingTitleEn: 'Reduced Fetal Movement',
      findingTitleHi: 'भ्रूण की कम गति',
      findingTitleOr: 'ଗର୍ଭସ୍ଥ ଶିଶୁର କମ ଚଳପ୍ରଚଳ',
      descriptionKey: 'ruleReducedMovement',
      descriptionEn:
        'Decreased fetal movements reported. Mother should be instructed on fetal kick counts and evaluated by a medical officer within 24–48 hours.',
      descriptionHi:
        'भ्रूण की गति में कमी दर्ज की गई। माता को किक काउंट की सलाह दें और 24-48 घंटों में डॉक्टर से जांच कराएं।',
      descriptionOr:
        'ଶିଶୁର ଚଳପ୍ରଚଳ ହ୍ରାସ ପାଇଛି। ମାଆଙ୍କୁ କିକ୍ ଗଣନା ଶିଖାନ୍ତୁ ଏବଂ ୨୪-୪୮ ଘଣ୍ଟା ମଧ୍ୟରେ ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ।',
      clinicalGuidelineRef: 'National ANC Fetal Surveillance Protocol',
    });
  } else {
    normalFindings.push({
      id: 'fetal-movement-normal',
      category: 'normal',
      parameter: 'Fetal Movement',
      recordedValue: 'Active / Normal',
      findingTitleKey: 'ruleNormalMovementTitle',
      findingTitleEn: 'Active Fetal Movement',
      findingTitleHi: 'सक्रिय भ्रूण गति',
      findingTitleOr: 'ସକ୍ରିୟ ଶିଶୁ ଚଳପ୍ରଚଳ',
      descriptionKey: 'ruleNormalMovement',
      descriptionEn: 'Healthy fetal movements reported regularly by mother (≥ 10 movements over 2 hours).',
      descriptionHi: 'माता द्वारा नियमित रूप से स्वस्थ भ्रूण गति दर्ज की गई (2 घंटे में ≥ 10 हलचल)।',
      descriptionOr: 'ମାତାଙ୍କ ଦ୍ୱାରା ନିୟମିତ ଶିଶୁ ଚଳପ୍ରଚଳ ଅନୁଭୂତ (୨ ଘଣ୍ଟାରେ ≥ ୧୦ ଥର)।',
      clinicalGuidelineRef: 'Standard Antenatal Monitoring',
    });
  }

  // 5. CONVULSIONS (Eclampsia Emergency)
  const hasConvulsions = signLower.some(
    (s) => s.includes('convulsion') || s.includes('dangerconvulsions') || s.includes('fits')
  );
  if (hasConvulsions) {
    urgentFindings.push({
      id: 'danger-convulsions',
      category: 'urgent',
      parameter: 'Neurological / Convulsions',
      recordedValue: 'Reported Present',
      findingTitleKey: 'ruleConvulsionsTitle',
      findingTitleEn: 'Convulsions / Eclamptic Fits',
      findingTitleHi: 'दौरे / एक्लेम्पसिया आपातकाल',
      findingTitleOr: 'ବାତ / ଏକ୍ଲାମ୍ପସିଆ ଜରୁରୀକାଳୀନ ଅବସ୍ଥା',
      descriptionKey: 'ruleConvulsions',
      descriptionEn:
        'Convulsions during pregnancy indicate eclampsia. Highest risk obstetric emergency. Administer loading dose Magnesium Sulfate if trained and transport immediately.',
      descriptionHi:
        'गर्भावस्था में दौरे एक्लेम्पसिया का संकेत हैं। अत्यंत गंभीर आपातकाल। तुरंत उच्च चिकित्सा केंद्र रेफर करें।',
      descriptionOr:
        'ଗର୍ଭାବସ୍ଥାରେ ବାତ ହେବା ଏକ୍ଲାମ୍ପସିଆର ଲକ୍ଷଣ। ଅତ୍ୟନ୍ତ ଜରୁରୀ। ତୁରନ୍ତ ଡାକ୍ତରଖାନା ସ୍ଥାନାନ୍ତର କରନ୍ତୁ।',
      clinicalGuidelineRef: 'MoHFW India Eclampsia Management Protocol',
    });
  }

  // 6. SEVERE HEADACHE & VISUAL DISTURBANCE (Impending Eclampsia)
  const hasHeadache = signLower.some((s) => s.includes('headache') || s.includes('dangerheadache'));
  const hasVisual = signLower.some((s) => s.includes('visual') || s.includes('dangervisual') || s.includes('blur'));
  if (hasHeadache && hasVisual) {
    urgentFindings.push({
      id: 'danger-headache-visual',
      category: 'urgent',
      parameter: 'Neurological Symptoms',
      recordedValue: 'Severe Headache + Visual Blurring',
      findingTitleKey: 'ruleHeadacheVisualTitle',
      findingTitleEn: 'Severe Headache with Visual Disturbances',
      findingTitleHi: 'दृष्टि धुंधलेपन के साथ गंभीर सिरदर्द',
      findingTitleOr: 'ଦୃଷ୍ଟି ଦୁର୍ବଳତା ସହିତ ଗୁରୁତର ମୁଣ୍ଡବିନ୍ଧା',
      descriptionKey: 'ruleHeadacheVisual',
      descriptionEn:
        'Symptoms of cerebral oedema / impending eclampsia. Imminent seizure danger. Urgent emergency referral required.',
      descriptionHi:
        'प्रमस्तिष्क शोफ / आसन्न एक्लेम्पसिया के लक्षण। दौरे का तत्काल खतरा। तत्काल आपातकालीन रेफरल आवश्यक।',
      descriptionOr:
        'ମସ୍ତିଷ୍କ ଚାପ ଏବଂ ଏକ୍ଲାମ୍ପସିଆର ପୂର୍ବ ଲକ୍ଷଣ। ତୁରନ୍ତ ଡାକ୍ତରଖାନା ନେବା ଆବଶ୍ୟକ।',
      clinicalGuidelineRef: 'WHO Recommendations for Prevention and Treatment of Pre-eclampsia',
    });
  } else if (hasHeadache || hasVisual) {
    concerningFindings.push({
      id: 'danger-headache-or-visual',
      category: 'concerning',
      parameter: 'Neurological Symptoms',
      recordedValue: hasHeadache ? 'Severe Headache' : 'Visual Disturbance',
      findingTitleKey: 'ruleHeadacheOrVisualTitle',
      findingTitleEn: hasHeadache ? 'Persistent Severe Headache' : 'Visual Disturbances',
      findingTitleHi: hasHeadache ? 'लगातार गंभीर सिरदर्द' : 'दृष्टि संबंधी गड़बड़ी',
      findingTitleOr: hasHeadache ? 'କ୍ରମାଗତ ମୁଣ୍ଡବିନ୍ଧା' : 'ଦୃଷ୍ଟି ସମସ୍ୟା',
      descriptionKey: 'ruleHeadacheOrVisual',
      descriptionEn:
        'Neurovascular symptoms require BP monitoring, urine protein evaluation, and medical officer review within 24–48 hours.',
      descriptionHi:
        'रक्तचाप की निगरानी, मूत्र प्रोटीन परीक्षण और 24-48 घंटों के भीतर डॉक्टर से जांच आवश्यक है।',
      descriptionOr:
        'ରକ୍ତଚାପ ଯାଞ୍ଚ, ପରିସ୍ରା ପରୀକ୍ଷା ଏବଂ ୨୪-୪୮ ଘଣ୍ଟା ମଧ୍ୟରେ ଡାକ୍ତରୀ ପରାମର୍ଶ ଆବଶ୍ୟକ।',
      clinicalGuidelineRef: 'MoHFW Danger Sign Guidelines',
    });
  }

  // 7. HIGH FEVER / MATERNAL SEPSIS
  const hasFeverSign = signLower.some((s) => s.includes('fever') || s.includes('dangerfever'));
  const temp = inputs.bodyTemp;
  if (temp >= 101.0 || (hasFeverSign && temp >= 100.4)) {
    urgentFindings.push({
      id: 'danger-high-fever',
      category: 'urgent',
      parameter: 'Body Temperature',
      recordedValue: `${temp} °F`,
      findingTitleKey: 'ruleHighFeverTitle',
      findingTitleEn: 'High Maternal Fever (≥ 101.0 °F)',
      findingTitleHi: 'उच्च मातृ ज्वर (≥ 101.0 °F)',
      findingTitleOr: 'ଅତ୍ୟଧିକ ମାତୃ ଜ୍ୱର (≥ ୧୦୧.୦ °F)',
      descriptionKey: 'ruleHighFever',
      descriptionEn: `High maternal fever (${temp} °F) raises suspicion of chorioamnionitis or systemic maternal sepsis. Immediate medical evaluation required.`,
      descriptionHi: `उच्च बुखार (${temp} °F) संक्रमण अथवा सेप्सिस का संकेत देता है। तत्काल चिकित्सकीय मूल्यांकन आवश्यक।`,
      descriptionOr: `ଅତ୍ୟଧିକ ଜ୍ୱର (${temp} °F) ଗର୍ଭାଶୟ ସଂକ୍ରମଣର ସନ୍ଦେହ। ତୁରନ୍ତ ଡାକ୍ତରୀ ଚିକିତ୍ସା ଆବଶ୍ୟକ।`,
      clinicalGuidelineRef: 'MoHFW Maternal Infection Management Guidelines',
    });
  }

  // 8. SWELLING / OEDEMA
  const hasSwelling = signLower.some((s) => s.includes('swelling') || s.includes('dangerswelling'));
  if (hasSwelling) {
    if (sys >= 140 || dia >= 90 || hasHeadache) {
      urgentFindings.push({
        id: 'danger-severe-swelling',
        category: 'urgent',
        parameter: 'Oedema / Swelling',
        recordedValue: 'Facial / Generalized Swelling with Hypertension',
        findingTitleKey: 'ruleSevereSwellingTitle',
        findingTitleEn: 'Marked Oedema with Elevated BP (Pre-eclampsia Indicator)',
        findingTitleHi: 'उच्च बीपी के साथ गंभीर सूजन (प्री-एक्लेम्पसिया)',
        findingTitleOr: 'ଉଚ୍ଚ ରକ୍ତଚାପ ସହିତ ଶରୀର ଫୁଲିବା (ପ୍ରି-ଏକ୍ଲାମ୍ପସିଆ)',
        descriptionKey: 'ruleSevereSwelling',
        descriptionEn:
          'Generalized oedema (face/hands) combined with hypertension indicates pre-eclampsia. Urgent clinical facility referral needed.',
        descriptionHi:
          'उच्च रक्तचाप के साथ चेहरे और हाथों में सूजन प्री-एक्लेम्पसिया का संकेत है। तत्काल अस्पताल रेफरल आवश्यक।',
        descriptionOr:
          'ମୁହଁ ଏବଂ ହାତ ଫୁଲିବା ସହିତ ରକ୍ତଚାପ ବୃଦ୍ଧି ପ୍ରି-ଏକ୍ଲାମ୍ପସିଆର ସଙ୍କେତ। ତୁରନ୍ତ ରେଫରାଲ ଆବଶ୍ୟକ।',
        clinicalGuidelineRef: 'MoHFW Pre-eclampsia Protocol',
      });
    } else {
      concerningFindings.push({
        id: 'concerning-swelling',
        category: 'concerning',
        parameter: 'Oedema / Swelling',
        recordedValue: 'Reported Swelling',
        findingTitleKey: 'ruleMildSwellingTitle',
        findingTitleEn: 'Reported Swelling (Edema)',
        findingTitleHi: 'हाथ-पैरों में सूजन',
        findingTitleOr: 'ହାତ ଏବଂ ଗୋଡ଼ ଫୁଲିବା',
        descriptionKey: 'ruleMildSwelling',
        descriptionEn:
          'Swelling in pregnancy requires urine albumin screening and regular BP tracking by the frontline health worker.',
        descriptionHi:
          'गर्भावस्था में सूजन के लिए मूत्र एल्बुमिन परीक्षण और रक्तचाप की निरंतर निगरानी आवश्यक है।',
        descriptionOr:
          'ଗର୍ଭାବସ୍ଥାରେ ଶରୀର ଫୁଲିଲେ ପରିସ୍ରା ଆଲବୁମିନ ଯାଞ୍ଚ ଏବଂ ନିୟମିତ ବିପି ମାପିବା ଆବଶ୍ୟକ।',
        clinicalGuidelineRef: 'Frontline Antenatal Guidelines',
      });
    }
  }

  // 9. FETAL HEART RATE (if recorded)
  const fhr = inputs.fetalHeartRate;
  if (fhr && !isNaN(fhr) && fhr > 0) {
    if (fhr < 110 || fhr > 160) {
      urgentFindings.push({
        id: 'fhr-abnormal',
        category: 'urgent',
        parameter: 'Fetal Heart Rate',
        recordedValue: `${fhr} bpm`,
        findingTitleKey: 'ruleAbnormalFHRTitle',
        findingTitleEn: `Abnormal Fetal Heart Rate (${fhr} bpm)`,
        findingTitleHi: `असामान्य भ्रूण हृदय गति (${fhr} bpm)`,
        findingTitleOr: `ଅସ୍ୱାଭାବିକ ଶିଶୁ ହୃଦସ୍ପନ୍ଦନ (${fhr} bpm)`,
        descriptionKey: 'ruleAbnormalFHR',
        descriptionEn: `Fetal heart rate (${fhr} bpm) is outside the normal physiological range (110–160 bpm). Indicates potential fetal hypoxia. Immediate transfer for NST/obstetric assessment.`,
        descriptionHi: `भ्रूण की हृदय गति (${fhr} bpm) सामान्य सीमा (110-160 bpm) से बाहर है। तत्काल अस्पताल रेफर करें।`,
        descriptionOr: `ଶିଶୁର ହୃଦସ୍ପନ୍ଦନ (${fhr} bpm) ସାଧାରଣ ସୀମା ବାହାରେ ଅଛି। ତୁରନ୍ତ ଡାକ୍ତରଖାନା ନେବା ଆବଶ୍ୟକ।`,
        clinicalGuidelineRef: 'Intrapartum and Antenatal FHR Guidelines',
      });
    } else {
      normalFindings.push({
        id: 'fhr-normal',
        category: 'normal',
        parameter: 'Fetal Heart Rate',
        recordedValue: `${fhr} bpm`,
        findingTitleKey: 'ruleNormalFHRTitle',
        findingTitleEn: 'Normal Fetal Heart Rate (110–160 bpm)',
        findingTitleHi: 'सामान्य भ्रूण हृदय गति (110–160 bpm)',
        findingTitleOr: 'ସାଧାରଣ ଶିଶୁ ହୃଦସ୍ପନ୍ଦନ (୧୧୦–୧୬୦ bpm)',
        descriptionKey: 'ruleNormalFHR',
        descriptionEn: `Fetal heart rate is reassuring (${fhr} bpm) within normal antenatal physiological limits.`,
        descriptionHi: `भ्रूण की हृदय गति (${fhr} bpm) सामान्य प्रसवपूर्व सीमा के भीतर संतोषजनक है।`,
        descriptionOr: `ଶିଶୁର ହୃଦସ୍ପନ୍ଦନ (${fhr} bpm) ସାଧାରଣ ଏବଂ ସନ୍ତୋଷଜନକ ଅଟେ।`,
        clinicalGuidelineRef: 'WHO FHR Standards',
      });
    }
  }

  // 10. COMBINED PROTOCOL RECOMMENDATION SYNTHESIS
  const hasUrgent = urgentFindings.length > 0;
  const hasConcerning = concerningFindings.length > 0;

  let recommendedFollowUp: ClinicalScreeningResult['recommendedFollowUp'];

  if (hasUrgent) {
    const isOverride = mlRiskCategory === 'Low';
    recommendedFollowUp = {
      urgencyLevel: 'immediate_emergency',
      actionTitleKey: 'immediateEmergencyReferral',
      actionTitleEn: 'Immediate Emergency Referral to Hospital / FRU',
      actionTitleHi: 'अस्पताल / एफआरयू में तत्काल आपातकालीन रेफरल',
      actionTitleOr: 'ଡାକ୍ତରଖାନା / ଏଫଆରୟୁ କୁ ତୁରନ୍ତ ଜରୁରୀକାଳୀନ ରେଫରାଲ',
      protocolNoteKey: isOverride ? 'safetyOverrideNotice' : 'urgentCareNotice',
      protocolNoteEn: isOverride
        ? 'CRITICAL SAFETY OVERRIDE: The ML model predicted Low Risk based on baseline statistical vitals, but independent clinical screening detected URGENT danger signs. In accordance with MoHFW maternal safety guidelines, acute clinical danger signs strictly override low ML screening. Immediate emergency facility referral is required.'
        : 'Urgent maternal danger signs identified. Immediate referral to First Referral Unit (FRU) or Sub-Divisional Hospital with 102 emergency ambulance transport is mandatory.',
      protocolNoteHi: isOverride
        ? 'महत्वपूर्ण सुरक्षा चेतावनी: एमएल मॉडल ने सामान्य आंकड़ों के आधार पर कम जोखिम का पूर्वानुमान लगाया था, लेकिन स्वतंत्र नैदानिक जांच में गंभीर खतरे के लक्षण पाए गए। राष्ट्रीय मातृ सुरक्षा प्रोटोकॉल के अनुसार, नैदानिक खतरे के लक्षण एमएल स्कोर से ऊपर हैं। तत्काल आपातकालीन रेफरल अनिवार्य है।'
        : 'गंभीर मातृ खतरे के लक्षण मिले हैं। 102 एम्बुलेंस के साथ प्रथम रेफरल इकाई (FRU) या अनुमंडलीय अस्पताल में तत्काल रेफरल अनिवार्य है।',
      protocolNoteOr: isOverride
        ? 'ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ସୁରକ୍ଷା ଚେତାବନୀ: ଏମଏଲ ମଡେଲ କମ ବିପଦ ଦର୍ଶାଇଥିଲେ ମଧ୍ୟ ସ୍ୱତନ୍ତ୍ର ଚିକିତ୍ସା ଯାଞ୍ଚରେ ଗୁରୁତର ବିପଦ ଲକ୍ଷଣ ମିଳିଛି। ଜାତୀୟ ମାତୃ ସୁରକ୍ଷା ନିୟମ ଅନୁସାରେ ଚିକିତ୍ସା ବିପଦ ଲକ୍ଷଣ ସର୍ବାଗ୍ରେ ବିବେଚ୍ୟ। ତୁରନ୍ତ ଡାକ୍ତରଖାନା ରେଫରାଲ ବାଧ୍ୟତାମୂଳକ।'
        : 'ଗୁରୁତର ମାତୃ ବିପଦ ଲକ୍ଷଣ ଚିହ୍ନଟ। ୧୦୨ ଆମ୍ବୁଲାନ୍ସ ଯୋଗେ ପ୍ରଥମ ରେଫରାଲ ୟୁନିଟ୍ (FRU) କୁ ତୁରନ୍ତ ସ୍ଥାନାନ୍ତର ବାଧ୍ୟତାମୂଳକ।',
      overrideApplied: isOverride,
    };
  } else if (mlRiskCategory === 'High') {
    recommendedFollowUp = {
      urgencyLevel: 'consult_24_48h',
      actionTitleKey: 'consultWithin24to48Hours',
      actionTitleEn: 'Medical Officer Consultation within 24–48 Hours',
      actionTitleHi: '24-48 घंटों के भीतर चिकित्सा अधिकारी से परामर्श',
      actionTitleOr: '୨୪-୪୮ ଘଣ୍ଟା ମଧ୍ୟରେ ଡାକ୍ତରଙ୍କ ସହିତ ପରାମର୍ଶ',
      protocolNoteKey: 'mlHighRiskFollowupNote',
      protocolNoteEn:
        'The ML model predicted High Risk based on multiple elevated physiological indicators (such as blood glucose and blood pressure). Arrange an antenatal consultation with the Medical Officer at the Primary Health Centre (PHC/CHC) within 24–48 hours for clinical evaluation and confirmatory tests.',
      protocolNoteHi:
        'एमएल मॉडल ने कई बढ़े हुए शारीरिक संकेतकों (जैसे रक्त शर्करा और रक्तचाप) के आधार पर उच्च जोखिम का पूर्वानुमान लगाया है। नैदानिक मूल्यांकन के लिए 24-48 घंटों के भीतर प्राथमिक स्वास्थ्य केंद्र (PHC/CHC) के चिकित्सा अधिकारी से परामर्श तय करें।',
      protocolNoteOr:
        'ଏମଏଲ ମଡେଲ ବର୍ଦ୍ଧିତ ଶାରୀରିକ ଲକ୍ଷଣ (ଯଥା ରକ୍ତ ଶର୍କରା ଓ ରକ୍ତଚାପ) ଆଧାରରେ ଉଚ୍ଚ ବିପଦ ଆକଳନ କରିଛି। ୨୪-୪୮ ଘଣ୍ଟା ମଧ୍ୟରେ ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର (PHC) ର ଡାକ୍ତରଙ୍କ ସହିତ ପରାମର୍ଶ କରାନ୍ତୁ।',
      overrideApplied: false,
    };
  } else if (hasConcerning) {
    recommendedFollowUp = {
      urgencyLevel: 'consult_24_48h',
      actionTitleKey: 'consultWithin24to48Hours',
      actionTitleEn: 'Medical Officer Review within 24–48 Hours',
      actionTitleHi: '24-48 घंटों के भीतर डॉक्टर से समीक्षा',
      actionTitleOr: '୨୪-୪୮ ଘଣ୍ଟା ମଧ୍ୟରେ ଡାକ୍ତରଙ୍କ ସହିତ ସମୀକ୍ଷା',
      protocolNoteKey: 'clinicalConcerningFollowupNote',
      protocolNoteEn:
        'Concerning clinical observations (such as moderate anaemia or reduced fetal movement) were detected. Schedule a clinical examination at the nearest PHC/CHC within 24–48 hours for therapeutic intervention and follow-up.',
      protocolNoteHi:
        'चिंताजनक नैदानिक अवलोकन (जैसे मध्यम एनीमिया या कम भ्रूण गति) पाए गए। चिकित्सीय हस्तक्षेप के लिए 24-48 घंटों के भीतर निकटतम प्राथमिक स्वास्थ्य केंद्र में जांच कराएं।',
      protocolNoteOr:
        'ଚିନ୍ତାଜନକ ଚିକିତ୍ସା ଅବଲୋକନ (ଯଥା ମଧ୍ୟମ ରକ୍ତହୀନତା କିମ୍ବା କମ ଶିଶୁ ଚଳପ୍ରଚଳ) ଚିହ୍ନଟ। ୨୪-୪୮ ଘଣ୍ଟା ମଧ୍ୟରେ ନିକଟସ୍ଥ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରରେ ଡାକ୍ତରଙ୍କ ପରାମର୍ଶ ନିଅନ୍ତୁ।',
      overrideApplied: false,
    };
  } else if (mlRiskCategory === 'Moderate') {
    recommendedFollowUp = {
      urgencyLevel: 'followup_7d',
      actionTitleKey: 'scheduledFollowUp7Days',
      actionTitleEn: 'Scheduled Review within 7 Days & Monitoring',
      actionTitleHi: '7 दिनों के भीतर निर्धारित समीक्षा एवं निगरानी',
      actionTitleOr: '୭ ଦିନ ମଧ୍ୟରେ ନିର୍ଦ୍ଧାରିତ ସମୀକ୍ଷା ଓ ତଦାରଖ',
      protocolNoteKey: 'mlModerateRiskFollowupNote',
      protocolNoteEn:
        'The ML screening model evaluated intermediate physiological markers. Re-check blood pressure and vital parameters within 7 days. Reinforce daily IFA and calcium supplementation, hydration, and nutritional counselling.',
      protocolNoteHi:
        'एमएल मॉडल ने मध्यम जोखिम वाले शारीरिक मार्करों का मूल्यांकन किया है। 7 दिनों के भीतर रक्तचाप और अन्य मापों की पुनः जांच करें। दैनिक आईएफए, कैल्शियम और पोषण परामर्श सुनिश्चित करें।',
      protocolNoteOr:
        'ଏମଏଲ ମଡେଲ ମଧ୍ୟମ ବିପଦ ଆକଳନ କରିଛି। ୭ ଦିନ ମଧ୍ୟରେ ପୁନର୍ବାର ରକ୍ତଚାପ ଏବଂ ଶାରୀରିକ ମାପ ଯାଞ୍ଚ କରନ୍ତୁ। ନିୟମିତ ଆଇଏଫଏ ଏବଂ କ୍ୟାଲସିୟମ ବଟିକା ସୁନିଶ୍ଚିତ କରନ୍ତୁ।',
      overrideApplied: false,
    };
  } else {
    recommendedFollowUp = {
      urgencyLevel: 'routine_anc',
      actionTitleKey: 'continueRoutineAnc',
      actionTitleEn: 'Continue Routine Antenatal Care (ANC)',
      actionTitleHi: 'नियमित प्रसवपूर्व देखभाल (एएनसी) जारी रखें',
      actionTitleOr: 'ନିୟମିତ ପ୍ରସବପୂର୍ବ ଯତ୍ନ (ଏଏନସି) ଜାରି ରଖନ୍ତୁ',
      protocolNoteKey: 'routineAncFollowupNote',
      protocolNoteEn:
        'Both the ML model and independent clinical screening indicate stable maternal parameters. Continue routine antenatal care visits according to the national trimester schedule, daily IFA supplementation, and advise on maternal danger signs.',
      protocolNoteHi:
        'एमएल मॉडल और स्वतंत्र नैदानिक जांच दोनों सामान्य स्थिति दर्शाते हैं। राष्ट्रीय दिशानिर्देशों के अनुसार नियमित प्रसवपूर्व जांच जारी रखें, दैनिक आईएफए लें और खतरे के लक्षणों के प्रति सतर्क रहें।',
      protocolNoteOr:
        'ଏମଏଲ ମଡେଲ ଏବଂ ସ୍ୱତନ୍ତ୍ର ଚିକିତ୍ସା ଯାଞ୍ଚ ଉଭୟ ସାଧାରଣ ସ୍ଥିତି ଦର୍ଶାଉଛନ୍ତି। ଜାତୀୟ ନିୟମ ଅନୁସାରେ ନିୟମିତ ପ୍ରସବପୂର୍ବ ଯାଞ୍ଚ ଜାରି ରଖନ୍ତୁ ଏବଂ ବିପଦ ଲକ୍ଷଣ ପ୍ରତି ସତର୍କ ରୁହନ୍ତୁ।',
      overrideApplied: false,
    };
  }

  return {
    urgentFindings,
    concerningFindings,
    normalFindings,
    hasUrgentDangerSigns: hasUrgent,
    hasConcerningObservations: hasConcerning,
    recommendedFollowUp,
  };
}
