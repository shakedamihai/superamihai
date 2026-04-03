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
import { UnitCombobox } from "./UnitCombobox";

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSave: (updates: { id: string; product_name?: string; department?: string; base_quantity?: number; unit?: string }) => void;
  departmentNames: string[];
  onAddDepartment: (name: string) => void;
}

export function EditProductDialog({ product, open, onClose, onSave, departmentNames, onAddDepartment }: EditProductDialogProps) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [unit, setUnit] = useState("יחידות");
  const [baseQty, setBaseQty] = useState(1);

  // פונקציה חכמה לתיקון שמות יחידות והפיכתן לרבים ולתקן החדש
  const formatUnit = (u?: string) => {
    if (!u || u.trim() === "") return "יחידות";
    const lowerUnit = u.toLowerCase().trim();
    if (lowerUnit.includes("קילו") || lowerUnit === 'ק"ג') return 'ק"ג';
    if (lowerUnit === "חבילה") return "חבילות";
    if (lowerUnit === "מארז") return "מארזים";
    if (lowerUnit === "ליטר") return "ליטרים";
    if (lowerUnit === "בקבוק") return "בקבוקים";
    return u;
  };

  const [lastId, setLastId] = useState<string | null>(null);
  if (product && product.id !== lastId) {
    setName(product.product_name);
    setDepartment(product.department);
    setUnit(formatUnit(product.unit)); // מתקן אוטומטית כשהמוצר נטען לעריכה
    setBaseQty(product.base_quantity);
    setLastId(product.id);
  }

  // חישוב הקפיצות לפי התקן החדש (ק"ג במקום קילו)
  const step = unit === 'ק"ג' ? 0.5 : unit === "גרם" ? 100 : 1;
  const min = step;

  const handleSave = () => {
    if (!product || !name.trim()) return;
    onSave({
      id: product.id,
      product_name: name.trim(),
      department,
      base_quantity: baseQty,
      unit,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setLastId(null); } }}>
      <DialogContent className="max-w-sm font-sans" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">עריכת מוצר</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>שם המוצר</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="text-right" />
          </div>
          <div className="space-y-2">
            <Label>מחלקה</Label>
            <DepartmentCombobox
              value={department}
              onChange={setDepartment}
              departments={departmentNames}
              onAddDepartment={onAddDepartment}
            />
          </div>
          <div className="space-y-2">
            <Label>יחידת מידה</Label>
            <UnitCombobox value={unit} onChange={(u) => {
              const formattedU = formatUnit(u);
              setUnit(formattedU);
              const newStep = formattedU === 'ק"ג' ? 0.5 : formattedU === "גרם" ? 100 : 1;
              setBaseQty(Math.max(newStep, baseQty));
            }} />
          </div>
          <div className="space-y-2">
            <Label>כמות יעד ({unit})</Label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1 w-fit">
              <button
                type="button"
                onClick={() => setBaseQty(Math.max(min, baseQty - step))}
                className="w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center font-bold text-lg text-slate-600 hover:bg-slate-100"
              >
                -
              </button>
              <span className="w-16 text-center font-bold text-xl tabular-nums">{baseQty}</span>
              <button
                type="button"
                onClick={() => setBaseQty(baseQty + step)}
                className="w-10 h-10 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center font-bold text-lg text-slate-600 hover:bg-slate-100"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:justify-start mt-4">
          <Button onClick={handleSave} disabled={!name.trim()} className="w-full sm:w-auto font-bold bg-indigo-600 hover:bg-indigo-700">שמור שינויים</Button>
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">ביטול</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
