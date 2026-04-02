import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Zap, Minus } from "lucide-react";
import { DepartmentCombobox } from "./DepartmentCombobox";
import { UnitCombobox } from "./UnitCombobox";
import { autoCategorize } from "@/hooks/useDepartments";

interface AddProductViewProps {
  onAdd: (product: {
    product_name: string;
    department: string;
    base_quantity: number;
    current_stock?: number;
    is_one_time?: boolean;
    unit?: string;
  }) => void;
  isAdding: boolean;
  departmentNames: string[];
  onAddDepartment: (name: string) => void;
}

export function AddProductView({ onAdd, isAdding, departmentNames, onAddDepartment }: AddProductViewProps) {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState<string>(departmentNames[0] || "כללי");
  const [unit, setUnit] = useState("יחידות");
  const [baseQty, setBaseQty] = useState(1);
  const [isOneTime, setIsOneTime] = useState(false);
  const [quickName, setQuickName] = useState("");

  // לוגיקת צעדים מעודכנת שתואמת למזווה
  const getStep = (u: string) => {
    const lower = u.toLowerCase();
    if (lower.includes("קילו") || lower === 'ק"ג' || lower.includes("ליטר")) return 0.5;
    if (lower.includes("גרם") || lower.includes('מ"ל')) return 100;
    return 1;
  };

  const step = getStep(unit);
  const min = step;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onAdd({
      product_name: name.trim(),
      department,
      base_quantity: isOneTime ? 1 : baseQty,
      current_stock: 0,
      is_one_time: isOneTime,
      unit: isOneTime ? "יחידות" : unit,
    });
    
    setName("");
    // איפוס כמות הבסיס לפי היחידה שנבחרה
    setBaseQty(unit.includes("גרם") ? 100 : 1);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    
    // כאן ה-autoCategorize המעודכן מ-useDepartments נכנס לפעולה!
    const category = autoCategorize(quickName.trim());
    
    onAdd({
      product_name: quickName.trim(),
      department: category,
      base_quantity: 1,
      current_stock: 0,
      is_one_time: true,
      unit: "יחידות",
    });
    setQuickName("");
  };

  return (
    <div className="space-y-6 animate-slide-in font-sans">
      {/* הוספה מהירה */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-amber-50 rounded-lg">
            <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <h3 className="font-bold text-slate-800">הוספה מהירה (חד-פעמי)</h3>
        </div>
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <Input
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder="מה חסר עכשיו? (למשל: מלפפון)"
            className="flex-1 rounded-xl bg-slate-50 border-slate-200 h-12"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isAdding || !quickName.trim()}
            className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90"
          >
            <Plus className="h-5 w-5 text-white" />
          </Button>
        </form>
      </div>

      {/* טופס הוספה מלא */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-5 text-lg">הוספת מוצר קבוע</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="product-name" className="text-slate-600 font-medium">שם המוצר</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: לחם שיפון"
              className="rounded-xl bg-slate-50 border-slate-200 h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">מחלקה</Label>
            <DepartmentCombobox
              value={department}
              onChange={setDepartment}
              departments={departmentNames}
              onAddDepartment={onAddDepartment}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-600 font-medium">יחידת מידה</Label>
            <UnitCombobox value={unit} onChange={(u) => {
              setUnit(u);
              const newStep = getStep(u);
              setBaseQty(newStep === 100 ? 100 : 1);
            }} />
          </div>

          {!isOneTime && (
            <div className="space-y-2">
              <Label className="text-slate-600 font-medium">כמות בסיס (כמה תמיד צריך בבית?)</Label>
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => setBaseQty(Math.max(min, Number((baseQty - step).toFixed(2))))}
                  className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm active:scale-95 transition-all"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-black text-slate-800 tabular-nums">
                    {baseQty}
                  </span>
                  <span className="mr-2 text-sm text-slate-500 font-bold">{unit}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBaseQty(Number((baseQty + step).toFixed(2)))}
                  className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm active:scale-95 transition-all"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex flex-col">
              <Label htmlFor="one-time" className="font-bold text-slate-700">מוצר חד-פעמי</Label>
              <span className="text-xs text-slate-500">יופיע פעם אחת ברשימה ויימחק</span>
            </div>
            <Switch
              id="one-time"
              checked={isOneTime}
              onCheckedChange={setIsOneTime}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-md shadow-indigo-100 transition-all active:scale-[0.98]"
            disabled={isAdding || !name.trim()}
          >
            <Plus className="h-5 w-5 ml-2" />
            הוסף למלאי הקבוע
          </Button>
        </form>
      </div>
    </div>
  );
}
