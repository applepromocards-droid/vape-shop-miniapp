import { useEffect, useState } from "react";
import { getInitData, getTg } from "../telegram";
import { useI18n } from "../context/I18nContext";

export function Addresses({ onClose }: { onClose: () => void }) {
  const [addresses, setAddresses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    const tg = getTg();
    if (!tg) return;
    tg.BackButton.show();
    tg.BackButton.onClick(onClose);
    return () => { tg.BackButton.offClick(onClose); tg.BackButton.hide(); };
  }, []);

  useEffect(() => {
    fetch("/api/orders/address", { headers: { "x-telegram-init-data": getInitData() } })
      .then(r => r.json())
      .then(d => { setAddresses(d.addresses ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const remove = async (addr: string) => {
    await fetch("/api/orders/address", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-telegram-init-data": getInitData() },
      body: JSON.stringify({ address: addr }),
    });
    setAddresses(prev => prev.filter(a => a !== addr));
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <button className="page-header__back" onClick={onClose}>‹</button>
        <h1 className="page-header__title">{t.addresses_title}</h1>
      </div>

      {loading && (
        <div className="empty"><span className="empty__icon">⏳</span><p>{t.addresses_loading}</p></div>
      )}

      {!loading && addresses.length === 0 && (
        <div className="empty">
          <span className="empty__icon">📍</span>
          <div className="empty__title">{t.addresses_empty_title}</div>
          <p>{t.addresses_empty_sub}</p>
        </div>
      )}

      <div className="addr-list">
        {addresses.map(addr => (
          <div key={addr} className="addr-item">
            <span className="addr-item__icon">📍</span>
            <span className="addr-item__text">{addr}</span>
            <button className="addr-item__del" onClick={() => remove(addr)}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}
