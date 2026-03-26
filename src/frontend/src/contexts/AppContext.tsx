import { createContext, useContext } from "react";
import type { SessionToken } from "../backend.d";

export type Page =
  | "dashboard"
  | "inventory"
  | "sales"
  | "purchases"
  | "customers"
  | "suppliers"
  | "reports"
  | "products"
  | "my-orders"
  | "staff-master"
  | "customer-master"
  | "packing-master";

export interface AppContextType {
  session: SessionToken | null;
  setSession: (s: SessionToken | null) => void;
  actor: any;
  currentPage: Page;
  setCurrentPage: (p: Page) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx)
    throw new Error("useAppContext must be used within AppContext.Provider");
  return ctx;
}
