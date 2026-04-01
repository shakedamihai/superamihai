import { Copy, CheckCircle2, ChevronDown, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, getDepartmentColor } from "@/hooks/useProducts";
import { getDepartmentUnit, isLactoseFree } from "@/hooks/useDepartments";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
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

export function ShoppingListView({
  shoppingByDepartment,
  shoppingList,
  onCopyList,
  onFinishChecked,
  onDeleteProduct,
  isFinishing,
}: ShoppingListViewProps) {
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

  const checkedCount = checked.size;
  const totalCount = shoppingList.length;

  if (shoppingList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-slide-in">
        <CheckCircle2 className="h-16 w-16 mb-4 text-primary/40" />
        <p className="text-lg font-medium">הכל במלאי! 🎉</p>
        <p className="text-sm mt-1">אין מוצרים לקנייה כרגע</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-slide-in">
      {/* Progress */}
      {checkedCount > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          ✅ {checkedCount}/{totalCount} נקנו
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={onCopyList} variant="outline" className="flex-1 gap-2">
          <Copy className="h-4 w-4" />
          העתק לשופרסל
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default" className="flex-1 gap-2" disabled={isFinishing || checkedCount === 0}>
              <CheckCircle2 className="h-4 w-4" />
              מחק מוצרים שנקנו
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>מחיקת מוצרים שנקנו</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו תעדכן את המלאי לכמות הבסיס עבור {checkedCount} מוצרים מסומנים ותמחק פריטים חד-פעמיים מסומנים. להמשיך?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogAction onClick={() => { onFinishChecked(checked); setChecked(new Set()); }}>
                כן, מחק
              </AlertDialogAction>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Items by department */}
      {Object.entries(shoppingByDepartment).map(([dept, items]) => (
        <Collapsible
          key={dept}
          open={openDepts[dept] !== false}
          onOpenChange={(open) =>
            setOpenDepts((prev) => ({ ...prev, [dept]: open }))
          }
        >
          <CollapsibleTrigger className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border font-medium ${getDepartmentColor(dept)}`}>
            <span>{dept} ({items.length})</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openDepts[dept] !== false ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1">
            {items.map((p) => {
              const qty = p.is_one_time ? 1 : Math.max(0, p.base_quantity - p.current_stock);
              const { unit } = getDepartmentUnit(p.department);
              const isChecked = checked.has(p.id);
              const lactoseFree = isLactoseFree(p.product_name);

              return (
                <div
                  key={p.id}
                  onClick={() => toggleChecked(p.id)}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 border cursor-pointer transition-all ${
                    isChecked
                      ? "bg-muted/50 border-primary/30 opacity-60"
                      : lactoseFree
                      ? "bg-sky-50/50 dark:bg-sky-950/20 border-sky-400"
                      : "bg-card border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isChecked
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    }`}>
                      {isChecked && <Check className="h-4 w-4" />}
                    </div>
                    <span className="bg-primary/10 text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
                      {qty}
                    </span>
                    <div>
                      <span className={`font-medium ${isChecked ? "line-through" : ""}`}>
                        {p.product_name}
                      </span>
                      <span className="text-xs text-muted-foreground mr-1">{unit}</span>
                      {lactoseFree && (
                        <span className="text-[9px] bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300 px-1.5 py-0.5 rounded font-bold mr-1">
                          ללא לקטוז
                        </span>
                      )}
                      {p.is_one_time && (
                        <span className="text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-medium mr-1">
                          חד-פעמי
                        </span>
                      )}
                    </div>
                  </div>
                  {p.is_one_time && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteProduct(p.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
