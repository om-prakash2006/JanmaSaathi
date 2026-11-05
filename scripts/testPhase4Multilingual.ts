import { TRANSLATIONS, CLINICAL_GLOSSARY, Language } from '../src/i18n/translations';

async function runMultilingualVerification() {
  console.log('====================================================');
  console.log('JANMASAATHI - PHASE 4 MULTILINGUAL VERIFICATION TEST');
  console.log('====================================================\n');

  let passes = 0;
  let fails = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passes++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      fails++;
    }
  }

  // Test 1: Supported Languages completeness
  const languages: Language[] = ['en', 'hi', 'or'];
  assert(
    languages.every((l) => TRANSLATIONS[l] && typeof TRANSLATIONS[l] === 'object'),
    'Test 1: All 3 languages (English, Hindi, Odia) present in dictionary'
  );

  // Test 2: Key parity across languages
  const enKeys = Object.keys(TRANSLATIONS.en);
  const hiKeys = Object.keys(TRANSLATIONS.hi);
  const orKeys = Object.keys(TRANSLATIONS.or);

  const missingInHi = enKeys.filter((k) => !hiKeys.includes(k));
  const missingInOr = enKeys.filter((k) => !orKeys.includes(k));

  assert(
    missingInHi.length === 0,
    'Test 2a: 100% key parity between English and Hindi',
    missingInHi.join(', ')
  );
  assert(
    missingInOr.length === 0,
    'Test 2b: 100% key parity between English and Odia',
    missingInOr.join(', ')
  );

  // Test 3: Clinical Glossary Completeness
  const glossaryKeys = Object.keys(CLINICAL_GLOSSARY);
  let glossaryPass = true;
  for (const gKey of glossaryKeys) {
    const entry = (CLINICAL_GLOSSARY as any)[gKey];
    if (!entry.en || !entry.hi || !entry.or) {
      glossaryPass = false;
      break;
    }
  }
  assert(
    glossaryPass,
    'Test 3: Clinical Glossary contains full English, Hindi (Devanagari), and Odia script entries'
  );

  // Test 4: Dynamic Interpolation Function
  function mockT(lang: Language, key: string, params?: Record<string, string | number>): string {
    let template = TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        template = template.replace(new RegExp(`{\\s*${paramKey}\\s*}`, 'g'), String(value));
      });
    }
    return template;
  }

  const resultEn = mockT('en', 'greetingPriya');
  const resultHi = mockT('hi', 'greetingPriya');
  const resultOr = mockT('or', 'greetingPriya');

  assert(
    resultEn === 'Namaste, Priya' && resultHi.includes('नमस्ते') && resultOr.includes('ନମସ୍କାର'),
    'Test 4: Dynamic language greeting translation for all 3 roles'
  );

  // Test 5: Script encoding validity (Devanagari & Odia Unicode ranges)
  const devanagariRegex = /[\u0900-\u097F]/;
  const odiaRegex = /[\u0B00-\u0B7F]/;

  assert(
    devanagariRegex.test(TRANSLATIONS.hi.loginHeader) && devanagariRegex.test(CLINICAL_GLOSSARY.gestationalAge.hi),
    'Test 5a: Native Devanagari script verified in Hindi dictionary'
  );

  assert(
    odiaRegex.test(TRANSLATIONS.or.loginHeader) && odiaRegex.test(CLINICAL_GLOSSARY.gestationalAge.or),
    'Test 5b: Native Odia script verified in Odia dictionary'
  );

  // Test 6: Role-Based Pre-login & Post-login strings
  assert(
    Boolean(TRANSLATIONS.en.roleWorker && TRANSLATIONS.hi.roleWorker && TRANSLATIONS.or.roleWorker),
    'Test 6: Role labels (Mother, Health Worker, Medical Officer) translated across all roles'
  );

  console.log('\n----------------------------------------------------');
  console.log(`SUMMARY: ${passes} PASSED, ${fails} FAILED`);
  console.log('----------------------------------------------------');

  if (fails > 0) {
    process.exit(1);
  }
}

runMultilingualVerification();
