import { 
  Copy, CheckCircle2, ChevronDown, Trash2, Check, Search, X, Zap,
  Beef, Carrot, Milk, Snowflake, Sparkles, Wheat, CupSoda, Baby, ShoppingBag, 
  Apple, Fish, Package, ChefHat, Leaf, Droplets, UtensilsCrossed, Candy,
  CookingPot, Grape // האייקונים שסיכמנו עליהם
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/hooks/useProducts";
import { isLactoseFree, useDepartments } from "@/hooks/useDepartments";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const DEPT_CONFIG: Record<string, { icon: any, color: string, border: string }> = {
  "ירקות": { icon: Carrot, color: "text-emerald-500", border: "border-r-emerald-500" },
  "פירות": { icon: Apple, color: "text-pink-500", border: "border-r-pink-500" },
  "מוצרי חלב ומקרר": { icon: Milk, color: "text-blue-500", border: "border-r-blue-500" },
  "קצביה": { icon: Beef, color: "text-red-500", border: "border-r-red-500" },
  "דגים": { icon: Fish, color: "text-cyan-500", border: "border-r-cyan-500" },
  "קפואים": { icon: Snowflake, color: "text-indigo-600", border: "border-r-indigo-600" }, // כחול כהה
  "מזווה ושימורים": { icon: Package, color: "text-orange-500", border: "border-r-orange-500" },
  "תבלינים ואפייה": { icon: CookingPot, color: "text-amber-700", border: "border-r-amber-700" }, // סיר פתוח
  "מאפייה ולחם": { icon: Wheat, color: "text-yellow-500", border: "border-r-yellow-500" },
  "חטיפים ומתוקים": { icon: Candy, color: "text-purple-500", border: "border-r-purple-500" },
  "משקאות": { icon: CupSoda, color: "text-indigo-500", border: "border-r-indigo-500" },
  "פארם וטואלטיקה": { icon: Sparkles, color: "text-fuchsia-500", border: "border-r-fuchsia-500" },
  "חומרי ניקוי": { icon: Droplets, color: "text-slate-500", border: "border-r-slate-500" },
  "חד-פעמי": { icon: UtensilsCrossed, color: "text-rose-400", border: "border-r-rose-400" },
  "תינוקות": { icon: Baby, color: "text-teal-500", border: "border-r-teal-500" },
  "פיצוחים ופירות יבשים": { icon: Grape, color: "text-orange-800", border: "border-r-orange-800" }, // ענבים בצבע חום-צימוק
  "מעדניה": { icon: ChefHat, color: "text-violet-600", border: "border-r-violet-600" },
  "בריאות ואורגני": { icon: Leaf, color: "text-lime-500", border: "border-r-lime-500" },
  "כללי": { icon: ShoppingBag, color: "text-slate-400", border: "border-r-slate-400" },
};

const formatUnit = (unit?: string) => {
  if (!unit || unit.trim() === "") return "יחידות";
  const u = unit.toLowerCase();
  if (u.includes("קילו") || u === 'ק"ג') return 'ק"ג';
  if (u.includes("יחיד")) return "יחידות";
  if (u.includes("חביל")) return "חבילות";
  if (u.includes("מארז")) return "מארזים";
  if (u.includes("ליטר")) return "ליטרים";
  if (u.includes("בקבוק")) return "בקבוקים";
  if (u.includes("פחי")) return "פחיות";
  if (u.includes("גליל")) return "גלילים";
  if (u.includes("שפופר")) return "שפופרות";
  if (u.includes("טבלי")) return "טבליות";
  if (u.includes("קפסול")) return "קפסולות";
  if (u.includes("גרם") && !u.includes("קילו")) return "גרם";
  return unit;
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
      if (p.is_one_time) {
        onDeleteProduct(p.id);
      } else {
        if (onUpdateProduct) {
          onUpdateProduct({ id: p.id, current_stock: p.base_quantity });
        } else {
          onUpdateStock(p.id, p.base_quantity);
        }
      }
    });
    setDeleteTarget(null);
  };

  const filteredDepts = useMemo(() => {
    const keys = Object.keys(shoppingByDepartment);
    keys.sort((a, b) => {
      const deptA = departments.find(d => d.name === a);
      const deptB = departments.find(d => d.name === b);
      return (deptA ? deptA.sort_order : 999) - (deptB ? deptB.sort_order : 999);
    });

    if (!searchQuery) return keys;
    
    return keys.filter(dept => {
      const matchesDept = dept.toLowerCase().includes(lowerQuery);
      const items = shoppingByDepartment[dept] || [];
      return matchesDept || items.some(p => p.product_name?.toLowerCase().includes(lowerQuery));
    });
  }, [shoppingByDepartment, searchQuery, lowerQuery, departments]);

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

  const totalMergedItems = useMemo(() => {
    let count = 0;
    Object.values(shoppingByDepartment).forEach(items => {
      const names = new Set(items.map(i => i.product_name.trim().toLowerCase()));
      count += names.size;
    });
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
      mergedMap.forEach(ids => {
        if (ids.every(id => checked.has(id))) count++;
      });
    });
    return count;
  }, [shoppingByDepartment, checked]);

  return (
    <div className="space-y-6 pb-24 bg-slate-50 min-h-screen pt-4 px-2 font-sans">
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
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{checkedMergedItems}/{totalMergedItems}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${totalMergedItems === 0 ? 0 : (checkedMergedItems / totalMergedItems) * 100}%` }} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={onCopyList} variant="outline" className="flex-1 gap-2 rounded-xl h-12 border-slate-200 font-bold text-slate-700"><Copy className="h-4 w-4" /> העתק</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="flex-1 gap-2 rounded-xl h-12 font-bold" disabled={isFinishing || checked.size === 0}><CheckCircle2 className="h-4 w-4" /> סיום</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl p-6 font-sans">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-right">סיימת לקנות?</AlertDialogTitle>
                      <AlertDialogDescription className="text-right">הפריטים שסומנו יעברו למלאי והתוספות החד-פעמיות יימחקו לחלוטין.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
                      <AlertDialogAction className="rounded-xl px-6 py-5 bg-indigo-600 text-white font-bold" onClick={() => { 
                        const regularIds = new Set<string>();
                        
                        checked.forEach(id => {
                          let foundProduct: Product | undefined;
                          for (const items of Object.values(shoppingByDepartment)) {
                            const p = items.find(i => i.id === id);
                            if (p) { foundProduct = p; break; }
                          }
                          
                          if (foundProduct) {
                            if (foundProduct.is_one_time) {
                              onDeleteProduct(foundProduct.id);
                            } else {
                              regularIds.add(foundProduct.id);
                            }
                          }
                        });
                        
                        if (regularIds.size > 0) {
                          onFinishChecked(regularIds);
                        }
                        setChecked(new Set()); 
                      }}>עדכן מלאי</AlertDialogAction>
                      <AlertDialogCancel className="rounded-xl px-6 py-5 border-slate-200 font-medium">ביטול</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredDepts.map((deptName) => {
          const rawItems = shoppingByDepartment[deptName];
          const filteredRaw = isSearching ? (deptName.toLowerCase().includes(lowerQuery) ? rawItems : rawItems.filter(p => p.product_name?.toLowerCase().includes(lowerQuery))) : rawItems;
          
          const mergedMap = new Map<string, MergedProduct>();
          filteredRaw.forEach(p => {
            const key = p.product_name.trim().toLowerCase();
            const qtyNeeded = p.is_one_time ? p.base_quantity : Math.max(0, p.base_quantity - (p.current_stock || 0));
            
            if (!mergedMap.has(key)) {
              mergedMap.set(key, {
                id: p.id,
                product_name: p.product_name.trim(),
                totalQty: qtyNeeded,
                unit: p.unit || "יחידות",
                ids: [p.id],
                is_one_time_only: !!p.is_one_time,
                has_one_time_extra: !!p.is_one_time,
                products: [p]
              });
            } else {
              const existing = mergedMap.get(key)!;
              existing.totalQty += qtyNeeded;
              existing.ids.push(p.id);
              existing.is_one_time_only = existing.is_one_time_only && !!p.is_one_time;
              existing.has_one_time_extra = existing.has_one_time_extra || !!p.is_one_time;
              existing.products.push(p);
            }
          });
          const mergedItems = Array.from(mergedMap.values());

          const config = DEPT_CONFIG[deptName] || DEPT_CONFIG["כללי"];
          const Icon = config.icon;

          return (
            <Collapsible key={deptName} open={isSearching ? true : (openDepts[deptName] !== false)} onOpenChange={(open) => setOpenDepts(prev => ({ ...prev, [deptName]: open }))} className={`bg-white rounded-2xl shadow-sm border border-border overflow-hidden border-r-8 ${config.border}`}>
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-5 font-bold text-foreground outline-none">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-slate-50`}><Icon className={`h-5 w-5 ${config.color}`} /></div>
                  <span className="text-lg">{deptName}</span>
                  <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-black">{mergedItems.length}</span>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-300 transition-transform ${openDepts[deptName] !== false || isSearching ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
                <div className="flex flex-col gap-2 border-t border-border/50 pt-3">
                  {mergedItems.map((merged) => {
                    const isChecked = merged.ids.every(id => checked.has(id));
                    const lactoseFree = isLactoseFree(merged.product_name);
                    const unitLabel = formatUnit(merged.unit);

                    return (
                      <div key={merged.id} className={`flex items-center justify-between rounded-xl px-4 py-3.5 border transition-all ${isChecked ? "bg-muted/40 opacity-50" : "bg-white border-gray-100"}`}>
                        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => {
                          const next = new Set(checked);
                          if (isChecked) {
                            merged.ids.forEach(id => next.delete(id));
                          } else {
                            merged.ids.forEach(id => next.add(id));
                          }
                          setChecked(next);
                        }} >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isChecked ? "bg-primary border-primary text-white" : "bg-white border-muted-foreground/30"}`}>{isChecked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}</div>
                          <div className="flex flex-col text-right">
                            <span className={`text-[1.05rem] font-medium ${isChecked ? "line-through text-muted-foreground" : ""}`}>{merged.product_name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-primary font-bold">{merged.totalQty} {unitLabel}</span>
                              {lactoseFree && <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold">ללא לקטוז</span>}
                              
                              {merged.is_one_time_only && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">חד-פעמי</span>}
                              {!merged.is_one_time_only && merged.has_one_time_extra && <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold"><Zap className="h-3 w-3 fill-amber-700"/> כמות מוגדלת</span>}
                            </div>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(merged); }} className="text-muted-foreground/40 p-2 hover:text-red-500 rounded-lg">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl p-6 font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">להסיר מרשימת הקניות?</AlertDialogTitle>
            <AlertDialogDescription className="text-right mt-2 font-medium">
            הכמות החד-פעמית תימחק מהמערכת. הכמות הקבועה של המוצר תישאר במזווה ותעודכן כקיימת במלאי.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
            <AlertDialogAction className="rounded-xl px-6 py-5 bg-red-500 hover:bg-red-600 text-white font-bold" onClick={confirmDelete}>
              הסר מהרשימה ועדכן
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-xl px-6 py-5 font-medium border border-slate-200">ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
