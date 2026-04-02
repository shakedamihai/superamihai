import { 
  Copy, CheckCircle2, ChevronDown, Trash2, Check, Search,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ShoppingListViewProps {
  shoppingByDepartment: Record<string, Product[]>;
  shoppingList: Product[];
  onCopyList: () => void;
  onFinishChecked: (checkedIds: Set<string>) => void;
  onDeleteProduct: (id: string) => void;
  isFinishing: boolean;
}

// מאגר הצבעים הייחודיים
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
  { borderClass: 'border-r-fuchsia-500', iconClass: 'text-fuchsia-500' },
  { borderClass: 'border-r-lime-500', iconClass: 'text-lime-500' },
  { borderClass: 'border-r-sky-500', iconClass: 'text-sky-500' },
  { borderClass: 'border-r-rose-500', iconClass: 'text-rose-500' },
  { borderClass: 'border-r-emerald-500', iconClass: 'text-emerald-500' },
  { borderClass: 'border-r-violet-500', iconClass: 'text-violet-500' },
  { borderClass: 'border-r-yellow-500', iconClass: 'text-yellow-500' },
  { borderClass: 'border-r-stone-500', iconClass: 'text-stone-500' },
  { borderClass: 'border-r-slate-500', iconClass: 'text-slate-500' },
  { borderClass: 'border-r-zinc-500', iconClass: 'text-zinc-500' },
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
  isFinishing,
}: ShoppingListViewProps) {
  
  const [searchQuery, setSearchQuery] = useState("");
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>(() =>
    Object.keys(shoppingByDepartment).reduce((acc, d) => ({ ...acc, [d]: true }), {})
  );
  
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleChecked = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deptKeys = useMemo(() => Object.keys(shoppingByDepartment).sort(), [shoppingByDepartment]);
  
  const deptColors = useMemo(() => {
    const mapping: Record<string, typeof COLORS[0]> = {};
    const usedIndices = new Set<number>();

    const preferences = [
      { keys: ['ירק'], idx: 1 }, 
      { keys: ['פיר'], idx: 14 },
      { keys: ['חלב', 'גבינ', 'מקרר'], idx: 2 }, 
      { keys: ['בשר', 'עוף', 'קצביה'], idx: 0 }, 
      { keys: ['דג'], idx: 5 }, 
      { keys: ['קפוא'], idx: 12 }, 
      { keys: ['פארם', 'נקיון', 'סבון'], idx: 4 }, 
      { keys: ['מאפי', 'לחם'], idx: 7 }, 
      { keys: ['שתי', 'משק'], idx: 8 }, 
      { keys: ['תינוק'], idx: 10 }, 
    ];

    deptKeys.forEach((dept) => {
      const lower = dept.toLowerCase();
      for (const pref of preferences) {
        if (pref.keys.some(k => lower.includes(k)) && !usedIndices.has(pref.idx)) {
          mapping[dept] = COLORS[pref.idx];
          usedIndices.add(pref.idx);
          break;
        }
      }
    });

    deptKeys.forEach((dept) => {
      if (!mapping[dept]) {
        const availableIndex = COLORS.findIndex((_, i) => !usedIndices.has(i));
        if (availableIndex !== -1) {
          mapping[dept] = COLORS[availableIndex];
          usedIndices.add(availableIndex);
        } else {
          mapping[dept] = COLORS[Math.abs(dept.length) % COLORS.length];
        }
      }
    });

    return mapping;
  }, [deptKeys]);

  const checkedCount = checked.size;
  const totalCount = shoppingList.length;

  // --- לוגיקת החיפוש ---
  const lowerQuery = searchQuery.toLowerCase();
  
  const filteredDepts = useMemo(() => {
    if (!searchQuery) return deptKeys;
    return deptKeys.filter(dept => {
      const matchesDeptName = dept.toLowerCase().includes(lowerQuery);
      const items = shoppingByDepartment[dept] || [];
      const hasMatchingItems = items.some(p => p.product_name?.toLowerCase().includes(lowerQuery));
      return matchesDeptName || hasMatchingItems;
    });
  }, [deptKeys, shoppingByDepartment, searchQuery, lowerQuery]);

  // מצב ריק - כשאין בכלל מוצרים ברשימה
  if (shoppingList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-slide-in">
        <div className="bg-white p-8 rounded-3xl border border-dashed shadow-sm flex flex-col items-center text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground mb-1">הכל במלאי! 🎉</p>
          <p className="text-muted-foreground font-medium">אין מוצרים שחסרים כרגע במזווה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-in pb-20 bg-gray-50/50 min-h-screen pt-4 px-1">
      
      {/* שורת חיפוש חדשה - התאמה מושלמת למסך המלאי */}
      <div className="relative w-full shadow-sm rounded-2xl">
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground/70" />
        </div>
        <Input
          type="text"
          placeholder="חיפוש מחלקה או פריט..."
          className="w-full pl-4 pr-12 py-6 rounded-2xl bg-white border-border text-lg shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* אזור פעולות למעלה (כפתורים יפים) */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-border space-y-4">
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="text-muted-foreground">התקדמות קנייה</span>
          <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">{checkedCount} מתוך {totalCount}</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            onClick={onCopyList} 
            variant="outline" 
            className="flex-1 gap-2 rounded-xl h-12 border-primary/20 hover:bg-primary/5 text-primary"
          >
            <Copy className="h-4 w-4" />
            העתק רשימה
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="default" 
                className="flex-1 gap-2 rounded-xl h-12 shadow-sm" 
                disabled={isFinishing || checkedCount === 0}
              >
                <CheckCircle2 className="h-4 w-4" />
                סיום קנייה
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl p-6">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-right text-xl">סיום קנייה?</AlertDialogTitle>
                <AlertDialogDescription className="text-right text-base mt-2">
                  פעולה זו תמלא את המלאי ל-{checkedCount} הפריטים שסומנו, ותנקה פריטים חד-פעמיים מהרשימה.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
                <AlertDialogAction 
                  className="rounded-xl px-6 py-5 text-md"
                  onClick={() => { onFinishChecked(checked); setChecked(new Set()); }}
                >
                  עדכן מלאי
                </AlertDialogAction>
                <AlertDialogCancel className="rounded-xl px-6 py-5 text-md">ביטול</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* רשימת המחלקות המסוננת */}
      <div className="space-y-4">
        {filteredDepts.length === 0 && searchQuery ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed shadow-sm">
            <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">לא נמצאו תוצאות לחיפוש</p>
          </div>
        ) : (
          filteredDepts.map((dept) => {
            const items = shoppingByDepartment[dept];
            const matchesDeptName = dept.toLowerCase().includes(lowerQuery);
            
            // חיתוך הפריטים לפי החיפוש - מציג הכל אם חיפשת מחלקה, אחרת מסנן פריטים
            const displayItems = searchQuery 
              ? (matchesDeptName 
                  ? items 
                  : items.filter(p => p.product_name?.toLowerCase().includes(lowerQuery)))
              : items;

            const Icon = getDeptIcon(dept);
            const { borderClass, iconClass } = deptColors[dept] || COLORS[0];

            return (
              <Collapsible
                key={dept}
                // פתיחה אוטומטית כשיש חיפוש
                open={searchQuery ? true : (openDepts[dept] !== false)}
                onOpenChange={(open) =>
                  setOpenDepts((prev) => ({ ...prev, [dept]: open }))
                }
                className={`bg-white rounded-2xl shadow-sm border border-border overflow-hidden border-r-4 ${borderClass}`}
              >
                <div className="flex items-center gap-1 p-1">
                  <CollapsibleTrigger
                    className="flex-1 flex items-center justify-between px-4 py-3 bg-transparent font-bold transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${iconClass}`} />
                      <span className="text-[1.05rem] tracking-tight text-foreground">{dept}</span>
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-black">
                        {displayItems.length}
                      </span>
                    </div>
                    <ChevronDown className={`h-5 w-5 text-muted-foreground/50 transition-transform duration-300 ${openDepts[dept] !== false || searchQuery ? "rotate-180" : ""}`} />
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="px-3 pb-3 space-y-2 mt-1">
                  <div className="space-y-2 border-t border-border/50 pt-3">
                    {displayItems.map((p) => {
                      const qty = p.is_one_time ? 1 : Math.max(0, p.base_quantity - p.current_stock);
                      const unit = p.unit || "יחידות";
                      const isChecked = checked.has(p.id);
                      const lactoseFree = isLactoseFree(p.product_name);

                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleChecked(p.id)}
                          className={`group flex items-center justify-between rounded-xl px-4 py-3.5 border cursor-pointer transition-all duration-200 ${
                            isChecked
                              ? "bg-muted/40 border-transparent opacity-60 grayscale-[0.3]"
                              : lactoseFree
                              ? "bg-sky-50/40 border-sky-100"
                              : "bg-white border-gray-100 hover:border-primary/20 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                              isChecked
                                ? "bg-primary border-primary text-primary-foreground scale-110"
                                : "bg-white border-muted-foreground/30 group-hover:border-primary/50"
                            }`}>
                              {isChecked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                            </div>
                            
                            <div className="flex flex-col">
                              <span className={`text-[1.05rem] font-medium transition-all ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {p.product_name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-sm ${isChecked ? "text-muted-foreground/70" : "text-primary/80 font-bold"}`}>
                                  {qty} {unit}
                                </span>
                                
                                {lactoseFree && (
                                  <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold">
                                    ללא לקטוז
                                  </span>
                                )}
                                {p.is_one_time && (
                                  <span className="text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-medium">
                                    חד-פעמי
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {p.is_one_time && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteProduct(p.id); }}
                              className="text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </div>
    </div>
  );
}
