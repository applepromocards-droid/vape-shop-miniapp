import { useState } from "react";
import { useI18n } from "../context/I18nContext";

const STORAGE_KEY = "age_confirmed_v1";
const MIN_AGE = 18;

export function isAgeConfirmed(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; }
  catch { return false; }
}

export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [denied, setDenied] = useState(false);
  const { t } = useI18n();

  const confirm = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    onConfirm();
  };

  if (denied) {
    return (
      <div className="age-gate">
        <div className="age-gate__wrap">
          <img src="./logo.svg" alt="MMSMOKE" className="age-gate__logo-img" />
          <div className="age-gate__card">
            <h2>{t.age_denied_title}</h2>
            <p>{t.age_denied_text(MIN_AGE)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="age-gate">
      <div className="age-gate__wrap">
        <img src="./logo.svg" alt="MMSMOKE" className="age-gate__logo-img" />
        <div className="age-gate__card">
          <h2>{t.age_title}</h2>
          <p>{t.age_text(MIN_AGE)}</p>
          <div className="age-gate__actions">
            <button className="btn btn--primary" onClick={confirm}>{t.age_yes(MIN_AGE)}</button>
            <button className="btn btn--ghost" onClick={() => setDenied(true)}>{t.age_no}</button>
          </div>
          <small className="age-gate__legal">{t.age_legal}</small>
        </div>
      </div>
    </div>
  );
}
