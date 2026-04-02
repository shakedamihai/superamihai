import { useState, useEffect } from "react";
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
  
  // משתני הוספה מהירה
  const [quickName, setQuickName] = useState("");
  const [quickQty, setQuickQty] = useState<number | string>(1);
  
  const [isManualOverride, setIsManualOverride] = useState(false);

  useEffect(() => {
    if (name.length <= 1) {
      setIsManualOverride(false);
    }
    
    if (name.trim() && !isManualOverride) {
      const category = autoCategorize(name.trim());
      if (category !== "כללי" || department === "כללי") {
        if (department !== category) {
          setDepartment(category);
        }
      }
    }
  }, [name, isManualOverride, department]);

  const getStep = (u: string) => {
    const l = u.toLowerCase();
    if (l.includes("קילו") || l === 'ק"ג' || l.includes("ליטר")) return 0.5;
    if (l.includes("גרם") || l.includes('מ"ל')) return 100;
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
    setBaseQty(unit.includes("גרם") ? 100 : 1);
    setIsManualOverride(false);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    const category = autoCategorize(quickName.trim());
    onAdd({
      product_name: quickName.trim(),
      department: category,
      base_quantity: Number(quickQty) || 1, // הבטחה שזה נשלח כמספר
      current_stock: 0,
      is_one_time: true,
      unit: "יחידות",
    });
    setQuickName("");
    setQuickQty(1); // איפוס
  };

  return (
    <div className="space-y-6 animate-slide-in font-sans">
      <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 shadow-sm mt-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-amber-50 rounded-lg"><Zap className="h-4 w-4 text-amber-500 fill-amber-500" /></div>
          <h3 className="font-bold text-slate-800">הוספת מוצרים חד פעמיים</h3>
        </div>
        <form onSubmit={handleQuickAdd} className="flex gap-2 items-center">
          <Input 
            value={quickName} 
            onChange={(e) => setQuickName(e.target.value)} 
            placeholder="שם המוצר..." 
            className="flex-1 rounded-xl bg-slate-50 h-12" 
          />
          <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 h-12 overflow-hidden">
            <button 
              type="button" 
              onClick={() => setQuickQty(Math.max(1, (Number(quickQty) || 1) - 1))} 
              className="px-3 h-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 active:bg-slate-300 transition-colors"
            >
              <Minus className="h-4 w-4"/>
            </button>
            <input 
              type="number"
              min="1"
              value={quickQty}
              onChange={(e) => setQuickQty(e.target.value)}
              onBlur={() => {
                // אם המשתמש מוחק את הכל ועוזב את השדה, זה יחזור ל-1 אוטומטית
                if (Number(quickQty) < 1 || isNaN(Number(quickQty))) {
                  setQuickQty(1);
                }
              }}
              className="w-10 text-center font-bold text-slate-800 bg-transparent border-none p-0 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button 
              type="button" 
              onClick={() => setQuickQty((Number(quickQty) || 1) + 1)} 
              className="px-3 h-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 active:bg-slate-300 transition-colors"
            >
              <Plus className="h-4 w-4"/>
            </button>
          </div>
          <Button type="submit" size="icon" disabled={isAdding || !quickName.trim()} className="h-12 w-12 rounded-xl shrink-0 bg-amber-500 hover:bg-amber-600 text-white">
            <Plus className="h-5 w-5" />
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-5">הוספת מוצר למזווה הקבוע</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>שם המוצר</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: שוקולד חלב" className="rounded-xl bg-slate-50 h-11" />
          </div>

          <div className="space-y-2">
            <Label>מחלקה</Label>
            <DepartmentCombobox 
              value={department} 
              onChange={(val) => { setDepartment(val); setIsManualOverride(true); }} 
              departments={departmentNames} 
              onAddDepartment={onAddDepartment} 
            />
          </div>

          <div className="space-y-2">
            <Label>יחידת מידה</Label>
            <UnitCombobox value={unit} onChange={(u) => { setUnit(u); setBaseQty(getStep(u) === 100 ? 100 : 1); }} />
          </div>

          {!isOneTime && (
            <div className="space-y-2">
              <Label>כמות בסיס במלאי</Label>
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <button type="button" onClick={() => setBaseQty(Math.max(min, Number((baseQty - step).toFixed(2))))} className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <Minus className="h-5 w-5" />
                </button>
                <div className="flex-1 text-center"><span className="text-2xl font-black text-slate-800">{baseQty}</span><span className="mr-2 text-sm text-slate-500">{unit}</span></div>
                <button type="button" onClick={() => setBaseQty(Number((baseQty + step).toFixed(2)))} className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Label htmlFor="one-time" className="font-bold">מוצר חד-פעמי (לא יישאר במזווה)</Label>
            <Switch id="one-time" checked={isOneTime} onCheckedChange={setIsOneTime} />
          </div>

          <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-md shadow-indigo-100 transition-all active:scale-[0.98]" disabled={isAdding || !name.trim()}>
            <Plus className="h-5 w-5 ml-2" /> הוסף למלאי
          </Button>
        </form>
      </div>
    </div>
  );
}
