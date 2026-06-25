import { useEffect, useState } from "react";
import { CatalogProvider } from "./context/CatalogContext";
import { CartProvider } from "./context/CartContext";
import { BottomNav, type Tab } from "./components/BottomNav";
import { AgeGate, isAgeConfirmed } from "./components/AgeGate";
import { Catalog } from "./pages/Catalog";
import { Favorites } from "./pages/Favorites";
import { Cart } from "./pages/Cart";
import { Profile } from "./pages/Profile";
import { Admin } from "./pages/Admin";
import { initTelegram } from "./telegram";

export default function App() {
  const [tab, setTab] = useState<Tab>("catalog");
  const [ageOk, setAgeOk] = useState(isAgeConfirmed());
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    initTelegram();
  }, []);

  if (!ageOk) {
    return (
      <CatalogProvider>
        <AgeGate onConfirm={() => setAgeOk(true)} />
      </CatalogProvider>
    );
  }

  return (
    <CatalogProvider>
      <CartProvider>
        {showAdmin ? (
          <Admin onClose={() => setShowAdmin(false)} />
        ) : (
          <div className="app">
            <main className="app__content">
              {tab === "catalog" && <Catalog />}
              {tab === "favorites" && <Favorites />}
              {tab === "cart" && <Cart />}
              {tab === "profile" && <Profile onOpenAdmin={() => setShowAdmin(true)} />}
            </main>
            <BottomNav active={tab} onChange={setTab} />
          </div>
        )}
      </CartProvider>
    </CatalogProvider>
  );
}
