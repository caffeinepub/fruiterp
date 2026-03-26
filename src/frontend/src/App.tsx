import { Toaster } from "@/components/ui/sonner";
import { useCallback, useState } from "react";
import type { SessionToken } from "./backend.d";
import Layout from "./components/Layout";
import { AppContext } from "./contexts/AppContext";
import type { Page } from "./contexts/AppContext";
import { useActor } from "./hooks/useActor";
import CustomerMasterPage from "./pages/CustomerMasterPage";
import CustomersPage from "./pages/CustomersPage";
import DashboardPage from "./pages/DashboardPage";
import InventoryPage from "./pages/InventoryPage";
import LoginPage from "./pages/LoginPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import PackingMasterPage from "./pages/PackingMasterPage";
import ProductsPage from "./pages/ProductsPage";
import PurchasesPage from "./pages/PurchasesPage";
import ReportsPage from "./pages/ReportsPage";
import SalesPage from "./pages/SalesPage";
import StaffMasterPage from "./pages/StaffMasterPage";
import SuppliersPage from "./pages/SuppliersPage";

export default function App() {
  const { actor, isFetching } = useActor();
  const [session, setSession] = useState<SessionToken | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  const logout = useCallback(() => {
    setSession(null);
    setCurrentPage("dashboard");
  }, []);

  const handleLogin = useCallback((token: SessionToken) => {
    setSession(token);
    const defaultPage: Page =
      token.role === "customer" ? "products" : "dashboard";
    setCurrentPage(defaultPage);
  }, []);

  const renderPage = () => {
    if (!session) return null;
    const role = session.role;
    if (role === "customer") {
      if (currentPage === "my-orders") return <MyOrdersPage />;
      return <ProductsPage />;
    }
    switch (currentPage) {
      case "inventory":
        return <InventoryPage />;
      case "sales":
        return <SalesPage />;
      case "purchases":
        return <PurchasesPage />;
      case "customers":
        return <CustomersPage />;
      case "suppliers":
        return <SuppliersPage />;
      case "reports":
        return role === "admin" ? <ReportsPage /> : <DashboardPage />;
      case "staff-master":
        return role === "admin" ? <StaffMasterPage /> : <DashboardPage />;
      case "customer-master":
        return role === "admin" ? <CustomerMasterPage /> : <DashboardPage />;
      case "packing-master":
        return role === "admin" ? <PackingMasterPage /> : <DashboardPage />;
      default:
        return <DashboardPage />;
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-display text-lg">
            Loading FruitERP...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{ session, setSession, actor, currentPage, setCurrentPage }}
    >
      <Toaster richColors position="top-right" />
      {!session ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <Layout onLogout={logout}>{renderPage()}</Layout>
      )}
    </AppContext.Provider>
  );
}
