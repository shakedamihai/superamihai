import { 
  Copy, CheckCircle2, ChevronDown, Trash2, Check, Search, X,
  Beef, Carrot, Milk, Snowflake, Sparkles, 
  Wheat, CupSoda, Baby, ShoppingBag, Apple, Fish
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/hooks/useProducts";
import { isLactoseFree } from "@/hooks/useDepartments";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // נוסף ה-Import שהיה חסר
} from "@/components/ui/alert-dialog";

interface ShoppingListViewProps {
  shoppingByDepartment: Record<string, Product[]>;
  shoppingList: Product[];
  departmentOrder: string[];
  onCopyList: () => void;
  onFinishChecked: (checkedIds: Set<string>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (updates: { id: string; current_stock?: number }) => void;
  isFinishing: boolean;
}

const COLORS = [
  { borderClass: 'border-r-red-500', iconClass: 'text-red-500' },
  { borderClass: 'border-r-green-500', iconClass: 'text-green-500' },
  { borderClass: 'border-r-blue-500', iconClass: 'text-blue-500' },
  { borderClass: 'border-r-orange-500', iconClass: 'text-orange-500' },
  { borderClass: 'border-r-purple-500', iconClass: 'text-purple-500' },
  { borderClass: 'border-r-cyan-500', iconClass: 'text-cyan-500' },
  { borderClass: 'border-r-pink-500', iconClass: 'text-pink-500' },
  { borderClass: 'border-r-amber-500', iconClass: 'text-amber-500' },
  { borderClass: 'border-r-indigo-500', iconClass: 'text-indigo-500' },
  { borderClass: 'border-r-teal-500', iconClass: 'text-teal-500' },
];

const getDeptIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('ירק')) return Carrot;
  if (lower.includes('פיר')) return Apple;
  if (lower.includes('חלב') || lower.includes('גבינ') || lower.includes('מקרר')) return Milk;
  if (lower.includes('בשר') || lower.includes('עוף') || lower.includes('קצביה')) return Beef;
  if (lower.includes('דג')) return Fish;
  if (lower.includes('קפוא')) return Snowflake;
  if (lower.includes('פארם') || lower.includes('נקיון') || lower.includes('סבון')) return Sparkles;
  if (lower.includes('מאפי') || lower.includes('לחם')) return Wheat;
  if (lower.includes('שתי') || lower.includes('משק')) return CupSoda;
  if (lower.includes('תינוק')) return Baby;
  return ShoppingBag;
};

export function ShoppingListView({
  shoppingByDepartment,
  shoppingList,
  onCopyList,
  onFinishChecked,
  onDeleteProduct,
  onUpdateProduct,
  isFinishing,
}: ShoppingListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>(() =>
    Object.keys(shoppingByDepartment).reduce((acc, d) => ({ ...acc, [d]: true }), {})
  );
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const isSearching = searchQuery.length > 0;
  const lowerQuery = searchQuery.toLowerCase();

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.is_one_time) {
      onDeleteProduct(deleteTarget.id);
    } else {
      // עדכון מלאי ל-100% כדי שיצא מרשימת הקניות
      onUpdateProduct({ id: deleteTarget.id, current_stock: deleteTarget.base_quantity });
    }
    setDeleteTarget(null);
  };

  const filteredDepts = useMemo(() => {
    const keys = Object.keys(shoppingByDepartment).sort();
    if (!searchQuery) return keys;
    return keys.filter(dept => {
      const matchesDept = dept.toLowerCase().includes(lowerQuery);
      const items = shoppingByDepartment[dept] || [];
      return matchesDept || items.some(p => p.product_name?.toLowerCase().includes(lowerQuery));
    });
  }, [shoppingByDepartment, searchQuery, lowerQuery]);

  if (shoppingList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 min-h-screen">
        <div className="bg-white p-8 rounded-3xl border border-dashed shadow-sm flex flex-col items-center font-sans">
          <CheckCircle2 className="h-12 w-12 text-primary/30 mb-4" />
          <p className="text-xl font-bold">הכל במלאי! 🎉</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 bg-slate-50 min-h-screen pt-4 px-2 font-sans">
      
      {/* אזור הניהול הבהיר */}
      <div className={`relative bg-white border border-slate-200 shadow-sm transition-all duration-300 ${isSearching ? 'rounded-2xl p-4' : 'rounded-[2rem] p-6'}`}>
        <div className="space-y-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 right-0 flex items-center pr-4"><Search className="h-5 w-5 text-slate-400" /></div>
            <Input
              placeholder="חיפוש פריט או מחלקה..."
              className="w-full pl-10 pr-12 py-6 rounded-xl bg-slate-50 border-slate-200 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><X className="h-5 w-5" /></button>}
          </div>

          {!isSearching && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-2 px-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                  <span>התקדמות קנייה</span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{checked.size}/{shoppingList.length}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(checked.size / shoppingList.length) * 100}%` }} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={onCopyList} variant="outline" className="flex-1 gap-2 rounded-xl h-12 border-slate-200 font-bold text-slate-700"><Copy className="h-4 w-4" /> העתק</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="flex-1 gap-2 rounded-xl h-12 font-bold" disabled={isFinishing || checked.size === 0}><CheckCircle2 className="h-4 w-4" /> סיום</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl p-6">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-right">סיימת לקנות?</AlertDialogTitle>
                      <AlertDialogDescription className="text-right">הפריטים שסומנו יעברו למלאי.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
                      <AlertDialogAction className="rounded-xl" onClick={() => { onFinishChecked(checked); setChecked(new Set()); }}>עדכן מלאי</AlertDialogAction>
                      <AlertDialogCancel className="rounded-xl">ביטול</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        {!isSearching && <div className="flex items-center justify-between px-3 mb-4"><h2 className="text-xl font-extrabold text-slate-800">מה לקנות?</h2></div>}
        <div className="space-y-4">
          {filteredDepts.map((dept) => {
            const items = shoppingByDepartment[dept];
            const displayItems = isSearching ? (dept.toLowerCase().includes(lowerQuery) ? items : items.filter(p => p.product_name?.toLowerCase().includes(lowerQuery))) : items;
            const Icon = getDeptIcon(dept);
            const deptStyle = COLORS.find(c => dept.toLowerCase().includes(c.iconClass.split('-')[1])) || COLORS[3];

            return (
              <Collapsible key={dept} open={isSearching ? true : (openDepts[dept] !== false)} onOpenChange={(open) => setOpenDepts(prev => ({ ...prev, [dept]: open }))} className={`bg-white rounded-2xl shadow-sm border border-border overflow-hidden border-r-4 ${deptStyle.borderClass}`}>
                <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-4 font-bold text-foreground">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${deptStyle.iconClass}`} />
                    <span>{dept}</span>
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-black">{displayItems.length}</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-slate-300 transition-transform ${openDepts[dept] !== false || isSearching ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3 pb-3 space-y-2 mt-1">
                  <div className="space-y-2 border-t border-border/50 pt-3">
                    {displayItems.map((p) => {
                      const isChecked = checked.has(p.id);
                      const lactoseFree = isLactoseFree(p.product_name);
                      const unitDisplay = p.unit?.toLowerCase().includes("קילו") ? 'ק"ג' : (p.unit || "יחידות");

                      return (
                        <div key={p.id} className={`flex items-center justify-between rounded-xl px-4 py-3.5 border transition-all ${isChecked ? "bg-muted/40 opacity-50" : "bg-white border-gray-100"}`}>
                          <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => {
                            const next = new Set(checked);
                            if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                            setChecked(next);
                          }}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isChecked ? "bg-primary border-primary text-white" : "bg-white border-muted-foreground/30"}`}>{isChecked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</div>
                            <div className="flex flex-col text-right">
                              <span className={`text-[1.05rem] font-medium ${isChecked ? "line-through text-muted-foreground" : ""}`}>{p.product_name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-primary font-bold">{p.is_one_time ? '1 יחידות' : `${Math.max(0, p.base_quantity - p.current_stock)} ${unitDisplay}`}</span>
                                {lactoseFree && <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold">ללא לקטוז</span>}
                                {p.is_one_time && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">מוצר חד-פעמי</span>}
                              </div>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }} className="text-muted-foreground/40 p-2 hover:text-red-500 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl p-6 font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              {deleteTarget?.is_one_time ? 'למחוק את המוצר?' : 'להסיר מרשימת הקניות?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right mt-2 font-medium">
              {deleteTarget?.is_one_time 
                ? 'המוצר החד-פעמי יימחק לחלוטין מהמערכת.' 
                : 'המוצר יוסר מהרשימה והמלאי שלו יעודכן כ"מלא". הוא עדיין יישאר במזווה.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
            <AlertDialogAction className="rounded-xl px-6 py-5 bg-red-500 hover:bg-red-600 text-white font-bold" onClick={confirmDelete}>
              {deleteTarget?.is_one_time ? 'מחק מוצר' : 'עדכן מלאי והסר'}
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-xl px-6 py-5 font-medium">ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
