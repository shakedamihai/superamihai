import { Copy, CheckCircle2, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, getDepartmentColor } from "@/hooks/useProducts";
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
  onFinishShopping: () => void;
  onDeleteProduct: (id: string) => void;
  isFinishing: boolean;
}

export function ShoppingListView({
  shoppingByDepartment,
  shoppingList,
  onCopyList,
  onFinishShopping,
  onDeleteProduct,
  isFinishing,
}: ShoppingListViewProps) {
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>(() =>
    Object.keys(shoppingByDepartment).reduce((acc, d) => ({ ...acc, [d]: true }), {})
  );

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
      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={onCopyList}
          variant="outline"
          className="flex-1 gap-2"
        >
          <Copy className="h-4 w-4" />
          העתק לשופרסל
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="default"
              className="flex-1 gap-2"
              disabled={isFinishing}
            >
              <CheckCircle2 className="h-4 w-4" />
              סיימתי קניות
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>סיום קניות</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו תעדכן את המלאי לכמות הבסיס ותמחק פריטים חד-פעמיים.
                להמשיך?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogAction onClick={onFinishShopping}>
                כן, סיימתי
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
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-card rounded-lg px-4 py-3 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-primary/10 text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center text-sm">
                      {qty}
                    </span>
                    <span className="font-medium">{p.product_name}</span>
                    {p.is_one_time && (
                      <span className="text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-medium">
                        חד-פעמי
                      </span>
                    )}
                  </div>
                  {p.is_one_time && (
                    <button
                      onClick={() => onDeleteProduct(p.id)}
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
