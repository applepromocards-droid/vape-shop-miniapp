import { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { getTg } from "../telegram";

export function Cart() {
  const { items, setQty, clear, total } = useCart();

  const checkout = () => {
    const tg = getTg();
    const payload = {
      type: "order",
      items: items.map((i) => ({
        id: i.product.id,
        title: i.product.title,
        flavor: i.flavor?.name,
        qty: i.qty,
        price: i.product.price,
      })),
      total,
      currency: items[0]?.product.currency ?? "",
      user: tg?.initDataUnsafe.user?.id,
    };
    if (tg) {
      tg.sendData(JSON.stringify(payload));
    } else {
      alert("Заказ (debug):\n" + JSON.stringify(payload, null, 2));
      clear();
    }
  };

  useEffect(() => {
    const tg = getTg();
    if (!tg) return;
    const mb = tg.MainButton;
    if (items.length > 0) {
      mb.setText(`Оформить · ${total} ${items[0].product.currency}`);
      mb.show();
      mb.onClick(checkout);
    } else {
      mb.hide();
    }
    return () => { mb.offClick(checkout); mb.hide(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, total]);

  if (items.length === 0) {
    return (
      <div>
        <div className="cart-page__title">Корзина</div>
        <div className="empty">
          <span className="empty__icon">🛒</span>
          <div className="empty__title">Корзина пуста</div>
          <p>Добавьте товары из каталога</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="cart-page__title">Корзина</div>

      <div className="cart">
        {items.map((i) => {
          const key = `${i.product.id}:${i.flavor?.id ?? ""}`;
          return (
            <div className="cart__item" key={key}>
              <div className="cart__thumb">
                {i.product.image
                  ? <img src={i.product.image} alt="" />
                  : i.product.emoji
                }
              </div>
              <div className="cart__info">
                <div className="cart__name">{i.product.title}</div>
                {i.flavor && <div className="cart__flavor">{i.flavor.name}</div>}
                <div className="cart__price">{i.product.price} {i.product.currency}</div>
              </div>
              <div className="cart__qty">
                <button
                  className="cart__qty-btn cart__qty-btn--minus"
                  onClick={() => setQty(i.product.id, i.qty - 1, i.flavor?.id)}
                >−</button>
                <span className="cart__qty-val">{i.qty}</span>
                <button
                  className="cart__qty-btn cart__qty-btn--plus"
                  onClick={() => setQty(i.product.id, i.qty + 1, i.flavor?.id)}
                >+</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cart-promo">
        <span className="cart-promo__icon">🎁</span>
        <span className="cart-promo__label">Промокод</span>
        <button className="cart-promo__btn">Применить</button>
      </div>

      <div className="cart-summary">
        <div className="cart-summary__row">
          <span>Товары ({items.reduce((s, i) => s + i.qty, 0)})</span>
          <span>{total} {items[0].product.currency}</span>
        </div>
        <div className="cart-summary__row">
          <span>Доставка</span>
          <span className="cart-summary__free">Бесплатно</span>
        </div>
        <div className="cart-summary__total">
          <span className="cart-summary__total-label">Итого</span>
          <span className="cart-summary__total-val">{total} {items[0].product.currency}</span>
        </div>
        <button className="cart-checkout" onClick={checkout}>Оформить заказ</button>
      </div>
    </div>
  );
}
