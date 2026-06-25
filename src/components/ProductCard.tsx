import type { Product } from "../types";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { haptic } from "../telegram";

interface Props {
  product: Product;
  onSelectFlavor?: (p: Product) => void;
}

export function ProductCard({ product, onSelectFlavor }: Props) {
  const { add } = useCart();
  const { isFavorite, toggle } = useFavorites();

  const hasFlavors = (product.flavors?.length ?? 0) > 0;
  const anyInStock = hasFlavors
    ? (product.flavors?.some((f) => f.inStock) ?? false)
    : product.inStock;

  const inStockCount = product.flavors?.filter((f) => f.inStock).length ?? 0;
  const fav = isFavorite(product.id);

  return (
    <div className="prod-card">
      <div className="prod-card__thumb">
        {product.badge && <span className="prod-card__badge">{product.badge}</span>}
        <button
          className={`prod-card__fav${fav ? " prod-card__fav--active" : ""}`}
          onClick={(e) => { e.stopPropagation(); haptic("light"); toggle(product.id); }}
          aria-label={fav ? "Убрать из избранного" : "Добавить в избранное"}
        >
          {fav ? "♥" : "♡"}
        </button>
        {product.image
          ? <img src={product.image} alt={product.title} className="prod-card__img" />
          : <span className="prod-card__emoji">{product.emoji}</span>
        }
      </div>
      <div className="prod-card__body">
        <div className="prod-card__title">{product.title}</div>
        {hasFlavors ? (
          <div className="prod-card__flavors">
            {inStockCount > 0
              ? `${inStockCount} ${pluralFlavor(inStockCount)}`
              : <span className="prod-card__no-stock">Нет в наличии</span>
            }
          </div>
        ) : null}
        <div className="prod-card__row">
          <span className="prod-card__price">{product.price} {product.currency}</span>
          {hasFlavors ? (
            <button
              className="prod-card__pick"
              disabled={!anyInStock}
              onClick={() => onSelectFlavor?.(product)}
            >
              Выбрать
            </button>
          ) : (
            <button
              className="prod-card__add"
              disabled={!product.inStock}
              onClick={() => add(product)}
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function pluralFlavor(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return "вкус";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "вкуса";
  return "вкусов";
}
