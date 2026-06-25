import { useState } from "react";
import { getInitData, haptic } from "../telegram";
import { useI18n } from "../context/I18nContext";

export function ReferralOnboarding({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useI18n();

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
      <div className="ref-onboarding__title">{t.ref_ob_title}</div>
      <p className="ref-onboarding__sub">{t.ref_ob_sub}</p>

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
        {loading ? t.ref_ob_saving : t.ref_ob_confirm}
      </button>
      <button className="ref-onboarding__btn ref-onboarding__btn--skip" onClick={onDone}>
        {t.ref_ob_skip}
      </button>
    </div>
  );
}
