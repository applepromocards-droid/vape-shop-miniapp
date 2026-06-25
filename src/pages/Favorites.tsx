import { useState } from "react";
import { useFavorites } from "../context/FavoritesContext";
import { useCatalog } from "../context/CatalogContext";
import { useI18n } from "../context/I18nContext";
import { ProductCard } from "../components/ProductCard";
import { FlavorPicker } from "../components/FlavorPicker";
import type { Product } from "../types";

export function Favorites() {
  const { favorites } = useFavorites();
  const { products } = useCatalog();
  const { t } = useI18n();
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null);

  const favProducts = products.filter(p => favorites.has(p.id));

  return (
    <div>
      {pickerProduct && (
        <FlavorPicker product={pickerProduct} onClose={() => setPickerProduct(null)} />
      )}
      <div className="cart-page__title">{t.fav_title}</div>

      {favProducts.length === 0 ? (
        <div className="empty">
          <span className="empty__icon">♡</span>
          <div className="empty__title">{t.fav_empty_title}</div>
          <p>{t.fav_empty_sub}</p>
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
