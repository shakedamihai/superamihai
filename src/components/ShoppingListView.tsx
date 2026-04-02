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
      { keys: ['ירק'], idx: 1 }, { keys: ['פיר'], idx: 14 },
      { keys: ['חלב', 'גבינ', 'מקרר'], idx: 2 }, { keys: ['בשר', 'עוף', 'קצביה'], idx: 0 }, 
      { keys: ['דג'], idx: 5 }, { keys: ['קפוא'], idx: 12 }, 
      { keys: ['פארם', 'נקיון', 'סבון'], idx: 4 }, { keys: ['מאפי', 'לחם'], idx: 7 }, 
      { keys: ['שתי', 'משק'], idx: 8 }, { keys: ['תינוק'], idx: 10 }, 
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

  const lowerQuery = searchQuery.toLowerCase();
  const isSearching = searchQuery.length > 0;
  
  const filteredDepts = useMemo(() => {
    if (!searchQuery) return deptKeys;
    return deptKeys.filter(dept => {
      const matchesDeptName = dept.toLowerCase().includes(lowerQuery);
      const items = shoppingByDepartment[dept] || [];
      return matchesDeptName || items.some(p => p.product_name?.toLowerCase().includes(lowerQuery));
    });
  }, [deptKeys, shoppingByDepartment, searchQuery, lowerQuery]);

  if (shoppingList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-slide-in">
        <div className="bg-white p-8 rounded-3xl border border-dashed shadow-sm flex flex-col items-center text-center font-sans">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground mb-1">הכל במלאי! 🎉</p>
          <p className="text-muted-foreground font-medium">אין מוצרים שחסרים כרגע</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-in pb-24 bg-slate-50 min-h-screen">
      
      {/* --- אזור הפיקוד הנעוץ (Sticky Shrinking Dashboard) --- */}
      <div className="sticky top-0 z-30 pt-4 px-2 pb-2 bg-slate-50/80 backdrop-blur-md">
        <div className={`relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${
          isSearching ? 'rounded-2xl p-3' : 'rounded-[2.5rem] p-6'
        }`}>
          
          {/* עיצוב רקע עדין */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

          <div className="space-y-4 relative z-10">
            {/* 1. שורת חיפוש - תמיד גלויה */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <Search className="h-5 w-5 text-indigo-300" />
              </div>
              <Input
                type="text"
                placeholder="חיפוש מהיר..."
                className="w-full pl-10 pr-12 py-6 rounded-xl bg-white/10 border-none backdrop-blur-md text-white placeholder:text-indigo-200 text-lg focus-visible:ring-2 focus-visible:ring-white/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-200 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* 2. התקדמות וכפתורים - נעלמים בזמן חיפוש כדי לחסוך מקום למקלדת */}
            {!isSearching && (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-2 px-1">
                  <div className="flex items-center justify-between text-sm font-black text-indigo-50">
                    <span className="tracking-wide">התקדמות קנייה</span>
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
                      {checkedCount} / {totalCount}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-700 ease-out rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" 
                      style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <Button 
                    onClick={onCopyList} 
                    variant="outline" 
                    className="flex-1 gap-2 rounded-2xl h-14 bg-white/5 border-white/20 hover:bg-white/10 text-white font-bold"
                  >
                    <Copy className="h-5 w-5" />
                    העתק
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="default" 
                        className="flex-1 gap-2 rounded-2xl h-14 bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg font-black" 
                        disabled={isFinishing || checkedCount === 0}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        סימנתי!
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl p-6 font-sans">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-right text-xl">סיימת לקנות?</AlertDialogTitle>
                        <AlertDialogDescription className="text-right text-base mt-2 font-medium">
                          המערכת תמלא את המלאי עבור {checkedCount} המוצרים שסימנת ותנקה אותם מהרשימה.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
                        <AlertDialogAction 
                          className="rounded-xl px-6 py-5 text-md bg-indigo-600 hover:bg-indigo-700 font-bold"
                          onClick={() => { onFinishChecked(checked); setChecked(new Set()); }}
                        >
                          עדכן מלאי
                        </AlertDialogAction>
                        <AlertDialogCancel className="rounded-xl px-6 py-5 text-md font-medium">ביטול</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* --- אזור רשימת הקניות --- */}
      <div className="pt-2 px-2">
        {!isSearching && (
          <div className="flex items-center justify-between px-3 mb-5 mt-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">מה לקנות?</h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredDepts.length} קטגוריות</span>
          </div>
        )}

        <div className="space-y-4">
          {filteredDepts.length === 0 && isSearching ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed shadow-sm">
              <Search className="h-12 w-12 mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400 font-bold">לא מצאתי פריט כזה...</p>
            </div>
          ) : (
            filteredDepts.map((dept) => {
              const items = shoppingByDepartment[dept];
              const matchesDeptName = dept.toLowerCase().includes(lowerQuery);
              const displayItems = isSearching 
                ? (matchesDeptName ? items : items.filter(p => p.product_name?.toLowerCase().includes(lowerQuery)))
                : items;

              const Icon = getDeptIcon(dept);
              const { borderClass, iconClass } = deptColors[dept] || COLORS[0];

              return (
                <Collapsible
                  key={dept}
                  open={isSearching ? true : (openDepts[dept] !== false)}
                  onOpenChange={(open) => setOpenDepts((prev) => ({ ...prev, [dept]: open }))}
                  className={`bg-white rounded-[1.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden border-r-8 ${borderClass}`}
                >
                  <div className="flex items-center gap-1 p-1">
                    <CollapsibleTrigger className="flex-1 flex items-center justify-between px-4 py-4 bg-transparent font-black text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-slate-50 ${iconClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-[1.1rem] tracking-tight">{dept}</span>
                        <span className="ml-2 px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black">
                          {displayItems.length}
                        </span>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-slate-300 transition-transform duration-500 ${openDepts[dept] !== false || isSearching ? "rotate-180" : ""}`} />
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="px-4 pb-4 space-y-3 mt-1">
                    <div className="space-y-2.5 border-t border-slate-50 pt-4">
                      {displayItems.map((p) => {
                        const qty = p.is_one_time ? 1 : Math.max(0, p.base_quantity - p.current_stock);
                        const isChecked = checked.has(p.id);
                        const lactoseFree = isLactoseFree(p.product_name);

                        return (
                          <div
                            key={p.id}
                            onClick={() => toggleChecked(p.id)}
                            className={`group flex items-center justify-between rounded-2xl px-5 py-4 border-2 cursor-pointer transition-all duration-300 ${
                              isChecked ? "bg-slate-50 border-transparent opacity-40 scale-[0.98]" : "bg-white border-slate-50 shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                                isChecked ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white border-slate-200"
                              }`}>
                                {isChecked && <Check className="h-4 w-4" strokeWidth={4} />}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-[1.1rem] font-bold ${isChecked ? "line-through text-slate-400" : "text-slate-800"}`}>
                                  {p.product_name}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-sm font-black ${isChecked ? "text-slate-300" : "text-indigo-600/80"}`}>
                                    {qty} {p.unit || "יחידות"}
                                  </span>
                                  {lactoseFree && <span className="text-[9px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md font-black uppercase">ללא לקטוז</span>}
                                  {p.is_one_time && <span className="text-[9px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md font-black uppercase">חד-פעמי</span>}
                                </div>
                              </div>
                            </div>
                            {p.is_one_time && (
                              <button onClick={(e) => { e.stopPropagation(); onDeleteProduct(p.id); }} className="text-slate-200 hover:text-red-500 p-2.5">
                                <Trash2 className="h-5 w-5" />
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
    </div>
  );
}
