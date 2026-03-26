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
import { Loader2, Pencil, Plus, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Customer } from "../backend.d";
import { useAppContext } from "../contexts/AppContext";

interface CustForm {
  name: string;
  phone: string;
  email: string;
  address: string;
}
const emptyForm = (): CustForm => ({
  name: "",
  phone: "",
  email: "",
  address: "",
});

export default function CustomersPage() {
  const { actor, session } = useAppContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [form, setForm] = useState<CustForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!actor || !session) return;
    const doLoad = async () => {
      setLoading(true);
      try {
        setCustomers(await actor.listCustomers(session.token));
      } catch {
        toast.error("Failed to load customers");
      } finally {
        setLoading(false);
      }
    };
    doLoad();
  }, [actor, session]);

  const reload = async () => {
    if (!actor || !session) return;
    try {
      setCustomers(await actor.listCustomers(session.token));
    } catch {
      toast.error("Failed to reload");
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };
  const openEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!actor || !session) return;
    setSaving(true);
    try {
      if (editingId !== null) {
        await actor.updateCustomer(
          session.token,
          editingId,
          form.name,
          form.phone,
          form.email,
          form.address,
        );
        toast.success("Customer updated");
      } else {
        await actor.createCustomer(
          session.token,
          form.name,
          form.phone,
          form.email,
          form.address,
        );
        toast.success("Customer created");
      }
      setDialogOpen(false);
      await reload();
    } catch {
      toast.error("Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div data-ocid="customers.page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Users size={22} />
            Customers
          </h1>
          <p className="text-muted-foreground text-sm">
            {customers.length} customers
          </p>
        </div>
        <Button data-ocid="customers.add_button" onClick={openCreate}>
          <Plus size={16} className="mr-2" />
          Add Customer
        </Button>
      </div>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          data-ocid="customers.search_input"
          className="pl-9"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {loading ? (
        <div data-ocid="customers.loading_state" className="space-y-2">
          {["s1", "s2", "s3", "s4"].map((k) => (
            <div key={k} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    data-ocid="customers.empty_state"
                    className="text-center py-8 text-muted-foreground"
                  >
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c, i) => (
                  <TableRow
                    key={c.id.toString()}
                    data-ocid={`customers.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.address}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        data-ocid={`customers.edit_button.${i + 1}`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="customers.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(["name", "phone", "email", "address"] as (keyof CustForm)[]).map(
              (key) => (
                <div key={key}>
                  <Label className="capitalize">{key}</Label>
                  <Input
                    data-ocid={`customers.${key}.input`}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                  />
                </div>
              ),
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="customers.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="customers.save_button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
