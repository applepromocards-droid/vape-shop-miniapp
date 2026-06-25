import { useState } from "react";
import { useFavorites } from "../context/FavoritesContext";
import { useCatalog } from "../context/CatalogContext";
import { ProductCard } from "../components/ProductCard";
import { FlavorPicker } from "../components/FlavorPicker";
import type { Product } from "../types";

export function Favorites() {
  const { favorites } = useFavorites();
  const { products } = useCatalog();
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null);

  const favProducts = products.filter(p => favorites.has(p.id));

  return (
    <div>
      {pickerProduct && (
        <FlavorPicker product={pickerProduct} onClose={() => setPickerProduct(null)} />
      )}
      <div className="cart-page__title">Избранное</div>

      {favProducts.length === 0 ? (
        <div className="empty">
          <span className="empty__icon">♡</span>
          <div className="empty__title">Ничего не сохранено</div>
          <p>Нажмите ♡ на карточке товара, чтобы добавить в избранное</p>
        </div>
      ) : (
        <div className="prod-list">
          {favProducts.map(p => (
            <ProductCard key={p.id} product={p} onSelectFlavor={setPickerProduct} />
          ))}
        </div>
      )}
    </div>
  );
}
