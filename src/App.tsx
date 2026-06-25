import { useEffect, useState } from "react";
import { CatalogProvider, useCatalog } from "./context/CatalogContext";
import { CartProvider } from "./context/CartContext";
import { BottomNav, type Tab } from "./components/BottomNav";
import { AgeGate, isAgeConfirmed } from "./components/AgeGate";
import { Catalog } from "./pages/Catalog";
import { Favorites } from "./pages/Favorites";
import { Cart } from "./pages/Cart";
import { Profile } from "./pages/Profile";
import { Admin } from "./pages/Admin";
import { initTelegram } from "./telegram";

function AppInner() {
  const { loading } = useCatalog();
  const [tab, setTab] = useState<Tab>("catalog");
  const [ageOk, setAgeOk] = useState(isAgeConfirmed());
  const [showAdmin, setShowAdmin] = useState(false);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0d0809" }}>
        <img src="./logo.svg" alt="" style={{ width: 56, opacity: 0.6 }} />
      </div>
    );
  }

  if (!ageOk) return <AgeGate onConfirm={() => setAgeOk(true)} />;

  return showAdmin ? (
    <Admin onClose={() => setShowAdmin(false)} />
  ) : (
    <div className="app">
      <main className="app__content">
        {tab === "catalog"   && <Catalog />}
        {tab === "favorites" && <Favorites />}
        {tab === "cart"      && <Cart />}
        {tab === "profile"   && <Profile onOpenAdmin={() => setShowAdmin(true)} />}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}

export default function App() {
  useEffect(() => { initTelegram(); }, []);

  return (
    <CatalogProvider>
      <CartProvider>
        <AppInner />
      </CartProvider>
    </CatalogProvider>
  );
}
