import { useEffect, useState } from "react";
import { CatalogProvider, useCatalog } from "./context/CatalogContext";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { BottomNav, type Tab } from "./components/BottomNav";
import { AgeGate, isAgeConfirmed } from "./components/AgeGate";
import { Catalog } from "./pages/Catalog";
import { Favorites } from "./pages/Favorites";
import { Cart } from "./pages/Cart";
import { Profile } from "./pages/Profile";
import { Admin } from "./pages/Admin";
import { Checkout } from "./pages/Checkout";
import { Orders } from "./pages/Orders";
import { Addresses } from "./pages/Addresses";
import { ReferralOnboarding } from "./pages/ReferralOnboarding";
import { Referral } from "./pages/Referral";
import { getTg, initTelegram } from "./telegram";

type Screen = "main" | "admin" | "checkout" | "orders" | "addresses" | "referral";

function hasSeenRefOnboarding() {
  const uid = getTg()?.initDataUnsafe.user?.id;
  if (!uid) return true; // not in Telegram, skip
  return !!localStorage.getItem(`ref_asked_${uid}`);
}

function markRefOnboardingSeen() {
  const uid = getTg()?.initDataUnsafe.user?.id;
  if (uid) localStorage.setItem(`ref_asked_${uid}`, "1");
}

function AppInner() {
  const { loading, isAdmin } = useCatalog();
  const [tab, setTab]       = useState<Tab>("catalog");
  const [ageOk, setAgeOk]   = useState(isAgeConfirmed());
  const [screen, setScreen] = useState<Screen>("main");
  const [showRef, setShowRef] = useState(false);

  // Show referral onboarding once after age gate
  useEffect(() => {
    if (ageOk && !loading && !hasSeenRefOnboarding()) {
      setShowRef(true);
    }
  }, [ageOk, loading]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0d0809" }}>
        <img src="./logo.svg" alt="" style={{ width: 56, opacity: 0.6 }} />
      </div>
    );
  }

  if (!ageOk) return <AgeGate onConfirm={() => setAgeOk(true)} />;

  if (showRef) return (
    <ReferralOnboarding onDone={() => { markRefOnboardingSeen(); setShowRef(false); }} />
  );

  if (screen === "admin")     return <Admin      onClose={() => setScreen("main")} />;
  if (screen === "checkout")  return <Checkout   onClose={() => setScreen("main")} />;
  if (screen === "orders")    return <Orders     onClose={() => setScreen("main")} />;
  if (screen === "addresses") return <Addresses  onClose={() => setScreen("main")} />;
  if (screen === "referral")  return <Referral   onClose={() => setScreen("main")} />;

  return (
    <div className="app">
      <main className="app__content">
        {tab === "catalog"   && <Catalog />}
        {tab === "favorites" && <Favorites />}
        {tab === "cart"      && <Cart onCheckout={() => setScreen("checkout")} />}
        {tab === "profile"   && (
          <Profile
            isAdmin={isAdmin}
            onOpenAdmin={()      => setScreen("admin")}
            onOpenOrders={()     => setScreen("orders")}
            onOpenAddresses={()  => setScreen("addresses")}
            onOpenReferral={()   => setScreen("referral")}
          />
        )}
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
        <FavoritesProvider>
          <AppInner />
        </FavoritesProvider>
      </CartProvider>
    </CatalogProvider>
  );
}
