import { useState, useEffect } from "react";
import { getInitData, haptic } from "../telegram";

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
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const confirmed = stats?.confirmed ?? 0;

  return (
    <div className="ref-page">
      <div className="ref-page__header">
        <button className="ref-page__back" onClick={onClose}>‹</button>
        <span className="ref-page__title">Реферальная программа</span>
      </div>

      {/* Hero */}
      <div className="ref-page__hero">
        <div className="ref-page__hero-icon">🎁</div>
        <div className="ref-page__hero-text">Приведи 3 друга —<br />получи бесплатную курилку!</div>
      </div>

      {/* Progress */}
      <div className="ref-page__card">
        <div className="ref-page__card-label">Твои рефералы</div>
        <div className="ref-page__progress-row">
          <div className="ref-page__bar">
            <div className="ref-page__fill" style={{ width: `${Math.min(100, (confirmed / 3) * 100)}%` }} />
          </div>
          <span className="ref-page__count">{confirmed}/3</span>
        </div>
        {stats?.rewardReady && (
          <div className="ref-page__reward">🎁 Награда отправлена в Telegram!</div>
        )}
        {!stats?.rewardReady && stats && stats.pending > 0 && (
          <div className="ref-page__pending">
            ⏳ {stats.pending} {stats.pending === 1 ? "друг ещё не сделал" : "друга ещё не сделали"} первый заказ
          </div>
        )}

        <div className="ref-page__how">
          <div className="ref-page__how-title">Как это работает?</div>
          <div className="ref-page__how-step"><span>1</span> Скажи другу свой @username</div>
          <div className="ref-page__how-step"><span>2</span> Он указывает тебя при первом запуске</div>
          <div className="ref-page__how-step"><span>3</span> После его первого заказа тебе засчитается +1</div>
        </div>
      </div>

      {/* Who invited me */}
      <div className="ref-page__card">
        <div className="ref-page__card-label">Кто тебя пригласил?</div>

        {stats?.invitedBy ? (
          <div className="ref-page__set-by">
            ✅ Указан <b>@{stats.invitedBy}</b>
          </div>
        ) : saved ? (
          <div className="ref-page__set-by">✅ Сохранено!</div>
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
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
            <p className="ref-page__note">
              Указать можно только один раз. Засчитается после твоего первого завершённого заказа.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
