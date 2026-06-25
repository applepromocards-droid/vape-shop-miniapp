import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getInitData } from "../telegram";

interface FavCtx {
  favorites: Set<string>;
  toggle: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

const Ctx = createContext<FavCtx | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/favorites", { headers: { "x-telegram-init-data": getInitData() } })
      .then(r => r.ok ? r.json() : [])
      .then((ids: string[]) => setFavorites(new Set(ids)))
      .catch(() => {});
  }, []);

  const toggle = useCallback((productId: string) => {
    const isFav = favorites.has(productId);
    // Optimistic update
    setFavorites(prev => {
      const next = new Set(prev);
      isFav ? next.delete(productId) : next.add(productId);
      return next;
    });
    fetch(`/api/favorites/${productId}`, {
      method: isFav ? "DELETE" : "POST",
      headers: { "x-telegram-init-data": getInitData() },
    }).catch(() => {
      // Revert on error
      setFavorites(prev => {
        const next = new Set(prev);
        isFav ? next.add(productId) : next.delete(productId);
        return next;
      });
    });
  }, [favorites]);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  return <Ctx.Provider value={{ favorites, toggle, isFavorite }}>{children}</Ctx.Provider>;
}

export function useFavorites() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFavorites must be inside FavoritesProvider");
  return c;
}
