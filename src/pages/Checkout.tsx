import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { getTg, getInitData, haptic } from "../telegram";

type Step = "delivery" | "payment" | "confirm";
type DeliveryType = "delivery" | "pickup";
type PaymentType = "cash" | "card";

export function Checkout({ onClose }: { onClose: () => void }) {
  const { items, total, clear } = useCart();
  const tg = getTg();

  const [step, setStep]               = useState<Step>("delivery");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("delivery");
  const [address, setAddress]           = useState("");
  const [payment, setPayment]           = useState<PaymentType>("cash");
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [placing, setPlacing]           = useState(false);
  const [placed, setPlaced]             = useState(false);

  const currency  = items[0]?.product.currency ?? "€";
  const totalQty  = items.reduce((s, i) => s + i.qty, 0);
  const freeShip  = totalQty >= 3;
  const shipFee   = deliveryType === "delivery" && !freeShip ? 10 : 0;
  const finalTotal = total + shipFee;

  // Load saved addresses
  useEffect(() => {
    fetch("/api/orders/address", { headers: { "x-telegram-init-data": getInitData() } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.addresses?.length) {
          setSavedAddresses(d.addresses);
          setAddress(d.addresses[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Telegram BackButton
  useEffect(() => {
    const back = tg?.BackButton;
    if (!back) return;
    back.show();
    const cb = () => {
      haptic("light");
      if (placed) return;
      if (step === "delivery") onClose();
      else if (step === "payment") setStep("delivery");
      else setStep("payment");
    };
    back.onClick(cb);
    return () => { back.offClick(cb); back.hide(); };
  }, [step, placed]);

  const placeOrder = async () => {
    setPlacing(true);
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": getInitData() },
        body: JSON.stringify({
          items: items.map(i => ({
            title: i.product.title,
            flavor: i.flavor?.name ?? null,
            qty: i.qty,
            price: i.product.price,
            currency: i.product.currency,
          })),
          subtotal: total,
          delivery: deliveryType === "delivery",
          address: deliveryType === "delivery" ? address : null,
          payment,
        }),
      });
      haptic("heavy");
      clear();
      setPlaced(true);
      setTimeout(() => tg?.close(), 3500);
    } catch {
      alert("Ошибка при оформлении, попробуйте ещё раз");
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="checkout-success">
        <div className="checkout-success__ring" />
        <div className="checkout-success__icon">✅</div>
        <div className="checkout-success__title">Заказ принят!</div>
        <p className="checkout-success__sub">Администратор свяжется с вами в ближайшее время</p>
      </div>
    );
  }

  const STEPS: Step[] = ["delivery", "payment", "confirm"];
  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="checkout">
      {/* Header */}
      <div className="checkout__header">
        <button className="checkout__back" onClick={() => {
          haptic("light");
          if (step === "delivery") onClose();
          else if (step === "payment") setStep("delivery");
          else setStep("payment");
        }}>‹</button>
        <span className="checkout__title">Оформление заказа</span>
        <div style={{ width: 36 }} />
      </div>

      {/* Step dots */}
      <div className="checkout__dots">
        {STEPS.map((s, i) => (
          <div key={s} className={`checkout__dot${i <= stepIdx ? " checkout__dot--active" : ""}`} />
        ))}
      </div>

      {/* Step: delivery */}
      {step === "delivery" && (
        <div className="checkout__body">
          <div className="checkout__label">Способ получения</div>

          <div className="checkout__options">
            <button
              className={`checkout-option${deliveryType === "delivery" ? " checkout-option--active" : ""}`}
              onClick={() => { haptic("light"); setDeliveryType("delivery"); }}
            >
              <span className="checkout-option__icon">🚚</span>
              <span className="checkout-option__name">Доставка</span>
              <span className="checkout-option__sub">{freeShip ? "бесплатно" : "+10 €"}</span>
            </button>
            <button
              className={`checkout-option${deliveryType === "pickup" ? " checkout-option--active" : ""}`}
              onClick={() => { haptic("light"); setDeliveryType("pickup"); }}
            >
              <span className="checkout-option__icon">🏠</span>
              <span className="checkout-option__name">Самовывоз</span>
              <span className="checkout-option__sub">бесплатно</span>
            </button>
          </div>

          {deliveryType === "delivery" && (
            <div className="checkout__address-wrap">
              <div className="checkout__label" style={{ marginTop: 20 }}>Адрес доставки</div>

              {savedAddresses.length > 0 && (
                <div className="checkout__addr-chips">
                  {savedAddresses.map(a => (
                    <button
                      key={a}
                      className={`checkout__addr-chip${address === a ? " checkout__addr-chip--active" : ""}`}
                      onClick={() => { haptic("light"); setAddress(a); }}
                    >
                      📍 {a}
                    </button>
                  ))}
                </div>
              )}

              <textarea
                className="checkout__address"
                placeholder="Улица, дом, квартира"
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={3}
              />
              <div className="checkout__delivery-note">
                🎁 Доставка бесплатна при заказе от 3 товаров
              </div>
            </div>
          )}

          <button
            className="checkout__next"
            disabled={deliveryType === "delivery" && !address.trim()}
            onClick={() => { haptic("light"); setStep("payment"); }}
          >
            Далее →
          </button>
        </div>
      )}

      {/* Step: payment */}
      {step === "payment" && (
        <div className="checkout__body">
          <div className="checkout__label">Способ оплаты</div>

          <div className="checkout__options">
            <button
              className={`checkout-option${payment === "cash" ? " checkout-option--active" : ""}`}
              onClick={() => { haptic("light"); setPayment("cash"); }}
            >
              <span className="checkout-option__icon">💵</span>
              <span className="checkout-option__name">Наличными</span>
              <span className="checkout-option__sub">при получении</span>
            </button>
            <button
              className={`checkout-option${payment === "card" ? " checkout-option--active" : ""}`}
              onClick={() => { haptic("light"); setPayment("card"); }}
            >
              <span className="checkout-option__icon">💳</span>
              <span className="checkout-option__name">Картой</span>
              <span className="checkout-option__sub">при получении</span>
            </button>
          </div>

          <button
            className="checkout__next"
            onClick={() => { haptic("light"); setStep("confirm"); }}
          >
            Далее →
          </button>
        </div>
      )}

      {/* Step: confirm */}
      {step === "confirm" && (
        <div className="checkout__body">
          <div className="checkout__label">Ваш заказ</div>

          <div className="checkout-summary">
            {items.map(i => (
              <div className="checkout-summary__item" key={`${i.product.id}:${i.flavor?.id ?? ""}`}>
                <div className="checkout-summary__name">
                  {i.product.emoji} {i.product.title}
                  {i.flavor && <span className="checkout-summary__flavor"> · {i.flavor.name}</span>}
                </div>
                <div className="checkout-summary__price">
                  {i.qty > 1 && <span className="checkout-summary__qty">{i.qty}×</span>}
                  {i.product.price * i.qty} {currency}
                </div>
              </div>
            ))}

            <div className="checkout-summary__divider" />

            <div className="checkout-summary__row">
              <span>Товары ({totalQty})</span>
              <span>{total} {currency}</span>
            </div>
            {deliveryType === "delivery" && (
              <div className="checkout-summary__row">
                <span>Доставка</span>
                <span className={freeShip ? "checkout-summary__free" : ""}>
                  {freeShip ? "бесплатно 🎁" : `+${shipFee} ${currency}`}
                </span>
              </div>
            )}
            {deliveryType === "pickup" && (
              <div className="checkout-summary__row">
                <span>Самовывоз</span>
                <span className="checkout-summary__free">бесплатно</span>
              </div>
            )}
            <div className="checkout-summary__total">
              <span>Итого</span>
              <span>{finalTotal} {currency}</span>
            </div>

            <div className="checkout-summary__divider" />

            <div className="checkout-summary__meta">
              {deliveryType === "delivery"
                ? <span>📍 {address}</span>
                : <span>🏠 Самовывоз</span>
              }
              <span>{payment === "cash" ? "💵 Наличными" : "💳 Картой"}</span>
            </div>
          </div>

          <button
            className="checkout__place"
            disabled={placing}
            onClick={placeOrder}
          >
            {placing ? "Оформляем..." : `Заказать · ${finalTotal} ${currency}`}
          </button>
        </div>
      )}
    </div>
  );
}
