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
import { BarChart3, DollarSign, Package, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product, SalesOrder } from "../backend.d";
import { useAppContext } from "../contexts/AppContext";

export default function ReportsPage() {
  const { actor, session } = useAppContext();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || !session) return;
    const doLoad = async () => {
      try {
        const [o, p] = await Promise.all([
          actor.listSalesOrders(session.token),
          actor.listProducts(),
        ]);
        setOrders(o);
        setProducts(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    doLoad();
  }, [actor, session]);

  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + o.totalAmount, 0);
  const pendingRevenue = orders
    .filter((o) => o.status === "pending")
    .reduce((s, o) => s + o.totalAmount, 0);
  const byStatus = ["pending", "completed", "cancelled"].map((s) => ({
    status: s,
    count: orders.filter((o) => o.status === s).length,
    revenue: orders
      .filter((o) => o.status === s)
      .reduce((acc, o) => acc + o.totalAmount, 0),
  }));

  const categoryMap: Record<string, { count: number; value: number }> = {};
  for (const p of products) {
    if (!categoryMap[p.category])
      categoryMap[p.category] = { count: 0, value: 0 };
    categoryMap[p.category].count += 1;
    categoryMap[p.category].value += Number(p.stockQuantity) * p.pricePerUnit;
  }
  const categories = Object.entries(categoryMap).map(([cat, data]) => ({
    category: cat,
    ...data,
  }));

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(n);

  if (loading) {
    return (
      <div data-ocid="reports.loading_state" className="space-y-4">
        {["s1", "s2", "s3"].map((k) => (
          <div key={k} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div data-ocid="reports.page" className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <BarChart3 size={22} />
          Reports
        </h1>
        <p className="text-muted-foreground text-sm">
          Business performance overview
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <BarChart3 size={18} className="text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Revenue
            </CardTitle>
            <TrendingUp size={18} className="text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold">
              {fmt(totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Revenue
            </CardTitle>
            <DollarSign size={18} className="text-accent" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold">
              {fmt(pendingRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products
            </CardTitle>
            <Package size={18} className="text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card data-ocid="reports.sales.card">
          <CardHeader>
            <CardTitle className="font-display text-base">
              Sales by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byStatus.map((row) => (
                  <TableRow
                    key={row.status}
                    data-ocid={`reports.sales.item.${row.status}`}
                  >
                    <TableCell>
                      {row.status === "completed" && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                          Completed
                        </Badge>
                      )}
                      {row.status === "pending" && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                          Pending
                        </Badge>
                      )}
                      {row.status === "cancelled" && (
                        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                          Cancelled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right">
                      {fmt(row.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card data-ocid="reports.inventory.card">
          <CardHeader>
            <CardTitle className="font-display text-base">
              Inventory by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Products</TableHead>
                  <TableHead className="text-right">Stock Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-4"
                    >
                      No data
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((row, i) => (
                    <TableRow
                      key={row.category}
                      data-ocid={`reports.inventory.item.${i + 1}`}
                    >
                      <TableCell className="font-medium">
                        {row.category}
                      </TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">
                        {fmt(row.value)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
