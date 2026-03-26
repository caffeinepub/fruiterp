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
import { Eye, EyeOff, Loader2, Plus, Trash2, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { CustomerAccount } from "../backend.d";
import { useAppContext } from "../contexts/AppContext";

interface CustomerLoginForm {
  name: string;
  username: string;
  password: string;
}

const emptyForm = (): CustomerLoginForm => ({
  name: "",
  username: "",
  password: "",
});

export default function CustomerMasterPage() {
  const { actor, session } = useAppContext();
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CustomerLoginForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || !session) return;
    const doLoad = async () => {
      setLoading(true);
      try {
        setCustomers(await actor.listCustomerLogins(session.token));
      } catch {
        toast.error("Failed to load customer accounts");
      } finally {
        setLoading(false);
      }
    };
    doLoad();
  }, [actor, session]);

  const reload = async () => {
    if (!actor || !session) return;
    try {
      setCustomers(await actor.listCustomerLogins(session.token));
    } catch {
      toast.error("Failed to reload");
    }
  };

  const handleAdd = async () => {
    if (!actor || !session) return;
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      toast.error("All fields are required");
      return;
    }
    setSaving(true);
    try {
      const ok = await actor.addCustomerLogin(
        session.token,
        form.name,
        form.username,
        form.password,
      );
      if (ok) {
        toast.success("Customer account created");
        setDialogOpen(false);
        setForm(emptyForm());
        await reload();
      } else {
        toast.error("Failed to create account (username may already exist)");
      }
    } catch {
      toast.error("Failed to create customer account");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!actor || !session || !deleteUsername) return;
    try {
      await actor.removeCustomerLogin(session.token, deleteUsername);
      toast.success("Customer account removed");
      setDeleteUsername(null);
      await reload();
    } catch {
      toast.error("Failed to remove customer account");
    }
  };

  return (
    <div data-ocid="customer-master.page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <UserCheck size={22} />
            Customer Master
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage customer login accounts
          </p>
        </div>
        <Button
          data-ocid="customer-master.add_button"
          onClick={() => {
            setForm(emptyForm());
            setDialogOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          Add Customer
        </Button>
      </div>

      {loading ? (
        <div data-ocid="customer-master.loading_state" className="space-y-2">
          {["s1", "s2", "s3"].map((k) => (
            <div key={k} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    data-ocid="customer-master.empty_state"
                    className="text-center py-8 text-muted-foreground"
                  >
                    No customer accounts yet. Add your first customer.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c, i) => (
                  <TableRow
                    key={c.username}
                    data-ocid={`customer-master.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {c.username}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        data-ocid={`customer-master.delete_button.${i + 1}`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteUsername(c.username)}
                      >
                        <Trash2 size={14} />
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
        <DialogContent data-ocid="customer-master.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Add Customer Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Full Name</Label>
              <Input
                data-ocid="customer-master.name.input"
                placeholder="e.g. Amit Patel"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Username</Label>
              <Input
                data-ocid="customer-master.username.input"
                placeholder="e.g. amit2024"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  data-ocid="customer-master.password.input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Set a password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="customer-master.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="customer-master.submit_button"
              onClick={handleAdd}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteUsername !== null}
        onOpenChange={(o) => !o && setDeleteUsername(null)}
      >
        <DialogContent data-ocid="customer-master.delete.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Remove Customer Account
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <strong>{deleteUsername}</strong>?
            They will no longer be able to log in.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="customer-master.delete.cancel_button"
              onClick={() => setDeleteUsername(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-ocid="customer-master.delete.confirm_button"
              onClick={handleDelete}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
