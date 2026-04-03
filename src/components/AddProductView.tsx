import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Zap, Minus, RotateCcw } from "lucide-react";
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
      base_quantity: baseQty,
      current_stock: 0, 
      is_one_time: isOneTime,
      unit: unit,
    });

    setName("");
    setBaseQty(unit.includes("גרם") ? 100 : 1);
    setIsManualOverride(false);
  };

  return (
    <div className="animate-slide-in font-sans max-w-md mx-auto mt-1 px-1">
      <div className="bg-white rounded-[1.5rem] border border-slate-200 p-4 shadow-sm">
        <h3 className="font-black text-lg text-slate-800 mb-3 text-right">הוספת פריט</h3>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* באנרים לבחירה - גרסה צרה יותר */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setIsOneTime(false)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
                !isOneTime ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              מוצר קבוע
            </button>
            <button
              type="button"
              onClick={() => setIsOneTime(true)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${
                isOneTime ? "bg-white text-amber-600 shadow-sm" : "text-slate-500"
              }`}
            >
              <Zap className={`h-3.5 w-3.5 ${isOneTime ? "fill-amber-500" : ""}`} />
              חד-פעמי
            </button>
          </div>

          {/* שם הפריט */}
          <div className="space-y-1">
            <Label className="text-xs font-bold mr-1 text-slate-600">שם הפריט</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={isOneTime ? "מה לקנות?" : "למשל: חלב, ביצים..."} 
              className="rounded-xl bg-slate-50 h-10 border-slate-200" 
            />
          </div>

          {/* מחלקה */}
          <div className="space-y-1">
            <Label className="text-xs font-bold mr-1 text-slate-600">מחלקה</Label>
            <DepartmentCombobox 
              value={department} 
              onChange={(val) => { setDepartment(val); setIsManualOverride(true); }} 
              departments={departmentNames} 
              onAddDepartment={onAddDepartment} 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* יחידה */}
            <div className="space-y-1">
              <Label className="text-xs font-bold mr-1 text-slate-600">יחידה</Label>
              <UnitCombobox value={unit} onChange={(u) => { setUnit(u); setBaseQty(getStep(u) === 100 ? 100 : 1); }} />
            </div>

            {/* כמות */}
            <div className="space-y-1">
              <Label className="text-xs font-bold mr-1 text-slate-600">כמות</Label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-9 overflow-hidden">
                <button type="button" onClick={() => setBaseQty(Math.max(step, Number((baseQty - step).toFixed(2))))} className="px-2 h-full hover:bg-slate-200 text-slate-500"><Minus className="h-3 w-3"/></button>
                <span className="flex-1 text-center font-bold text-xs tabular-nums">{baseQty}</span>
                <button type="button" onClick={() => setBaseQty(Number((baseQty + step).toFixed(2)))} className="px-2 h-full hover:bg-slate-200 text-slate-500"><Plus className="h-3 w-3"/></button>
              </div>
            </div>
          </div>

          {/* הסבר קצר במיוחד */}
          <div className={`p-2 rounded-lg text-[10px] font-medium flex items-center gap-2 border ${
            isOneTime ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-indigo-50 text-indigo-700 border-indigo-100"
          }`}>
            {isOneTime ? <Zap className="h-3 w-3 fill-amber-500" /> : <RotateCcw className="h-3 w-3" />}
            <span>{isOneTime ? "יימחק מהמערכת בסיום הקנייה" : "יישמר במזווה הקבוע שלך"}</span>
          </div>

          {/* כפתור הוספה */}
          <Button 
            type="submit" 
            className={`w-full h-11 rounded-xl font-bold text-base shadow-sm transition-all active:scale-[0.98] ${
              isOneTime ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
            disabled={isAdding || !name.trim()}
          >
            <Plus className="h-4 w-4 ml-1.5" />
            {isOneTime ? "הוסף לקניות" : "הוסף למזווה"}
          </Button>
        </form>
      </div>
    </div>
  );
}
