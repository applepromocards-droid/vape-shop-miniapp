import { useCart } from "../context/CartContext";
import { useI18n } from "../context/I18nContext";
import { haptic } from "../telegram";

export type Tab = "catalog" | "favorites" | "cart" | "profile";

function IconCatalog() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M12 20.3l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.54L12 20.3z" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h2.5l2.2 12.3a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  );
}

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const { count } = useCart();
  const { t } = useI18n();

  const tabs = [
    { key: "catalog"   as Tab, label: t.nav_catalog,   Icon: IconCatalog },
    { key: "favorites" as Tab, label: t.nav_favorites,  Icon: IconHeart },
    { key: "cart"      as Tab, label: t.nav_cart,       Icon: IconCart },
    { key: "profile"   as Tab, label: t.nav_profile,    Icon: IconProfile },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`bottom-nav__item${active === tab.key ? " is-active" : ""}`}
          onClick={() => { haptic("light"); onChange(tab.key); }}
        >
          <span className="bottom-nav__icon">
            <tab.Icon />
            {tab.key === "cart" && count > 0 && (
              <span className="bottom-nav__badge">{count}</span>
            )}
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
