import { ChevronDown } from "lucide-react";
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
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { SortableProductRow } from "./SortableProductRow";

interface PantryCheckViewProps {
  productsByDepartment: Record<string, Product[]>;
  onUpdateStock: (id: string, stock: number) => void;
  onUpdateProduct: (updates: { id: string; product_name?: string; department?: string; base_quantity?: number }) => void;
  onDeleteProduct: (id: string) => void;
  onReorderProducts: (updates: { id: string; sort_order: number }[]) => void;
}

export function PantryCheckView({ productsByDepartment, onUpdateStock, onUpdateProduct, onDeleteProduct, onReorderProducts }: PantryCheckViewProps) {
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>(() =>
    Object.keys(productsByDepartment).reduce((acc, d) => ({ ...acc, [d]: true }), {})
  );
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

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

  const handleDragEnd = (dept: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = recurringByDept[dept];
    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const updates = reordered.map((p, i) => ({ id: p.id, sort_order: i }));
    onReorderProducts(updates);
  };

  return (
    <div className="space-y-3 animate-slide-in">
      <p className="text-sm text-muted-foreground px-1">
        עדכנו את הכמות הנוכחית של כל מוצר בבית. גררו ⠿ לשינוי סדר.
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd(dept)}
            >
              <SortableContext
                items={items.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((p) => (
                  <SortableProductRow
                    key={p.id}
                    product={p}
                    onUpdateStock={onUpdateStock}
                    onEdit={setEditProduct}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
