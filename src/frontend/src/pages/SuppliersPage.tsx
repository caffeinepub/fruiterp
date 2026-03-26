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
import { Building2, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Supplier } from "../backend.d";
import { useAppContext } from "../contexts/AppContext";

interface SupplierForm {
  name: string;
  contactName: string;
  phone: string;
  email: string;
}
const emptyForm = (): SupplierForm => ({
  name: "",
  contactName: "",
  phone: "",
  email: "",
});

export default function SuppliersPage() {
  const { actor, session } = useAppContext();
  const isAdmin = session?.role === "admin";
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  useEffect(() => {
    if (!actor || !session) return;
    const doLoad = async () => {
      setLoading(true);
      try {
        setSuppliers(await actor.listSuppliers(session.token));
      } catch {
        toast.error("Failed to load suppliers");
      } finally {
        setLoading(false);
      }
    };
    doLoad();
  }, [actor, session]);

  const reload = async () => {
    if (!actor || !session) return;
    try {
      setSuppliers(await actor.listSuppliers(session.token));
    } catch {
      toast.error("Failed to reload");
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };
  const openEdit = (s: Supplier) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      contactName: s.contactName,
      phone: s.phone,
      email: s.email,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!actor || !session) return;
    setSaving(true);
    try {
      if (editingId !== null) {
        await actor.updateSupplier(
          session.token,
          editingId,
          form.name,
          form.contactName,
          form.phone,
          form.email,
        );
        toast.success("Supplier updated");
      } else {
        await actor.createSupplier(
          session.token,
          form.name,
          form.contactName,
          form.phone,
          form.email,
        );
        toast.success("Supplier created");
      }
      setDialogOpen(false);
      await reload();
    } catch {
      toast.error("Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!actor || !session || deleteId === null) return;
    try {
      await actor.deleteSupplier(session.token, deleteId);
      toast.success("Supplier deleted");
      setDeleteId(null);
      await reload();
    } catch {
      toast.error("Failed to delete supplier");
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div data-ocid="suppliers.page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Building2 size={22} />
            Suppliers
          </h1>
          <p className="text-muted-foreground text-sm">
            {suppliers.length} suppliers
          </p>
        </div>
        <Button data-ocid="suppliers.add_button" onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Add Supplier
        </Button>
      </div>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          data-ocid="suppliers.search_input"
          className="pl-9"
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div data-ocid="suppliers.loading_state" className="space-y-2">
          {["s1", "s2", "s3", "s4"].map((k) => (
            <div key={k} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    data-ocid="suppliers.empty_state"
                    className="text-center py-8 text-muted-foreground"
                  >
                    No suppliers found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s, i) => (
                  <TableRow
                    key={s.id.toString()}
                    data-ocid={`suppliers.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.contactName}</TableCell>
                    <TableCell>{s.phone}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          data-ocid={`suppliers.edit_button.${i + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil size={14} />
                        </Button>
                        {isAdmin && (
                          <Button
                            data-ocid={`suppliers.delete_button.${i + 1}`}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(s.id)}
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
        <DialogContent data-ocid="suppliers.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Edit Supplier" : "Add Supplier"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(
              [
                ["name", "Company Name"],
                ["contactName", "Contact Person"],
                ["phone", "Phone"],
                ["email", "Email"],
              ] as [keyof SupplierForm, string][]
            ).map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <Input
                  data-ocid={`suppliers.${key}.input`}
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
              data-ocid="suppliers.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="suppliers.save_button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isAdmin && (
        <Dialog
          open={deleteId !== null}
          onOpenChange={(o) => !o && setDeleteId(null)}
        >
          <DialogContent data-ocid="suppliers.delete.dialog">
            <DialogHeader>
              <DialogTitle className="font-display">
                Delete Supplier
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this supplier?
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                data-ocid="suppliers.delete.cancel_button"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                data-ocid="suppliers.delete.confirm_button"
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
