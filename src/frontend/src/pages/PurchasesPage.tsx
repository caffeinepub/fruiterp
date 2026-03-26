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
import { Loader2, Plus, Trash2, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { OrderItem, Product, PurchaseOrder, Supplier } from "../backend.d";
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
  if (status === "received")
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
        Received
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

export default function PurchasesPage() {
  const { actor, session } = useAppContext();
  const isAdmin = session?.role === "admin";
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([newLine()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!actor || !session) return;
    const doLoad = async () => {
      setLoading(true);
      try {
        const [o, s, p] = await Promise.all([
          actor.listPurchaseOrders(session.token),
          actor.listSuppliers(session.token),
          actor.listProducts(),
        ]);
        setOrders(o);
        setSuppliers(s);
        setProducts(p);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    doLoad();
  }, [actor, session]);

  const reload = async () => {
    if (!actor || !session) return;
    try {
      const [o, s, p] = await Promise.all([
        actor.listPurchaseOrders(session.token),
        actor.listSuppliers(session.token),
        actor.listProducts(),
      ]);
      setOrders(o);
      setSuppliers(s);
      setProducts(p);
    } catch {
      toast.error("Failed to reload");
    }
  };

  const openCreate = () => {
    setSelectedSupplierId("");
    setLineItems([newLine()]);
    setDialogOpen(true);
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
    if (!actor || !session || !selectedSupplierId) {
      toast.error("Please select a supplier");
      return;
    }
    const supplier = suppliers.find(
      (s) => s.id.toString() === selectedSupplierId,
    );
    if (!supplier) return;
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
      await actor.createPurchaseOrder(
        session.token,
        supplier.id,
        supplier.name,
        items,
      );
      toast.success("Purchase order created");
      setDialogOpen(false);
      await reload();
    } catch {
      toast.error("Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: bigint, status: string) => {
    if (!actor || !session) return;
    try {
      await actor.updatePurchaseOrderStatus(session.token, id, status);
      toast.success(`Order marked as ${status}`);
      await reload();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const fmt = (n: number) => `₹${n.toFixed(2)}`;
  const fmtDate = (ts: bigint) =>
    new Date(Number(ts) / 1_000_000).toLocaleDateString();

  return (
    <div data-ocid="purchases.page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Truck size={22} />
            Purchase Orders
          </h1>
          <p className="text-muted-foreground text-sm">
            {orders.length} orders
          </p>
        </div>
        <Button data-ocid="purchases.add_button" onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          New Order
        </Button>
      </div>

      {loading ? (
        <div data-ocid="purchases.loading_state" className="space-y-2">
          {["s1", "s2", "s3", "s4"].map((k) => (
            <div key={k} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    data-ocid="purchases.empty_state"
                    className="text-center py-8 text-muted-foreground"
                  >
                    No purchase orders yet
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o, i) => (
                  <TableRow
                    key={o.id.toString()}
                    data-ocid={`purchases.item.${i + 1}`}
                  >
                    <TableCell className="font-mono text-sm">
                      #{o.id.toString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {o.supplierName}
                    </TableCell>
                    <TableCell>{fmtDate(o.createdAt)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {fmt(o.totalAmount)}
                    </TableCell>
                    <TableCell>{statusBadge(o.status)}</TableCell>
                    <TableCell className="text-right">
                      {o.status === "pending" && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            data-ocid={`purchases.receive_button.${i + 1}`}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => updateStatus(o.id, "received")}
                          >
                            Received
                          </Button>
                          {isAdmin && (
                            <Button
                              data-ocid={`purchases.cancel_button.${i + 1}`}
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-red-700 border-red-300 hover:bg-red-50"
                              onClick={() => updateStatus(o.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" data-ocid="purchases.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              New Purchase Order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Supplier</Label>
              <Select
                value={selectedSupplierId}
                onValueChange={setSelectedSupplierId}
              >
                <SelectTrigger data-ocid="purchases.supplier.select">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id.toString()} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Order Items</Label>
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
              <div className="space-y-2">
                {lineItems.map((line, idx) => (
                  <div key={line._id} className="flex items-center gap-2">
                    <Select
                      value={line.productId}
                      onValueChange={(v) => updateLine(line._id, v)}
                    >
                      <SelectTrigger
                        data-ocid={`purchases.product.select.${idx + 1}`}
                        className="flex-1"
                      >
                        <SelectValue placeholder="Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem
                            key={p.id.toString()}
                            value={p.id.toString()}
                          >
                            {p.name} — ₹{p.pricePerUnit.toFixed(2)}/{p.unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      data-ocid={`purchases.quantity.input.${idx + 1}`}
                      type="number"
                      min="1"
                      className="w-24"
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
                    <span className="text-sm w-20 text-right text-muted-foreground">
                      ₹
                      {(
                        (Number.parseFloat(line.quantity) || 0) * line.unitPrice
                      ).toFixed(2)}
                    </span>
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() =>
                          setLineItems((p) =>
                            p.filter((l) => l._id !== line._id),
                          )
                        }
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-border">
                <span className="font-semibold">Total: {fmt(total)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="purchases.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="purchases.submit_button"
              onClick={handleCreate}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
