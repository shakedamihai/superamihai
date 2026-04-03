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

    // איפוס שדות לאחר הוספה
    setName("");
    setBaseQty(unit.includes("גרם") ? 100 : 1);
    setIsManualOverride(false);
  };

  return (
    <div className="space-y-6 animate-slide-in font-sans pb-10 mt-4 max-w-md mx-auto">
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm overflow-hidden">
        <h3 className="font-black text-2xl text-slate-800 mb-6 text-right">הוספת פריט</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* באנרים לבחירה בין קבוע לחד-פעמי */}
          <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-2">
            <button
              type="button"
              onClick={() => setIsOneTime(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all ${
                !isOneTime 
                  ? "bg-white text-indigo-600 shadow-md scale-[1.02]" 
                  : "text-slate-500 hover:text-slate-600"
              }`}
            >
              <RotateCcw className={`h-4 w-4 ${!isOneTime ? "animate-spin-slow" : ""}`} />
              מוצר קבוע
            </button>
            <button
              type="button"
              onClick={() => setIsOneTime(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all ${
                isOneTime 
                  ? "bg-white text-amber-600 shadow-md scale-[1.02]" 
                  : "text-slate-500 hover:text-slate-600"
              }`}
            >
              <Zap className={`h-4 w-4 ${isOneTime ? "fill-amber-500" : ""}`} />
              חד-פעמי
            </button>
          </div>

          {/* שם המוצר */}
          <div className="space-y-2">
            <Label className="font-bold mr-1 text-slate-700">שם הפריט</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={isOneTime ? "מה צריך לקנות עכשיו?..." : "לדוגמה: ביצים, חלב..."} 
              className="rounded-xl bg-slate-50 h-12 border-slate-200 focus:ring-2 focus:ring-indigo-500/20" 
            />
          </div>

          {/* מחלקה */}
          <div className="space-y-2">
            <Label className="font-bold mr-1 text-slate-700">מחלקה</Label>
            <DepartmentCombobox 
              value={department} 
              onChange={(val) => { setDepartment(val); setIsManualOverride(true); }} 
              departments={departmentNames} 
              onAddDepartment={onAddDepartment} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* יחידת מידה */}
            <div className="space-y-2">
              <Label className="font-bold mr-1 text-slate-700">יחידה</Label>
              <UnitCombobox value={unit} onChange={(u) => { setUnit(u); setBaseQty(getStep(u) === 100 ? 100 : 1); }} />
            </div>

            {/* כמות */}
            <div className="space-y-2">
              <Label className="font-bold mr-1 text-slate-700">כמות</Label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-10 overflow-hidden">
                <button type="button" onClick={() => setBaseQty(Math.max(step, Number((baseQty - step).toFixed(2))))} className="px-2 h-full hover:bg-slate-200 text-slate-500 transition-colors">
                  <Minus className="h-3.5 w-3.5"/>
                </button>
                <span className="flex-1 text-center font-bold text-sm tabular-nums text-slate-700">{baseQty}</span>
                <button type="button" onClick={() => setBaseQty(Number((baseQty + step).toFixed(2)))} className="px-2 h-full hover:bg-slate-200 text-slate-500 transition-colors">
                  <Plus className="h-3.5 w-3.5"/>
                </button>
              </div>
            </div>
          </div>

          {/* הודעת הסבר דינמית */}
          <div className={`p-4 rounded-2xl text-xs font-medium flex items-start gap-3 border transition-colors ${
            isOneTime 
              ? "bg-amber-50 text-amber-800 border-amber-100" 
              : "bg-indigo-50 text-indigo-800 border-indigo-100"
          }`}>
            {isOneTime ? <Zap className="h-4 w-4 shrink-0 fill-amber-500" /> : <RotateCcw className="h-4 w-4 shrink-0" />}
            <p className="leading-relaxed">
              {isOneTime 
                ? "מוצר חד-פעמי יתווסף ישירות לרשימת הקניות ויימחק מהמערכת ברגע שתסיימי לקנות אותו." 
                : "מוצר קבוע יישמר במזווה שלך ויופיע ברשימת הקניות בכל פעם שתסמני שהוא חסר."}
            </p>
          </div>

          {/* כפתור הוספה */}
          <Button 
            type="submit" 
            className={`w-full h-14 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-[0.98] ${
              isOneTime 
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
            }`}
            disabled={isAdding || !name.trim()}
          >
            <Plus className="h-5 w-5 ml-2" />
            {isOneTime ? "הוסף לרשימת הקניות" : "הוסף למזווה הקבוע"}
          </Button>
        </form>
      </div>
    </div>
  );
}
