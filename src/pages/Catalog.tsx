import { useState, useEffect } from "react";
import { CategoryCard } from "../components/CategoryCard";
import { ProductCard } from "../components/ProductCard";
import { FlavorPicker } from "../components/FlavorPicker";
import { useCatalog } from "../context/CatalogContext";
import { getTg } from "../telegram";
import type { Product } from "../types";

const BRANDS = ["Все", "Elf Bar", "Lost Mary", "HQD", "Chaser"];

export function Catalog() {
  const { categories, productsByCategory, hero } = useCatalog();
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("Все");
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null);

  const category = categories.find((c) => c.id === openCat);

  useEffect(() => {
    const tg = getTg();
    if (!tg) return;
    const back = () => { setOpenCat(null); setBrand("Все"); };
    if (openCat) {
      tg.BackButton.show();
      tg.BackButton.onClick(back);
    } else {
      tg.BackButton.hide();
    }
    return () => tg.BackButton.offClick(back);
  }, [openCat]);

  if (category) {
    const allProducts = productsByCategory(category.id);
    const products = brand === "Все"
      ? allProducts
      : allProducts.filter((p) => p.title.toLowerCase().includes(brand.toLowerCase()));

    return (
      <div>
        {pickerProduct && (
          <FlavorPicker product={pickerProduct} onClose={() => setPickerProduct(null)} />
        )}
        <div className="page-header">
          <button className="page-header__back" onClick={() => { setOpenCat(null); setBrand("Все"); }}>
            ‹
          </button>
          <h1 className="page-header__title">{category.title} {category.subtitle}</h1>
        </div>

        <div className="filter-chips">
          {BRANDS.map((b) => (
            <button
              key={b}
              className={`chip ${brand === b ? "chip--active" : "chip--inactive"}`}
              onClick={() => setBrand(b)}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="prod-list">
          {products.length === 0 ? (
            <p className="empty" style={{ gridColumn: "1/-1" }}>Скоро здесь появятся товары.</p>
          ) : (
            products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelectFlavor={setPickerProduct}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  const filteredCats = search
    ? categories.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : categories;

  return (
    <div>
      <header className="mm-header">
        <div className="mm-header__brand">
          <div className="mm-header__logo">
            <img src="./logo.svg" alt="MMSMOKE" className="mm-header__logo-img" />
          </div>
          <div className="mm-header__name">MMSMOKE</div>
        </div>
        <button className="mm-header__btn" aria-label="Избранное">♡</button>
      </header>

      <div className="mm-search">
        <span className="mm-search__icon">⌕</span>
        <input
          className="mm-search__input"
          placeholder="Поиск вкусов и устройств…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!search && hero.visible && (
        <div className="mm-hero">
          {hero.image && (
            <div className="mm-hero__pic-clip">
              <div
                className="mm-hero__bg-div"
                style={{
                  backgroundImage: `url(${hero.image})`,
                  backgroundPosition: `${hero.imagePosition?.x ?? 50}% ${hero.imagePosition?.y ?? 30}%`,
                  backgroundSize: `${hero.imageZoom ?? 200}% auto`,
                }}
              />
            </div>
          )}
          <div className="mm-hero__content">
            {hero.tag && <span className="mm-hero__tag">{hero.tag}</span>}
            <div className="mm-hero__name" style={{ whiteSpace: "pre-line" }}>{hero.title}</div>
            {hero.subtitle && <div className="mm-hero__sub">{hero.subtitle}</div>}
          </div>
        </div>
      )}

      <div className="mm-section">
        <span className="mm-section__title">Категории</span>
        <button className="mm-section__link">все →</button>
      </div>

      <div className="cat-grid">
        {filteredCats.map((c) => (
          <CategoryCard key={c.id} category={c} onClick={() => setOpenCat(c.id)} />
        ))}
      </div>
    </div>
  );
}
