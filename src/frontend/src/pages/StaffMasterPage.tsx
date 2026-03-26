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
import { Eye, EyeOff, Loader2, Plus, Trash2, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { StaffAccount } from "../backend.d";
import { useAppContext } from "../contexts/AppContext";

interface StaffForm {
  name: string;
  username: string;
  password: string;
}

const emptyForm = (): StaffForm => ({ name: "", username: "", password: "" });

export default function StaffMasterPage() {
  const { actor, session } = useAppContext();
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<StaffForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!actor || !session) return;
    const doLoad = async () => {
      setLoading(true);
      try {
        setStaff(await actor.listStaff(session.token));
      } catch {
        toast.error("Failed to load staff");
      } finally {
        setLoading(false);
      }
    };
    doLoad();
  }, [actor, session]);

  const reload = async () => {
    if (!actor || !session) return;
    try {
      setStaff(await actor.listStaff(session.token));
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
      const ok = await actor.addStaff(
        session.token,
        form.name,
        form.username,
        form.password,
      );
      if (ok) {
        toast.success("Staff member added");
        setDialogOpen(false);
        setForm(emptyForm());
        await reload();
      } else {
        toast.error("Failed to add staff (username may already exist)");
      }
    } catch {
      toast.error("Failed to add staff");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!actor || !session || !deleteUsername) return;
    try {
      await actor.removeStaff(session.token, deleteUsername);
      toast.success("Staff member removed");
      setDeleteUsername(null);
      await reload();
    } catch {
      toast.error("Failed to remove staff");
    }
  };

  return (
    <div data-ocid="staff-master.page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <UserCog size={22} />
            Staff Master
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage staff login accounts
          </p>
        </div>
        <Button
          data-ocid="staff-master.add_button"
          onClick={() => {
            setForm(emptyForm());
            setDialogOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          Add Staff
        </Button>
      </div>

      {loading ? (
        <div data-ocid="staff-master.loading_state" className="space-y-2">
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
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    data-ocid="staff-master.empty_state"
                    className="text-center py-8 text-muted-foreground"
                  >
                    No staff accounts yet. Add your first staff member.
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((s, i) => (
                  <TableRow
                    key={s.username}
                    data-ocid={`staff-master.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {s.username}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        data-ocid={`staff-master.delete_button.${i + 1}`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteUsername(s.username)}
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
        <DialogContent data-ocid="staff-master.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Full Name</Label>
              <Input
                data-ocid="staff-master.name.input"
                placeholder="e.g. Rahul Sharma"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Username</Label>
              <Input
                data-ocid="staff-master.username.input"
                placeholder="e.g. rahul123"
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
                  data-ocid="staff-master.password.input"
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
              data-ocid="staff-master.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="staff-master.submit_button"
              onClick={handleAdd}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteUsername !== null}
        onOpenChange={(o) => !o && setDeleteUsername(null)}
      >
        <DialogContent data-ocid="staff-master.delete.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Remove Staff Member
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <strong>{deleteUsername}</strong>?
            They will no longer be able to log in.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="staff-master.delete.cancel_button"
              onClick={() => setDeleteUsername(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-ocid="staff-master.delete.confirm_button"
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
