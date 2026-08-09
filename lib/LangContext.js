/**
 * LangContext.js
 * Détection automatique de la langue du visiteur (navigateur)
 * + toggle manuel FR ↔ EN persisté en localStorage
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

const LangContext = createContext({ lang: 'fr', setLang: () => {} });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('fr'); // SSR-safe default

  useEffect(() => {
    // 1. Priorité : choix manuel sauvegardé
    const saved = typeof window !== 'undefined' && localStorage.getItem('lang');
    if (saved === 'fr' || saved === 'en') {
      setLangState(saved);
      return;
    }
    // 2. Langue du navigateur — FR par défaut sauf si explicitement EN
    const browserLang = navigator.language?.slice(0, 2).toLowerCase();
    setLangState(browserLang === 'en' ? 'en' : 'fr');
  }, []);

  function setLang(l) {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem('lang', l);
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
