import { ChevronDown, Pencil, GripVertical } from "lucide-react";
import { Product, getDepartmentColor } from "@/hooks/useProducts";
import { Department } from "@/hooks/useDepartments";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableProductRow } from "./SortableProductRow";

interface PantryCheckViewProps {
  productsByDepartment: Record<string, Product[]>;
  departments: Department[];
  onUpdateStock: (id: string, stock: number) => void;
  onUpdateProduct: (updates: { id: string; product_name?: string; department?: string; base_quantity?: number }) => void;
  onDeleteProduct: (id: string) => void;
  onReorderProducts: (updates: { id: string; sort_order: number }[]) => void;
  onRenameDepartment: (oldName: string, newName: string) => void;
  onReorderDepartments: (updates: { id: string; sort_order: number }[]) => void;
  departmentNames: string[];
  onAddDepartment: (name: string) => void;
}

function SortableDepartmentItem({
  dept,
  children,
}: {
  dept: Department;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: dept.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          className="touch-none w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

export function PantryCheckView({
  productsByDepartment,
  departments,
  onUpdateStock,
  onUpdateProduct,
  onDeleteProduct,
  onReorderProducts,
  onRenameDepartment,
  onReorderDepartments,
  departmentNames,
  onAddDepartment,
}: PantryCheckViewProps) {
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>(() =>
    Object.keys(productsByDepartment).reduce((acc, d) => ({ ...acc, [d]: true }), {})
  );
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [renameDept, setRenameDept] = useState<{ oldName: string; newName: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const recurringByDept = Object.entries(productsByDepartment).reduce(
    (acc, [dept, items]) => {
      const recurring = items.filter((p) => !p.is_one_time);
      if (recurring.length > 0) acc[dept] = recurring;
      return acc;
    },
    {} as Record<string, Product[]>
  );

  // Order departments by their sort_order from departments table
  const orderedDepts = departments
    .filter((d) => recurringByDept[d.name])
    .map((d) => d);

  // Also include departments that have products but aren't in the departments table
  const knownNames = new Set(departments.map((d) => d.name));
  const extraDepts = Object.keys(recurringByDept).filter((name) => !knownNames.has(name));

  if (Object.keys(recurringByDept).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-slide-in">
        <p className="text-lg font-medium">אין מוצרים קבועים</p>
        <p className="text-sm mt-1">הוסיפו מוצרים בלשונית "הוספה"</p>
      </div>
    );
  }

  const handleProductDragEnd = (dept: string) => (event: DragEndEvent) => {
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

  const handleDeptDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedDepts.findIndex((d) => d.id === active.id);
    const newIndex = orderedDepts.findIndex((d) => d.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(orderedDepts, oldIndex, newIndex);
    const updates = reordered.map((d, i) => ({ id: d.id, sort_order: i }));
    onReorderDepartments(updates);
  };

  const renderDeptContent = (deptName: string) => {
    const items = recurringByDept[deptName];
    if (!items) return null;
    return (
      <Collapsible
        open={openDepts[deptName] !== false}
        onOpenChange={(open) =>
          setOpenDepts((prev) => ({ ...prev, [deptName]: open }))
        }
      >
        <div className="flex items-center gap-1">
          <CollapsibleTrigger className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg border font-medium ${getDepartmentColor(deptName)}`}>
            <span>{deptName} ({items.length})</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${openDepts[deptName] !== false ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <button
            onClick={() => setRenameDept({ oldName: deptName, newName: deptName })}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        <CollapsibleContent className="mt-1 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleProductDragEnd(deptName)}
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
    );
  };

  return (
    <div className="space-y-3 animate-slide-in">
      <p className="text-sm text-muted-foreground px-1">
        עדכנו את הכמות הנוכחית של כל מוצר בבית. גררו ⠿ לשינוי סדר.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDeptDragEnd}
      >
        <SortableContext
          items={orderedDepts.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {orderedDepts.map((dept) => (
            <SortableDepartmentItem key={dept.id} dept={dept}>
              {renderDeptContent(dept.name)}
            </SortableDepartmentItem>
          ))}
        </SortableContext>
      </DndContext>

      {/* Extra departments not in departments table */}
      {extraDepts.map((deptName) => (
        <div key={deptName}>{renderDeptContent(deptName)}</div>
      ))}

      <EditProductDialog
        product={editProduct}
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        onSave={onUpdateProduct}
        departmentNames={departmentNames}
        onAddDepartment={onAddDepartment}
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

      {/* Rename department dialog */}
      <Dialog open={!!renameDept} onOpenChange={(o) => { if (!o) setRenameDept(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>עריכת שם מחלקה</DialogTitle>
          </DialogHeader>
          <Input
            value={renameDept?.newName || ""}
            onChange={(e) => setRenameDept((prev) => prev ? { ...prev, newName: e.target.value } : null)}
            placeholder="שם חדש למחלקה"
          />
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              onClick={() => {
                if (renameDept && renameDept.newName.trim() && renameDept.newName !== renameDept.oldName) {
                  onRenameDepartment(renameDept.oldName, renameDept.newName.trim());
                }
                setRenameDept(null);
              }}
              disabled={!renameDept?.newName.trim()}
            >
              שמור
            </Button>
            <Button variant="outline" onClick={() => setRenameDept(null)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
