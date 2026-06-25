import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Category, Hero, Product } from "../types";
import { getInitData } from "../telegram";

const API = "/api";

const DEFAULT_HERO: Hero = {
  visible: true,
  tag: "НОВИНКА",
  title: "Elf Bar\nSweet King",
  subtitle: "30 000 затяжек · 4 вкуса",
};

function adminHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-telegram-init-data": getInitData(),
  };
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

interface CatalogCtx {
  categories: Category[];
  products: Product[];
  hero: Hero;
  loading: boolean;
  isAdmin: boolean;
  addCategory: (c: Omit<Category, "id">) => Promise<void>;
  updateCategory: (c: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addProduct: (p: Omit<Product, "id">) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  productsByCategory: (catId: string) => Product[];
  updateHero: (h: Hero) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const Ctx = createContext<CatalogCtx | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [hero, setHero]             = useState<Hero>(DEFAULT_HERO);
  const [loading, setLoading]       = useState(true);
  const [isAdmin, setIsAdmin]       = useState(false);

  useEffect(() => {
    const initData = getInitData();

    Promise.all([
      apiFetch<Category[]>(`${API}/categories`),
      apiFetch<Product[]>(`${API}/products`),
      apiFetch<Hero>(`${API}/hero`),
      apiFetch<{ isAdmin: boolean }>(`${API}/auth/is-admin`, {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({ initData }),
      }),
    ])
      .then(([cats, prods, h, adminRes]) => {
        setCategories(cats);
        setProducts(prods);
        setHero(h);
        setIsAdmin(adminRes.isAdmin);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addCategory = async (c: Omit<Category, "id">) => {
    const newCat = await apiFetch<Category>(`${API}/categories`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(c),
    });
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = async (c: Category) => {
    const updated = await apiFetch<Category>(`${API}/categories/${c.id}`, {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify(c),
    });
    setCategories((prev) => prev.map((x) => (x.id === c.id ? updated : x)));
  };

  const deleteCategory = async (id: string) => {
    await apiFetch(`${API}/categories/${id}`, { method: "DELETE", headers: adminHeaders() });
    setCategories((prev) => prev.filter((x) => x.id !== id));
    setProducts((prev) => prev.filter((x) => x.categoryId !== id));
  };

  const addProduct = async (p: Omit<Product, "id">) => {
    const newProd = await apiFetch<Product>(`${API}/products`, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(p),
    });
    setProducts((prev) => [...prev, newProd]);
  };

  const updateProduct = async (p: Product) => {
    const updated = await apiFetch<Product>(`${API}/products/${p.id}`, {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify(p),
    });
    setProducts((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
  };

  const deleteProduct = async (id: string) => {
    await apiFetch(`${API}/products/${id}`, { method: "DELETE", headers: adminHeaders() });
    setProducts((prev) => prev.filter((x) => x.id !== id));
  };

  const productsByCategory = (catId: string) =>
    products.filter((p) => p.categoryId === catId);

  const updateHero = async (h: Hero) => {
    await apiFetch(`${API}/hero`, {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify(h),
    });
    setHero(h);
  };

  const resetToDefaults = async () => {
    await apiFetch(`${API}/reset`, { method: "POST", headers: adminHeaders() });
    const [cats, prods, h] = await Promise.all([
      apiFetch<Category[]>(`${API}/categories`),
      apiFetch<Product[]>(`${API}/products`),
      apiFetch<Hero>(`${API}/hero`),
    ]);
    setCategories(cats);
    setProducts(prods);
    setHero(h);
  };

  return (
    <Ctx.Provider value={{
      categories, products, hero, loading, isAdmin,
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
