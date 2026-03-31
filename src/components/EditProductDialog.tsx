import { useState } from "react";
import { Product, DEPARTMENTS } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: { id: string; product_name?: string; department?: string; base_quantity?: number }) => void;
}

export function EditProductDialog({ product, open, onClose, onSave }: EditProductDialogProps) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [baseQty, setBaseQty] = useState(1);

  // Sync state when product changes
  const [lastId, setLastId] = useState<string | null>(null);
  if (product && product.id !== lastId) {
    setName(product.product_name);
    setDepartment(product.department);
    setBaseQty(product.base_quantity);
    setLastId(product.id);
  }

  const handleSave = () => {
    if (!product || !name.trim()) return;
    onSave({
      id: product.id,
      product_name: name.trim(),
      department,
      base_quantity: baseQty,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setLastId(null); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>עריכת מוצר</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>שם המוצר</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>מחלקה</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>כמות בסיס</Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setBaseQty(Math.max(1, baseQty - 1))}
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-lg"
              >
                -
              </button>
              <span className="w-12 text-center font-bold text-xl tabular-nums">{baseQty}</span>
              <button
                type="button"
                onClick={() => setBaseQty(baseQty + 1)}
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-lg"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-row-reverse gap-2 mt-2">
          <Button onClick={handleSave} disabled={!name.trim()}>שמור</Button>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
