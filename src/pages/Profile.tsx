import { useEffect, useState } from "react";
import { getTg, getInitData } from "../telegram";

interface Props {
  onOpenAdmin: () => void;
  onOpenOrders: () => void;
  onOpenAddresses: () => void;
  isAdmin: boolean;
}

export function Profile({ onOpenAdmin, onOpenOrders, onOpenAddresses, isAdmin }: Props) {
  const user = getTg()?.initDataUnsafe.user;
  const name = user
    ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}`
    : "Гость";
  const username = user?.username ? `@${user.username}` : null;

  const [supportUrl, setSupportUrl] = useState("");
  const [refStats, setRefStats] = useState<{ confirmed: number; pending: number; rewardReady: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then(d => { if (d.supportUrl) setSupportUrl(d.supportUrl); })
      .catch(() => {});

    fetch("/api/referrals/my", { headers: { "x-telegram-init-data": getInitData() } })
      .then(r => r.json())
      .then(d => setRefStats(d))
      .catch(() => {});
  }, []);

  const openSupport = () => {
    const tg = getTg();
    if (supportUrl && tg) {
      tg.openTelegramLink(supportUrl);
    } else if (tg) {
      tg.close();
    }
  };

  const MENU = [
    { icon: "📦", label: "Мои заказы",     action: onOpenOrders },
    { icon: "📍", label: "Адреса доставки", action: onOpenAddresses },
    { icon: "💬", label: "Поддержка",       action: openSupport },
  ];

  return (
    <div>
      <div className="profile">
        <div className="profile__glow" />
        <div className="profile__avatar">
          {user?.photo_url
            ? <img src={user.photo_url} alt="" />
            : "👤"
          }
        </div>
        <div className="profile__name">{name}</div>
        {username && <div className="profile__username">{username}</div>}

        {/* Referral block */}
        {user?.username && (
          <div className="profile__ref-block">
            <div className="profile__ref-title">🔗 Реферальная программа</div>
            <div className="profile__ref-sub">Приведи 3 друга — получи бесплатную курилку!</div>
            {refStats && (
              <>
                <div className="profile__ref-progress">
                  <div className="profile__ref-bar">
                    <div className="profile__ref-fill" style={{ width: `${Math.min(100, (refStats.confirmed / 3) * 100)}%` }} />
                  </div>
                  <span className="profile__ref-count">{refStats.confirmed}/3</span>
                </div>
                {refStats.rewardReady
                  ? <div className="profile__ref-reward">🎁 Награда уже в пути! Проверь Telegram.</div>
                  : refStats.pending > 0
                    ? <div className="profile__ref-pending">⏳ {refStats.pending} {refStats.pending === 1 ? "заказ ожидает" : "заказа ожидают"} подтверждения</div>
                    : null
                }
                <div className="profile__ref-share">
                  Твой тег: <b>@{user.username}</b> — поделись с друзьями
                </div>
              </>
            )}
          </div>
        )}

        <div className="profile__menu">
          {MENU.map((m) => (
            <button key={m.label} className="menu-item" onClick={m.action}>
              <span className="menu-item__icon">{m.icon}</span>
              <span className="menu-item__label">{m.label}</span>
              <span className="menu-item__arrow">›</span>
            </button>
          ))}
          {isAdmin && (
            <button className="menu-item menu-item--admin" onClick={onOpenAdmin}>
              <span className="menu-item__icon">⚙️</span>
              <span className="menu-item__label">Управление каталогом</span>
              <span className="menu-item__arrow">›</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
