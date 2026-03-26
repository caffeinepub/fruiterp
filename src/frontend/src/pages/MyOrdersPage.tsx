import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { OrderItem, Product, SalesOrder } from "../backend.d";
import { useAppContext } from "../contexts/AppContext";

let lineCounter = 0;
interface LineItem {
  _id: number;
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: number;
}
const newLine = (): LineItem => ({
  _id: ++lineCounter,
  productId: "",
  productName: "",
  quantity: "1",
  unitPrice: 0,
});

const statusBadge = (status: string) => {
  if (status === "completed")
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
        Completed
      </Badge>
    );
  if (status === "cancelled")
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
        Cancelled
      </Badge>
    );
  return (
    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
      Pending
    </Badge>
  );
};

export default function MyOrdersPage() {
  const { actor, session } = useAppContext();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([newLine()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!actor || !session) return;
    const doLoad = async () => {
      setLoading(true);
      try {
        const [o, p] = await Promise.all([
          actor.listSalesOrders(session.token),
          actor.listProducts(),
        ]);
        setOrders(o);
        setProducts(p);
      } catch {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    doLoad();
  }, [actor, session]);

  const reload = async () => {
    if (!actor || !session) return;
    try {
      const [o, p] = await Promise.all([
        actor.listSalesOrders(session.token),
        actor.listProducts(),
      ]);
      setOrders(o);
      setProducts(p);
    } catch {
      toast.error("Failed to reload");
    }
  };

  const updateLine = (id: number, productId: string) => {
    const prod = products.find((p) => p.id.toString() === productId);
    setLineItems((prev) =>
      prev.map((l) =>
        l._id === id
          ? {
              ...l,
              productId,
              productName: prod?.name ?? "",
              unitPrice: prod?.pricePerUnit ?? 0,
            }
          : l,
      ),
    );
  };

  const total = lineItems.reduce(
    (s, l) => s + (Number.parseFloat(l.quantity) || 0) * l.unitPrice,
    0,
  );

  const handleCreate = async () => {
    if (!actor || !session) return;
    const items: OrderItem[] = lineItems
      .filter((l) => l.productId && Number.parseFloat(l.quantity) > 0)
      .map((l) => ({
        productId: BigInt(l.productId),
        productName: l.productName,
        quantity: BigInt(Math.floor(Number.parseFloat(l.quantity))),
        unitPrice: l.unitPrice,
      }));
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setSaving(true);
    try {
      await actor.createSalesOrder(
        session.token,
        BigInt(0),
        session.username,
        items,
      );
      toast.success("Order placed!");
      setDialogOpen(false);
      await reload();
    } catch {
      toast.error("Failed to place order");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) => `₹${n.toFixed(2)}`;
  const fmtDate = (ts: bigint) =>
    new Date(Number(ts) / 1_000_000).toLocaleDateString();

  return (
    <div data-ocid="myorders.page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <ClipboardList size={22} />
            My Orders
          </h1>
          <p className="text-muted-foreground text-sm">
            {orders.length} orders
          </p>
        </div>
        <Button
          data-ocid="myorders.add_button"
          onClick={() => {
            setLineItems([newLine()]);
            setDialogOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          Place Order
        </Button>
      </div>

      {loading ? (
        <div data-ocid="myorders.loading_state" className="space-y-2">
          {["s1", "s2", "s3"].map((k) => (
            <div key={k} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    data-ocid="myorders.empty_state"
                    className="text-center py-8 text-muted-foreground"
                  >
                    No orders yet. Place your first order!
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o, i) => (
                  <TableRow
                    key={o.id.toString()}
                    data-ocid={`myorders.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-sm">
                      #{o.id.toString()}
                    </TableCell>
                    <TableCell>{fmtDate(o.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {o.items
                        .map((it: OrderItem) => it.productName)
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {fmt(o.totalAmount)}
                    </TableCell>
                    <TableCell>{statusBadge(o.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-ocid="myorders.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Place New Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLineItems((p) => [...p, newLine()])}
              >
                <Plus size={14} className="mr-1" />
                Add Item
              </Button>
            </div>
            {lineItems.map((line, idx) => (
              <div key={line._id} className="flex items-center gap-2">
                <Select
                  value={line.productId}
                  onValueChange={(v) => updateLine(line._id, v)}
                >
                  <SelectTrigger
                    data-ocid={`myorders.product.select.${idx + 1}`}
                    className="flex-1"
                  >
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter((p) => Number(p.stockQuantity) > 0)
                      .map((p) => (
                        <SelectItem
                          key={p.id.toString()}
                          value={p.id.toString()}
                        >
                          {p.name} — {fmt(p.pricePerUnit)}/{p.unit}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  data-ocid={`myorders.quantity.input.${idx + 1}`}
                  type="number"
                  min="1"
                  className="w-20"
                  value={line.quantity}
                  onChange={(e) =>
                    setLineItems((p) =>
                      p.map((l) =>
                        l._id === line._id
                          ? { ...l, quantity: e.target.value }
                          : l,
                      ),
                    )
                  }
                />
                {lineItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() =>
                      setLineItems((p) => p.filter((l) => l._id !== line._id))
                    }
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex justify-end pt-2 border-t border-border font-semibold">
              Total: ${total.toFixed(2)}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="myorders.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="myorders.submit_button"
              onClick={handleCreate}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Place
              Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
