import { getTg } from "../telegram";

const MENU = [
  { icon: "📦", label: "Мои заказы" },
  { icon: "📍", label: "Адреса доставки" },
  { icon: "🎫", label: "Мои промокоды" },
  { icon: "💬", label: "Поддержка" },
];

export function Profile({ onOpenAdmin, isAdmin }: { onOpenAdmin: () => void; isAdmin: boolean }) {
  const user = getTg()?.initDataUnsafe.user;
  const name = user
    ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}`
    : "Гость";
  const username = user?.username ? `@${user.username}` : null;

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
            <button key={m.label} className="menu-item">
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
