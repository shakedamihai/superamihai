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

// רכיב ידית גרירה משודרג למחלקה
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
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full flex justify-center mb-4">
      <div className="w-full max-w-[calc(100vw-32px)] flex items-start gap-2">
        {/* ידית גרירה גדולה וברורה בצד ימין */}
        <button
          {...attributes}
          {...listeners}
          className="touch-none w-10 h-12 flex items-center justify-center bg-muted rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-grab active:cursor-grabbing shrink-0"
          title="גרור לשינוי סדר המחלקה"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex-1 overflow-hidden">{children}</div>
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

  // סינון מחלקות שיש בהן מוצרים
  const orderedDepts = [...departments]
    .filter((d) => recurringByDept[d.name])
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const knownNames = new Set(departments.map((d) => d.name));
  const extraDepts = Object.keys(recurringByDept).filter((name) => !knownNames.has(name));

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

  const renderDeptHeader = (deptName: string) => {
    const items = recurringByDept[deptName];
    return (
      <div className="flex items-center gap-1.5 w-full">
        <CollapsibleTrigger className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg border font-bold shadow-sm ${getDepartmentColor(deptName)}`}>
          <div className="flex items-center gap-2">
            <span>{deptName}</span>
            <span className="text-xs opacity-70">({items?.length || 0})</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${openDepts[deptName] !== false ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        
        {/* כפתור עריכה נפרד וברור */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setRenameDept({ oldName: deptName, newName: deptName });
          }}
          className="w-11 h-11 rounded-lg border bg-card flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shrink-0"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center py-4 overflow-x-hidden min-h-[80vh]">
      <div className="w-full max-w-[calc(100vw-32px)] space-y-2">
        <p className="text-xs text-muted-foreground text-center mb-4 px-6">
          לחצו על ה-⠿ כדי לסדר את המחלקות, או על העיפרון כדי לשנות שם.
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
            <div className="flex flex-col">
              {orderedDepts.map((dept) => (
                <SortableDepartmentItem key={dept.id} dept={dept}>
                  <Collapsible
                    open={openDepts[dept.name] !== false}
                    onOpenChange={(open) =>
                      setOpenDepts((prev) => ({ ...prev, [dept.name]: open }))
                    }
                    className="w-full"
                  >
                    {renderDeptHeader(dept.name)}
                    <CollapsibleContent className="mt-2 space-y-2 px-1 pb-2">
                       {recurringByDept[dept.name]?.map((p) => (
                          <SortableProductRow
                            key={p.id}
                            product={p}
                            onUpdateStock={onUpdateStock}
                            onEdit={setEditProduct}
                            onDelete={setDeleteTarget}
                          />
                        ))}
                    </CollapsibleContent>
                  </Collapsible>
                </SortableDepartmentItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* מחלקות "כלליות" או כאלו שלא רשומות בטבלת המחלקות */}
        {extraDepts.map((deptName) => (
          <div key={deptName} className="px-10 opacity-80">
             <div className="py-2 border-t mt-2">
               {renderDeptHeader(deptName)}
             </div>
          </div>
        ))}
      </div>

      {/* Dialog עריכת שם מחלקה - משופר */}
      <Dialog open={!!renameDept} onOpenChange={(o) => { if (!o) setRenameDept(null); }}>
        <DialogContent className="max-w-[90vw] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-right">שינוי שם מחלקה</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <label className="text-sm text-muted-foreground block text-right">שם נוכחי: {renameDept?.oldName}</label>
            <Input
              value={renameDept?.newName || ""}
              onChange={(e) => setRenameDept((prev) => prev ? { ...prev, newName: e.target.value } : null)}
              placeholder="הכניסו שם חדש..."
              className="text-right h-12 text-lg"
              autoFocus
            />
          </div>
          <DialogFooter className="flex flex-row-reverse gap-3">
            <Button
              className="flex-1 h-12 text-lg"
              onClick={() => {
                if (renameDept && renameDept.newName.trim() && renameDept.newName !== renameDept.oldName) {
                  onRenameDepartment(renameDept.oldName, renameDept.newName.trim());
                }
                setRenameDept(null);
              }}
              disabled={!renameDept?.newName.trim() || renameDept?.newName === renameDept?.oldName}
            >
              עדכן שם
            </Button>
            <Button variant="outline" className="flex-1 h-12 text-lg" onClick={() => setRenameDept(null)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <EditProductDialog
        product={editProduct}
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        onSave={onUpdateProduct}
        departmentNames={departmentNames}
        onAddDepartment={onAddDepartment}
      />
    </div>
  );
}
