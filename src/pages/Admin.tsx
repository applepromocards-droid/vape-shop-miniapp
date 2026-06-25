import { useState, useRef, useEffect } from "react";
import type { Category, Flavor, Hero, Product } from "../types";
import { useCatalog } from "../context/CatalogContext";
import { getInitData } from "../telegram";

type Mode = "cats" | "prods" | "banner" | "cat-form" | "prod-form" | "promos" | "orders";

type CatForm = { id?: string; title: string; subtitle: string; emoji: string; image?: string };
type ProdForm = {
  id?: string;
  title: string;
  titleEn: string;
  price: number;
  currency: string;
  emoji: string;
  categoryId: string;
  puffs: number;
  badge: string;
  inStock: boolean;
  image?: string;
  flavors: Array<{ id: string; name: string; inStock: boolean }>;
};

const BLANK_CAT: CatForm = { title: "", subtitle: "", emoji: "🛒", image: undefined };
const blankProd = (catId = ""): ProdForm => ({
  title: "", titleEn: "", price: 0, currency: "€",
  emoji: "📦", categoryId: catId, puffs: 0, badge: "", inStock: true,
  image: undefined, flavors: [],
});

type HeroForm = Pick<Hero, "visible" | "tag" | "title" | "titleEn" | "subtitle" | "subtitleEn"> & {
  image?: string;
  imagePosition?: { x: number; y: number };
  imageZoom?: number;
};

function resizeImage(file: File, maxPx: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export function Admin({ onClose }: { onClose: () => void }) {
  const {
    categories, products, hero,
    addCategory, updateCategory, deleteCategory,
    addProduct, updateProduct, deleteProduct,
    updateHero, resetToDefaults,
  } = useCatalog();

  const [mode, setMode] = useState<Mode>("cats");
  const [returnMode, setReturnMode] = useState<Mode>("prods");

  // Promos state
  type Promo = { id: string; code: string; type: string; value: number; minOrder: number | null; active: boolean };
  const [promos, setPromos] = useState<Promo[]>([]);
  const [promoForm, setPromoForm] = useState({ code: "", type: "free_delivery", value: "", minOrder: "" });
  const [promoLoading, setPromoLoading] = useState(false);

  // Orders state
  type OrderItem = { title: string; flavor?: string; qty: number; price: number; currency: string };
  type AdminOrder = { id: string; tgName: string | null; tgUsername: string | null; tgUserId: string; items: OrderItem[]; subtotal: number; delivery: boolean; address: string | null; payment: string; promoCode: string | null; discount: number | null; status: string; createdAt: string };
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState<"all" | "new" | "done" | "cancelled">("all");
  const [catForm, setCatForm] = useState<CatForm>(BLANK_CAT);
  const [prodForm, setProdForm] = useState<ProdForm>(blankProd());
  const [heroForm, setHeroForm] = useState<HeroForm>({
    visible: hero.visible,
    tag: hero.tag,
    title: hero.title,
    titleEn: hero.titleEn ?? "",
    subtitle: hero.subtitle,
    subtitleEn: hero.subtitleEn ?? "",
    image: hero.image,
    imagePosition: hero.imagePosition,
    imageZoom: hero.imageZoom ?? 200,
  });
  const imgRef = useRef<HTMLInputElement>(null);
  const catImgRef = useRef<HTMLInputElement>(null);
  const heroImgRef = useRef<HTMLInputElement>(null);

  /* ── Hero image drag-to-reposition ── */
  const heroPrevRef  = useRef<HTMLDivElement>(null);
  const heroDragging = useRef(false);
  const heroLast     = useRef({ x: 0, y: 0 });
  // Natural dims of the uploaded image — set in handleHeroImg after resizing
  const heroNatural  = useRef<{ w: number; h: number } | null>(null);

  const heroPos = heroForm.imagePosition ?? { x: 50, y: 30 };

  // Stable move handler ref — reassigned each render so closure always sees latest nat/form
  const heroMoveRef = useRef<(x: number, y: number) => void>(() => {});
  heroMoveRef.current = (clientX: number, clientY: number) => {
    if (!heroDragging.current) return;
    const dx = clientX - heroLast.current.x;
    const dy = clientY - heroLast.current.y;
    heroLast.current = { x: clientX, y: clientY };
    if (dx === 0 && dy === 0) return;

    const nat = heroNatural.current;
    const el  = heroPrevRef.current;
    let dxPct = 0;
    let dyPct = 0;

    if (nat && el) {
      const cw    = el.getBoundingClientRect().width;
      const ch    = el.getBoundingClientRect().height;
      const zoom  = heroForm.imageZoom ?? 200;
      const dispW = cw * (zoom / 100);
      const dispH = dispW * (nat.h / nat.w);
      const ovX   = dispW - cw;
      const ovY   = dispH - ch;
      // Works for both zoom > 100% (image overflows) and zoom < 100% (image smaller, floats freely)
      // When ovX < 0 the sign flips and drag direction matches visual naturally
      if (ovX !== 0) dxPct = -(dx / ovX) * 100;
      if (ovY !== 0) dyPct = -(dy / ovY) * 100;
    } else {
      dxPct = -dx * 0.3;
      dyPct = -dy * 0.5;
    }

    setHeroForm((f) => ({
      ...f,
      imagePosition: {
        x: Math.max(0, Math.min(100, (f.imagePosition?.x ?? 50) + dxPct)),
        y: Math.max(0, Math.min(100, (f.imagePosition?.y ?? 30) + dyPct)),
      },
    }));
  };

  // Global mouse listeners so drag keeps working even when cursor leaves the preview
  useEffect(() => {
    const onMove = (e: MouseEvent) => heroMoveRef.current(e.clientX, e.clientY);
    const onUp   = () => { heroDragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  // Non-passive touchmove — must be attached imperatively to preventDefault page scroll
  useEffect(() => {
    if (mode !== "banner") return;
    const el = heroPrevRef.current;
    if (!el) return;
    const onTouch = (e: TouchEvent) => {
      if (!heroDragging.current) return;
      e.preventDefault();
      heroMoveRef.current(e.touches[0].clientX, e.touches[0].clientY);
    };
    el.addEventListener("touchmove", onTouch, { passive: false });
    return () => el.removeEventListener("touchmove", onTouch);
  }, [mode]);

  /* ── Category actions ── */
  const openNewCat = () => { setCatForm(BLANK_CAT); setMode("cat-form"); };
  const openEditCat = (c: Category) => {
    setCatForm({ id: c.id, title: c.title, subtitle: c.subtitle ?? "", emoji: c.emoji, image: c.image });
    setMode("cat-form");
  };
  const saveCat = async () => {
    if (!catForm.title.trim()) return;
    const data = {
      title: catForm.title.trim(),
      subtitle: catForm.subtitle.trim() || undefined,
      emoji: catForm.emoji || "🛒",
      image: catForm.image || undefined,
    };
    if (catForm.id) await updateCategory({ ...data, id: catForm.id });
    else await addCategory(data);
    setMode("cats");
  };

  /* ── Product actions ── */
  const openNewProd = () => {
    setProdForm(blankProd(categories[0]?.id ?? ""));
    setReturnMode("prods");
    setMode("prod-form");
  };
  const openNewProdForCat = (catId: string) => {
    setProdForm(blankProd(catId));
    setReturnMode("cat-form");
    setMode("prod-form");
  };
  const openEditProd = (p: Product, from: Mode = "prods") => {
    setProdForm({
      id: p.id, title: p.title, titleEn: p.titleEn ?? "",
      price: p.price, currency: p.currency, emoji: p.emoji,
      categoryId: p.categoryId, puffs: p.puffs ?? 0,
      badge: p.badge ?? "", inStock: p.inStock,
      image: p.image,
      flavors: p.flavors?.map((f) => ({ ...f })) ?? [],
    });
    setReturnMode(from);
    setMode("prod-form");
  };
  const saveProd = async () => {
    if (!prodForm.title.trim() || !prodForm.categoryId) return;
    const flavors: Flavor[] = prodForm.flavors
      .filter((f) => f.name.trim())
      .map((f) => ({ ...f, name: f.name.trim() }));
    const data: Omit<Product, "id"> = {
      title: prodForm.title.trim(),
      titleEn: prodForm.titleEn.trim() || undefined,
      price: Number(prodForm.price) || 0,
      currency: prodForm.currency || "€",
      emoji: prodForm.emoji || "📦",
      categoryId: prodForm.categoryId,
      puffs: prodForm.puffs || undefined,
      badge: prodForm.badge.trim() || undefined,
      inStock: flavors.length > 0 ? flavors.some((f) => f.inStock) : prodForm.inStock,
      image: prodForm.image || undefined,
      flavors: flavors.length > 0 ? flavors : undefined,
    };
    if (prodForm.id) await updateProduct({ ...data, id: prodForm.id });
    else await addProduct(data);
    setMode(returnMode);
  };

  /* ── Flavor helpers ── */
  const addFlavor = () =>
    setProdForm((f) => ({
      ...f,
      flavors: [...f.flavors, { id: `fv-${Date.now()}`, name: "", inStock: true }],
    }));
  const updateFlavor = (idx: number, patch: Partial<{ name: string; inStock: boolean }>) =>
    setProdForm((f) => ({
      ...f,
      flavors: f.flavors.map((fl, i) => i === idx ? { ...fl, ...patch } : fl),
    }));
  const removeFlavor = (idx: number) =>
    setProdForm((f) => ({ ...f, flavors: f.flavors.filter((_, i) => i !== idx) }));

  /* ── Image upload ── */
  const handleImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, 600);
    setProdForm((f) => ({ ...f, image: dataUrl }));
    if (imgRef.current) imgRef.current.value = "";
  };
  const handleCatImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, 800);
    setCatForm((f) => ({ ...f, image: dataUrl }));
    if (catImgRef.current) catImgRef.current.value = "";
  };

  const handleHeroImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImage(file, 800);
    // Decode to get natural dims for accurate drag math
    const tmp = new window.Image();
    tmp.onload = () => { heroNatural.current = { w: tmp.naturalWidth, h: tmp.naturalHeight }; };
    tmp.src = dataUrl;
    setHeroForm((f) => ({ ...f, image: dataUrl, imagePosition: { x: 50, y: 30 }, imageZoom: 200 }));
    if (heroImgRef.current) heroImgRef.current.value = "";
  };
  const saveHero = () => {
    updateHero({
      visible: heroForm.visible,
      tag: heroForm.tag.trim(),
      title: heroForm.title,
      titleEn: heroForm.titleEn?.trim() || undefined,
      subtitle: heroForm.subtitle.trim(),
      subtitleEn: heroForm.subtitleEn?.trim() || undefined,
      image: heroForm.image || undefined,
      imagePosition: heroForm.image ? (heroForm.imagePosition ?? { x: 50, y: 30 }) : undefined,
      imageZoom: heroForm.image ? (heroForm.imageZoom ?? 200) : undefined,
    });
  };

  /* ── Promos ── */
  const loadPromos = async () => {
    const data = await fetch("/api/promos", { headers: { "x-telegram-init-data": getInitData() } }).then(r => r.json());
    setPromos(data);
  };
  const createPromo = async () => {
    if (!promoForm.code.trim()) return;
    setPromoLoading(true);
    await fetch("/api/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-telegram-init-data": getInitData() },
      body: JSON.stringify({
        code: promoForm.code,
        type: promoForm.type,
        value: Number(promoForm.value) || 0,
        minOrder: promoForm.minOrder ? Number(promoForm.minOrder) : null,
      }),
    });
    setPromoForm({ code: "", type: "free_delivery", value: "", minOrder: "" });
    await loadPromos();
    setPromoLoading(false);
  };
  const deletePromo = async (id: string) => {
    await fetch(`/api/promos/${id}`, { method: "DELETE", headers: { "x-telegram-init-data": getInitData() } });
    setPromos(prev => prev.filter(p => p.id !== id));
  };

  /* ── Orders (admin) ── */
  const loadOrders = async () => {
    setOrdersLoading(true);
    const data = await fetch("/api/orders/all", { headers: { "x-telegram-init-data": getInitData() } }).then(r => r.json());
    setAdminOrders(data);
    setOrdersLoading(false);
  };
  const updateOrderStatus = async (id: string, status: "done" | "cancelled") => {
    await fetch(`/api/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-telegram-init-data": getInitData() },
      body: JSON.stringify({ status }),
    });
    setAdminOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  /* ── Back logic ── */
  const handleBack = () => {
    if (mode === "cat-form") { setMode("cats"); return; }
    if (mode === "prod-form") { setMode(returnMode); return; }
    onClose();
  };

  const title =
    mode === "cats"    ? "Управление" :
    mode === "prods"   ? "Управление" :
    mode === "banner"  ? "Управление" :
    mode === "cat-form" ? (catForm.id ? "Редактировать категорию" : "Новая категория") :
    (prodForm.id ? "Редактировать товар" : "Новый товар");

  return (
    <div className="admin">
      <div className="admin__header">
        <button className="page-header__back" onClick={handleBack}>‹</button>
        <h1 className="page-header__title">{title}</h1>
      </div>

      {/* Tab switcher */}
      {(mode === "cats" || mode === "prods" || mode === "banner" || mode === "promos" || mode === "orders") && (
        <div className="admin-tabs admin-tabs--scroll">
          <button className={`admin-tab${mode === "cats" ? " is-active" : ""}`} onClick={() => setMode("cats")}>
            Категории
          </button>
          <button className={`admin-tab${mode === "prods" ? " is-active" : ""}`} onClick={() => setMode("prods")}>
            Товары
          </button>
          <button className={`admin-tab${mode === "banner" ? " is-active" : ""}`} onClick={() => {
            if (hero.image) {
              const tmp = new window.Image();
              tmp.onload = () => { heroNatural.current = { w: tmp.naturalWidth, h: tmp.naturalHeight }; };
              tmp.src = hero.image;
            }
            setHeroForm({ visible: hero.visible, tag: hero.tag, title: hero.title, titleEn: hero.titleEn ?? "", subtitle: hero.subtitle, subtitleEn: hero.subtitleEn ?? "", image: hero.image, imagePosition: hero.imagePosition, imageZoom: hero.imageZoom ?? 200 });
            setMode("banner");
          }}>
            Новинки
          </button>
          <button className={`admin-tab${mode === "promos" ? " is-active" : ""}`} onClick={() => { setMode("promos"); loadPromos(); }}>
            Промокоды
          </button>
          <button className={`admin-tab${mode === "orders" ? " is-active" : ""}`} onClick={() => { setMode("orders"); loadOrders(); }}>
            Заказы
          </button>
        </div>
      )}

      {/* ─── Category list ─── */}
      {mode === "cats" && (
        <div className="admin-list">
          {categories.map((c) => (
            <div key={c.id} className="admin-item">
              <div className="admin-item__info">
                <span className="admin-item__emoji">{c.emoji}</span>
                <div>
                  <div className="admin-item__title">{c.title}</div>
                  {c.subtitle && <div className="admin-item__sub">{c.subtitle}</div>}
                </div>
              </div>
              <div className="admin-item__actions">
                <button className="admin-btn admin-btn--edit" onClick={() => openEditCat(c)}>✏️</button>
                <button className="admin-btn admin-btn--del" onClick={() => {
                  if (window.confirm(`Удалить категорию «${c.title}» и все её товары?`))
                    deleteCategory(c.id);
                }}>🗑</button>
              </div>
            </div>
          ))}
          <button className="admin-add-btn" onClick={openNewCat}>+ Добавить категорию</button>
          <button className="admin-reset-btn" onClick={() => {
            if (window.confirm("Сбросить всё к исходным данным?")) resetToDefaults();
          }}>↺ Сбросить к исходным данным</button>
        </div>
      )}

      {/* ─── Product list ─── */}
      {mode === "prods" && (
        <div className="admin-list">
          {products.map((p) => {
            const cat = categories.find((c) => c.id === p.categoryId);
            const inStockFlavors = p.flavors?.filter((f) => f.inStock).length ?? 0;
            const totalFlavors = p.flavors?.length ?? 0;
            return (
              <div key={p.id} className="admin-item">
                <div className="admin-item__info">
                  <div className="admin-item__thumb">
                    {p.image
                      ? <img src={p.image} alt="" className="admin-item__thumb-img" />
                      : <span>{p.emoji}</span>
                    }
                  </div>
                  <div>
                    <div className="admin-item__title">{p.title}</div>
                    <div className="admin-item__sub">
                      {cat?.title ?? "—"} · {p.price} {p.currency}
                      {totalFlavors > 0 && ` · ${inStockFlavors}/${totalFlavors} вкусов`}
                    </div>
                  </div>
                </div>
                <div className="admin-item__actions">
                  <button className="admin-btn admin-btn--edit" onClick={() => openEditProd(p)}>✏️</button>
                  <button className="admin-btn admin-btn--del" onClick={() => {
                    if (window.confirm(`Удалить «${p.title}»?`)) deleteProduct(p.id);
                  }}>🗑</button>
                </div>
              </div>
            );
          })}
          <button className="admin-add-btn" onClick={openNewProd}>+ Добавить товар</button>
          <button className="admin-reset-btn" onClick={() => {
            if (window.confirm("Сбросить всё к исходным данным?")) resetToDefaults();
          }}>↺ Сбросить к исходным данным</button>
        </div>
      )}

      {/* ─── Banner / Новинки form ─── */}
      {mode === "banner" && (
        <div className="admin-form">
          {/* Show/Hide toggle */}
          <div className="admin-field admin-field--inline">
            <label className="admin-label">Показывать баннер</label>
            <button
              className={`admin-toggle${heroForm.visible ? " admin-toggle--on" : ""}`}
              onClick={() => setHeroForm((f) => ({ ...f, visible: !f.visible }))}
            >
              {heroForm.visible ? "Включён" : "Скрыт"}
            </button>
          </div>

          {/* Hero image upload (simple) */}
          <div className="admin-field">
            <label className="admin-label">Фото для баннера</label>
            <div className="admin-img-wrap admin-img-wrap--hero" onClick={() => heroImgRef.current?.click()}>
              {heroForm.image ? (
                <>
                  <img src={heroForm.image} alt="" className="admin-img-preview" draggable={false} />
                  <button
                    className="admin-img-remove"
                    onClick={(e) => { e.stopPropagation(); setHeroForm((f) => ({ ...f, image: undefined, imagePosition: undefined })); }}
                  >✕</button>
                </>
              ) : (
                <div className="admin-img-placeholder">
                  <span className="admin-img-icon">🖼️</span>
                  <span>Нажмите, чтобы загрузить фото</span>
                </div>
              )}
              <input ref={heroImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleHeroImg} />
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-label">Тег (напр. НОВИНКА, ХИТ)</label>
            <input
              className="admin-input"
              value={heroForm.tag}
              onChange={(e) => setHeroForm((f) => ({ ...f, tag: e.target.value }))}
              placeholder="НОВИНКА"
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Название товара (RU)</label>
            <textarea
              className="admin-input admin-textarea"
              value={heroForm.title}
              onChange={(e) => setHeroForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={"Elf Bar\nSweet King"}
              rows={2}
            />
            <span className="admin-hint">Новая строка — перенос в баннере</span>
          </div>

          <div className="admin-field">
            <label className="admin-label">Название товара (EN) <span className="admin-hint-inline">необязательно</span></label>
            <textarea
              className="admin-input admin-textarea"
              value={heroForm.titleEn ?? ""}
              onChange={(e) => setHeroForm((f) => ({ ...f, titleEn: e.target.value }))}
              placeholder={"Elf Bar\nSweet King"}
              rows={2}
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Подпись (RU)</label>
            <input
              className="admin-input"
              value={heroForm.subtitle}
              onChange={(e) => setHeroForm((f) => ({ ...f, subtitle: e.target.value }))}
              placeholder="30 000 затяжек · 4 вкуса"
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Подпись (EN) <span className="admin-hint-inline">необязательно</span></label>
            <input
              className="admin-input"
              value={heroForm.subtitleEn ?? ""}
              onChange={(e) => setHeroForm((f) => ({ ...f, subtitleEn: e.target.value }))}
              placeholder="30,000 puffs · 4 flavors"
            />
          </div>

          {/* Draggable preview */}
          <div className="admin-field">
            <label className="admin-label">
              Предпросмотр
              {heroForm.image && <span className="admin-label-hint"> — тяни фото, чтобы выровнять</span>}
            </label>
            <div
              ref={heroPrevRef}
              className={`mm-hero admin-hero-preview${heroForm.image ? " admin-hero-preview--drag" : ""}`}
              onMouseDown={heroForm.image ? (e) => { e.preventDefault(); heroDragging.current = true; heroLast.current = { x: e.clientX, y: e.clientY }; } : undefined}
              onTouchStart={heroForm.image ? (e) => { e.preventDefault(); heroDragging.current = true; heroLast.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } : undefined}
              onTouchEnd={() => { heroDragging.current = false; }}
            >
              {heroForm.image && (
                <div className="mm-hero__pic-clip">
                  <div
                    className="mm-hero__bg-div"
                    style={{
                      backgroundImage: `url(${heroForm.image})`,
                      backgroundPosition: `${heroPos.x}% ${heroPos.y}%`,
                      backgroundSize: `${heroForm.imageZoom ?? 200}% auto`,
                    }}
                  />
                </div>
              )}
              <div className="mm-hero__content" style={{ pointerEvents: "none" }}>
                {heroForm.tag && <span className="mm-hero__tag">{heroForm.tag}</span>}
                <div className="mm-hero__name" style={{ whiteSpace: "pre-line" }}>{heroForm.title || "Название товара"}</div>
                {heroForm.subtitle && <div className="mm-hero__sub">{heroForm.subtitle}</div>}
              </div>
              {heroForm.image && <span className="admin-hero-drag-icon">⇔</span>}
            </div>
            {heroForm.image && (
              <div className="admin-zoom-row">
                <button
                  className="admin-zoom-btn"
                  onClick={() => setHeroForm((f) => ({ ...f, imageZoom: Math.max(30, (f.imageZoom ?? 200) - 10) }))}
                >−</button>
                <span className="admin-zoom-label">{heroForm.imageZoom ?? 200}%</span>
                <button
                  className="admin-zoom-btn"
                  onClick={() => setHeroForm((f) => ({ ...f, imageZoom: Math.min(500, (f.imageZoom ?? 200) + 10) }))}
                >+</button>
              </div>
            )}
          </div>

          <div className="admin-form-actions">
            <button className="btn btn--primary" style={{ flex: 1 }} onClick={saveHero}>
              Сохранить баннер
            </button>
          </div>
        </div>
      )}

      {/* ─── Category form ─── */}
      {mode === "cat-form" && (
        <div className="admin-form">
          {/* Category image */}
          <div className="admin-field">
            <label className="admin-label">Фото категории</label>
            <div className="admin-img-wrap admin-img-wrap--cat" onClick={() => catImgRef.current?.click()}>
              {catForm.image ? (
                <>
                  <img src={catForm.image} alt="" className="admin-img-preview" />
                  <button
                    className="admin-img-remove"
                    onClick={(e) => { e.stopPropagation(); setCatForm((f) => ({ ...f, image: undefined })); }}
                  >✕</button>
                </>
              ) : (
                <div className="admin-img-placeholder">
                  <span className="admin-img-icon">🖼️</span>
                  <span>Фото для карточки категории</span>
                </div>
              )}
              <input ref={catImgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCatImg} />
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-label">Название *</label>
            <input
              className="admin-input"
              value={catForm.title}
              onChange={(e) => setCatForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Название категории"
              autoFocus
            />
          </div>
          <div className="admin-field">
            <label className="admin-label">Подзаголовок</label>
            <input
              className="admin-input"
              value={catForm.subtitle}
              onChange={(e) => setCatForm((f) => ({ ...f, subtitle: e.target.value }))}
              placeholder="Например: PUFFS"
            />
          </div>
          <div className="admin-field">
            <label className="admin-label">Эмодзи</label>
            <input
              className="admin-input"
              value={catForm.emoji}
              onChange={(e) => setCatForm((f) => ({ ...f, emoji: e.target.value }))}
              placeholder="🛒"
            />
          </div>
          <div className="admin-form-actions">
            <button className="btn btn--ghost" onClick={() => setMode("cats")}>Отмена</button>
            <button className="btn btn--primary" onClick={saveCat} disabled={!catForm.title.trim()}>
              Сохранить
            </button>
          </div>

          {/* Products in this category */}
          {catForm.id && (() => {
            const catProds = products.filter((p) => p.categoryId === catForm.id);
            return (
              <div className="admin-cat-prods">
                <div className="admin-label">
                  Товары в категории
                  <span className="admin-tab__count" style={{ marginLeft: 6 }}>{catProds.length}</span>
                </div>
                {catProds.map((p) => (
                  <div key={p.id} className="admin-item admin-item--compact">
                    <div className="admin-item__info">
                      <div className="admin-item__thumb" style={{ width: 32, height: 32 }}>
                        {p.image
                          ? <img src={p.image} alt="" className="admin-item__thumb-img" />
                          : <span style={{ fontSize: 18 }}>{p.emoji}</span>
                        }
                      </div>
                      <div>
                        <div className="admin-item__title" style={{ fontSize: 13 }}>{p.title}</div>
                        <div className="admin-item__sub" style={{ fontSize: 11 }}>{p.price} {p.currency}</div>
                      </div>
                    </div>
                    <div className="admin-item__actions">
                      <button className="admin-btn admin-btn--edit" onClick={() => openEditProd(p, "cat-form")}>✏️</button>
                      <button className="admin-btn admin-btn--del" onClick={() => {
                        if (window.confirm(`Удалить «${p.title}»?`)) deleteProduct(p.id);
                      }}>🗑</button>
                    </div>
                  </div>
                ))}
                <button className="admin-add-btn" style={{ marginTop: 8 }} onClick={() => openNewProdForCat(catForm.id!)}>
                  + Добавить товар в эту категорию
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── Product form ─── */}
      {mode === "prod-form" && (
        <div className="admin-form">

          {/* Image upload */}
          <div className="admin-field">
            <label className="admin-label">Фото товара</label>
            <div className="admin-img-wrap" onClick={() => imgRef.current?.click()}>
              {prodForm.image ? (
                <>
                  <img src={prodForm.image} alt="" className="admin-img-preview" />
                  <button
                    className="admin-img-remove"
                    onClick={(e) => { e.stopPropagation(); setProdForm((f) => ({ ...f, image: undefined })); }}
                  >✕</button>
                </>
              ) : (
                <div className="admin-img-placeholder">
                  <span className="admin-img-icon">📷</span>
                  <span>Нажмите, чтобы загрузить фото</span>
                </div>
              )}
              <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImg} />
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-label">Название (RU) *</label>
            <input
              className="admin-input"
              value={prodForm.title}
              onChange={(e) => setProdForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Elf Bar BC10000"
            />
          </div>

          <div className="admin-field">
            <label className="admin-label">Название (EN) <span className="admin-hint-inline">необязательно</span></label>
            <input
              className="admin-input"
              value={prodForm.titleEn}
              onChange={(e) => setProdForm((f) => ({ ...f, titleEn: e.target.value }))}
              placeholder="Elf Bar BC10000"
            />
          </div>

          <div className="admin-row">
            <div className="admin-field" style={{ flex: 1 }}>
              <label className="admin-label">Цена *</label>
              <input
                className="admin-input"
                type="number"
                inputMode="numeric"
                value={prodForm.price || ""}
                onChange={(e) => setProdForm((f) => ({ ...f, price: Number(e.target.value) }))}
                placeholder="25"
              />
            </div>
            <div className="admin-field" style={{ width: 72 }}>
              <label className="admin-label">Валюта</label>
              <input
                className="admin-input"
                value={prodForm.currency}
                onChange={(e) => setProdForm((f) => ({ ...f, currency: e.target.value }))}
                placeholder="€"
              />
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-label">Категория *</label>
            <select
              className="admin-input admin-select"
              value={prodForm.categoryId}
              onChange={(e) => setProdForm((f) => ({ ...f, categoryId: e.target.value }))}
            >
              <option value="">— выбрать —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.title}</option>
              ))}
            </select>
          </div>

          <div className="admin-row">
            <div className="admin-field" style={{ flex: 1 }}>
              <label className="admin-label">Эмодзи</label>
              <input
                className="admin-input"
                value={prodForm.emoji}
                onChange={(e) => setProdForm((f) => ({ ...f, emoji: e.target.value }))}
                placeholder="📦"
              />
            </div>
            <div className="admin-field" style={{ flex: 1 }}>
              <label className="admin-label">Бейдж (HIT, NEW…)</label>
              <input
                className="admin-input"
                value={prodForm.badge}
                onChange={(e) => setProdForm((f) => ({ ...f, badge: e.target.value }))}
                placeholder="HIT"
              />
            </div>
          </div>

          <div className="admin-field">
            <label className="admin-label">Затяжки (puffs)</label>
            <input
              className="admin-input"
              type="number"
              inputMode="numeric"
              value={prodForm.puffs || ""}
              onChange={(e) => setProdForm((f) => ({ ...f, puffs: Number(e.target.value) }))}
              placeholder="10000"
            />
          </div>

          {/* Flavor list */}
          <div className="admin-field">
            <label className="admin-label">
              Вкусы ({prodForm.flavors.length})
            </label>
            <div className="admin-flavor-list">
              {prodForm.flavors.map((fl, idx) => (
                <div key={fl.id} className="admin-flavor-row">
                  <input
                    className="admin-input admin-input--flavor"
                    value={fl.name}
                    onChange={(e) => updateFlavor(idx, { name: e.target.value })}
                    placeholder="Название вкуса"
                  />
                  <button
                    className={`admin-stock${fl.inStock ? " admin-stock--in" : " admin-stock--out"}`}
                    onClick={() => updateFlavor(idx, { inStock: !fl.inStock })}
                    title={fl.inStock ? "В наличии" : "Нет в наличии"}
                  >
                    {fl.inStock ? "✓" : "✗"}
                  </button>
                  <button
                    className="admin-btn admin-btn--del"
                    onClick={() => removeFlavor(idx)}
                  >🗑</button>
                </div>
              ))}
              <button className="admin-add-flavor-btn" onClick={addFlavor}>
                + Добавить вкус
              </button>
            </div>
          </div>

          {/* InStock toggle only when no flavors */}
          {prodForm.flavors.length === 0 && (
            <div className="admin-field admin-field--inline">
              <label className="admin-label">В наличии</label>
              <button
                className={`admin-toggle${prodForm.inStock ? " admin-toggle--on" : ""}`}
                onClick={() => setProdForm((f) => ({ ...f, inStock: !f.inStock }))}
              >
                {prodForm.inStock ? "Да — в наличии" : "Нет в наличии"}
              </button>
            </div>
          )}

          <div className="admin-form-actions">
            <button className="btn btn--ghost" onClick={() => setMode("prods")}>Отмена</button>
            <button
              className="btn btn--primary"
              onClick={saveProd}
              disabled={!prodForm.title.trim() || !prodForm.categoryId}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
      {/* ─── Promo codes ─── */}
      {mode === "promos" && (
        <div className="admin-list">
          <div className="admin-promo-form">
            <div className="admin-label">Новый промокод</div>
            <input className="admin-input" placeholder="Код (напр. SALE10)" value={promoForm.code}
              onChange={e => setPromoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
            <select className="admin-input admin-select" value={promoForm.type}
              onChange={e => setPromoForm(f => ({ ...f, type: e.target.value }))}>
              <option value="free_delivery">🚚 Бесплатная доставка</option>
              <option value="fixed">💰 Скидка на сумму (€)</option>
              <option value="percent">% Скидка на процент</option>
            </select>
            {promoForm.type !== "free_delivery" && (
              <input className="admin-input" type="number" placeholder={promoForm.type === "fixed" ? "Сумма скидки (€)" : "Процент скидки (%)"}
                value={promoForm.value} onChange={e => setPromoForm(f => ({ ...f, value: e.target.value }))} />
            )}
            <input className="admin-input" type="number" placeholder="Мин. сумма заказа (необязательно)"
              value={promoForm.minOrder} onChange={e => setPromoForm(f => ({ ...f, minOrder: e.target.value }))} />
            <button className="btn btn--primary" disabled={!promoForm.code.trim() || promoLoading} onClick={createPromo}>
              {promoLoading ? "Создание..." : "Создать промокод"}
            </button>
          </div>

          {promos.length === 0
            ? <p style={{ textAlign: "center", color: "var(--muted)", padding: 16 }}>Промокодов пока нет</p>
            : promos.map(p => (
              <div key={p.id} className="admin-item">
                <div className="admin-item__info">
                  <div>
                    <div className="admin-item__title">{p.code}</div>
                    <div className="admin-item__sub">
                      {p.type === "free_delivery" && "🚚 Бесплатная доставка"}
                      {p.type === "fixed"   && `💰 −${p.value} €`}
                      {p.type === "percent" && `% −${p.value}%`}
                      {p.minOrder ? ` · мин. ${p.minOrder} €` : ""}
                    </div>
                  </div>
                </div>
                <div className="admin-item__actions">
                  <button className="admin-btn admin-btn--del" onClick={() => {
                    if (window.confirm(`Удалить промокод «${p.code}»?`)) deletePromo(p.id);
                  }}>🗑</button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ─── Orders (admin) ─── */}
      {mode === "orders" && (
        <div className="admin-list">
          <div className="admin-order-filters">
            {(["all", "new", "done", "cancelled"] as const).map(f => (
              <button key={f} className={`admin-order-filter${ordersFilter === f ? " is-active" : ""}`}
                onClick={() => setOrdersFilter(f)}>
                {f === "all" ? "Все" : f === "new" ? "Новые" : f === "done" ? "Выполнены" : "Отменены"}
              </button>
            ))}
          </div>

          {ordersLoading && <p style={{ textAlign: "center", color: "var(--muted)", padding: 16 }}>Загрузка...</p>}

          {!ordersLoading && adminOrders.filter(o => ordersFilter === "all" || o.status === ordersFilter).length === 0 && (
            <p style={{ textAlign: "center", color: "var(--muted)", padding: 16 }}>Заказов нет</p>
          )}

          {adminOrders
            .filter(o => ordersFilter === "all" || o.status === ordersFilter)
            .map(order => {
              const currency = order.items[0]?.currency ?? "€";
              const qty = order.items.reduce((s, i) => s + i.qty, 0);
              const freeShip = qty >= 3;
              const shipFee = order.delivery && !freeShip ? 10 : 0;
              const total = order.subtotal + shipFee - (order.discount ?? 0);
              const date = new Date(order.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
              const who = [order.tgName, order.tgUsername ? `@${order.tgUsername}` : null].filter(Boolean).join(" ");

              return (
                <div key={order.id} className={`admin-order-card admin-order-card--${order.status}`}>
                  <div className="admin-order-card__header">
                    <span className="admin-order-card__id">#{order.id.slice(-6).toUpperCase()}</span>
                    <span className="admin-order-card__date">{date}</span>
                  </div>
                  <div className="admin-order-card__who">{who || `ID: ${order.tgUserId}`}</div>
                  <div className="admin-order-card__items">
                    {order.items.map((it, i) => (
                      <div key={i}>{it.title}{it.flavor ? ` · ${it.flavor}` : ""} ×{it.qty}</div>
                    ))}
                  </div>
                  <div className="admin-order-card__meta">
                    {order.delivery ? `🚚 ${order.address}` : "🏠 Самовывоз"}
                    {" · "}{order.payment === "cash" ? "💵" : "💳"}
                    {order.discount ? ` · 🎟 −${order.discount} ${currency}` : ""}
                    {" · "}<b>{total} {currency}</b>
                  </div>

                  {order.status === "new" && (
                    <div className="admin-order-card__actions">
                      <button className="admin-order-btn admin-order-btn--done"
                        onClick={() => updateOrderStatus(order.id, "done")}>✓ Выполнен</button>
                      <button className="admin-order-btn admin-order-btn--cancel"
                        onClick={() => updateOrderStatus(order.id, "cancelled")}>✕ Отменить</button>
                    </div>
                  )}
                  {order.status !== "new" && (
                    <div className={`admin-order-badge ${order.status === "done" ? "admin-order-badge--done" : "admin-order-badge--cancelled"}`}>
                      {order.status === "done" ? "✓ Выполнен" : "✕ Отменён"}
                    </div>
                  )}
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}
