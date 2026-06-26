import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useI18n } from "../context/I18nContext";
import { getTg, getInitData, haptic } from "../telegram";

type Step = "delivery" | "payment" | "confirm";
type DeliveryType = "delivery" | "pickup";
type PaymentType = "cash" | "card";
type ChangeOption = "yes" | "no";

export function Checkout({ onClose }: { onClose: () => void }) {
  const { items, total, clear } = useCart();
  const { t } = useI18n();
  const tg = getTg();

  const [step, setStep]                   = useState<Step>("delivery");
  const [deliveryType, setDeliveryType]   = useState<DeliveryType>("delivery");
  const [address, setAddress]             = useState("");
  const [payment, setPayment]             = useState<PaymentType>("cash");
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [promoInput, setPromoInput]       = useState("");
  const [promoApplied, setPromoApplied]   = useState<{ code: string; type: string; value: number } | null>(null);
  const [promoError, setPromoError]       = useState("");
  const [promoLoading, setPromoLoading]   = useState(false);
  const [changeOption, setChangeOption]   = useState<ChangeOption>("no");
  const [changeFrom, setChangeFrom]       = useState("");
  const [placing, setPlacing]             = useState(false);
  const [placed, setPlaced]               = useState(false);

  const currency   = items[0]?.product.currency ?? "€";
  const totalQty   = items.reduce((s, i) => s + i.qty, 0);
  const freeShip   = totalQty >= 3 || promoApplied?.type === "free_delivery";
  const shipFee    = deliveryType === "delivery" && !freeShip ? 10 : 0;
  const discount   = promoApplied
    ? promoApplied.type === "fixed"   ? promoApplied.value
    : promoApplied.type === "percent" ? Math.round(total * promoApplied.value / 100)
    : 0
    : 0;
  const finalTotal = Math.max(0, total + shipFee - discount);

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

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promos/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim(), subtotal: total }),
      });
      const data = await res.json();
      if (data.valid) {
        haptic("medium");
        setPromoApplied({ code: data.code, type: data.type, value: data.value });
        setPromoError("");
      } else {
        setPromoError(data.error ?? t.checkout_promo_error);
        setPromoApplied(null);
      }
    } catch {
      setPromoError(t.checkout_conn_error);
    } finally {
      setPromoLoading(false);
    }
  };

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
          changeNeeded: payment === "cash" ? changeOption === "yes" : null,
          changeFrom: payment === "cash" && changeOption === "yes" ? (changeFrom.trim() || null) : null,
          promoCode: promoApplied?.code ?? null,
          discount: discount > 0 ? discount : null,
        }),
      });
      haptic("heavy");
      clear();
      setPlaced(true);
      setTimeout(() => tg?.close(), 3500);
    } catch {
      alert(t.checkout_order_error);
    } finally {
      setPlacing(false);
    }
  };

  if (placed) {
    return (
      <div className="checkout-success">
        <div className="checkout-success__ring" />
        <div className="checkout-success__icon">✅</div>
        <div className="checkout-success__title">{t.checkout_success_title}</div>
        <p className="checkout-success__sub">{t.checkout_success_sub}</p>
      </div>
    );
  }

  const STEPS: Step[] = ["delivery", "payment", "confirm"];
  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="checkout">
      <div className="checkout__header">
        <button className="checkout__back" onClick={() => {
          haptic("light");
          if (step === "delivery") onClose();
          else if (step === "payment") setStep("delivery");
          else setStep("payment");
        }}>‹</button>
        <span className="checkout__title">{t.checkout_title}</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="checkout__dots">
        {STEPS.map((s, i) => (
          <div key={s} className={`checkout__dot${i <= stepIdx ? " checkout__dot--active" : ""}`} />
        ))}
      </div>

      {step === "delivery" && (
        <div className="checkout__body">
          <div className="checkout__label">{t.checkout_delivery_method}</div>

          <div className="checkout__options">
            <button
              className={`checkout-option${deliveryType === "delivery" ? " checkout-option--active" : ""}`}
              onClick={() => { haptic("light"); setDeliveryType("delivery"); }}
            >
              <span className="checkout-option__icon">🚚</span>
              <span className="checkout-option__name">{t.checkout_delivery}</span>
              <span className="checkout-option__sub">{freeShip ? t.checkout_free : "+10 €"}</span>
            </button>
            <button
              className={`checkout-option${deliveryType === "pickup" ? " checkout-option--active" : ""}`}
              onClick={() => { haptic("light"); setDeliveryType("pickup"); }}
            >
              <span className="checkout-option__icon">🏠</span>
              <span className="checkout-option__name">{t.checkout_pickup}</span>
              <span className="checkout-option__sub">{t.checkout_free}</span>
            </button>
          </div>

          {deliveryType === "delivery" && (
            <div className="checkout__address-wrap">
              <div className="checkout__label" style={{ marginTop: 20 }}>{t.checkout_address_label}</div>

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
                placeholder={t.checkout_address_placeholder}
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={3}
              />
              <div className="checkout__delivery-note">{t.checkout_free_note}</div>
            </div>
          )}

          <button
            className="checkout__next"
            disabled={deliveryType === "delivery" && !address.trim()}
            onClick={() => { haptic("light"); setStep("payment"); }}
          >
            {t.checkout_next}
          </button>
        </div>
      )}

      {step === "payment" && (
        <div className="checkout__body">
          <div className="checkout__label">{t.checkout_payment}</div>

          <div className="checkout__options">
            <button
              className={`checkout-option${payment === "cash" ? " checkout-option--active" : ""}`}
              onClick={() => { haptic("light"); setPayment("cash"); }}
            >
              <span className="checkout-option__icon">💵</span>
              <span className="checkout-option__name">{t.checkout_cash}</span>
              <span className="checkout-option__sub">{t.checkout_on_delivery}</span>
            </button>
            <button
              className={`checkout-option${payment === "card" ? " checkout-option--active" : ""}`}
              onClick={() => { haptic("light"); setPayment("card"); }}
            >
              <span className="checkout-option__icon">💳</span>
              <span className="checkout-option__name">{t.checkout_card}</span>
              <span className="checkout-option__sub">{t.checkout_on_delivery}</span>
            </button>
          </div>

          {payment === "cash" && (
            <div className="checkout__change-wrap">
              <div className="checkout__label" style={{ marginTop: 20 }}>{t.checkout_change_label}</div>
              <div className="checkout__options">
                <button
                  className={`checkout-option${changeOption === "no" ? " checkout-option--active" : ""}`}
                  onClick={() => { haptic("light"); setChangeOption("no"); setChangeFrom(""); }}
                >
                  <span className="checkout-option__icon">✅</span>
                  <span className="checkout-option__name">{t.checkout_change_no}</span>
                </button>
                <button
                  className={`checkout-option${changeOption === "yes" ? " checkout-option--active" : ""}`}
                  onClick={() => { haptic("light"); setChangeOption("yes"); }}
                >
                  <span className="checkout-option__icon">💰</span>
                  <span className="checkout-option__name">{t.checkout_change_yes}</span>
                </button>
              </div>
              {changeOption === "yes" && (
                <div style={{ marginTop: 12 }}>
                  <div className="checkout__label">{t.checkout_change_from}</div>
                  <input
                    className="checkout__promo-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    type="number"
                    inputMode="numeric"
                    placeholder={t.checkout_change_placeholder}
                    value={changeFrom}
                    onChange={e => setChangeFrom(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="checkout__promo-wrap">
            <div className="checkout__label" style={{ marginTop: 20 }}>{t.checkout_promo_label}</div>
            {promoApplied ? (
              <div className="checkout__promo-applied">
                <span>{t.checkout_promo_applied(promoApplied.code)}</span>
                <button onClick={() => { setPromoApplied(null); setPromoInput(""); }}>✕</button>
              </div>
            ) : (
              <div className="checkout__promo-row">
                <input
                  className="checkout__promo-input"
                  placeholder={t.checkout_promo_placeholder}
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(""); }}
                />
                <button
                  className="checkout__promo-btn"
                  disabled={!promoInput.trim() || promoLoading}
                  onClick={applyPromo}
                >
                  {promoLoading ? "..." : "OK"}
                </button>
              </div>
            )}
            {promoError && <div className="checkout__promo-error">{promoError}</div>}
          </div>

          <button
            className="checkout__next"
            onClick={() => { haptic("light"); setStep("confirm"); }}
          >
            {t.checkout_next}
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="checkout__body">
          <div className="checkout__label">{t.checkout_your_order}</div>

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
              <span>{t.cart_items(totalQty)}</span>
              <span>{total} {currency}</span>
            </div>
            {deliveryType === "delivery" && (
              <div className="checkout-summary__row">
                <span>{t.checkout_delivery}</span>
                <span className={freeShip ? "checkout-summary__free" : ""}>
                  {freeShip ? `${t.checkout_free} 🎁` : `+${shipFee} ${currency}`}
                </span>
              </div>
            )}
            {deliveryType === "pickup" && (
              <div className="checkout-summary__row">
                <span>{t.checkout_pickup}</span>
                <span className="checkout-summary__free">{t.checkout_free}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="checkout-summary__row" style={{ color: "#4caf50" }}>
                <span>🎟 {promoApplied?.code}</span>
                <span>−{discount} {currency}</span>
              </div>
            )}
            <div className="checkout-summary__total">
              <span>{t.cart_total}</span>
              <span>{finalTotal} {currency}</span>
            </div>

            <div className="checkout-summary__divider" />

            <div className="checkout-summary__meta">
              {deliveryType === "delivery"
                ? <span>📍 {address}</span>
                : <span>🏠 {t.checkout_pickup}</span>
              }
              <span>
                {payment === "cash"
                  ? `💵 ${t.checkout_cash}${changeOption === "yes" ? ` · ${t.checkout_change_yes}${changeFrom ? ` (${changeFrom})` : ""}` : ` · ${t.checkout_change_no}`}`
                  : `💳 ${t.checkout_card}`
                }
              </span>
            </div>
          </div>

          <button
            className="checkout__place"
            disabled={placing}
            onClick={placeOrder}
          >
            {placing ? t.checkout_placing : t.checkout_place(finalTotal, currency)}
          </button>
        </div>
      )}
    </div>
  );
}
