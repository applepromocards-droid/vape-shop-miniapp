import { createContext, useContext, useState, type ReactNode } from "react";
import { getTg } from "../telegram";
import { getTranslations, type Lang, type Translations } from "../i18n";

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const Ctx = createContext<I18nCtx | null>(null);

function detectLang(): Lang {
  const saved = localStorage.getItem("lang") as Lang | null;
  if (saved === "ru" || saved === "en") return saved;
  const tgLang = getTg()?.initDataUnsafe.user?.language_code ?? "";
  return tgLang.startsWith("ru") ? "ru" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = (l: Lang) => {
    localStorage.setItem("lang", l);
    setLangState(l);
  };

  const t = getTranslations(lang);

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be inside I18nProvider");
  return c;
}
