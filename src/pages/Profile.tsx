import { useState, useEffect } from "react";
import { getTg } from "../telegram";
import { useI18n } from "../context/I18nContext";

interface Props {
  onOpenAdmin: () => void;
  onOpenOrders: () => void;
  onOpenAddresses: () => void;
  onOpenReferral: () => void;
  isAdmin: boolean;
}

export function Profile({ onOpenAdmin, onOpenOrders, onOpenAddresses, onOpenReferral, isAdmin }: Props) {
  const user = getTg()?.initDataUnsafe.user;
  const { t } = useI18n();
  const name = user
    ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}`
    : "Гость";
  const username = user?.username ? `@${user.username}` : null;

  const [supportUrl, setSupportUrl]       = useState("");
  const [supportUserId, setSupportUserId] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then(d => {
        if (d.supportUrl)    setSupportUrl(d.supportUrl);
        if (d.supportUserId) setSupportUserId(d.supportUserId);
      })
      .catch(() => {});
  }, []);

  const openSupport = () => {
    const tg = getTg();
    if (supportUrl && tg) {
      tg.openTelegramLink(supportUrl);
    } else if (supportUserId) {
      window.open(`tg://user?id=${supportUserId}`, "_blank");
    } else if (tg) {
      tg.close();
    }
  };

  const MENU = [
    { icon: "📦", label: t.profile_orders,    action: onOpenOrders },
    { icon: "📍", label: t.profile_addresses,  action: onOpenAddresses },
    { icon: "🔗", label: t.profile_referral,   action: onOpenReferral },
    { icon: "💬", label: t.profile_support,    action: openSupport },
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
              <span className="menu-item__label">{t.profile_admin}</span>
              <span className="menu-item__arrow">›</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
