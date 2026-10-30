import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { TEXT } from "./text.js";

const KEY = "q3.lang";
const LangContext = createContext({ lang: "zh", t: TEXT.zh, setLang: () => {} });

function initial() {
  try {
    return localStorage.getItem(KEY) === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(initial);
  const t = TEXT[lang];

  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    document.title = t.site;
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      // the choice just won't survive a reload
    }
  }, [lang, t]);

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
