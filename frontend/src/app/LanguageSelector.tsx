"use client";

import { useEffect } from "react";

// Languages chosen to cover the 2026 World Cup participating countries.
// Google Translate codes — coverage by host/qualified nations:
//   en (US/Canada/England/Australia/NZ/Scotland/Jamaica/Haiti/SA/Ghana/Nigeria)
//   es (MX/AR/CO/EC/PY/UY/ES/CR/SV/HN)
//   fr (FR/BE/CA-QC/CI/SN/MA/TN/DZ/HT)
//   pt (BR/PT/CV/AO)
//   de (DE/AT/CH)
//   nl (NL/BE/CW)
//   it (IT/CH)
//   ar (SA/QA/MA/TN/DZ/EG/JO)
//   fa (IR)
//   ja (JP)  ko (KR)
//   tr (TR)  pl (PL)  hr (HR)  sr (RS)  bs (BA)  sl (SI)
//   cs (CZ)  sk (SK)  hu (HU)  ro (RO)  el (GR)
//   da (DK)  sv (SE)  no (NO)  fi (FI)
//   uk (UA)  he (IL — fans)  zh-CN (CN — diaspora)
const INCLUDED_LANGUAGES =
  "en,es,fr,pt,de,nl,it,ar,fa,ja,ko,tr,pl,hr,sr,bs,sl,cs,sk,hu,ro,el,da,sv,no,fi,uk,he,zh-CN";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (
          opts: {
            pageLanguage: string;
            includedLanguages?: string;
            autoDisplay?: boolean;
            layout?: number;
          },
          el: string,
        ) => unknown;
      };
    };
  }
}

export function LanguageSelector() {
  useEffect(() => {
    if (
      document.querySelector('script[src*="translate.google.com/translate_a"]')
    ) {
      return;
    }
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: INCLUDED_LANGUAGES,
          autoDisplay: false,
        },
        "google_translate_element",
      );
    };
    const s = document.createElement("script");
    s.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return (
    <div
      id="google_translate_element"
      className="lang-selector text-xs text-zinc-700"
      aria-label="Translate page"
    />
  );
}
