import { TRANSLATIONS } from '../src/i18n/translations';

console.log('================================================================');
console.log('JANMASAATHI - MULTILINGUAL TRANSLATION PARITY AUDIT');
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

const enKeys = Object.keys(TRANSLATIONS.en);
const hiKeys = Object.keys(TRANSLATIONS.hi);
const orKeys = Object.keys(TRANSLATIONS.or);

console.log(`Total Keys -> English: ${enKeys.length}, Hindi: ${hiKeys.length}, Odia: ${orKeys.length}`);

// 1. Key count equality
assert(
  enKeys.length === hiKeys.length && enKeys.length === orKeys.length,
  'Test 1: Translation key counts are identical across English, Hindi, and Odia',
  `EN: ${enKeys.length}, HI: ${hiKeys.length}, OR: ${orKeys.length}`
);

// 2. Key existence in Hindi
const missingInHi = enKeys.filter((k) => !(k in TRANSLATIONS.hi));
assert(
  missingInHi.length === 0,
  'Test 2: All English translation keys exist in Hindi dictionary',
  missingInHi.length > 0 ? `Missing keys: ${missingInHi.join(', ')}` : undefined
);

// 3. Key existence in Odia
const missingInOr = enKeys.filter((k) => !(k in TRANSLATIONS.or));
assert(
  missingInOr.length === 0,
  'Test 3: All English translation keys exist in Odia dictionary',
  missingInOr.length > 0 ? `Missing keys: ${missingInOr.join(', ')}` : undefined
);

// 4. Check for empty string values in any language
const emptyInEn = enKeys.filter((k) => !TRANSLATIONS.en[k] || !TRANSLATIONS.en[k].trim());
const emptyInHi = hiKeys.filter((k) => !TRANSLATIONS.hi[k] || !TRANSLATIONS.hi[k].trim());
const emptyInOr = orKeys.filter((k) => !TRANSLATIONS.or[k] || !TRANSLATIONS.or[k].trim());

assert(
  emptyInEn.length === 0 && emptyInHi.length === 0 && emptyInOr.length === 0,
  'Test 4: Zero empty translation strings in English, Hindi, or Odia',
  `Empty EN: ${emptyInEn.length}, HI: ${emptyInHi.length}, OR: ${emptyInOr.length}`
);

// 5. Test parameterized replacement function
import { CLINICAL_GLOSSARY } from '../src/i18n/translations';

const testParamKey = 'weekLabel';
const enSample = TRANSLATIONS.en[testParamKey]?.replace('{num}', '24');
const hiSample = TRANSLATIONS.hi[testParamKey]?.replace('{num}', '24');
const orSample = TRANSLATIONS.or[testParamKey]?.replace('{num}', '24');

assert(
  enSample.includes('24') && hiSample.includes('24') && orSample.includes('24'),
  'Test 5: Parameterized dynamic translation replacement functions correctly across languages',
  `EN: "${enSample}", HI: "${hiSample}", OR: "${orSample}"`
);

// 6. Test Clinical Glossary dictionary entries for 100% language coverage
const glossaryKeys = Object.keys(CLINICAL_GLOSSARY) as (keyof typeof CLINICAL_GLOSSARY)[];
let glossaryComplete = true;

glossaryKeys.forEach((key) => {
  const item = CLINICAL_GLOSSARY[key];
  if (!item.en || !item.hi || !item.or) {
    glossaryComplete = false;
  }
});

assert(
  glossaryComplete,
  'Test 6: Clinical Glossary dictionary contains full English, Hindi, and Odia terms',
  `Glossary term count: ${glossaryKeys.length}`
);

// 7. Test Numeral Translation (0-9 -> Devanagari / Odia numerals)
import { toLocalizedNumerals, toLocalizedName } from '../src/i18n/translations';

const hiNum = toLocalizedNumerals('Week 24, Day 5, Hb 11.2', 'hi');
const orNum = toLocalizedNumerals('Week 24, Day 5, Hb 11.2', 'or');

assert(
  hiNum.includes('२४') && hiNum.includes('५') && hiNum.includes('११.२'),
  'Test 7: Numeric digits automatically convert to Devanagari numerals in Hindi mode',
  `Result: "${hiNum}"`
);

assert(
  orNum.includes('୨୪') && orNum.includes('୫') && orNum.includes('୧୧.୨'),
  'Test 8: Numeric digits automatically convert to Odia numerals in Odia mode',
  `Result: "${orNum}"`
);

// 8. Test Name Translation
const priyaHi = toLocalizedName('Priya Sharma', 'hi');
const priyaOr = toLocalizedName('Priya Sharma', 'or');
const drRajeshHi = toLocalizedName('Dr. Rajesh Kumar', 'hi');

assert(
  priyaHi === 'प्रिया शर्मा' && priyaOr === 'ପ୍ରିୟା ଶର୍ମା' && drRajeshHi === 'डॉ. राजेश कुमार',
  'Test 9: Patient, Health Worker, Doctor, and Location names translate accurately into Hindi and Odia',
  `Priya HI: "${priyaHi}", Priya OR: "${priyaOr}", Doctor HI: "${drRajeshHi}"`
);

console.log('================================================================');
console.log(`PARITY AUDIT RESULT: ${passedTests}/${totalTests} tests passed successfully.`);
console.log('================================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
