import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, Package2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PackingMaster } from "../backend.d";
import { useAppContext } from "../contexts/AppContext";

interface PackingForm {
  packingName: string;
  itemName: string;
  packingType: string;
  standardWeight: string;
  tareWeight: string;
  marka: string;
  size: string;
  unitType: string;
  isReturnable: boolean;
  crateCategory: string;
  crateCode: string;
}

const emptyForm = (): PackingForm => ({
  packingName: "",
  itemName: "",
  packingType: "box",
  standardWeight: "",
  tareWeight: "0",
  marka: "",
  size: "none",
  unitType: "box",
  isReturnable: false,
  crateCategory: "big",
  crateCode: "",
});

const TYPE_LABELS: Record<string, string> = {
  box: "📦 Box",
  crate: "🧺 Crate",
  loose: "⚖️ Loose",
};

const SIZE_LABELS: Record<string, string> = {
  none: "—",
  small: "Small",
  medium: "Medium",
  large: "Large",
};

const UNIT_LABELS: Record<string, string> = {
  box: "Box",
  kg: "Kg",
  both: "Both",
};

export default function PackingMasterPage() {
  const { actor, session } = useAppContext();
  const [packings, setPackings] = useState<PackingMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<PackingForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  useEffect(() => {
    if (!actor || !session) return;
    const doLoad = async () => {
      setLoading(true);
      try {
        setPackings(await actor.listPackings(session.token));
      } catch {
        toast.error("Failed to load packings");
      } finally {
        setLoading(false);
      }
    };
    doLoad();
  }, [actor, session]);

  const reload = async () => {
    if (!actor || !session) return;
    try {
      setPackings(await actor.listPackings(session.token));
    } catch {
      toast.error("Failed to reload");
    }
  };

  const handleAdd = async () => {
    if (!actor || !session) return;
    if (
      !form.packingName.trim() ||
      !form.itemName.trim() ||
      !form.standardWeight
    ) {
      toast.error("Packing Name, Item, and Standard Weight are required");
      return;
    }
    setSaving(true);
    try {
      await actor.createPacking(
        session.token,
        form.packingName,
        form.itemName,
        form.packingType,
        Number.parseFloat(form.standardWeight) || 0,
        Number.parseFloat(form.tareWeight) || 0,
        form.marka,
        form.size,
        form.unitType,
        form.isReturnable,
        form.packingType === "crate" ? form.crateCategory : "",
        form.packingType === "crate" ? form.crateCode : "",
      );
      toast.success("Packing created");
      setDialogOpen(false);
      setForm(emptyForm());
      await reload();
    } catch {
      toast.error("Failed to create packing");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!actor || !session || deleteId === null) return;
    try {
      await actor.deletePacking(session.token, deleteId);
      toast.success("Packing deleted");
      setDeleteId(null);
      await reload();
    } catch {
      toast.error("Failed to delete packing");
    }
  };

  const setField = (key: keyof PackingForm, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div data-ocid="packing-master.page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Package2 size={22} />
            Packing Master
          </h1>
          <p className="text-muted-foreground text-sm">
            Define how goods are packed, weighted, and tracked
          </p>
        </div>
        <Button
          data-ocid="packing-master.add_button"
          onClick={() => {
            setForm(emptyForm());
            setDialogOpen(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          Add Packing
        </Button>
      </div>

      {loading ? (
        <div data-ocid="packing-master.loading_state" className="space-y-2">
          {["s1", "s2", "s3"].map((k) => (
            <div key={k} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Packing Name</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Wt (kg)</TableHead>
                <TableHead>Marka</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Crate Info</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    data-ocid="packing-master.empty_state"
                    className="text-center py-8 text-muted-foreground"
                  >
                    No packings defined yet. Add your first packing.
                  </TableCell>
                </TableRow>
              ) : (
                packings.map((p, i) => (
                  <TableRow
                    key={p.id.toString()}
                    data-ocid={`packing-master.item.${i + 1}`}
                  >
                    <TableCell className="font-medium">
                      {p.packingName}
                    </TableCell>
                    <TableCell>{p.itemName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {TYPE_LABELS[p.packingType] ?? p.packingType}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.standardWeight}</TableCell>
                    <TableCell>{p.marka || "—"}</TableCell>
                    <TableCell>{SIZE_LABELS[p.size] ?? p.size}</TableCell>
                    <TableCell>
                      {UNIT_LABELS[p.unitType] ?? p.unitType}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {p.packingType === "crate" ? (
                        <span>
                          {p.crateCategory} ·{" "}
                          {p.isReturnable ? "Returnable" : "Non-returnable"}
                          {p.crateCode ? ` · ${p.crateCode}` : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        data-ocid={`packing-master.delete_button.${i + 1}`}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(p.id)}
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
        <DialogContent
          data-ocid="packing-master.dialog"
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Add Packing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Packing Name *</Label>
                <Input
                  data-ocid="packing-master.packingName.input"
                  placeholder="e.g. Apple Box 20kg"
                  value={form.packingName}
                  onChange={(e) => setField("packingName", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label>Item *</Label>
                <Input
                  data-ocid="packing-master.itemName.input"
                  placeholder="e.g. Apple"
                  value={form.itemName}
                  onChange={(e) => setField("itemName", e.target.value)}
                />
              </div>
              <div>
                <Label>Packing Type</Label>
                <Select
                  value={form.packingType}
                  onValueChange={(v) => setField("packingType", v)}
                >
                  <SelectTrigger data-ocid="packing-master.packingType.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="box">📦 Box</SelectItem>
                    <SelectItem value="crate">🧺 Crate</SelectItem>
                    <SelectItem value="loose">⚖️ Loose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Size</Label>
                <Select
                  value={form.size}
                  onValueChange={(v) => setField("size", v)}
                >
                  <SelectTrigger data-ocid="packing-master.size.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Standard Weight (kg) *</Label>
                <Input
                  data-ocid="packing-master.standardWeight.input"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 20"
                  value={form.standardWeight}
                  onChange={(e) => setField("standardWeight", e.target.value)}
                />
              </div>
              <div>
                <Label>Tare Weight (kg)</Label>
                <Input
                  data-ocid="packing-master.tareWeight.input"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={form.tareWeight}
                  onChange={(e) => setField("tareWeight", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label>Marka / Brand</Label>
                <Input
                  data-ocid="packing-master.marka.input"
                  placeholder="e.g. Himachal Premium"
                  value={form.marka}
                  onChange={(e) => setField("marka", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label>Unit Type (sell in)</Label>
                <Select
                  value={form.unitType}
                  onValueChange={(v) => setField("unitType", v)}
                >
                  <SelectTrigger data-ocid="packing-master.unitType.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.packingType === "crate" && (
              <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  🧺 Crate Configuration
                </p>
                <div className="flex items-center gap-3">
                  <Checkbox
                    data-ocid="packing-master.isReturnable.checkbox"
                    id="isReturnable"
                    checked={form.isReturnable}
                    onCheckedChange={(v) => setField("isReturnable", !!v)}
                  />
                  <Label htmlFor="isReturnable">Is Returnable?</Label>
                </div>
                <div>
                  <Label>Crate Category</Label>
                  <Select
                    value={form.crateCategory}
                    onValueChange={(v) => setField("crateCategory", v)}
                  >
                    <SelectTrigger data-ocid="packing-master.crateCategory.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="big">Big</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Crate Code / Name</Label>
                  <Input
                    data-ocid="packing-master.crateCode.input"
                    placeholder="e.g. CR-001"
                    value={form.crateCode}
                    onChange={(e) => setField("crateCode", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="packing-master.cancel_button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="packing-master.submit_button"
              onClick={handleAdd}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Packing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <DialogContent data-ocid="packing-master.delete.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Delete Packing</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this packing? This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="packing-master.delete.cancel_button"
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              data-ocid="packing-master.delete.confirm_button"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
