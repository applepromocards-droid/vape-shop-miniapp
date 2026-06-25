import { useCart } from "../context/CartContext";
import { useI18n } from "../context/I18nContext";

export function Cart({ onCheckout }: { onCheckout: () => void }) {
  const { items, setQty, total } = useCart();
  const { t } = useI18n();

  if (items.length === 0) {
    return (
      <div>
        <div className="cart-page__title">{t.cart_title}</div>
        <div className="empty">
          <span className="empty__icon">🛒</span>
          <div className="empty__title">{t.cart_empty_title}</div>
          <p>{t.cart_empty_sub}</p>
        </div>
      </div>
    );
  }

  const currency = items[0].product.currency;
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const freeShip = totalQty >= 3;

  return (
    <div>
      <div className="cart-page__title">{t.cart_title}</div>

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
                <div className="cart__price">{i.product.price} {currency}</div>
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

      <div className="cart-summary">
        <div className="cart-summary__row">
          <span>{t.cart_items(totalQty)}</span>
          <span>{total} {currency}</span>
        </div>
        <div className="cart-summary__row">
          <span>{t.cart_delivery}</span>
          {freeShip
            ? <span className="cart-summary__free">{t.cart_free}</span>
            : <span className="cart-summary__note">{t.cart_calculated}</span>
          }
        </div>
        {!freeShip && (
          <div className="cart-summary__promo-note">
            {t.cart_add_more(3 - totalQty)}
          </div>
        )}
        <div className="cart-summary__total">
          <span className="cart-summary__total-label">{t.cart_total}</span>
          <span className="cart-summary__total-val">{total} {currency}</span>
        </div>
        <button className="cart-checkout" onClick={onCheckout}>
          {t.cart_checkout}
        </button>
      </div>
    </div>
  );
}
