import { createContext, useContext, useState, type ReactNode } from "react";
import type { Category, Hero, Product } from "../types";
import { CATEGORIES, PRODUCTS } from "../data/catalog";

const LS_HERO = "mm_hero_v1";

const DEFAULT_HERO: Hero = {
  visible: true,
  tag: "НОВИНКА",
  title: "Elf Bar\nSweet King",
  subtitle: "30 000 затяжек · 4 вкуса",
};

function loadHero(): Hero {
  try {
    const v = localStorage.getItem(LS_HERO);
    return v ? (JSON.parse(v) as Hero) : DEFAULT_HERO;
  } catch { return DEFAULT_HERO; }
}

const LS_CATS = "mm_cats_v4";
const LS_PRODS = "mm_prods_v4";

// Old category IDs → new ones
const CAT_MAP: Record<string, string> = {
  "disposable-high":  "elfbar",   // will be refined per product below
  "disposable-ultra": "waka",
  "cigarettes":       "chapman",
  "puffs-2000-18000": "elfbar",
  "puffs-23000-50000": "elfbar",
};

function remapCategoryId(productId: string, oldCatId: string): string {
  if (productId.startsWith("waka"))     return "waka";
  if (productId.startsWith("ebcreate")) return "ebcreate";
  if (productId.startsWith("chapman"))  return "chapman";
  if (productId.startsWith("elfbar"))   return "elfbar";
  return CAT_MAP[oldCatId] ?? oldCatId;
}

function migrateProducts(raw: unknown[]): Product[] {
  return raw.map((p: any) => {
    // remap old category IDs to new brand-based ones
    const categoryId = remapCategoryId(p.id ?? "", p.categoryId ?? "");
    // migrate old single-flavor field
    if (!p.flavors && p.flavor !== undefined) {
      const { flavor, ...rest } = p;
      return {
        ...rest,
        categoryId,
        flavors: flavor ? [{ id: `fv-${p.id}`, name: flavor, inStock: p.inStock ?? true }] : [],
      } as Product;
    }
    return { ...p, categoryId } as Product;
  });
}

function loadRaw(key: string): unknown[] | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as unknown[]) : null;
  } catch { return null; }
}

function persist<T>(key: string, data: T[]) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { }
}

function loadProducts(): Product[] {
  // Try current key first
  const current = loadRaw(LS_PRODS);
  if (current) return migrateProducts(current);

  // Recover from previous versions (user had images stored there)
  for (const oldKey of ["mm_prods_v3", "mm_prods_v2", "mm_prods_v1"]) {
    const old = loadRaw(oldKey);
    if (old) {
      const migrated = migrateProducts(old);
      persist(LS_PRODS, migrated);   // save under new key
      return migrated;
    }
  }

  return PRODUCTS;
}

function loadCategories(): Category[] {
  const current = loadRaw(LS_CATS);
  if (current) return current as Category[];
  return CATEGORIES;
}

interface CatalogCtx {
  categories: Category[];
  products: Product[];
  hero: Hero;
  addCategory: (c: Omit<Category, "id">) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  productsByCategory: (catId: string) => Product[];
  updateHero: (h: Hero) => void;
  resetToDefaults: () => void;
}

const Ctx = createContext<CatalogCtx | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(loadCategories);
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [hero, setHero] = useState<Hero>(loadHero);

  function setCats(next: Category[]) { setCategories(next); persist(LS_CATS, next); }
  function setProds(next: Product[]) { setProducts(next); persist(LS_PRODS, next); }
  function updateHero(next: Hero) {
    setHero(next);
    try { localStorage.setItem(LS_HERO, JSON.stringify(next)); } catch { }
  }

  const addCategory = (c: Omit<Category, "id">) =>
    setCats([...categories, { ...c, id: `cat-${Date.now()}` }]);

  const updateCategory = (c: Category) =>
    setCats(categories.map((x) => (x.id === c.id ? c : x)));

  const deleteCategory = (id: string) => {
    setCats(categories.filter((x) => x.id !== id));
    setProds(products.filter((x) => x.categoryId !== id));
  };

  const addProduct = (p: Omit<Product, "id">) =>
    setProds([...products, { ...p, id: `prod-${Date.now()}` }]);

  const updateProduct = (p: Product) =>
    setProds(products.map((x) => (x.id === p.id ? p : x)));

  const deleteProduct = (id: string) =>
    setProds(products.filter((x) => x.id !== id));

  const productsByCategory = (catId: string) =>
    products.filter((p) => p.categoryId === catId);

  const resetToDefaults = () => { setCats(CATEGORIES); setProds(PRODUCTS); };

  return (
    <Ctx.Provider value={{
      categories, products, hero,
      addCategory, updateCategory, deleteCategory,
      addProduct, updateProduct, deleteProduct,
      productsByCategory, updateHero, resetToDefaults,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCatalog() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCatalog must be inside CatalogProvider");
  return c;
}
