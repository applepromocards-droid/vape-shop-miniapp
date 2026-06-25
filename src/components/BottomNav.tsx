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
  const { lang, setLang, t } = useI18n();

  const tabs = [
    { key: "catalog" as Tab,   label: t.nav_catalog, Icon: IconCatalog },
    { key: "cart"    as Tab,   label: t.nav_cart,    Icon: IconCart },
    { key: "profile" as Tab,   label: t.nav_profile, Icon: IconProfile },
  ];

  const toggleLang = () => {
    haptic("light");
    setLang(lang === "ru" ? "en" : "ru");
  };

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

      {/* Language toggle */}
      <button className="bottom-nav__item bottom-nav__lang" onClick={toggleLang}>
        <span className="bottom-nav__lang-icon">{lang === "ru" ? "🇷🇺" : "🇬🇧"}</span>
        <span>{lang === "ru" ? "RU" : "EN"}</span>
      </button>
    </nav>
  );
}
