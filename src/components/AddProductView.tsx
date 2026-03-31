import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Zap } from "lucide-react";
import { DepartmentCombobox } from "./DepartmentCombobox";
import { getDepartmentUnit } from "@/hooks/useDepartments";

interface AddProductViewProps {
  onAdd: (product: {
    product_name: string;
    department: string;
    base_quantity: number;
    current_stock?: number;
    is_one_time?: boolean;
  }) => void;
  isAdding: boolean;
  departmentNames: string[];
  onAddDepartment: (name: string) => void;
}

export function AddProductView({ onAdd, isAdding, departmentNames, onAddDepartment }: AddProductViewProps) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState<string>(departmentNames[0] || "כללי");
  const [baseQty, setBaseQty] = useState(1);
  const [isOneTime, setIsOneTime] = useState(false);
  const [quickName, setQuickName] = useState("");

  const { unit, step, min } = getDepartmentUnit(department);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      product_name: name.trim(),
      department,
      base_quantity: isOneTime ? 1 : baseQty,
      current_stock: 0,
      is_one_time: isOneTime,
    });
    setName("");
    setBaseQty(min);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    onAdd({
      product_name: quickName.trim(),
      department: "כללי",
      base_quantity: 1,
      current_stock: 0,
      is_one_time: true,
    });
    setQuickName("");
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Quick add */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-secondary" />
          <h3 className="font-semibold">הוספה מהירה (חד-פעמי)</h3>
        </div>
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <Input
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder="שם המוצר..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isAdding || !quickName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Full add form */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold mb-4">הוספת מוצר קבוע</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">שם המוצר</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: חלב"
            />
          </div>

          <div className="space-y-2">
            <Label>מחלקה</Label>
            <DepartmentCombobox
              value={department}
              onChange={(d) => {
                setDepartment(d);
                // Reset qty to appropriate min when switching departments
                const newUnit = getDepartmentUnit(d);
                setBaseQty(newUnit.min);
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
                disabled={isOneTime}
              >
                -
              </button>
              <span className="w-16 text-center font-bold text-xl tabular-nums">
                {isOneTime ? 1 : baseQty}
              </span>
              <button
                type="button"
                onClick={() => setBaseQty(baseQty + step)}
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-lg"
                disabled={isOneTime}
              >
                +
              </button>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="one-time">פריט חד-פעמי</Label>
            <Switch
              id="one-time"
              checked={isOneTime}
              onCheckedChange={setIsOneTime}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isAdding || !name.trim()}
          >
            <Plus className="h-4 w-4 ml-2" />
            הוסף מוצר
          </Button>
        </form>
      </div>
    </div>
  );
}
