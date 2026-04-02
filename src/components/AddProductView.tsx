import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Zap, Minus, RefreshCw } from "lucide-react";
import { DepartmentCombobox } from "./DepartmentCombobox";
import { UnitCombobox } from "./UnitCombobox";
import { autoCategorize, useDepartments } from "@/hooks/useDepartments";

export function AddProductView({ onAdd, isAdding, departmentNames, onAddDepartment }: any) {
  const { syncStandardDepartments } = useDepartments();
  const [name, setName] = useState("");
  const [department, setDepartment] = useState<string>(departmentNames[0] || "כללי");
  const [unit, setUnit] = useState("יחידות");
  const [baseQty, setBaseQty] = useState(1);
  const [isOneTime, setIsOneTime] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);

  // לוגיקה חכמה: איפוס דריסה ידנית כשהשם נמחק או מוחלף בטקסט חדש (אורך 0 או 1)
  useEffect(() => {
    if (name.length <= 1) {
      setIsManualOverride(false);
    }
    
    if (name.trim() && !isManualOverride) {
      const category = autoCategorize(name.trim());
      if (category !== "כללי" || department === "כללי") {
        setDepartment(category);
      }
    }
  }, [name, isManualOverride]);

  const getStep = (u: string) => {
    const l = u.toLowerCase();
    if (l.includes("קילו") || l === 'ק"ג' || l.includes("ליטר")) return 0.5;
    if (l.includes("גרם") || l.includes('מ"ל')) return 100;
    return 1;
  };

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
    setBaseQty(1);
    setIsManualOverride(false);
  };

  return (
    <div className="space-y-6 animate-slide-in font-sans">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
        <span className="text-indigo-900 text-sm font-medium">רוצה לסנכרן את כל המחלקות החדשות?</span>
        <Button size="sm" onClick={() => syncStandardDepartments.mutate()} className="bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-100 rounded-xl gap-2">
          <RefreshCw className="h-4 w-4" /> סנכרן
        </Button>
      </div>

      <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-5">הוספת מוצר</h3>
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
              <Label>כמות בסיס</Label>
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <button type="button" onClick={() => setBaseQty(Math.max(0.1, Number((baseQty - getStep(unit)).toFixed(2))))} className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <Minus className="h-5 w-5" />
                </button>
                <div className="flex-1 text-center"><span className="text-2xl font-black">{baseQty}</span><span className="mr-2 text-sm text-slate-500">{unit}</span></div>
                <button type="button" onClick={() => setBaseQty(Number((baseQty + getStep(unit)).toFixed(2)))} className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Label htmlFor="one-time" className="font-bold">מוצר חד-פעמי</Label>
            <Switch id="one-time" checked={isOneTime} onCheckedChange={setIsOneTime} />
          </div>

          <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-black text-lg" disabled={isAdding || !name.trim()}>
            <Plus className="h-5 w-5 ml-2" /> הוסף למלאי
          </Button>
        </form>
      </div>
    </div>
  );
}
