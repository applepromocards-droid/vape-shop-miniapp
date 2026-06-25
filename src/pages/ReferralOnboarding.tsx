import { useState } from "react";
import { getInitData, haptic } from "../telegram";

export function ReferralOnboarding({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const clean = username.replace(/^@/, "").trim();
    if (!clean) { onDone(); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": getInitData() },
        body: JSON.stringify({ inviterUsername: clean }),
      });
      const data = await res.json();
      if (!data.ok && data.error) setError(data.error);
      else { haptic("medium"); onDone(); }
    } catch {
      onDone();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ref-onboarding">
      <div className="ref-onboarding__icon">🎁</div>
      <div className="ref-onboarding__title">Тебя кто-то пригласил?</div>
      <p className="ref-onboarding__sub">
        Введи @username человека, который поделился с тобой магазином.
        Они получат бонус за каждого приглашённого!
      </p>

      <div className="ref-onboarding__input-wrap">
        <span className="ref-onboarding__at">@</span>
        <input
          className="ref-onboarding__input"
          placeholder="username"
          value={username}
          onChange={e => { setUsername(e.target.value.replace(/^@/, "")); setError(""); }}
          autoComplete="off"
          autoCapitalize="none"
        />
      </div>
      {error && <div className="ref-onboarding__error">{error}</div>}

      <button
        className="ref-onboarding__btn ref-onboarding__btn--primary"
        disabled={loading}
        onClick={submit}
      >
        {loading ? "Сохранение..." : "Подтвердить"}
      </button>
      <button className="ref-onboarding__btn ref-onboarding__btn--skip" onClick={onDone}>
        Пропустить
      </button>
    </div>
  );
}
