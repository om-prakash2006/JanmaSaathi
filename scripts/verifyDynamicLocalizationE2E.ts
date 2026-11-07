/**
 * End-to-End Dynamic Localization Verification Script for JanmaSaathi
 * Tests dynamic content translation across Mother, Worker, and Supervisor entities.
 */

import {
  localizeDynamicText,
  translateName,
  convertNumerals,
  DYNAMIC_CLINICAL_DICTIONARY,
} from '../src/utils/dynamicLocalization';
import {
  DEMO_HEALTH_UPDATES,
  DEMO_MESSAGES,
  DEMO_APPOINTMENTS,
  DEMO_REFERRALS,
  DEMO_ASSESSMENTS,
} from '../src/data/centralDemoData';

async function runE2ETests() {
  console.log('--- Starting JanmaSaathi Dynamic Localization E2E Tests ---');
  let failures = 0;

  function assert(condition: boolean, desc: string) {
    if (!condition) {
      console.error(`❌ FAILED: ${desc}`);
      failures++;
    } else {
      console.log(`✅ PASSED: ${desc}`);
    }
  }

  // 1. Test Demo Health Updates Translations
  const priyaUpdate = DEMO_HEALTH_UPDATES[0];
  assert(
    Boolean(priyaUpdate.translations?.observations?.or),
    'Priya Sharma update has Odia observations'
  );
  assert(
    Boolean(priyaUpdate.translations?.observations?.hi),
    'Priya Sharma update has Hindi observations'
  );

  const localizedObsOr = localizeDynamicText(
    priyaUpdate.observations,
    'or',
    priyaUpdate.translations?.observations
  );
  assert(
    localizedObsOr.includes('ସାମାନ୍ୟ ଫୁଲା') || localizedObsOr.includes('ପାଦରେ'),
    `Odia observation translated: ${localizedObsOr}`
  );

  const localizedObsHi = localizeDynamicText(
    priyaUpdate.observations,
    'hi',
    priyaUpdate.translations?.observations
  );
  assert(
    localizedObsHi.includes('पैरों में हल्की सूजन') || localizedObsHi.includes('शिशु'),
    `Hindi observation translated: ${localizedObsHi}`
  );

  // 2. Test Demo Messages Translations
  const workerMsg = DEMO_MESSAGES[0];
  const msgOr = localizeDynamicText(workerMsg.text, 'or', workerMsg.translations?.text);
  assert(
    msgOr.includes('ପ୍ରିୟା') && (msgOr.includes('ଏମସିପି') || msgOr.includes('ରାମପୁର')),
    `Worker message translated to Odia: ${msgOr}`
  );

  const motherReply = DEMO_MESSAGES[1];
  const replyHi = localizeDynamicText(motherReply.text, 'hi', motherReply.translations?.text);
  assert(
    replyHi.includes('सुनीता') && (replyHi.includes('परामर्श') || replyHi.includes('पानी')),
    `Mother message translated to Hindi: ${replyHi}`
  );

  // 3. Test Demo Referrals Translations
  const referral = DEMO_REFERRALS[0];
  const refReasonOr = localizeDynamicText(
    referral.reasonForReferral,
    'or',
    referral.translations?.reasonForReferral
  );
  assert(
    refReasonOr.includes('ଉଚ୍ଚ ରକ୍ତଚାପ') || refReasonOr.includes('ମୁଣ୍ଡବିନ୍ଧା'),
    `Referral reason translated to Odia: ${refReasonOr}`
  );

  const refFacilityHi = localizeDynamicText(
    referral.referredToFacility,
    'hi',
    referral.translations?.referredToFacility
  );
  assert(
    refFacilityHi.includes('रामपुर प्राथमिक स्वास्थ्य केंद्र') || refFacilityHi.includes('अस्पताल'),
    `Referral facility translated to Hindi: ${refFacilityHi}`
  );

  // 4. Test Appointments Translations
  const appt = DEMO_APPOINTMENTS[0];
  const apptTitleOr = localizeDynamicText(appt.title, 'or', appt.translations?.title);
  assert(
    apptTitleOr.includes('ପ୍ରସବପୂର୍ବ ଯାଞ୍ଚ') || apptTitleOr.includes('ANC'),
    `Appointment title translated to Odia: ${apptTitleOr}`
  );

  // 5. Test Proper Name Translations
  const priyaHi = translateName('Priya Sharma', 'hi');
  const priyaOr = translateName('Priya Sharma', 'or');
  assert(priyaHi === 'प्रिया शर्मा', `Priya Sharma in Hindi: ${priyaHi}`);
  assert(priyaOr === 'ପ୍ରିୟା ଶର୍ମା', `Priya Sharma in Odia: ${priyaOr}`);

  const sunitaHi = translateName('Sunita Devi', 'hi');
  const sunitaOr = translateName('Sunita Devi', 'or');
  assert(sunitaHi === 'सुनीता देवी', `Sunita Devi in Hindi: ${sunitaHi}`);
  assert(sunitaOr === 'ସୁନୀତା ଦେବୀ', `Sunita Devi in Odia: ${sunitaOr}`);

  // 6. Test Numeral Conversions
  const numHi = convertNumerals('BP 140/90, Week 24, Phone +91 98450 11234', 'hi');
  assert(
    numHi.includes('१४०') && numHi.includes('९०') && numHi.includes('२४'),
    `Hindi Devanagari numerals: ${numHi}`
  );

  const numOr = convertNumerals('BP 140/90, Week 24, Phone +91 98450 11234', 'or');
  assert(
    numOr.includes('୧୪୦') && numOr.includes('୯୦') && numOr.includes('୨୪'),
    `Odia numerals: ${numOr}`
  );

  // 7. Dictionary completeness
  const dictKeys = Object.keys(DYNAMIC_CLINICAL_DICTIONARY);
  assert(dictKeys.length >= 30, `Clinical dictionary has ${dictKeys.length} clinical phrase mappings`);

  console.log(`\n--- E2E Tests Complete: ${failures === 0 ? 'ALL PASSED' : `${failures} FAILING`} ---`);
  if (failures > 0) process.exit(1);
}

runE2ETests().catch((err) => {
  console.error(err);
  process.exit(1);
});
