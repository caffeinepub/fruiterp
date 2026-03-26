import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Apple,
  BarChart3,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Package,
  Package2,
  ShoppingCart,
  Truck,
  UserCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useAppContext } from "../contexts/AppContext";
import type { Page } from "../contexts/AppContext";

interface NavItem {
  label: string;
  page: Page;
  icon: ReactNode;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    page: "dashboard",
    icon: <LayoutDashboard size={18} />,
    roles: ["admin", "staff"],
  },
  {
    label: "Inventory",
    page: "inventory",
    icon: <Package size={18} />,
    roles: ["admin", "staff"],
  },
  {
    label: "Sales",
    page: "sales",
    icon: <ShoppingCart size={18} />,
    roles: ["admin", "staff"],
  },
  {
    label: "Purchases",
    page: "purchases",
    icon: <Truck size={18} />,
    roles: ["admin", "staff"],
  },
  {
    label: "Customers",
    page: "customers",
    icon: <Users size={18} />,
    roles: ["admin", "staff"],
  },
  {
    label: "Suppliers",
    page: "suppliers",
    icon: <Building2 size={18} />,
    roles: ["admin", "staff"],
  },
  {
    label: "Reports",
    page: "reports",
    icon: <BarChart3 size={18} />,
    roles: ["admin"],
  },
  {
    label: "Staff Master",
    page: "staff-master",
    icon: <UserCog size={18} />,
    roles: ["admin"],
  },
  {
    label: "Customer Master",
    page: "customer-master",
    icon: <UserCheck size={18} />,
    roles: ["admin"],
  },
  {
    label: "Packing Master",
    page: "packing-master",
    icon: <Package2 size={18} />,
    roles: ["admin"],
  },
  {
    label: "Products",
    page: "products",
    icon: <Apple size={18} />,
    roles: ["customer"],
  },
  {
    label: "My Orders",
    page: "my-orders",
    icon: <ClipboardList size={18} />,
    roles: ["customer"],
  },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-accent text-accent-foreground",
  staff: "bg-primary/20 text-primary",
  customer: "bg-blue-100 text-blue-700",
};

interface LayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export default function Layout({ children, onLogout }: LayoutProps) {
  const { session, currentPage, setCurrentPage } = useAppContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = session?.role ?? "";
  const visibleNav = NAV_ITEMS.filter((n) => n.roles.includes(role));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Leaf size={16} className="text-sidebar-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-sidebar-foreground tracking-tight">
            FruitERP
          </span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map((item) => (
          <button
            type="button"
            key={item.page}
            data-ocid={`nav.${item.page}.link`}
            onClick={() => {
              setCurrentPage(item.page);
              setMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              currentPage === item.page
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-2">
          <p className="text-sidebar-foreground font-semibold text-sm">
            {session?.username}
          </p>
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              ROLE_COLORS[role] ?? ""
            }`}
          >
            {role}
          </span>
        </div>
        <button
          type="button"
          data-ocid="nav.logout.button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex w-60 flex-col bg-sidebar flex-shrink-0">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-60 bg-sidebar flex flex-col">
            <SidebarContent />
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setMobileOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          <div className="flex-1" />
          <Badge variant="outline" className="capitalize">
            {role}
          </Badge>
          <span className="text-sm font-medium text-foreground">
            {session?.username}
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
        <footer className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()}. Built with &#10084;&#65039; using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
