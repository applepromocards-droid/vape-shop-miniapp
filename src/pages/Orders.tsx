import { useEffect, useState } from "react";
import { getInitData, getTg } from "../telegram";

type OrderItem = { title: string; flavor?: string; qty: number; price: number; currency: string };
type Order = {
  id: string;
  items: OrderItem[];
  subtotal: number;
  delivery: boolean;
  address?: string;
  payment: string;
  promoCode?: string;
  discount?: number;
  status: "new" | "done" | "cancelled";
  createdAt: string;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  new:       { label: "В обработке", cls: "order-status--new" },
  done:      { label: "Выполнен",    cls: "order-status--done" },
  cancelled: { label: "Отменён",     cls: "order-status--cancelled" },
};

export function Orders({ onClose }: { onClose: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = getTg();
    if (!tg) return;
    tg.BackButton.show();
    tg.BackButton.onClick(onClose);
    return () => { tg.BackButton.offClick(onClose); tg.BackButton.hide(); };
  }, []);

  useEffect(() => {
    fetch("/api/orders/my", { headers: { "x-telegram-init-data": getInitData() } })
      .then(r => r.json())
      .then(data => { setOrders(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="orders-page">
      <div className="page-header">
        <button className="page-header__back" onClick={onClose}>‹</button>
        <h1 className="page-header__title">Мои заказы</h1>
      </div>

      {loading && (
        <div className="empty"><span className="empty__icon">⏳</span><p>Загрузка...</p></div>
      )}

      {!loading && orders.length === 0 && (
        <div className="empty">
          <span className="empty__icon">📦</span>
          <div className="empty__title">Заказов пока нет</div>
          <p>Ваши заказы будут отображаться здесь</p>
        </div>
      )}

      <div className="orders-list">
        {orders.map(order => {
          const currency = order.items[0]?.currency ?? "€";
          const qty = order.items.reduce((s, i) => s + i.qty, 0);
          const freeShip = qty >= 3;
          const deliveryFee = order.delivery && !freeShip ? 10 : 0;
          const discount = order.discount ?? 0;
          const total = order.subtotal + deliveryFee - discount;
          const st = STATUS_LABEL[order.status] ?? STATUS_LABEL.new;
          const date = new Date(order.createdAt).toLocaleDateString("ru-RU", {
            day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
          });

          return (
            <div key={order.id} className="order-card">
              <div className="order-card__header">
                <span className="order-card__id">#{order.id.slice(-6).toUpperCase()}</span>
                <span className={`order-status ${st.cls}`}>{st.label}</span>
              </div>
              <div className="order-card__date">{date}</div>

              <div className="order-card__items">
                {order.items.map((it, i) => (
                  <div key={i} className="order-card__item">
                    <span className="order-card__item-name">
                      {it.title}{it.flavor ? <span className="order-card__item-flavor"> · {it.flavor}</span> : ""}
                    </span>
                    <span className="order-card__item-price">{it.qty > 1 ? `${it.qty}×` : ""}{it.price * it.qty} {it.currency}</span>
                  </div>
                ))}
              </div>

              <div className="order-card__footer">
                {order.delivery
                  ? <span className="order-card__meta">🚚 {order.address}</span>
                  : <span className="order-card__meta">🏠 Самовывоз</span>
                }
                {discount > 0 && (
                  <span className="order-card__meta order-card__promo">🎟 {order.promoCode} −{discount} {currency}</span>
                )}
                <span className="order-card__total">Итого: {total} {currency}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
