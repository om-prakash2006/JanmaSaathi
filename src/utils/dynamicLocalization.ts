import { Language, toLocalizedNumerals, toLocalizedName } from '../i18n/translations';
import { getCachedTranslation, saveCachedTranslation } from './indexedDB';

export { toLocalizedNumerals, toLocalizedName };
export const convertNumerals = toLocalizedNumerals;
export const translateName = toLocalizedName;

/**
 * Curated, clinically reviewed dynamic content translation dictionary
 * covers all demonstration records, medical observations, health advice,
 * messages, referral notes, and alerts across English, Hindi, and Odia.
 */
export const DYNAMIC_CLINICAL_DICTIONARY: Record<string, { hi: string; or: string }> = {
  // 1. Health Updates: Observations & Notes
  'Mild swelling in feet reported in evening after household work.': {
    hi: 'शाम को घरेलू काम के बाद पैरों में हल्की सूजन की सूचना दी।',
    or: 'ସନ୍ଧ୍ୟାରେ ଘର କାମ ପରେ ପାଦରେ ସାମାନ୍ୟ ଫୁଲା ହେଉଥିବା ଜଣାଇଛନ୍ତି।',
  },
  'Rest with feet elevated on a cushion; will be monitored at upcoming ANC 3 visit next week.': {
    hi: 'तकिए पर पैर ऊंचे रखकर विश्राम करें; अगले सप्ताह आगामी एएनसी 3 जांच में निगरानी की जाएगी।',
    or: 'ତକିଆ ଉପରେ ପାଦ ଉଚ୍ଚା କରି ବିଶ୍ରାମ ନିଅନ୍ତୁ; ଆସନ୍ତା ସପ୍ତାହର ଏଏନ୍‌ସି ୩ ଯାଞ୍ଚରେ ଏହାର ନିରୀକ୍ଷଣ କରାଯିବ।',
  },
  'Routine weekly well-being log — Feeling energetic and active.': {
    hi: 'साप्ताहिक नियमित स्वास्थ्य लॉग — ऊर्जावान और सक्रिय महसूस कर रही हैं।',
    or: 'ସାପ୍ତାହିକ ନିୟମିତ ସ୍ୱାସ୍ଥ୍ୟ ଲଗ୍ — ଶକ୍ତିଶାଳୀ ଏବଂ ସକ୍ରିୟ ଅନୁଭବ କରୁଛନ୍ତି।',
  },
  'Self-submitted check-in acknowledged. Great compliance with nutritional supplements.': {
    hi: 'स्वयं दर्ज की गई जांच स्वीकार की गई। पोषण अनुपूरक लेने में उत्कृष्ट अनुपालन।',
    or: 'ନିଜେ ଦାଖଲ କରିଥିବା ଯାଞ୍ଚ ଗ୍ରହଣ କରାଗଲା। ପୁଷ୍ଟିକର ସପ୍ଲିମେଣ୍ଟ ନିୟମିତ ଗ୍ରହଣ କରୁଛନ୍ତି।',
  },
  'Self-submitted check-in acknowledged.': {
    hi: 'स्वयं दर्ज की गई जांच स्वीकार की गई।',
    or: 'ନିଜେ ଦାଖଲ କରିଥିବା ଯାଞ୍ଚ ଗ୍ରହଣ କରାଗଲା।',
  },
  'No headache or blurred vision noted. Resting with legs elevated relieves pressure.': {
    hi: 'सिरदर्द या धुंधली दृष्टि नहीं देखी गई। पैर ऊंचे करके आराम करने से राहत मिलती है।',
    or: 'ମୁଣ୍ଡବିନ୍ଧା କିମ୍ବା ଝାପସା ଦୃଷ୍ଟି ନାହିଁ। ଗୋଡ଼ ଉଚ୍ଚା କରି ବିଶ୍ରାମ ନେଲେ ଆରାମ ମିଳୁଛି।',
  },
  'Taking iron-folic acid and calcium tablets daily as prescribed. Balanced nutrition maintained.': {
    hi: 'निर्धारित अनुसार दैनिक आयरन-फोलिक एसिड और कैल्शियम की गोलियां ले रही हैं। संतुलित आहार जारी है।',
    or: 'ଡାକ୍ତରଙ୍କ ପରାମର୍ଶ ଅନୁସାରେ ପ୍ରତିଦିନ ଆଇରନ୍-ଫଲିକ୍ ଏସିଡ୍ ଏବଂ କ୍ୟାଲସିୟମ୍ ଔଷଧ ନେଉଛନ୍ତି। ସନ୍ତୁଳିତ ଖାଦ୍ୟ ଜାରି ରହିଛି।',
  },
  'Persistent dull headache and slight fatigue since yesterday afternoon.': {
    hi: 'कल दोपहर से लगातार हल्का सिरदर्द और थोड़ी थकान महसूस हो रही है।',
    or: 'ଗତକାଲି ଅପରାହ୍ନରୁ କ୍ରମାଗତ ସାମାନ୍ୟ ମୁଣ୍ଡବିନ୍ଧା ଏବଂ କ୍ଳାନ୍ତି ଲାଗୁଛି।',
  },
  'Resting did not relieve headache. Checking if home visit is scheduled today.': {
    hi: 'आराम करने से सिरदर्द में राहत नहीं मिली। जानना चाहती हैं कि क्या आज गृह भेंट निर्धारित है।',
    or: 'ବିଶ୍ରାମ ନେଲେ ମଧ୍ୟ ମୁଣ୍ଡବିନ୍ଧା କମିଲା ନାହିଁ। ଆଜି ଘର ପରିଦର୍ଶନ ଅଛି କି ନାହିଁ ଜାଣିବାକୁ ଚାହାଁନ୍ତି।',
  },
  'Logged via Mother Portal check-in.': {
    hi: 'मातृ पोर्टल चेक-इन द्वारा दर्ज।',
    or: 'ମାତୃ ପୋର୍ଟାଲ୍ ଯାଞ୍ଚ ମାଧ୍ୟମରେ ଦର୍ଜ କରାଗଲା।',
  },
  'Observation reviewed and acknowledged during field follow-up.': {
    hi: 'क्षेत्रीय फॉलो-अप के दौरान अवलोकन की समीक्षा और पुष्टि की गई।',
    or: 'କ୍ଷେତ୍ର ପରିଦର୍ଶନ ସମୟରେ ଅବଲୋକନ ସମୀକ୍ଷା ଏବଂ ନିଶ୍ଚିତ କରାଗଲା।',
  },
  'Routine home visit. Blood pressure normal, prenatal supplements replenished.': {
    hi: 'नियमित गृह भेंट। रक्तचाप सामान्य, प्रसवपूर्व अनुपूरक दवाइयां प्रदान की गईं।',
    or: 'ନିୟମିତ ଘର ପରିଦର୍ଶନ। ରକ୍ତଚାପ ସାଧାରଣ, ପ୍ରସବପୂର୍ବ ଔଷଧ ଯୋଗାଇ ଦିଆଗଲା।',
  },

  // 2. Symptoms
  'Mild Swelling in Feet': {
    hi: 'पैरों में हल्की सूजन',
    or: 'ପାଦରେ ସାମାନ୍ୟ ଫୁଲା',
  },
  'Normal Well-being': {
    hi: 'सामान्य स्वास्थ्य',
    or: 'ସାଧାରଣ ସୁସ୍ଥତା',
  },
  'Headache': {
    hi: 'सिरदर्द',
    or: 'ମୁଣ୍ଡବିନ୍ଧା',
  },
  'Fatigue': {
    hi: 'थकान',
    or: 'କ୍ଳାନ୍ତି',
  },
  'Severe / Persistent Headache': {
    hi: 'गंभीर / लगातार सिरदर्द',
    or: 'ଗୁରୁତର / କ୍ରମାଗତ ମୁଣ୍ଡବିନ୍ଧା',
  },
  'Elevated Blood Pressure': {
    hi: 'बढ़ा हुआ रक्तचाप',
    or: 'ବୃଦ୍ଧି ପାଇଥିବା ରକ୍ତଚାପ',
  },
  'Vaginal Bleeding': {
    hi: 'योनि से रक्तस्राव',
    or: 'ଯୋନିପଥରୁ ରକ୍ତସ୍ରାବ',
  },
  'Reduced Fetal Movement': {
    hi: 'शिशु की हलचल में कमी',
    or: 'ଗର୍ଭସ୍ଥ ଶିଶୁର ଚଳପ୍ରଚଳ ହ୍ରାସ',
  },

  // 3. Appointments
  'Third Antenatal Checkup (ANC 3) & Routine Blood Pressure Check': {
    hi: 'तीसरी प्रसवपूर्व जांच (ANC 3) एवं नियमित रक्तचाप परीक्षण',
    or: 'ତୃତୀୟ ପ୍ରସବପୂର୍ବ ଯାଞ୍ଚ (ANC 3) ଓ ନିୟମିତ ରକ୍ତଚାପ ପରୀକ୍ଷା',
  },
  'Urgent BP Follow-up & Clinical Lab Examination': {
    hi: 'तत्काल रक्तचाप फॉलो-अप एवं नैदानिक प्रयोगशाला परीक्षण',
    or: 'ଜରୁରୀ ରକ୍ତଚାପ ଫଲୋ-ଅପ୍ ଓ ଡାକ୍ତରୀ ପରୀକ୍ଷାଗାର ଯାଞ୍ଚ',
  },
  'Vitals check, abdominal palpation, Hb check, tetanus toxoid booster check.': {
    hi: 'शारीरिक माप जांच, उदर परीक्षण, हीमोग्लोबिन जांच, टिटनेस टॉक्साइड बूस्टर टीका।',
    or: 'ସ୍ୱାସ୍ଥ୍ୟ ମାପକ ଯାଞ୍ଚ, ପେଟ ପରୀକ୍ଷା, ହିମୋଗ୍ଲୋବିନ୍ ଯାଞ୍ଚ ଓ ଟିଟାନସ୍ ବୁଷ୍ଟର ଟିକା।',
  },
  'Specialist consultation for gestational hypertension review.': {
    hi: 'गर्भकालीन उच्च रक्तचाप समीक्षा हेतु विशेषज्ञ परामर्श।',
    or: 'ଗର୍ଭକାଳୀନ ଉଚ୍ଚ ରକ୍ତଚାପ ସମୀକ୍ଷା ପାଇଁ ବିଶେଷଜ୍ଞ ପରାମର୍ଶ।',
  },

  // 4. Direct Messages
  "Namaste Priya, remember to bring your MCP card for Thursday's checkup at Rampur Health Post.": {
    hi: 'नमस्ते प्रिया, रामपुर स्वास्थ्य केंद्र पर गुरुवार की जांच के लिए अपना एमसीपी कार्ड लाना न भूलें।',
    or: 'ନମସ୍କାର ପ୍ରିୟା, ଗୁରୁବାର ରାମପୁର ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର ଯାଞ୍ଚ ପାଇଁ ନିଜର ଏମସିପି କାର୍ଡ଼ ଆଣିବାକୁ ଭୁଲିବେ ନାହିଁ।',
  },
  'Namaste Sunita ji, yes I have kept it ready. Also drinking plenty of water as you advised.': {
    hi: 'नमस्ते सुनीता जी, हाँ मैंने इसे तैयार रखा है। आपके परामर्श अनुसार पर्याप्त पानी भी पी रही हूँ।',
    or: 'ନମସ୍କାର ସୁନୀତା ଦିଦି, ହଁ ମୁଁ ଏହା ପ୍ରସ୍ତୁତ ରଖିଛି। ଆପଣଙ୍କ ପରାମର୍ଶ ମୁତାବକ ପ୍ରଚୁର ପାଣି ମଧ୍ୟ ପିଉଛି।',
  },
  'Very good. If you feel any dizziness or discomfort, message me or tap Request Callback immediately.': {
    hi: 'बहुत अच्छा। यदि आपको कोई चक्कर या असहजता लगे, तो मुझे संदेश भेजें या तुरंत कॉल अनुरोध पर टैप करें।',
    or: 'ବହୁତ ଭଲ। ଯଦି କୌଣସି ମୁଣ୍ଡ ବୁଲାଇବା ବା ଅସୁବିଧା ଅନୁଭବ ହୁଏ, ତୁରନ୍ତ ମେସେଜ୍ କରନ୍ତୁ କିମ୍ବା କଲ୍ ଅନୁରୋଧ କରନ୍ତୁ।',
  },
  'Namaste Meena, how are you feeling today? Please remember to rest on your left side.': {
    hi: 'नमस्ते मीना, आज आप कैसा महसूस कर रही हैं? कृपया बाईं करवट विश्राम करना याद रखें।',
    or: 'ନମସ୍କାର ମୀନା, ଆଜି କିପରି ଲାଗୁଛି? ଦୟାକରି ବାମ ପାଖକୁ ଶୋଇ ବିଶ୍ରାମ ନେବା ମନେ ରଖନ୍ତୁ।',
  },
  'Namaste Didi, my blood pressure reading was high yesterday. I am taking the prescribed medicine.': {
    hi: 'नमस्ते दीदी, कल मेरा रक्तचाप अधिक आया था। मैं निर्धारित दवा ले रही हूँ।',
    or: 'ନମସ୍କାର ଦିଦି, ଗତକାଲି ମୋର ରକ୍ତଚାପ ଅଧିକ ଥିଲା। ମୁଁ ଡାକ୍ତର ଦେଇଥିବା ଔଷଧ ନେଉଛି।',
  },
  'Can you please check my blood pressure during your afternoon home visit?': {
    hi: 'क्या आप आज दोपहर की गृह भेंट के दौरान मेरा रक्तचाप जांच सकती हैं?',
    or: 'ଆଜି ଅପରାହ୍ନ ଘର ପରିଦର୍ଶନ ସମୟରେ ଆପଣ ମୋର ରକ୍ତଚାପ ଯାଞ୍ଚ କରିପାରିବେ କି?',
  },
  'Didi, I felt mild lower backache after morning chores. Baby movements are active and normal.': {
    hi: 'दीदी, सुबह के काम के बाद कमर में हल्का दर्द हुआ। शिशु की हलचल सक्रिय और सामान्य है।',
    or: 'ଦିଦି, ସକାଳ କାମ ପରେ କମରରେ ସାମାନ୍ୟ ଯନ୍ତ୍ରଣା ଲାଗିଲା। ଶିଶୁର ଚଳପ୍ରଚଳ ସକ୍ରିୟ ଓ ସାଧାରଣ ଅଛି।',
  },
  'Good to hear baby is active. Avoid lifting buckets or heavy loads. I will examine you tomorrow.': {
    hi: 'सुनकर अच्छा लगा कि शिशु सक्रिय है। बाल्टी या भारी वजन उठाने से बचें। मैं कल आपकी जांच करूंगी।',
    or: 'ଶିଶୁ ସକ୍ରିୟ ଥିବା ଶୁଣି ଖୁସି ଲାଗିଲା। ବାଲତି ବା ଭାରୀ ଜିନିଷ ଉଠାନ୍ତୁ ନାହିଁ। କାଲି ମୁଁ ଯାଞ୍ଚ କରିବି।',
  },
  'Didi, I missed the ANC checkup last week because of family travel. When can I get my booster dose?': {
    hi: 'दीदी, पारिवारिक यात्रा के कारण पिछले हफ्ते मेरी एएनसी जांच छूट गई। मुझे बूस्टर खुराक कब मिल सकती है?',
    or: 'ଦିଦି, ପାରିବାରିକ ଯାତ୍ରା ଯୋଗୁଁ ଗତ ସପ୍ତାହରେ ମୋର ଏଏନ୍‌ସି ଯାଞ୍ଚ ଛୁଟିଗଲା। ମୋତେ ବୁଷ୍ଟର ଟିକା କେବେ ମିଳିପାରିବ?',
  },
  'I am feeling mild dizziness after taking my morning iron tablet.': {
    hi: 'सुबह की आयरन की गोली लेने के बाद मुझे हल्का चक्कर आ रहा है।',
    or: 'ସକାଳେ ଆଇରନ୍ ବଟିକା ଖାଇବା ପରେ ମୋତେ ସାମାନ୍ୟ ମୁଣ୍ଡ ବୁଲାଉଛି।',
  },
  'Please drink plenty of water and rest on your left side. I will check on you.': {
    hi: 'कृपया खूब पानी पिएं और बाईं करवट विश्राम करें। मैं आकर आपकी जांच करूंगी।',
    or: 'ଦୟାକରି ପ୍ରଚୁର ପାଣି ପିଅନ୍ତୁ ଏବଂ ବାମ ପାଖରେ ବିଶ୍ରାମ ନିଅନ୍ତୁ। ମୁଁ ଆପଣଙ୍କୁ ଯାଞ୍ଚ କରିବି।',
  },

  // 5. Quick Response Advice Pills in Chat
  'Please rest on your left side with pillows.': {
    hi: 'कृपया तकिए के सहारे बाईं करवट लेटकर विश्राम करें।',
    or: 'ଦୟାକରି ତକିଆ ସାହାଯ୍ୟରେ ବାମ କଡ଼ମାଡ଼ି ବିଶ୍ରାମ ନିଅନ୍ତୁ।',
  },
  'Remember to bring your MCP card for checkup.': {
    hi: 'जांच के लिए अपना एमसीपी कार्ड साथ लाना याद रखें।',
    or: 'ଯାଞ୍ଚ ପାଇଁ ଆପଣଙ୍କ ଏମସିପି କାର୍ଡ଼ ଆଣିବା ମନେ ରଖନ୍ତୁ।',
  },
  'Are you taking your iron-folic acid tablet daily?': {
    hi: 'क्या आप प्रतिदिन अपनी आयरन-फोलिक एसिड की गोली ले रही हैं?',
    or: 'ଆପଣ ପ୍ରତିଦିନ ଆଇରନ୍-ଫଲିକ୍ ଏସିଡ୍ ବଟିକା ଖାଉଛନ୍ତି କି?',
  },
  'I am scheduling a home visit to check your vitals.': {
    hi: 'मैं आपकी स्वास्थ्य जांच हेतु गृह भेंट निर्धारित कर रही हूँ।',
    or: 'ମୁଁ ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ଯାଞ୍ଚ ପାଇଁ ଘର ପରିଦର୍ଶନ ନିର୍ଦ୍ଧାରଣ କରୁଛି।',
  },

  // 6. Assessments
  'Mild swelling in ankles noted in late evening. Normal maternal wellbeing.': {
    hi: 'देर शाम टखनों में हल्की सूजन देखी गई। सामान्य मातृ स्वास्थ्य।',
    or: 'ସନ୍ଧ୍ୟାରେ ଗୋଇଠି ନିକଟରେ ସାମାନ୍ୟ ଫୁଲା ଦେଖାଗଲା। ସାଧାରଣ ମାତୃ ସ୍ୱାସ୍ଥ୍ୟ।',
  },
  'Continue iron-folic acid daily with citrus. Elevate feet 20 mins after midday.': {
    hi: 'खट्टे फलों के साथ प्रतिदिन आयरन-फोलिक एसिड जारी रखें। दोपहर बाद 20 मिनट पैर ऊपर रखें।',
    or: 'ଲେମ୍ବୁ/ଖଟା ଫଳ ସହ ଦୈନିକ ଆଇରନ୍-ଫଲିକ୍ ଏସିଡ୍ ଜାରି ରଖନ୍ତୁ। ମଧ୍ୟାହ୍ନ ପରେ ୨୦ ମିନିଟ୍ ପାଦ ଉଚ୍ଚା ରଖନ୍ତୁ।',
  },
  'Observations normal for 24 weeks. Keep routine ANC 3 appointment.': {
    hi: '24 सप्ताह के लिए अवलोकन सामान्य हैं। नियमित एएनसी 3 जांच जारी रखें।',
    or: '୨୪ ସପ୍ତାହ ପାଇଁ ଅବଲୋକନ ସ୍ୱାଭାବିକ ଅଟେ। ନିୟମିତ ଏଏନ୍‌ସି ୩ ଯାଞ୍ଚ ଜାରି ରଖନ୍ତୁ।',
  },
  'Blood pressure elevated at 142/92. Mild blurred vision reported in bright morning sunlight.': {
    hi: 'रक्तचाप 142/92 पर बढ़ा हुआ। सुबह की तेज धूप में हल्की धुंधली दृष्टि की सूचना।',
    or: 'ରକ୍ତଚାପ ୧୪୨/୯୨ରେ ବୃଦ୍ଧି ପାଇଛି। ସକାଳର ଖରାରେ ସାମାନ୍ୟ ଝାପସା ଦୃଷ୍ଟି ଜଣାଇଛନ୍ତି।',
  },
  'Low sodium diet, strict bedrest on left lateral side. Refer immediately to PHC.': {
    hi: 'कम नमक वाला आहार, बाईं करवट सख्त आराम। तुरंत पीएचसी रेफर करें।',
    or: 'କମ୍ ଲୁଣ ଯୁକ୍ତ ଖାଦ୍ୟ, ବାମ ପାଖରେ କଡ଼ମାଡ଼ି ବିଶ୍ରାମ। ତୁରନ୍ତ ପିଏଚ୍‌ସିକୁ ରେଫର୍ କରନ୍ତୁ।',
  },

  // 7. Referrals
  'Gestational hypertension (BP 142/92 mmHg) accompanied by persistent headache and blurred vision.': {
    hi: 'गर्भकालीन उच्च रक्तचाप (रक्तचाप 142/92 mmHg) के साथ लगातार सिरदर्द और धुंधली दृष्टि।',
    or: 'ଗର୍ଭକାଳୀନ ଉଚ୍ଚ ରକ୍ତଚାପ (ରକ୍ତଚାପ ୧୪୨/୯୨ mmHg) ସହିତ କ୍ରମାଗତ ମୁଣ୍ଡବିନ୍ଧା ଓ ଝାପସା ଦୃଷ୍ଟି।',
  },
  'Acknowledged. MOIC Dr. Pradhan notified at Rampur PHC. Bed reserved in antenatal ward.': {
    hi: 'स्वीकार किया गया। रामपुर पीएचसी में एमओआईसी डॉ. प्रधान को सूचित किया गया। प्रसवपूर्व वार्ड में बिस्तर आरक्षित।',
    or: 'ଗ୍ରହଣ କରାଗଲା। ରାମପୁର ପିଏଚ୍‌ସିର ଏମ୍‌ଓଆଇସି ଡାକ୍ତର ପ୍ରଧାନଙ୍କୁ ଅବଗତ କରାଗଲା। ପ୍ରସବପୂର୍ବ ୱାର୍ଡରେ ଶଯ୍ୟା ସଂରକ୍ଷିତ।',
  },
  'Preterm premature rupture of membranes (PPROM) at 33 weeks.': {
    hi: '33वें सप्ताह में समयपूर्व झिल्ली का फटना (पीपीआरओएम)।',
    or: '୩୩ ସପ୍ତାହରେ ସମୟପୂର୍ବ ଜଳଭଙ୍ଗା (PPROM)।',
  },
  '108 Janani Express dispatch verified. Patient admitted to Obstetric ICU.': {
    hi: '108 जननी एक्सप्रेस प्रेषण सत्यापित। प्रसूति आईसीयू में भर्ती।',
    or: '୧୦୮ ଜନନୀ ଏକ୍ସପ୍ରେସ୍ ପଠାଯିବା ନିଶ୍ଚିତ ହେଲା। ପ୍ରସୂତି ଆଇସିୟୁରେ ଭର୍ତ୍ତି କରାଗଲା।',
  },

  // 8. Alerts in Health Worker Patient Directory
  'Reported Symptoms Requiring Review': {
    hi: 'समीक्षा आवश्यक लक्षण रिपोर्ट किए गए',
    or: 'ସମୀକ୍ଷା ଆବଶ୍ୟକ ଲକ୍ଷଣ ରିପୋର୍ଟ ହୋଇଛି',
  },
  'Maternal Health Update Check-in': {
    hi: 'मातृ स्वास्थ्य अपडेट चेक-इन',
    or: 'ମାତୃ ସ୍ୱାସ୍ଥ୍ୟ ଅପଡେଟ୍ ଯାଞ୍ଚ',
  },
  'Elevated Blood Pressure Alert': {
    hi: 'उच्च रक्तचाप चेतावनी',
    or: 'ଉଚ୍ଚ ରକ୍ତଚାପ ଚେତାବନୀ',
  },
  'Clinical Assessment Flagged': {
    hi: 'नैदानिक मूल्यांकन चिह्नित',
    or: 'ଡାକ୍ତରୀ ଆକଳନ ଚିହ୍ନଟ',
  },
  'Missed Antenatal Checkup': {
    hi: 'छूटी हुई प्रसवपूर्व जांच',
    or: 'ଅନୁପସ୍ଥିତ ପ୍ରସବପୂର୍ବ ଯାଞ୍ଚ',
  },
  'Priority Follow-up Flag': {
    hi: 'प्राथमिकता फॉलो-अप फ्लैग',
    or: 'ପ୍ରାଥମିକତା ଫଲୋ-ଅପ୍',
  },

  // 9. Server API & Error Messages
  'Clinical input validation failed.': {
    hi: 'नैदानिक इनपुट सत्यापन विफल रहा।',
    or: 'ଡାକ୍ତରୀ ତଥ୍ୟ ଯାଞ୍ଚ ବିଫଳ ହେଲା।',
  },
  'Failed to process ML risk screening prediction.': {
    hi: 'मशीन लर्निंग जोखिम स्क्रीनिंग प्रक्रिया विफल रही।',
    or: 'ମେସିନ୍ ଲର୍ଣ୍ଣିଂ ବିପଦ ଆକଳନ ବିଫଳ ହେଲା।',
  },
  'No unlinked maternal record found matching the provided MCP Card Number and Date of Birth.': {
    hi: 'प्रदत्त एमसीपी कार्ड संख्या और जन्म तिथि से मेल खाता कोई असंबद्ध रिकॉर्ड नहीं मिला।',
    or: 'ଦିଆଯାଇଥିବା ଏମସିପି କାର୍ଡ଼ ନମ୍ବର ଏବଂ ଜନ୍ମ ତାରିଖ ସହିତ କୌଣସି ରେକର୍ଡ ମିଳିଲା ନାହିଁ।',
  },
  'Invalid staff code or password.': {
    hi: 'अमान्य स्टाफ कोड या पासवर्ड।',
    or: 'ଅବୈଧ ଷ୍ଟାଫ୍ କୋଡ୍ କିମ୍ବା ପାସୱାର୍ଡ।',
  },
  'Missing required credentials.': {
    hi: 'आवश्यक क्रेडेंशियल्स अनुपलब्ध हैं।',
    or: 'ଆବଶ୍ୟକ ତଥ୍ୟ ଅନୁପସ୍ଥିତ ଅଛି।',
  },
};

/**
 * Synchronous localizer for dynamic content.
 * Checks:
 * 1. Explicit entity translation metadata (entity.translations?.[fieldKey]?.[lang])
 * 2. Static curated clinical dictionary
 * 3. Pattern / Name / Number localized replacements
 */
export function localizeDynamicText(
  text: string | null | undefined,
  lang: Language,
  entityTranslations?: { en?: string; hi?: string; or?: string } | null
): string {
  if (!text) return '';
  if (lang === 'en') return text;

  // 1. Explicit entity translation if provided
  if (entityTranslations && entityTranslations[lang]) {
    return toLocalizedNumerals(toLocalizedName(entityTranslations[lang]!, lang), lang);
  }

  const clean = text.trim();

  // 2. Direct dictionary match
  if (DYNAMIC_CLINICAL_DICTIONARY[clean]) {
    const entry = DYNAMIC_CLINICAL_DICTIONARY[clean];
    const translated = entry[lang] || clean;
    return toLocalizedNumerals(toLocalizedName(translated, lang), lang);
  }

  // 3. Substring matching for compound observations / alert descriptions
  let translatedText = clean;
  let matched = false;

  for (const [enKey, dict] of Object.entries(DYNAMIC_CLINICAL_DICTIONARY)) {
    if (translatedText.includes(enKey)) {
      translatedText = translatedText.replace(new RegExp(enKey, 'g'), dict[lang] || enKey);
      matched = true;
    }
  }

  if (matched) {
    return toLocalizedNumerals(toLocalizedName(translatedText, lang), lang);
  }

  // 4. Default: Localize names and numerals in the original text without mutating meaning
  return toLocalizedNumerals(toLocalizedName(clean, lang), lang);
}

/**
 * Helper to localize an entity field with backward-compatibility.
 */
export function localizeField<T extends Record<string, any>>(
  entity: T | null | undefined,
  fieldKey: keyof T,
  lang: Language
): string {
  if (!entity) return '';
  const val = entity[fieldKey];
  if (typeof val !== 'string') return String(val || '');

  const explicitTranslations = (entity as any)?.translations?.[fieldKey as string];
  return localizeDynamicText(val, lang, explicitTranslations);
}

/**
 * Asynchronously retrieve translation with offline IndexedDB fallback.
 */
export async function getOrFetchTranslation(
  text: string,
  targetLang: Language
): Promise<string> {
  if (!text || targetLang === 'en') return text;

  // 1. Check synchronous dictionary
  const syncMatch = localizeDynamicText(text, targetLang);
  if (syncMatch !== text) {
    return syncMatch;
  }

  // 2. Check IndexedDB cache
  try {
    const cached = await getCachedTranslation(text, targetLang);
    if (cached) return cached;
  } catch {
    // continue
  }

  // 3. If online, attempt server-side translation proxy
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.translatedText) {
          await saveCachedTranslation(text, targetLang, data.translatedText);
          return data.translatedText;
        }
      }
    } catch {
      // offline fallback
    }
  }

  return toLocalizedNumerals(toLocalizedName(text, targetLang), targetLang);
}
