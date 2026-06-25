import { useState } from "react";

const STORAGE_KEY = "age_confirmed_v1";
const MIN_AGE = 18;

export function isAgeConfirmed(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; }
  catch { return false; }
}

export function AgeGate({ onConfirm }: { onConfirm: () => void }) {
  const [denied, setDenied] = useState(false);

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
            <h2>Доступ ограничен</h2>
            <p>Этот раздел предназначен только для лиц старше {MIN_AGE} лет. Продажа никотиносодержащей продукции несовершеннолетним запрещена.</p>
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
          <h2>Подтверждение возраста</h2>
          <p>Магазин содержит никотиносодержащую продукцию. Вам есть {MIN_AGE} лет?</p>
          <div className="age-gate__actions">
            <button className="btn btn--primary" onClick={confirm}>Мне есть {MIN_AGE}</button>
            <button className="btn btn--ghost" onClick={() => setDenied(true)}>Нет</button>
          </div>
          <small className="age-gate__legal">Никотин вызывает привыкание. Курение вредит вашему здоровью.</small>
        </div>
      </div>
    </div>
  );
}
