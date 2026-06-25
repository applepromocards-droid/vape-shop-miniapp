import { useCart } from "../context/CartContext";

export function Cart({ onCheckout }: { onCheckout: () => void }) {
  const { items, setQty, total } = useCart();

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

  const currency = items[0].product.currency;
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const freeShip = totalQty >= 3;

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
          <span>Товары ({totalQty})</span>
          <span>{total} {currency}</span>
        </div>
        <div className="cart-summary__row">
          <span>Доставка</span>
          {freeShip
            ? <span className="cart-summary__free">Бесплатно 🎁</span>
            : <span className="cart-summary__note">рассчитывается при оформлении</span>
          }
        </div>
        {!freeShip && (
          <div className="cart-summary__promo-note">
            🎁 Добавь ещё {3 - totalQty} {3 - totalQty === 1 ? "товар" : "товара"} для бесплатной доставки
          </div>
        )}
        <div className="cart-summary__total">
          <span className="cart-summary__total-label">Итого</span>
          <span className="cart-summary__total-val">{total} {currency}</span>
        </div>
        <button className="cart-checkout" onClick={onCheckout}>
          Оформить заказ
        </button>
      </div>
    </div>
  );
}
