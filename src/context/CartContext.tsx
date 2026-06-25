import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { CartItem, Flavor, Product } from "../types";
import { haptic } from "../telegram";

interface CartCtx {
  items: CartItem[];
  add: (p: Product, flavor?: Flavor) => void;
  remove: (productId: string, flavorId?: string) => void;
  setQty: (productId: string, qty: number, flavorId?: string) => void;
  clear: () => void;
  count: number;
  total: number;
}

const Ctx = createContext<CartCtx | null>(null);

const makeKey = (productId: string, flavorId = "") => `${productId}:${flavorId}`;
const itemKey = (i: CartItem) => makeKey(i.product.id, i.flavor?.id);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = (p: Product, flavor?: Flavor) => {
    haptic("light");
    const key = makeKey(p.id, flavor?.id);
    setItems((prev) => {
      const ex = prev.find((i) => itemKey(i) === key);
      if (ex) return prev.map((i) => itemKey(i) === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product: p, flavor, qty: 1 }];
    });
  };

  const remove = (productId: string, flavorId?: string) => {
    const key = makeKey(productId, flavorId);
    setItems((prev) => prev.filter((i) => itemKey(i) !== key));
  };

  const setQty = (productId: string, qty: number, flavorId?: string) => {
    const key = makeKey(productId, flavorId);
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => itemKey(i) !== key)
        : prev.map((i) => itemKey(i) === key ? { ...i, qty } : i)
    );
  };

  const clear = () => setItems([]);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const total = useMemo(
    () => items.reduce((s, i) => s + i.qty * i.product.price, 0),
    [items]
  );

  return (
    <Ctx.Provider value={{ items, add, remove, setQty, clear, count, total }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
}
