import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { DashboardStats, Product } from "../backend.d";
import { useAppContext } from "../contexts/AppContext";

export default function DashboardPage() {
  const { actor, session } = useAppContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || !session) return;
    actor
      .getDashboardStats(session.token)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [actor, session]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(n);

  if (loading) {
    return (
      <div data-ocid="dashboard.loading_state" className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {["s1", "s2", "s3", "s4"].map((k) => (
            <div key={k} className="h-28 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div data-ocid="dashboard.page" className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Overview of your fruit business operations
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-ocid="dashboard.products.card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="text-primary" size={18} />
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">
              {stats?.totalProducts?.toString() ?? "0"}
            </p>
          </CardContent>
        </Card>
        <Card data-ocid="dashboard.stock_value.card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock Value
            </CardTitle>
            <DollarSign className="text-accent" size={18} />
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">
              {fmt(stats?.totalStockValue ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card data-ocid="dashboard.revenue.card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sales Revenue
            </CardTitle>
            <TrendingUp className="text-primary" size={18} />
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">
              {fmt(stats?.totalSalesRevenue ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card data-ocid="dashboard.pending.card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Sales
            </CardTitle>
            <ShoppingCart className="text-orange-500" size={18} />
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">
              {stats?.pendingSalesCount?.toString() ?? "0"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-ocid="dashboard.low_stock.card">
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(stats?.lowStockProducts?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              All products are well stocked ✓
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.lowStockProducts?.map((p: Product) => (
                  <TableRow
                    key={p.id.toString()}
                    data-ocid={`dashboard.low_stock.item.${p.id.toString()}`}
                  >
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell className="text-right">
                      {p.stockQuantity.toString()} {p.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.lowStockThreshold.toString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="text-xs">
                        {p.stockQuantity === BigInt(0)
                          ? "Out of Stock"
                          : "Low Stock"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
