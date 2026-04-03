import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [quickQty, setQuickQty] = useState<number | string>(1);
  const [isManualOverride, setIsManualOverride] = useState(false);

  useEffect(() => {
    if (name.length <= 1) setIsManualOverride(false);
    
    if (name.trim() && !isManualOverride) {
      const category = autoCategorize(name.trim());
      if (category !== "כללי" || department === "כללי") {
        if (department !== category) setDepartment(category);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      product_name: name.trim(),
      department,
      base_quantity: baseQty, // עכשיו הכמות נשמרת גם בחד-פעמי
      current_stock: 0, // תמיד 0 כדי שיקפוץ ישר לרשימה
      is_one_time: isOneTime,
      unit: unit, // עכשיו היחידה נשמרת גם בחד-פעמי
    });

    // איפוס
    setName("");
    setBaseQty(unit.includes("גרם") ? 100 : 1);
    setIsOneTime(false);
    setIsManualOverride(false);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    const category = autoCategorize(quickName.trim());
    onAdd({
      product_name: quickName.trim(),
      department: category,
      base_quantity: Number(quickQty) || 1,
      current_stock: 0,
      is_one_time: true,
      unit: "יחידות",
    });
    setQuickName("");
    setQuickQty(1);
  };

  return (
    <div className="space-y-6 animate-slide-in font-sans pb-10">
      {/* הוספה מהירה (למעלה) */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 shadow-sm mt-2">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-amber-50 rounded-lg"><Zap className="h-4 w-4 text-amber-500 fill-amber-500" /></div>
          <h3 className="font-bold text-slate-800">הוספה מהירה לסטייקייה (חד-פעמי)</h3>
        </div>
        <form onSubmit={handleQuickAdd} className="flex gap-2 items-center">
          <Input 
            value={quickName} 
            onChange={(e) => setQuickName(e.target.value)} 
            placeholder="מה חסר לעכשיו?..." 
            className="flex-1 rounded-xl bg-slate-50 h-12" 
          />
          <div className="flex items-center bg-slate-50 rounded-xl border border-slate-200 h-12 overflow-hidden">
            <button 
              type="button" 
              onClick={() => setQuickQty(Math.max(1, (Number(quickQty) || 1) - 1))} 
              className="px-3 h-full text-slate-400 hover:bg-slate-200 transition-colors"
            >
              <Minus className="h-4 w-4"/>
            </button>
            <span className="w-8 text-center font-bold text-slate-800 tabular-nums">{quickQty}</span>
            <button 
              type="button" 
              onClick={() => setQuickQty((Number(quickQty) || 1) + 1)} 
              className="px-3 h-full text-slate-400 hover:bg-slate-200 transition-colors"
            >
              <Plus className="h-4 w-4"/>
            </button>
          </div>
          <Button type="submit" size="icon" disabled={isAdding || !quickName.trim()} className="h-12 w-12 rounded-xl shrink-0 bg-amber-500 hover:bg-amber-600 text-white">
            <Plus className="h-5 w-5" />
          </Button>
        </form>
      </div>

      {/* הוספה מפורטת למזווה */}
      <div className="bg-white rounded-[1.5rem] border border-slate-200 p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-5">הוספה מפורטת למזווה</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="font-bold">שם המוצר</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: שמן זית מרוקאי" className="rounded-xl bg-slate-50 h-11" />
          </div>

          <div className="space-y-2">
            <Label className="font-bold">מחלקה</Label>
            <DepartmentCombobox 
              value={department} 
              onChange={(val) => { setDepartment(val); setIsManualOverride(true); }} 
              departments={departmentNames} 
              onAddDepartment={onAddDepartment} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold">יחידה</Label>
              <UnitCombobox value={unit} onChange={(u) => { setUnit(u); setBaseQty(getStep(u) === 100 ? 100 : 1); }} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">כמות</Label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-10 overflow-hidden">
                <button type="button" onClick={() => setBaseQty(Math.max(step, Number((baseQty - step).toFixed(2))))} className="px-2 h-full hover:bg-slate-200 text-slate-500"><Minus className="h-3.5 w-3.5"/></button>
                <span className="flex-1 text-center font-bold text-sm">{baseQty}</span>
                <button type="button" onClick={() => setBaseQty(Number((baseQty + step).toFixed(2)))} className="px-2 h-full hover:bg-slate-200 text-slate-500"><Plus className="h-3.5 w-3.5"/></button>
              </div>
            </div>
          </div>

          {/* כפתור ה-Zap המעוצב למוצר חד-פעמי */}
          <button
            type="button"
            onClick={() => setIsOneTime(!isOneTime)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
              isOneTime 
                ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm" 
                : "border-slate-100 bg-slate-50 text-slate-400"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isOneTime ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                <Zap className={`h-5 w-5 ${isOneTime ? "fill-white" : ""}`} />
              </div>
              <div className="flex flex-col text-right">
                <span className="font-bold text-sm">מוצר חד-פעמי</span>
                <span className="text-[10px] opacity-80">יופיע רק פעם אחת ברשימת הקניות</span>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isOneTime ? "border-orange-500 bg-orange-500" : "border-slate-300"}`}>
              {isOneTime && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </button>

          <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-md transition-all active:scale-[0.98]" disabled={isAdding || !name.trim()}>
            <Plus className="h-5 w-5 ml-2" /> הוסף למערכת
          </Button>
        </form>
      </div>
    </div>
  );
}
