import { useState } from "react";
import { Product } from "@/hooks/useProducts";
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
import { DepartmentCombobox } from "./DepartmentCombobox";
import { getDepartmentUnit } from "@/hooks/useDepartments";

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: { id: string; product_name?: string; department?: string; base_quantity?: number }) => void;
  departmentNames: string[];
  onAddDepartment: (name: string) => void;
}

export function EditProductDialog({ product, open, onClose, onSave, departmentNames, onAddDepartment }: EditProductDialogProps) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [baseQty, setBaseQty] = useState(1);

  const [lastId, setLastId] = useState<string | null>(null);
  if (product && product.id !== lastId) {
    setName(product.product_name);
    setDepartment(product.department);
    setBaseQty(product.base_quantity);
    setLastId(product.id);
  }

  const { unit, step, min } = getDepartmentUnit(department);

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
            <DepartmentCombobox
              value={department}
              onChange={(d) => {
                setDepartment(d);
                const newUnit = getDepartmentUnit(d);
                setBaseQty(Math.max(newUnit.min, baseQty));
              }}
              departments={departmentNames}
              onAddDepartment={onAddDepartment}
            />
          </div>
          <div className="space-y-2">
            <Label>כמות בסיס ({unit})</Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setBaseQty(Math.max(min, baseQty - step))}
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-lg"
              >
                -
              </button>
              <span className="w-16 text-center font-bold text-xl tabular-nums">{baseQty}</span>
              <button
                type="button"
                onClick={() => setBaseQty(baseQty + step)}
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-lg"
              >
                +
              </button>
              <span className="text-sm text-muted-foreground">{unit}</span>
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
