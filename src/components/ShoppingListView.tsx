import { 
  Copy, CheckCircle2, ChevronDown, Trash2, Check, Search, X, Zap,
  Beef, Carrot, Milk, Snowflake, Sparkles, Wheat, CupSoda, Baby, ShoppingBag, 
  Apple, Fish, Package, ChefHat, Leaf, Droplets, UtensilsCrossed, Candy,
  CookingPot, Grape 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/hooks/useProducts";
import { useDepartments } from "@/hooks/useDepartments";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const DEPT_CONFIG: Record<string, { icon: any, color: string, border: string }> = {
  "ירקות": { icon: Carrot, color: "text-emerald-500", border: "border-r-emerald-500" },
  "פירות": { icon: Apple, color: "text-pink-500", border: "border-r-pink-500" },
  "מוצרי חלב ומקרר": { icon: Milk, color: "text-blue-500", border: "border-r-blue-500" },
  "קצביה": { icon: Beef, color: "text-red-500", border: "border-r-red-500" },
  "דגים": { icon: Fish, color: "text-cyan-500", border: "border-r-cyan-500" },
  "קפואים": { icon: Snowflake, color: "text-indigo-600", border: "border-r-indigo-600" },
  "מזווה ושימורים": { icon: Package, color: "text-orange-500", border: "border-r-orange-500" },
  "תבלינים ואפייה": { icon: CookingPot, color: "text-stone-600", border: "border-r-stone-600" },
  "מאפייה ולחם": { icon: Wheat, color: "text-yellow-500", border: "border-r-yellow-500" },
  "חטיפים ומתוקים": { icon: Candy, color: "text-purple-500", border: "border-r-purple-500" },
  "משקאות": { icon: CupSoda, color: "text-indigo-500", border: "border-r-indigo-500" },
  "פארם וטואלטיקה": { icon: Sparkles, color: "text-fuchsia-500", border: "border-r-fuchsia-500" },
  "חומרי ניקוי": { icon: Droplets, color: "text-slate-500", border: "border-r-slate-500" },
  "חד-פעמי": { icon: UtensilsCrossed, color: "text-rose-400", border: "border-r-rose-400" },
  "תינוקות": { icon: Baby, color: "text-teal-500", border: "border-r-teal-500" },
  "פיצוחים ופירות יבשים": { icon: Grape, color: "text-amber-700", border: "border-r-amber-700" },
  "מעדניה": { icon: ChefHat, color: "text-violet-600", border: "border-r-violet-600" },
  "בריאות ואורגני": { icon: Leaf, color: "text-lime-500", border: "border-r-lime-500" },
  "כללי": { icon: ShoppingBag, color: "text-slate-400", border: "border-r-slate-400" },
};

const formatUnit = (unit?: string) => {
  if (!unit || unit.trim() === "") return "יח'";
  const u = unit.toLowerCase();
  if (u.includes("קילו") || u === 'ק"ג') return 'ק"ג';
  if (u.includes("יחיד")) return "יח'";
  if (u.includes("חביל")) return "חב'";
  if (u.includes("מארז")) return "מארז";
  if (u.includes("ליטר")) return "ליטר";
  if (u.includes("בקבוק")) return "בקבוק";
  return unit;
};

const getFreeFromLabels = (name: string) => {
  if (!name) return [];
  const matches = name.match(/ללא\s+[א-ת]+/g);
  return matches ? Array.from(new Set(matches)) : [];
};

type MergedProduct = {
  id: string;
  product_name: string;
  totalQty: number;
  unit: string;
  ids: string[];
  is_one_time_only: boolean;
  has_one_time_extra: boolean;
  products: Product[];
};

interface ShoppingListViewProps {
  shoppingByDepartment: Record<string, Product[]>;
  shoppingList: Product[];
  onCopyList: () => void;
  onFinishChecked: (checkedIds: Set<string>) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateStock: (id: string, stock: number) => void;
  onUpdateProduct?: (updates: { id: string; current_stock?: number }) => void;
  isFinishing: boolean;
}

export function ShoppingListView({
  shoppingByDepartment,
  shoppingList,
  onCopyList,
  onFinishChecked,
  onDeleteProduct,
  onUpdateStock,
  onUpdateProduct,
  isFinishing,
}: ShoppingListViewProps) {
  const { departments } = useDepartments(); 
  const [searchQuery, setSearchQuery] = useState("");
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>(() =>
    Object.keys(shoppingByDepartment).reduce((acc, d) => ({ ...acc, [d]: true }), {})
  );
  
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<MergedProduct | null>(null);

  const isSearching = searchQuery.length > 0;
  const lowerQuery = searchQuery.toLowerCase();

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteTarget.products.forEach(p => {
      if (p.is_one_time) onDeleteProduct(p.id);
      else if (onUpdateProduct) onUpdateProduct({ id: p.id, current_stock: p.base_quantity });
      else onUpdateStock(p.id, p.base_quantity);
    });
    setDeleteTarget(null);
  };

  const getDeleteDialogContent = (target: MergedProduct | null) => {
    if (!target) return { title: "", desc: "", btn: "" };
    if (target.is_one_time_only) return { title: "למחוק מהמערכת?", desc: "המוצר הוא חד-פעמי ולכן יימחק לחלוטין.", btn: "מחק מוצר" };
    return { title: "להסיר מהרשימה?", desc: "המוצר יוסר מרשימת הקניות ויעודכן כקיים במלאי.", btn: "הסר ועדכן מלאי" };
  };

  const dialogContent = getDeleteDialogContent(deleteTarget);

  const filteredDepts = useMemo(() => {
    const keys = Object.keys(shoppingByDepartment).sort((a, b) => {
      const deptA = departments.find(d => d.name === a);
      const deptB = departments.find(d => d.name === b);
      return (deptA ? deptA.sort_order : 999) - (deptB ? deptB.sort_order : 999);
    });
    if (!searchQuery) return keys;
    return keys.filter(dept => dept.toLowerCase().includes(lowerQuery) || (shoppingByDepartment[dept] || []).some(p => p.product_name?.toLowerCase().includes(lowerQuery)));
  }, [shoppingByDepartment, searchQuery, lowerQuery, departments]);

  const totalMergedItems = useMemo(() => {
    let count = 0;
    Object.values(shoppingByDepartment).forEach(items => count += new Set(items.map(i => i.product_name.trim().toLowerCase())).size);
    return count;
  }, [shoppingByDepartment]);

  const checkedMergedItems = useMemo(() => {
    let count = 0;
    Object.values(shoppingByDepartment).forEach(items => {
      const mergedMap = new Map<string, string[]>();
      items.forEach(p => {
        const name = p.product_name.trim().toLowerCase();
        if (!mergedMap.has(name)) mergedMap.set(name, []);
        mergedMap.get(name)!.push(p.id);
      });
      mergedMap.forEach(ids => { if (ids.every(id => checked.has(id))) count++; });
    });
    return count;
  }, [shoppingByDepartment, checked]);

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
      <div className={`relative bg-white border border-slate-200 shadow-sm rounded-[2rem] p-6`}>
        <div className="space-y-4">
          <div className="relative w-full">
            <Search className="absolute right-4 top-3.5 h-5 w-5 text-slate-400" />
            <Input placeholder="חיפוש..." className="w-full pl-10 pr-12 py-6 rounded-xl bg-slate-50 border-slate-200 text-lg" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {!isSearching && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={onCopyList} variant="outline" className="flex-1 gap-2 rounded-xl h-12 border-slate-200 font-bold text-slate-700"><Copy className="h-4 w-4" /> העתק</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="flex-1 gap-2 rounded-xl h-12 font-bold" disabled={isFinishing || checked.size === 0}><CheckCircle2 className="h-4 w-4" /> סיום ({checkedMergedItems})</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl p-6 font-sans">
                    <AlertDialogHeader><AlertDialogTitle className="text-right">סיימת לקנות?</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
                      <AlertDialogAction className="rounded-xl px-6 py-5 bg-indigo-600 text-white font-bold" onClick={() => {
                        const regularIds = new Set<string>();
                        checked.forEach(id => {
                          let p; for (const items of Object.values(shoppingByDepartment)) { p = items.find(i => i.id === id); if (p) break; }
                          if (p?.is_one_time) onDeleteProduct(p.id); else if (p) regularIds.add(p.id);
                        });
                        if (regularIds.size > 0) onFinishChecked(regularIds);
                        setChecked(new Set());
                      }}>עדכן מלאי</AlertDialogAction>
                      <AlertDialogCancel className="rounded-xl px-6 py-5 border-slate-200">ביטול</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filteredDepts.map((deptName) => {
          const rawItems = shoppingByDepartment[deptName];
          const filteredRaw = isSearching ? (deptName.toLowerCase().includes(lowerQuery) ? rawItems : rawItems.filter(p => p.product_name?.toLowerCase().includes(lowerQuery))) : rawItems;
          const mergedMap = new Map<string, MergedProduct>();
          filteredRaw.forEach(p => {
            const key = p.product_name.trim().toLowerCase();
            const qtyNeeded = p.is_one_time ? p.base_quantity : Math.max(0, p.base_quantity - (p.current_stock || 0));
            if (!mergedMap.has(key)) mergedMap.set(key, { id: p.id, product_name: p.product_name.trim(), totalQty: qtyNeeded, unit: p.unit || "יח'", ids: [p.id], is_one_time_only: !!p.is_one_time, has_one_time_extra: !!p.is_one_time, products: [p] });
            else { const e = mergedMap.get(key)!; e.totalQty += qtyNeeded; e.ids.push(p.id); e.is_one_time_only = e.is_one_time_only && !!p.is_one_time; e.has_one_time_extra = e.has_one_time_extra || !!p.is_one_time; e.products.push(p); }
          });
          const config = DEPT_CONFIG[deptName] || DEPT_CONFIG["כללי"];
          const Icon = config.icon;

          return (
            <Collapsible key={deptName} open={isSearching ? true : (openDepts[deptName] !== false)} onOpenChange={(o) => setOpenDepts(p => ({ ...p, [deptName]: o }))} className={`bg-white rounded-2xl shadow-sm border border-border border-r-8 ${config.border}`}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-4 font-bold outline-none">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-50"><Icon className={`h-4 w-4 ${config.color}`} /></div>
                  <span className="text-base">{deptName}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${openDepts[deptName] !== false ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-2 pb-2">
                <div className="flex flex-col gap-1.5 border-t border-border/50 pt-2">
                  {Array.from(mergedMap.values()).map((merged) => {
                    const isChecked = merged.ids.every(id => checked.has(id));
                    const unitLabel = formatUnit(merged.unit);
                    const tags = getFreeFromLabels(merged.product_name);

                    return (
                      <div key={merged.id} className={`flex items-center justify-between rounded-xl px-3 py-2.5 border transition-all ${isChecked ? "bg-muted/40 opacity-50" : "bg-white border-gray-100"}`}>
                        <div className="flex items-center gap-3 flex-1 cursor-pointer overflow-hidden" onClick={() => {
                          const n = new Set(checked); if (isChecked) merged.ids.forEach(id => n.delete(id)); else merged.ids.forEach(id => n.add(id)); setChecked(n);
                        }}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 ${isChecked ? "bg-primary border-primary text-white" : "bg-white border-muted-foreground/30"}`}>{isChecked && <Check className="h-3 w-3" strokeWidth={3} />}</div>
                          <div className="flex flex-col text-right flex-1 overflow-hidden">
                            <div className="flex items-baseline gap-2 overflow-hidden">
                              <span className={`text-[1rem] font-bold truncate ${isChecked ? "line-through text-muted-foreground" : "text-slate-800"}`}>{merged.product_name}</span>
                              <span className={`text-[1rem] font-black shrink-0 ${isChecked ? "opacity-30" : "text-primary"}`}>({merged.totalQty} {unitLabel})</span>
                            </div>
                            {(tags.length > 0 || merged.is_one_time_only || (merged.has_one_time_extra && !merged.is_one_time_only)) && (
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                {tags.map(t => <span key={t} className="text-[9px] bg-sky-50 text-sky-700 px-1 py-0.5 rounded font-bold border border-sky-100">{t}</span>)}
                                {merged.is_one_time_only && <span className="text-[9px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded font-bold">חד-פעמי</span>}
                                {!merged.is_one_time_only && merged.has_one_time_extra && <span className="flex items-center gap-1 text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-bold"><Zap className="h-2 w-2 fill-amber-700"/> מוגדל</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(merged); }} className="text-muted-foreground/30 p-2 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl p-6 font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-right mt-2">{dialogContent.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
            <AlertDialogAction className="rounded-xl px-6 py-5 bg-red-500 font-bold" onClick={confirmDelete}>{dialogContent.btn}</AlertDialogAction>
            <AlertDialogCancel className="rounded-xl px-6 py-5">ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
