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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { useAppContext } from "../contexts/AppContext";

interface ProdForm {
  name: string;
  category: string;
  unit: string;
  pricePerUnit: string;
  stockQuantity: string;
  lowStockThreshold: string;
}
const emptyForm = (): ProdForm => ({
  name: "",
  category: "",
  unit: "",
  pricePerUnit: "",
  stockQuantity: "",
  lowStockThreshold: "",
});

export default function InventoryPage() {
  const { actor, session } = useAppContext();
  const isAdmin = session?.role === "admin";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [form, setForm] = useState<ProdForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  useEffect(() => {
    if (!actor) return;
    const doLoad = async () => {
      setLoading(true);
      try {
        setProducts(await actor.listProducts());
      } catch {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    doLoad();
  }, [actor]);

  const reload = async () => {
    if (!actor) return;
    try {
      setProducts(await actor.listProducts());
    } catch {
      toast.error("Failed to reload");
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      unit: p.unit,
      pricePerUnit: p.pricePerUnit.toString(),
      stockQuantity: p.stockQuantity.toString(),
      lowStockThreshold: p.lowStockThreshold.toString(),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!actor || !session) return;
    setSaving(true);
    try {
      const { name, category, unit } = form;
      const price = Number.parseFloat(form.pricePerUnit);
      const stock = BigInt(form.stockQuantity);
      const threshold = BigInt(form.lowStockThreshold);
      if (editingId !== null) {
        await actor.updateProduct(
          session.token,
          editingId,
          name,
          category,
          unit,
          price,
          stock,
          threshold,
        );
        toast.success("Product updated");
      } else {
        await actor.createProduct(
          session.token,
          name,
          category,
          unit,
          price,
          stock,
          threshold,
        );
        toast.success("Product created");
      }
      setDialogOpen(false);
      await reload();
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!actor || !session || deleteId === null) return;
    try {
      await actor.deleteProduct(session.token, deleteId);
      toast.success("Product deleted");
      setDeleteId(null);
      await reload();
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );
  const isLow = (p: Product) => p.stockQuantity <= p.lowStockThreshold;

  return (
    <div data-ocid="inventory.page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground text-sm">
            {products.length} products total
          </p>
        </div>
        <Button data-ocid="inventory.add_button" onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Add Product
        </Button>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          data-ocid="inventory.search_input"
          className="pl-9"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div data-ocid="inventory.loading_state" className="space-y-2">
          {["s1", "s2", "s3", "s4", "s5"].map((k) => (
            <div key={k} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    data-ocid="inventory.empty_state"
                    className="text-center py-8 text-muted-foreground"
                  >
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p, i) => (
                  <TableRow
                    key={p.id.toString()}
                    data-ocid={`inventory.item.${i + 1}`}
                    className={isLow(p) ? "bg-amber-50" : ""}
                  >
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell className="text-right">
                      ₹{p.pricePerUnit.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.stockQuantity.toString()}
                    </TableCell>
                    <TableCell>
                      {isLow(p) ? (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                          {p.stockQuantity === BigInt(0) ? "Out" : "Low"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          OK
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          data-ocid={`inventory.edit_button.${i + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil size={14} />
                        </Button>
                        {isAdmin && (
                          <Button
                            data-ocid={`inventory.delete_button.${i + 1}`}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(p.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="inventory.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {(
              [
                ["name", "Product Name", "text"],
                ["category", "Category", "text"],
                ["unit", "Unit (kg/piece/bunch)", "text"],
                ["pricePerUnit", "Price Per Unit (₹)", "number"],
                ["stockQuantity", "Stock Quantity", "number"],
                ["lowStockThreshold", "Low Stock Threshold", "number"],
              ] as [keyof ProdForm, string, string][]
            ).map(([key, label, type]) => (
              <div
                key={key}
                className={key === "name" ? "col-span-2" : "col-span-1"}
              >
                <Label>{label}</Label>
                <Input
                  data-ocid={`inventory.${key}.input`}
                  type={type}
                  min={type === "number" ? "0" : undefined}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="inventory.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="inventory.save_button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isAdmin && (
        <Dialog
          open={deleteId !== null}
          onOpenChange={(o) => !o && setDeleteId(null)}
        >
          <DialogContent data-ocid="inventory.delete.dialog">
            <DialogHeader>
              <DialogTitle className="font-display">Delete Product</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this product? This action cannot
              be undone.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                data-ocid="inventory.delete.cancel_button"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                data-ocid="inventory.delete.confirm_button"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
