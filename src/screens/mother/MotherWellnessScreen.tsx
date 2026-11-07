import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';

interface MotherWellnessScreenProps {
  onNavigateToConnect: () => void;
  onOpenProfile?: () => void;
}

export const MotherWellnessScreen: React.FC<MotherWellnessScreenProps> = ({
  onNavigateToConnect,
}) => {
  const { mothers, appointments } = useData();
  const { t, language, formatName, formatNumber, localize } = useLanguage();
  const mother = mothers[0]; // Priya Sharma (verified maternal record)
  const nextAppt = appointments.find((a) => a.motherId === mother?.id) || appointments[0];

  // Hydration state
  const [waterGlasses, setWaterGlasses] = useState<number>(() => {
    const saved = localStorage.getItem('janmasaathi_water_glasses');
    return saved ? parseInt(saved, 10) : 5;
  });
  const [waterReminderEnabled, setWaterReminderEnabled] = useState(true);

  const targetGlasses = 8;

  const handleUpdateGlasses = (delta: number) => {
    setWaterGlasses((prev) => {
      const next = Math.max(0, Math.min(12, prev + delta));
      localStorage.setItem('janmasaathi_water_glasses', String(next));
      return next;
    });
  };

  // Breathing exercise state (4s in, 4s out)
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'in' | 'out'>('in');
  const [breathingCountdown, setBreathingCountdown] = useState(4);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBreathingActive) {
      timer = setInterval(() => {
        setBreathingCountdown((prev) => {
          if (prev <= 1) {
            setBreathingPhase((phase) => (phase === 'in' ? 'out' : 'in'));
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathingCountdown(4);
      setBreathingPhase('in');
    }
    return () => clearInterval(timer);
  }, [isBreathingActive]);

  // Motivational messages collection
  const motivationalMessages = [
    {
      en: 'You are doing something beautiful. Take care of yourself, one day at a time.',
      hi: 'आप एक सुंदर और पावन कार्य कर रही हैं। एक समय में एक दिन, अपना और अपने शिशु का पूरा ध्यान रखें।',
      or: 'ଆପଣ ଏକ ସୁନ୍ଦର କାର୍ଯ୍ୟ କରୁଛନ୍ତି। ପ୍ରତିଦିନ ନିଜର ଏବଂ ନିଜ ଶିଶୁର ସମ୍ପୂର୍ଣ୍ଣ ଯତ୍ନ ନିଅନ୍ତୁ।',
    },
    {
      en: 'Every quiet moment of rest is a gentle gift of nourishment to your growing baby.',
      hi: 'विश्राम का प्रत्येक शांत क्षण आपके बढ़ते शिशु के लिए पोषण और शक्ति का उपहार है।',
      or: 'ବିଶ୍ରାମର ପ୍ରତ୍ୟେକ ଶାନ୍ତ ମୁହୂର୍ତ୍ତ ଆପଣଙ୍କ ବଢ଼ୁଥିବା ଶିଶୁ ପାଇଁ ପୁଷ୍ଟିକର ଉପହାର।',
    },
    {
      en: 'Trust your body, honor your pace, and celebrate the miracle you are carrying.',
      hi: 'अपने शरीर पर विश्वास रखें, अपनी गति का सम्मान करें और इस मातृत्व का स्वागत करें।',
      or: 'ନିଜ ଶରୀର ଉପରେ ବିଶ୍ୱାସ ରଖନ୍ତୁ, ନିଜ ଗତିକୁ ସମ୍ମାନ ଦିଅନ୍ତୁ ଏବଂ ଏହି ମାତୃତ୍ୱକୁ ଆଦର କରନ୍ତୁ।',
    },
    {
      en: 'You are strong, capable, and surrounded by care. Remember to be gentle with yourself today.',
      hi: 'आप समर्थ, सशक्त और स्नेह से घिरी हुई हैं। आज स्वयं के प्रति विनम्र और सहज रहें।',
      or: 'ଆପଣ ସମର୍ଥ, ଦୃଢ଼ ଏବଂ ସମସ୍ତଙ୍କ ସ୍ନେହରେ ଘେରି ରହିଛନ୍ତି। ଆଜି ନିଜ ପ୍ରତି କୋମଳ ରୁହନ୍ତୁ।',
    },
  ];

  const [motivationIndex, setMotivationIndex] = useState(0);

  const handleNextMotivation = () => {
    setMotivationIndex((prev) => (prev + 1) % motivationalMessages.length);
  };

  // Quick Resources Modal state
  const [activeResourceModal, setActiveResourceModal] = useState<string | null>(null);

  // Gestational calculation
  const currentWeek = mother?.gestationalAgeWeeks ?? 24;
  const currentDays = mother?.gestationalAgeDays ?? 2;
  const totalDays = 280;
  const daysElapsed = Math.min(totalDays, currentWeek * 7 + currentDays);
  const progressPercent = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

  return (
    <div className="flex flex-col w-full space-y-space-xl pb-24 font-sans text-on-surface">
      {/* 1. Header & Screen Identity */}
      <section className="flex flex-col pt-space-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-2xl" style={{ fontVariationSettings: '"FILL" 1' }}>
            favorite
          </span>
          <h1 className="font-serif text-2xl text-primary font-normal tracking-tight">
            {t('wellnessTitle')}
          </h1>
        </div>
        <p className="font-sans text-xs text-secondary mt-1">
          {t('wellnessSubtitle')}
        </p>
      </section>

      {/* 2. Personalized Pregnancy Overview */}
      <section className="bg-surface-container rounded-2xl p-space-lg border border-outline-variant/40 shadow-sm flex flex-col space-y-space-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-primary-container block">
              {t('pregnancyThisWeekTitle')}
            </span>
            <span className="font-serif text-xl font-bold text-on-surface mt-0.5 block">
              {t('weekLabel', { num: currentWeek })}
              {currentDays > 0 ? ` + ${currentDays}d` : ''}
            </span>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container inline-block">
              {t('trimesterLabel', { num: mother?.trimester ?? 2 })}
            </span>
            <span className="font-sans text-[11px] text-secondary block mt-1">
              {t('eddLabel')}: <strong className="text-on-surface">{mother?.edd ?? '18 Oct 2025'}</strong>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-secondary font-medium">
            <span>{t('dayOf280', { current: daysElapsed, total: totalDays })}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden p-0.5 border border-outline-variant/30">
            <div
              className="h-full bg-primary-container rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stage summary */}
        <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface space-y-1">
          <p className="leading-relaxed">
            {language === 'hi'
              ? 'सप्ताह २४ में आपके शिशु के कान और चेहरे की बनावट स्पष्ट हो रही है। शिशु आपकी आवाज़ सुन सकता है और पेट में सक्रिय हलचल महसूस होती है।'
              : language === 'or'
              ? '୨୪ତମ ସପ୍ତାହରେ ଆପଣଙ୍କ ଶିଶୁର ଶ୍ରବଣ ଶକ୍ତି ଓ ଚେହେରା ବିକଶିତ ହେଉଛି। ଶିଶୁ ଆପଣଙ୍କ ସ୍ୱର ଶୁଣିପାରୁଛି ଏବଂ ସକ୍ରିୟ ଚଳପ୍ରଚଳ ଅନୁଭବ ହେଉଛି।'
              : "At week 24, your baby's hearing and facial contours are developing steadily. Your baby responds to familiar voices, and distinct kicks and stretches can be felt."}
          </p>
        </div>
      </section>

      {/* 3. Pregnancy Guidance ("Know Your Pregnancy") */}
      <section className="bg-surface-container rounded-2xl p-space-lg border border-outline-variant/40 shadow-sm space-y-space-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[20px]">
            menu_book
          </span>
          <h2 className="font-serif text-lg font-bold text-on-surface">
            {t('knowYourPregnancyTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Common Pregnancy Changes */}
          <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1">
            <div className="flex items-center gap-2 text-primary-container font-semibold text-xs">
              <span className="material-symbols-outlined text-[16px]">accessibility_new</span>
              <span>
                {language === 'hi' ? 'सामान्य शारीरिक बदलाव' : language === 'or' ? 'ସାଧାରଣ ଶାରୀରିକ ପରିବର୍ତ୍ତନ' : 'Common Body Changes'}
              </span>
            </div>
            <p className="text-[12px] text-secondary leading-relaxed">
              {language === 'hi'
                ? 'पैरों में हल्का खिंचाव, पीठ में हल्का दबाव और ऊर्जा स्तर में बदलाव सामान्य हैं। खड़े रहने के बाद आराम करें और आरामदायक जूते पहनें।'
                : language === 'or'
                ? 'ଗୋଡ଼ରେ ସାମାନ୍ୟ ଟାଣ ଲାଗିବା, ପିଠିରେ ସାମାନ୍ୟ ଚାପ ସ୍ୱାଭାବିକ। ଅଧିକ ସମୟ ଠିଆ ନହୋଇ ବିଶ୍ରାମ ନିଅନ୍ତୁ।'
                : 'Mild ankle puffiness after walking, mild lower back pressure, and shifting center of gravity are typical. Rest with elevated feet when possible.'}
            </p>
          </div>

          {/* Fetal Development */}
          <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1">
            <div className="flex items-center gap-2 text-primary-container font-semibold text-xs">
              <span className="material-symbols-outlined text-[16px]">child_care</span>
              <span>
                {language === 'hi' ? 'गर्भस्थ शिशु का विकास' : language === 'or' ? 'ଗର୍ଭସ୍ଥ ଶିଶୁର ବିକାଶ' : 'Fetal Development'}
              </span>
            </div>
            <p className="text-[12px] text-secondary leading-relaxed">
              {language === 'hi'
                ? 'शिशु की त्वचा पर कोमल रोएं बन रहे हैं और फेफड़ों का शुरुआती विकास हो रहा है। शिशु दिन में सोने और जागने का नियमित क्रम बनाता है।'
                : language === 'or'
                ? 'ଶିଶୁର ଚର୍ମ ଏବଂ ଫୁସଫୁସର ପ୍ରାରମ୍ଭିକ ବିକାଶ ଚାଲିଛି। ଶିଶୁ ନିୟମିତ ଶୋଇବା ଓ ଜାଗ୍ରତ ରହିବାର ସମୟ ଗଢ଼ିଥାଏ।'
                : 'Rapid brain maturation and lung surfactant preparation continue. Your baby develops subtle sleep and waking cycles throughout the day.'}
            </p>
          </div>

          {/* ANC Checkup Guidance */}
          <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1">
            <div className="flex items-center gap-2 text-primary-container font-semibold text-xs">
              <span className="material-symbols-outlined text-[16px]">event_available</span>
              <span>
                {language === 'hi' ? 'प्रसवपूर्व जांच (ANC) सलाह' : language === 'or' ? 'ପ୍ରସବପୂର୍ବ ପରୀକ୍ଷା (ANC) ପରାମର୍ଶ' : 'Antenatal Checkup Guidance'}
              </span>
            </div>
            <p className="text-[12px] text-secondary leading-relaxed">
              {language === 'hi'
                ? 'नियमित रक्तचाप, हीमोग्लोबिन स्तर और फंडल ऊंचाई की माप अनिवार्य है। अपने उप-स्वास्थ्य केंद्र पर अगली जांच के लिए समय पर उपस्थित हों।'
                : language === 'or'
                ? 'ନିୟମିତ ରକ୍ତଚାପ, ହିମୋଗ୍ଲୋବିନ୍ ମାପ ଏବଂ ଫଣ୍ଡାଲ୍ ଉଚ୍ଚତା ପରୀକ୍ଷା ଜରୁରୀ। ଉପ-ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରରେ ସମୟ ମୁତାବକ ପହଞ୍ଚନ୍ତୁ।'
                : 'Blood pressure, weight, maternal hemoglobin, and symphysis-fundal height checks confirm healthy progression. Keep your MCP card handy for every visit.'}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-secondary italic">
          {t('educationalDisclaimer')}
        </p>
      </section>

      {/* 4. Nutrition & Diet ("Nutrition & Healthy Eating") */}
      <section className="bg-surface-container rounded-2xl p-space-lg border border-outline-variant/40 shadow-sm space-y-space-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[20px]">
            restaurant
          </span>
          <h2 className="font-serif text-lg font-bold text-on-surface">
            {t('nutritionTitle')}
          </h2>
        </div>

        {/* Sub-A: Foods to Include */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-primary-container uppercase tracking-wide flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            {t('foodsToInclude')}
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
              <strong className="text-on-surface block text-[12px]">
                {language === 'hi' ? 'आयरन व पत्तेदार सब्जियां' : language === 'or' ? 'ଲୌହଯୁକ୍ତ ଶାଗ ଓ ପନିପରିବା' : 'Iron & Greens'}
              </strong>
              <span className="text-[11px] text-secondary block mt-0.5">
                {language === 'hi' ? 'पालक, सहजन पत्ते, गुड़, भुना चना' : language === 'or' ? 'ପାଳଙ୍ଗ, ସଜନା ଶାଗ, ଗୁଡ଼, ବୁଟ' : 'Spinach, moringa, jaggery, chana'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
              <strong className="text-on-surface block text-[12px]">
                {language === 'hi' ? 'प्रोटीन व दालें' : language === 'or' ? 'ପୁଷ୍ଟିସାର ଓ ଡାଲି' : 'Protein & Lentils'}
              </strong>
              <span className="text-[11px] text-secondary block mt-0.5">
                {language === 'hi' ? 'अरहर/मूंग दाल, राजमा, अंडा, पनीर' : language === 'or' ? 'ହରଡ଼/ମୁଗ ଡାଲି, ଅଣ୍ଡା, ଛେନା' : 'Moong/arhar dal, eggs, fresh paneer'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
              <strong className="text-on-surface block text-[12px]">
                {language === 'hi' ? 'कैल्शियम व डेयरी' : language === 'or' ? 'କ୍ୟାଲସିୟମ୍ ଓ କ୍ଷୀରଜାତ' : 'Calcium & Dairy'}
              </strong>
              <span className="text-[11px] text-secondary block mt-0.5">
                {language === 'hi' ? 'उबला दूध, ताजा दही, रागी की रोटी' : language === 'or' ? 'ଫୁଟା କ୍ଷୀର, ସତେଜ ଦହି, ମାଣ୍ଡିଆ' : 'Boiled milk, fresh curd, ragi'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
              <strong className="text-on-surface block text-[12px]">
                {language === 'hi' ? 'ताजे मौसमी फल' : language === 'or' ? 'ସତେଜ ଋତୁକାଳୀନ ଫଳ' : 'Fresh Fruits'}
              </strong>
              <span className="text-[11px] text-secondary block mt-0.5">
                {language === 'hi' ? 'अमरूद, संतरा, सेब, केला' : language === 'or' ? 'ପିଜୁଳି, କମଳା, ସେଓ, କଦଳୀ' : 'Guava, oranges, apples, bananas'}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-B: Foods to Avoid or Limit */}
        <div className="space-y-2 pt-2 border-t border-outline-variant/30">
          <span className="text-xs font-bold text-error uppercase tracking-wide flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            {t('foodsToAvoid')}
          </span>
          <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1.5 text-xs text-secondary">
            <div className="flex items-start gap-2">
              <span className="text-error font-bold">•</span>
              <span>
                {language === 'hi'
                  ? 'कच्चा या अधपका अंडा, मांस अथवा मछली का सेवन न करें।'
                  : language === 'or'
                  ? 'କଞ୍ଚା ବା ଅର୍ଦ୍ଧରନ୍ଧା ଅଣ୍ଡା, ମାଂସ ବା ମାଛ ଖାଆନ୍ତୁ ନାହିଁ।'
                  : 'Raw or undercooked eggs, poultry, meat, and unpasteurized raw milk.'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-error font-bold">•</span>
              <span>
                {language === 'hi'
                  ? 'असुरक्षित खुला भोजन, बासी खाना और अस्वच्छ पानी से बचें।'
                  : language === 'or'
                  ? 'ଅସ୍ୱାସ୍ଥ୍ୟକର ଖୋଲା ଖାଦ୍ୟ, ବାସି ଖାଦ୍ୟ ଓ ଅପରିଷ୍କାର ପାଣିରୁ ଦୂରେଇ ରୁହନ୍ତୁ।'
                  : 'Unsafe street foods, unwashed raw vegetables, and unboiled drinking water.'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-error font-bold">•</span>
              <span>
                {language === 'hi'
                  ? 'चाय या कॉफी का अत्यधिक सेवन न करें (दिन में १ कप तक सीमित रखें)।'
                  : language === 'or'
                  ? 'ଅତ୍ୟଧିକ ଚା’ ବା କଫି ପିଅନ୍ତୁ ନାହିଁ (ଦିନକୁ ୧ କପ୍ ମଧ୍ୟରେ ସୀମିତ ରଖନ୍ତୁ)।'
                  : 'Excessive caffeine; limit strong tea or coffee to at most one cup daily.'}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-C: Daily Nutrition Tips */}
        <div className="p-3 rounded-xl bg-secondary-container/40 border border-outline-variant/30 space-y-1 text-xs">
          <span className="font-bold text-on-surface block">{t('dailyNutritionTips')}</span>
          <p className="text-secondary leading-relaxed">
            {language === 'hi'
              ? 'एक साथ भारी भोजन के बजाय दिन भर में थोड़े-थोड़े अंतराल पर पौष्टिक आहार लें। खाना पकाने व खाने से पहले साबुन से हाथ धोएं। अपने डॉक्टर द्वारा दी गई आयरन व कैल्शियम की गोलियां समय पर लें।'
              : language === 'or'
              ? 'ଏକାବେଳକେ ଅଧିକ ଖାଇବା ପରିବର୍ତ୍ତେ ଦିନସାରା ଅଳ୍ପ ଅଳ୍ପ ପୁଷ୍ଟିକର ଖାଦ୍ୟ ଖାଆନ୍ତୁ। ଖାଇବା ପୂର୍ବରୁ ସାବୁନରେ ହାତ ଧୁଅନ୍ତୁ। ନିର୍ଦ୍ଧାରିତ ଔଷଧ ସମୟରେ ନିଅନ୍ତୁ।'
              : 'Eat smaller, frequent nourishing meals rather than heavy portions. Maintain strict hand hygiene before preparation, and consume freshly cooked warm foods.'}
          </p>
        </div>
      </section>

      {/* 5. Daily Wellness ("Take Care of Yourself") */}
      <section className="bg-surface-container rounded-2xl p-space-lg border border-outline-variant/40 shadow-sm space-y-space-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[20px]">
            spa
          </span>
          <h2 className="font-serif text-lg font-bold text-on-surface">
            {t('takeCareTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {/* Category 1: Hydration */}
          <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface">
                <span className="material-symbols-outlined text-primary-container text-[18px]">water_drop</span>
                <span>{t('hydrationCategory')}</span>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={waterReminderEnabled}
                  onChange={(e) => setWaterReminderEnabled(e.target.checked)}
                  className="rounded text-primary-container focus:ring-0"
                />
                <span>{t('waterReminderToggle')}</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-secondary">
                {t('waterGlassesLogged', { count: waterGlasses, total: targetGlasses })}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateGlasses(-1)}
                  className="w-7 h-7 rounded-lg bg-surface-container border border-outline-variant text-xs font-bold flex items-center justify-center hover:bg-surface-container-high transition-colors"
                  aria-label="Decrease water glass count"
                >
                  -
                </button>
                <span className="text-xs font-bold text-primary-container px-2">
                  {waterGlasses}
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdateGlasses(1)}
                  className="w-7 h-7 rounded-lg bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center hover:opacity-95 shadow-2xs"
                  aria-label="Increase water glass count"
                >
                  +
                </button>
              </div>
            </div>

            {/* Glasses Visual Dots */}
            <div className="flex gap-1.5 pt-1">
              {Array.from({ length: targetGlasses }).map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    idx < waterGlasses ? 'bg-primary-container' : 'bg-surface-container-high'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Category 2: Rest & Sleep */}
          <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-on-surface">
              <span className="material-symbols-outlined text-primary-container text-[18px]">bedtime</span>
              <span>{t('restSleepCategory')}</span>
            </div>
            <p className="text-secondary leading-relaxed mt-1">
              {language === 'hi'
                ? 'बाईं करवट (Left Side) सोना गर्भ में शिशु के रक्त संचार के लिए सर्वोत्तम है। घुटनों के बीच तकिया रखें और दोपहर में कम से कम ३०-४५ मिनट विश्राम अवश्य करें।'
                : language === 'or'
                ? 'ବାମ ପାଖକୁ ଶୋଇବା ଗର୍ଭସ୍ଥ ଶିଶୁର ରକ୍ତ ସଞ୍ଚାଳନ ପାଇଁ ଉତ୍ତମ। ଆଣ୍ଠୁ ମଝିରେ ତକିଆ ରଖନ୍ତୁ ଏବଂ ଦିନବେଳା ଅତିକମରେ ୩୦-୪୫ ମିନିଟ୍ ବିଶ୍ରାମ ନିଅନ୍ତୁ।'
                : 'Sleeping on your left side optimizes placental blood flow and kidney filtration. Support your abdomen and knees with pillows for comfortable spinal alignment.'}
            </p>
          </div>

          {/* Category 3: Physical Activity */}
          <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-on-surface">
              <span className="material-symbols-outlined text-primary-container text-[18px]">directions_walk</span>
              <span>{t('physicalActivityCategory')}</span>
            </div>
            <p className="text-secondary leading-relaxed mt-1">
              {language === 'hi'
                ? 'प्रतिदिन २०-३० मिनट सामान्य गति से टहलना पाचन और रक्तचाप को संतुलित रखता है। भारी वजन उठाने या झटकेदार गतिविधियों से पूरी तरह बचें।'
                : language === 'or'
                ? 'ପ୍ରତିଦିନ ୨୦-୩୦ ମିନିଟ୍ ଧୀରେ ଧୀରେ ଚାଲିବା ସ୍ୱାସ୍ଥ୍ୟ ପାଇଁ ଲାଭଦାୟକ। ଭାରୀ ଜିନିଷ ଉଠାନ୍ତୁ ନାହିଁ ଏବଂ ଅତ୍ୟଧିକ ପରିଶ୍ରମରୁ ନିବୃତ୍ତ ରୁହନ୍ତୁ।'
                : 'Gentle, unhurried 20–30 minute walks improve circulation and digestion. Wear supportive footwear, stay hydrated, and strictly avoid heavy lifting.'}
            </p>
          </div>

          {/* Category 4: Mental Wellbeing & Interactive 4-4 Breathing */}
          <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-on-surface">
                <span className="material-symbols-outlined text-primary-container text-[18px]">self_improvement</span>
                <span>{t('mentalWellbeingCategory')}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className="px-2.5 py-1 rounded-lg bg-secondary-container text-on-secondary-container font-semibold text-[11px] hover:opacity-95 transition-all"
              >
                {isBreathingActive ? t('pauseBreathing') : t('startBreathing')}
              </button>
            </div>

            <p className="text-secondary leading-relaxed">
              {language === 'hi'
                ? 'गर्भावस्था में मन में चिंता या भावुकता आना स्वाभाविक है। परिवार और अपनी स्वास्थ्य कार्यकर्ता से अपनी भावनाएं साझा करें।'
                : language === 'or'
                ? 'ଗର୍ଭାବସ୍ଥାରେ ମନରେ ଭାବପ୍ରବଣତା ଆସିବା ସ୍ୱାଭାବିକ। ନିଜ ପରିବାର ଓ ସ୍ୱାସ୍ଥ୍ୟ କର୍ମୀଙ୍କ ସହ ଖୋଲାଖୋଲି କଥା ହୁଅନ୍ତୁ।'
                : 'Emotional fluctuations during pregnancy are completely normal. Share your feelings openly with your health worker and loved ones.'}
            </p>

            {/* Interactive Calm Breathing Indicator */}
            {isBreathingActive && (
              <div className="p-3 rounded-xl bg-secondary-container/20 border border-outline-variant/40 flex flex-col items-center justify-center space-y-2 animate-in fade-in duration-200">
                <span className="font-sans text-xs font-bold text-primary-container">
                  {t('calmBreathingTitle')}
                </span>
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-surface-container border-2 border-primary-container/40">
                  <div
                    className={`w-14 h-14 rounded-full bg-primary-container/20 flex items-center justify-center transition-transform duration-1000 ${
                      breathingPhase === 'in' ? 'scale-125' : 'scale-90'
                    }`}
                  >
                    <span className="font-serif text-lg font-bold text-primary-container">
                      {breathingCountdown}s
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-on-surface animate-pulse">
                  {breathingPhase === 'in' ? t('breatheIn') : t('breatheOut')}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Health Alerts & Important Reminders */}
      <section className="bg-surface-container rounded-2xl p-space-lg border border-outline-variant/40 shadow-sm space-y-space-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[20px]">
            notifications_active
          </span>
          <h2 className="font-serif text-lg font-bold text-on-surface">
            {t('healthAlertsTitle')}
          </h2>
        </div>

        {/* Scheduled Checkup Card */}
        {nextAppt && (
          <div className="p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary-container flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                {t('nextAppointment')}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container text-on-secondary-container">
                {t('statusScheduled')}
              </span>
            </div>
            <p className="text-xs font-bold text-on-surface">
              {localize(nextAppt.title, nextAppt.translations?.title)} • {formatNumber(nextAppt.date)} ({formatNumber(nextAppt.time)})
            </p>
            <p className="text-[11px] text-secondary">
              {localize(nextAppt.facility, nextAppt.translations?.facility)} • {t('yourHealthWorker')}: {formatName(mother?.assignedWorkerName ?? 'Sunita Devi')}
            </p>
          </div>
        )}

        {/* Danger Signs Awareness Box */}
        <div className="p-3.5 rounded-xl bg-error-container/25 border border-error/30 space-y-2">
          <div className="flex items-center gap-1.5 text-error font-bold text-xs">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <span>
              {language === 'hi' ? 'खतरे के लक्षण — तत्काल ध्यान दें' : language === 'or' ? 'ବିପଦ ଲକ୍ଷଣ — ତୁରନ୍ତ ଧ୍ୟାନ ଦିଅନ୍ତୁ' : 'Danger Signs — Immediate Attention'}
            </span>
          </div>
          <p className="text-[11px] text-on-surface leading-relaxed">
            {language === 'hi'
              ? 'योनि से रक्तस्राव, तेज सिरदर्द, आंखों में धुंधलापन, चेहरे पर अचानक अत्यधिक सूजन, तीव्र पेट दर्द, तेज बुखार अथवा शिशु की हलचल में अचानक कमी होने पर बिना देर किए तुरंत अस्पताल जाएं।'
              : language === 'or'
              ? 'ରକ୍ତସ୍ରାବ, ପ୍ରବଳ ମୁଣ୍ଡବିନ୍ଧା, ଆଖିକୁ ଝାପସା ଦେଖାଯିବା, ମୁହଁରେ ହଠାତ୍ ଅତ୍ୟଧିକ ଫୁଲା, ପ୍ରବଳ ପେଟବିନ୍ଧା କିମ୍ବା ଶିଶୁର ଚଳପ୍ରଚଳ କମିଗଲେ ତୁରନ୍ତ ଡାକ୍ତରଖାନା ଯାଆନ୍ତୁ।'
              : 'Vaginal bleeding, severe persistent headache, visual disturbances, severe abdominal pain, high fever, or noticeably reduced fetal movements require immediate clinical evaluation.'}
          </p>
          <div className="pt-1 flex items-center gap-2">
            <a
              href="tel:102"
              className="flex-1 py-1.5 px-3 rounded-lg bg-error text-on-error text-center font-bold text-xs shadow-xs hover:opacity-95"
            >
              {t('call102')}
            </a>
            <button
              type="button"
              onClick={onNavigateToConnect}
              className="flex-1 py-1.5 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-center font-semibold text-xs text-on-surface hover:bg-surface-container-high transition-colors"
            >
              {t('askHealthWorker')}
            </button>
          </div>
        </div>
      </section>

      {/* 7. Daily Motivation ("A Little Reminder for You") */}
      <section className="bg-gradient-to-br from-surface-container-high via-surface-container to-secondary-container/30 rounded-2xl p-space-lg border border-outline-variant/40 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary-container text-[20px]">
              sentiment_satisfied
            </span>
            <span className="font-serif text-base font-bold text-on-surface">
              {t('dailyMotivationTitle')}
            </span>
          </div>
          <button
            type="button"
            onClick={handleNextMotivation}
            className="text-[11px] font-semibold text-primary-container hover:underline flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            <span>{t('newMotivationBtn')}</span>
          </button>
        </div>

        <blockquote className="font-serif text-sm sm:text-base italic text-on-surface leading-relaxed p-3 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30">
          “{motivationalMessages[motivationIndex][language] || motivationalMessages[motivationIndex].en}”
        </blockquote>
      </section>

      {/* 8. Wellness Quick Resources */}
      <section className="bg-surface-container rounded-2xl p-space-lg border border-outline-variant/40 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container text-[20px]">
            library_books
          </span>
          <h2 className="font-serif text-lg font-bold text-on-surface">
            {t('quickResourcesTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {[
            {
              id: 'nutrition',
              title: t('nutritionGuideTitle'),
              desc: language === 'hi' ? 'दैनिक संतुलित थाली व पोषक तत्व' : language === 'or' ? 'ଦୈନନ୍ଦିନ ସନ୍ତୁଳିତ ଖାଦ୍ୟ ଓ ପୁଷ୍ଟିକର ଉପାଦାନ' : 'Daily balanced plate and vital nutrients',
              icon: 'nutrition',
            },
            {
              id: 'safety',
              title: t('safetyGuideTitle'),
              desc: language === 'hi' ? 'सुरक्षित यात्रा, स्वच्छता व सावधानियां' : language === 'or' ? 'ସୁରକ୍ଷିତ ଯାତ୍ରା, ସ୍ୱଚ୍ଛତା ଓ ସତର୍କତା' : 'Safe travel, hygiene, and everyday precautions',
              icon: 'health_and_safety',
            },
            {
              id: 'antenatal',
              title: t('antenatalCareGuideTitle'),
              desc: language === 'hi' ? '४ अनिवार्य प्रसवपूर्व जांचों का कैलेंडर' : language === 'or' ? '୪ଟି ବାଧ୍ୟତାମୂଳକ ପ୍ରସବପୂର୍ବ ପରୀକ୍ଷାର କ୍ୟାଲେଣ୍ଡର' : '4 mandatory ANC checkups schedule',
              icon: 'clinical_notes',
            },
            {
              id: 'mental',
              title: t('mentalWellbeingTipsTitle'),
              desc: language === 'hi' ? 'तनाव मुक्ति, ध्यान और पारिवारिक सहयोग' : language === 'or' ? 'ଚାପ ମୁକ୍ତି, ଧ୍ୟାନ ଓ ପାରିବାରିକ ସହଯୋଗ' : 'Stress relief, mindfulness, and family support',
              icon: 'psychology',
            },
          ].map((res) => (
            <button
              key={res.id}
              type="button"
              onClick={() => setActiveResourceModal(res.id)}
              className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between text-left hover:border-primary-container/60 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-primary-container text-[20px]">
                  {res.icon}
                </span>
                <div>
                  <span className="font-sans text-xs font-bold text-on-surface block">{res.title}</span>
                  <span className="font-sans text-[11px] text-secondary">{res.desc}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-secondary text-[18px]">
                chevron_right
              </span>
            </button>
          ))}

          {/* Quick contact direct link */}
          <button
            type="button"
            onClick={onNavigateToConnect}
            className="w-full p-3 rounded-xl bg-primary-container/10 border border-primary-container/30 flex items-center justify-between text-left hover:bg-primary-container/15 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary-container text-[20px]">
                chat
              </span>
              <div>
                <span className="font-sans text-xs font-bold text-primary-container block">{t('contactHealthWorkerBtn')}</span>
                <span className="font-sans text-[11px] text-secondary">
                  {formatName(mother?.assignedWorkerName ?? 'Sunita Devi')} • {localize('Rampur Sub-Centre')}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary-container text-[18px]">
              arrow_forward
            </span>
          </button>
        </div>
      </section>

      {/* Resource Modal Dialog */}
      {activeResourceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-5 border border-outline-variant shadow-xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <h3 className="font-serif text-lg font-bold text-primary">
                {activeResourceModal === 'nutrition' && t('nutritionGuideTitle')}
                {activeResourceModal === 'safety' && t('safetyGuideTitle')}
                {activeResourceModal === 'antenatal' && t('antenatalCareGuideTitle')}
                {activeResourceModal === 'mental' && t('mentalWellbeingTipsTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setActiveResourceModal(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="text-xs text-on-surface space-y-2.5 leading-relaxed">
              {activeResourceModal === 'nutrition' && (
                <>
                  <p>
                    {language === 'hi'
                      ? 'गर्भावस्था में संतुलित थाली में हरी सब्जियां, दालें, दूध/दही और साबुत अनाज शामिल करें। भोजन में आयोडीन युक्त नमक का प्रयोग करें। चाय और कॉफी को सीमित करें।'
                      : language === 'or'
                      ? 'ସନ୍ତୁଳିତ ଖାଦ୍ୟରେ ସବୁଜ ପନିପରିବା, ଡାଲି, କ୍ଷୀର/ଦହି ଏବଂ ଶସ୍ୟ ସାମିଲ କରନ୍ତୁ। ଆୟୋଡିନ୍ ଯୁକ୍ତ ଲୁଣ ବ୍ୟବହାର କରନ୍ତୁ। ଚା’ ଏବଂ କଫି କମ୍ କରନ୍ତୁ।'
                      : 'A balanced pregnancy plate comprises colorful local vegetables, lentils, dairy, and whole grains. Ensure consistent hydration and take prescribed iron-folic acid daily after food.'}
                  </p>
                  <p className="text-secondary italic">
                    {t('educationalDisclaimer')}
                  </p>
                </>
              )}

              {activeResourceModal === 'safety' && (
                <>
                  <p>
                    {language === 'hi'
                      ? 'यात्रा के दौरान अत्यधिक झटकों वाली सड़कों से बचें। आरामदेह फ्लैट चप्पल पहनें। बिना डॉक्टर की सलाह के कोई भी दवा या दर्द निवारक न लें।'
                      : language === 'or'
                      ? 'ଯାତ୍ରା ସମୟରେ ଖାଲଖମା ରାସ୍ତା ଏଡ଼ାନ୍ତୁ। ସୁବିଧାଜନକ ଚପଲ ପିନ୍ଧନ୍ତୁ। ଡାକ୍ତରଙ୍କ ପରାମର୍ଶ ବିନା କୌଣସି ଔଷଧ ଖାଆନ୍ତୁ ନାହିଁ।'
                      : 'Avoid rough transport routes and sudden jolts. Wear supportive flat footwear. Never self-administer medications without clinician authorization.'}
                  </p>
                  <p className="text-secondary italic">
                    {t('urgentCareNotice')}
                  </p>
                </>
              )}

              {activeResourceModal === 'antenatal' && (
                <>
                  <p>
                    {language === 'hi'
                      ? 'प्रसवपूर्व देखभाल (ANC) के ४ मुख्य चरण: पहली तिमाही में पंजीकरण व खून की जांच, दूसरी तिमाही में अल्ट्रासाउंड व टिटनेस टीका, तथा तीसरी तिमाही में नियमित रक्तचाप व शिशु की स्थिति की निगरानी।'
                      : language === 'or'
                      ? 'ପ୍ରସବପୂର୍ବ ଯତ୍ନ (ANC)ର ୪ଟି ପର୍ଯ୍ୟାୟ: ପ୍ରଥମ ତ୍ରୈମାସିକରେ ପଞ୍ଜୀକରଣ ଓ ରକ୍ତ ପରୀକ୍ଷା, ଦ୍ୱିତୀୟରେ ଅଲଟ୍ରାସାଉଣ୍ଡ ଓ ଟିଟି ଟିକା, ଏବଂ ତୃତୀୟରେ ନିୟମିତ ରକ୍ତଚାପ ନିରୀକ୍ଷଣ।'
                      : 'Key Antenatal Care stages ensure early detection of risks: registration & baseline blood work (ANC 1), ultrasound & tetanus immunization (ANC 2), and close blood pressure & fetal growth monitoring (ANC 3 & 4).'}
                  </p>
                </>
              )}

              {activeResourceModal === 'mental' && (
                <>
                  <p>
                    {language === 'hi'
                      ? 'गर्भावस्था में विश्राम, गहरी सांस और परिवार का स्नेह मन को शांत रखता है। यदि उदासी या अत्यधिक घबराहट महसूस हो, तो अपनी स्वास्थ्य कार्यकर्ता से निसंकोच बात करें।'
                      : language === 'or'
                      ? 'ବିଶ୍ରାମ, ଗଭୀର ଶ୍ୱାସକ୍ରିୟା ଏବଂ ପରିବାରର ସ୍ନେହ ମନକୁ ଶାନ୍ତ ରଖିଥାଏ। ଯଦି ଅଧିକ ଚିନ୍ତା ବା ଉଦାସୀନତା ଲାଗେ, ସ୍ୱାସ୍ଥ୍ୟ କର୍ମୀଙ୍କ ସହ କଥା ହୁଅନ୍ତୁ।'
                      : 'Daily calm breathing, open conversations with family, and recognizing that emotional vulnerability is natural help maintain mental wellness.'}
                  </p>
                </>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveResourceModal(null)}
                className="px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
