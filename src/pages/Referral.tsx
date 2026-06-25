import { useState, useEffect } from "react";
import { getInitData, haptic, getTg } from "../telegram";
import { useI18n } from "../context/I18nContext";

interface Stats {
  confirmed: number;
  pending: number;
  total: number;
  rewardReady: boolean;
  invitedBy: string | null;
}

export function Referral({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const { t } = useI18n();

  const load = () =>
    fetch("/api/referrals/my", { headers: { "x-telegram-init-data": getInitData() } })
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});

  useEffect(() => { load(); }, []);

  const submit = async () => {
    const clean = username.replace(/^@/, "").trim();
    if (!clean) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": getInitData() },
        body: JSON.stringify({ inviterUsername: clean }),
      });
      const data = await res.json();
      if (!data.ok && data.error) {
        setError(data.error);
      } else {
        haptic("medium");
        setSaved(true);
        setUsername("");
        load();
      }
    } catch {
      setError(t.checkout_conn_error);
    } finally {
      setLoading(false);
    }
  };

  const confirmed = stats?.confirmed ?? 0;
  const myUsername = getTg()?.initDataUnsafe.user?.username;
  const noUsername = !myUsername;

  return (
    <div className="ref-page">
      <div className="ref-page__header">
        <button className="ref-page__back" onClick={onClose}>‹</button>
        <span className="ref-page__title">{t.ref_title}</span>
      </div>

      <div className="ref-page__hero">
        <div className="ref-page__hero-icon">🎁</div>
        <div className="ref-page__hero-text" style={{ whiteSpace: "pre-line" }}>{t.ref_hero}</div>
      </div>

      {noUsername && (
        <div className="ref-page__no-username">
          <div className="ref-page__no-username-icon">⚠️</div>
          <div className="ref-page__no-username-title">{t.ref_no_username_title}</div>
          <p className="ref-page__no-username-text">{t.ref_no_username_text}</p>
        </div>
      )}

      <div className="ref-page__card">
        <div className="ref-page__card-label">{t.ref_my}</div>
        {noUsername ? (
          <div className="ref-page__disabled-hint">{t.ref_disabled}</div>
        ) : (
          <>
            <div className="ref-page__progress-row">
              <div className="ref-page__bar">
                <div className="ref-page__fill" style={{ width: `${Math.min(100, (confirmed / 3) * 100)}%` }} />
              </div>
              <span className="ref-page__count">{confirmed}/3</span>
            </div>
            {stats?.rewardReady && (
              <div className="ref-page__reward">{t.ref_reward}</div>
            )}
            {!stats?.rewardReady && stats && stats.pending > 0 && (
              <div className="ref-page__pending">{t.ref_pending(stats.pending)}</div>
            )}
          </>
        )}

        <div className="ref-page__how">
          <div className="ref-page__how-title">{t.ref_how_title}</div>
          <div className="ref-page__how-step"><span>1</span> {t.ref_how_1}</div>
          <div className="ref-page__how-step"><span>2</span> {t.ref_how_2}</div>
          <div className="ref-page__how-step"><span>3</span> {t.ref_how_3}</div>
        </div>

        {myUsername && (
          <div className="ref-page__share-tag">{t.ref_share(myUsername)}</div>
        )}
      </div>

      <div className="ref-page__card">
        <div className="ref-page__card-label">{t.ref_who}</div>

        {stats?.invitedBy ? (
          <div className="ref-page__set-by">{t.ref_set_by(stats.invitedBy)}</div>
        ) : saved ? (
          <div className="ref-page__set-by">{t.ref_saved}</div>
        ) : (
          <>
            <div className="ref-page__input-wrap">
              <span className="ref-page__at">@</span>
              <input
                className="ref-page__input"
                placeholder="username"
                value={username}
                onChange={e => { setUsername(e.target.value.replace(/^@/, "")); setError(""); }}
                autoComplete="off"
                autoCapitalize="none"
              />
            </div>
            {error && <div className="ref-page__error">{error}</div>}
            <button
              className="ref-page__submit"
              disabled={loading || !username.trim()}
              onClick={submit}
            >
              {loading ? t.ref_saving : t.ref_save}
            </button>
            <p className="ref-page__note">{t.ref_note}</p>
          </>
        )}
      </div>
    </div>
  );
}
