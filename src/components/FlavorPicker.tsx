import { useCart } from "../context/CartContext";
import type { Flavor, Product } from "../types";
import { haptic } from "../telegram";

interface Props {
  product: Product;
  onClose: () => void;
}

export function FlavorPicker({ product, onClose }: Props) {
  const { add, items } = useCart();

  const getQty = (flavorId: string) =>
    items.find((i) => i.product.id === product.id && i.flavor?.id === flavorId)?.qty ?? 0;

  const handleAdd = (flavor: Flavor) => {
    if (!flavor.inStock) return;
    haptic("light");
    add(product, flavor);
  };

  return (
    <div className="flavor-overlay" onClick={onClose}>
      <div className="flavor-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Handle bar */}
        <div className="flavor-sheet__bar" />

        {/* Product info */}
        <div className="flavor-sheet__head">
          <div className="flavor-sheet__product">
            <div className="flavor-sheet__thumb">
              {product.image
                ? <img src={product.image} alt="" className="flavor-sheet__thumb-img" />
                : <span className="flavor-sheet__emoji">{product.emoji}</span>
              }
            </div>
            <div className="flavor-sheet__info">
              <div className="flavor-sheet__title">{product.title}</div>
              <div className="flavor-sheet__meta">
                {product.puffs && <span>{product.puffs.toLocaleString()} затяжек · </span>}
                <span>{product.price} {product.currency}</span>
              </div>
            </div>
          </div>
          <button className="flavor-sheet__close" onClick={onClose}>✕</button>
        </div>

        {/* Divider */}
        <div className="flavor-sheet__divider" />

        {/* Flavor list */}
        <div className="flavor-list">
          {(product.flavors ?? []).map((f) => {
            const qty = getQty(f.id);
            return (
              <div key={f.id} className={`flavor-item${f.inStock ? "" : " flavor-item--out"}`}>
                <span className="flavor-item__name">{f.name}</span>
                {f.inStock ? (
                  <div className="flavor-item__right">
                    {qty > 0 && <span className="flavor-item__qty">× {qty}</span>}
                    <button className="flavor-item__add" onClick={() => handleAdd(f)}>+</button>
                  </div>
                ) : (
                  <span className="flavor-item__none">Нет в наличии</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
