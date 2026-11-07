import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  TRANSLATIONS,
  Language,
  CLINICAL_GLOSSARY,
  toLocalizedNumerals,
  toLocalizedName,
} from '../i18n/translations';
import { localizeDynamicText, localizeField } from '../utils/dynamicLocalization';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  getGlossaryTerm: (termKey: keyof typeof CLINICAL_GLOSSARY) => string;
  formatNumber: (num: number | string) => string;
  formatName: (name: string) => string;
  localize: (text: string | null | undefined, entityTranslations?: { en?: string; hi?: string; or?: string } | null) => string;
  localizeField: <T extends Record<string, any>>(entity: T | null | undefined, fieldKey: keyof T) => string;
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

  // Synchronize language preference from Firestore when user logs in or switches account
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data?.languagePreference && ['en', 'hi', 'or'].includes(data.languagePreference)) {
              setLanguageState(data.languagePreference as Language);
              if (typeof window !== 'undefined') {
                localStorage.setItem(LANG_STORAGE_KEY, data.languagePreference);
              }
            }
          }
        } catch (err) {
          console.warn('Language preference load notice:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

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

  const formatNumber = (num: number | string): string => {
    return toLocalizedNumerals(num, language);
  };

  const formatName = (name: string): string => {
    return toLocalizedName(name, language);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let template = TRANSLATIONS[language]?.[key] || TRANSLATIONS.en?.[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        let valStr = String(value);

        // Localize numbers or names passed as parameters
        if (typeof value === 'number' || /^[0-9+.\-/]+$/.test(valStr)) {
          valStr = toLocalizedNumerals(valStr, language);
        } else {
          valStr = toLocalizedName(valStr, language);
        }

        template = template.replace(new RegExp(`{\\s*${paramKey}\\s*}`, 'g'), valStr);
      });
    }

    if (language !== 'en') {
      template = toLocalizedNumerals(template, language);
      template = toLocalizedName(template, language);
    }

    return template;
  };

  const getGlossaryTerm = (termKey: keyof typeof CLINICAL_GLOSSARY): string => {
    const entry = CLINICAL_GLOSSARY[termKey];
    if (!entry) return String(termKey);
    return entry[language] || entry.en;
  };

  const localize = (
    text: string | null | undefined,
    entityTranslations?: { en?: string; hi?: string; or?: string } | null
  ): string => {
    return localizeDynamicText(text, language, entityTranslations);
  };

  const localizeFieldFn = <T extends Record<string, any>>(
    entity: T | null | undefined,
    fieldKey: keyof T
  ): string => {
    return localizeField(entity, fieldKey, language);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        getGlossaryTerm,
        formatNumber,
        formatName,
        localize,
        localizeField: localizeFieldFn,
      }}
    >
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
