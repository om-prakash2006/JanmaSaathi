import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS, Language, CLINICAL_GLOSSARY } from '../i18n/translations';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  getGlossaryTerm: (termKey: keyof typeof CLINICAL_GLOSSARY) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = 'janmasaathi_lang_v4';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANG_STORAGE_KEY) as Language;
      if (stored && ['en', 'hi', 'or'].includes(stored)) {
        return stored;
      }
    }
    return 'en';
  });

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    }

    // If authenticated in Firebase, persist language preference in Firestore user profile
    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          languagePreference: lang,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Language preference sync notice:', err);
      }
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let template = TRANSLATIONS[language]?.[key] || TRANSLATIONS.en?.[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        template = template.replace(new RegExp(`{\\s*${paramKey}\\s*}`, 'g'), String(value));
      });
    }

    return template;
  };

  const getGlossaryTerm = (termKey: keyof typeof CLINICAL_GLOSSARY): string => {
    const entry = CLINICAL_GLOSSARY[termKey];
    if (!entry) return String(termKey);
    return entry[language] || entry.en;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getGlossaryTerm }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
