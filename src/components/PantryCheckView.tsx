import { Minus, Plus, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Product, getDepartmentColor } from "@/hooks/useProducts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { EditProductDialog } from "./EditProductDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PantryCheckViewProps {
  productsByDepartment: Record<string, Product[]>;
  onUpdateStock: (id: string, stock: number) => void;
  onUpdateProduct: (updates: { id: string; product_name?: string; department?: string; base_quantity?: number }) => void;
  onDeleteProduct: (id: string) => void;
}

export function PantryCheckView({ productsByDepartment, onUpdateStock, onUpdateProduct, onDeleteProduct }: PantryCheckViewProps) {
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>(() =>
    Object.keys(productsByDepartment).reduce((acc, d) => ({ ...acc, [d]: true }), {})
  );
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const recurringByDept = Object.entries(productsByDepartment).reduce(
    (acc, [dept, items]) => {
      const recurring = items.filter((p) => !p.is_one_time);
      if (recurring.length > 0) acc[dept] = recurring;
      return acc;
    },
    {} as Record<string, Product[]>
  );

  if (Object.keys(recurringByDept).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-slide-in">
        <p className="text-lg font-medium">אין מוצרים קבועים</p>
        <p className="text-sm mt-1">הוסיפו מוצרים בלשונית "הוספה"</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-slide-in">
      <p className="text-sm text-muted-foreground px-1">
        עדכנו את הכמות הנוכחית של כל מוצר בבית
      </p>
      {Object.entries(recurringByDept).map(([dept, items]) => (
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
              const toBuy = Math.max(0, p.base_quantity - p.current_stock);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between bg-card rounded-lg px-3 py-3 border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.product_name}</div>
                    <div className="text-xs text-muted-foreground">
                      בסיס: {p.base_quantity} | חסר:{" "}
                      <span className={toBuy > 0 ? "text-secondary font-bold" : "text-primary"}>
                        {toBuy}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mr-2">
                    <button
                      onClick={() => setEditProduct(p)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <button
                      onClick={() => onUpdateStock(p.id, Math.max(0, p.current_stock - 1))}
                      className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-destructive/20 hover:text-destructive transition-colors active:scale-95"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-bold text-lg tabular-nums">
                      {p.current_stock}
                    </span>
                    <button
                      onClick={() => onUpdateStock(p.id, p.current_stock + 1)}
                      className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-primary/20 hover:text-primary transition-colors active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      ))}

      <EditProductDialog
        product={editProduct}
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        onSave={onUpdateProduct}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת מוצר</AlertDialogTitle>
            <AlertDialogDescription>
              למחוק את "{deleteTarget?.product_name}"? לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) onDeleteProduct(deleteTarget.id); setDeleteTarget(null); }}
            >
              מחק
            </AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
