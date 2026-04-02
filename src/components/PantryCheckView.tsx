import { ChevronDown, Pencil, GripVertical } from "lucide-react";
import { Product, getDepartmentColor } from "@/hooks/useProducts";
import { Department } from "@/hooks/useDepartments";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useMemo, useEffect } from "react";
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
  DragStartEvent,
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

function SortableDepartmentItem({ dept, children }: { dept: Department; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: dept.id 
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 150ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full flex justify-center mb-4">
      <div className="w-full max-w-[calc(100vw-32px)] flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="w-10 h-12 flex items-center justify-center bg-muted rounded-lg text-muted-foreground shrink-0 touch-none focus:outline-none"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="h-6 w-6" />
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
  
  // Base data calculation
  const baseRecurringByDept = useMemo(() => {
    return Object.entries(productsByDepartment || {}).reduce((acc, [dept, items]) => {
      const recurring = (items || []).filter((p) => !p.is_one_time);
      if (recurring.length > 0) acc[dept] = recurring;
      return acc;
    }, {} as Record<string, Product[]>);
  }, [productsByDepartment]);

  const baseSortedDepts = useMemo(() => {
    return [...(departments || [])]
      .filter((d) => baseRecurringByDept[d.name])
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [departments, baseRecurringByDept]);

  // Local state for optimistic updates
  const [localDepts, setLocalDepts] = useState<Department[]>(baseSortedDepts);
  const [localRecurring, setLocalRecurring] = useState<Record<string, Product[]>>(baseRecurringByDept);

  // Sync with server data
  useEffect(() => { setLocalDepts(baseSortedDepts); }, [baseSortedDepts]);
  useEffect(() => { setLocalRecurring(baseRecurringByDept); }, [baseRecurringByDept]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [renameDept, setRenameDept] = useState<{ oldName: string; newName: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 10 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 1. Is it a department being dragged?
    const isDeptDrag = localDepts.some((d) => d.id === active.id);

    if (isDeptDrag) {
      const oldIndex = localDepts.findIndex((d) => d.id === active.id);
      const newIndex = localDepts.findIndex((d) => d.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(localDepts, oldIndex, newIndex);
        setLocalDepts(reordered);
        try {
          onReorderDepartments(reordered.map((d, i) => ({ id: d.id, sort_order: i })));
        } catch(e) { console.error("Reorder Dept Error", e); }
      }
      return;
    }

    // 2. If not a department, it's a product. Find its department.
    let foundDeptName: string | null = null;
    for (const [deptName, items] of Object.entries(localRecurring)) {
      if (items.some((p) => p.id === active.id)) {
        foundDeptName = deptName;
        break;
      }
    }

    // 3. Product moved within same department
    if (foundDeptName && localRecurring[foundDeptName]) {
      const items = localRecurring[foundDeptName];
      const oldIndex = items.findIndex((p) => p.id === active.id);
      const newIndex = items.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        setLocalRecurring({
          ...localRecurring,
          [foundDeptName]: newItems,
        });
        try {
          onReorderProducts(
            newItems.map((p, i) => ({ id: p.id, sort_order: i }))
          );
        } catch (e) {
          console.error("Reorder Product Error", e);
        }
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-4 min-h-screen">
      <div className="w-full max-w-[calc(100vw-32px)] space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4">
            {localDepts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">אין מחלקות עדיין</p>
              </div>
            ) : (
              <SortableContext
                items={localDepts.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                {localDepts.map((dept) => (
                  <SortableDepartmentItem key={dept.id} dept={dept}>
                    <Collapsible
                      open={activeId === dept.id ? false : (openDepts[dept.name] !== false)}
                      onOpenChange={(open) =>
                        setOpenDepts({ ...openDepts, [dept.name]: open })
                      }
                    >
                      <div className="flex items-center gap-2">
                        <CollapsibleTrigger
                          className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg border font-bold ${getDepartmentColor(dept.name)}`}
                        >
                          <span>{dept.name} ({localRecurring[dept.name]?.length || 0})</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${openDepts[dept.name] !== false ? "rotate-180" : ""}`} />
                        </CollapsibleTrigger>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameDept({ oldName: dept.name, newName: dept.name });
                          }}
                          className="p-3 border rounded-lg bg-card focus:outline-none"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                      <CollapsibleContent className="mt-2 space-y-2 pb-4">
                        <SortableContext
                          items={localRecurring[dept.name]?.map((p) => p.id) || []}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {localRecurring[dept.name]?.map((product) => (
                              <SortableProductRow
                                key={product.id}
                                product={product}
                                onEdit={() => setEditProduct(product)}
                                onDelete={() => setDeleteTarget(product)}
                                onUpdateStock={onUpdateStock}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </CollapsibleContent>
                    </Collapsible>
                  </SortableDepartmentItem>
                ))}
              </SortableContext>
            )}
          </div>
        </DndContext>
      </div>

      {/* Edit Product Dialog */}
      <EditProductDialog
        product={editProduct}
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        onSave={(updates) => {
          onUpdateProduct(updates);
        }}
        departmentNames={departmentNames}
        onAddDepartment={onAddDepartment}
      />

      {/* Rename Department Dialog */}
      <Dialog open={!!renameDept} onOpenChange={(o) => !o && setRenameDept(null)}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader><DialogTitle className="text-right">עריכת מחלקה</DialogTitle></DialogHeader>
          <Input 
            value={renameDept?.newName || ""} 
            onChange={(e) => setRenameDept(prev => prev ? { ...prev, newName: e.target.value } : null)} 
            className="text-right" 
          />
          <DialogFooter className="flex-row-reverse gap-2 pt-4">
            <Button onClick={() => { 
              if (renameDept?.newName.trim()) onRenameDepartment(renameDept.oldName, renameDept.newName.trim()); 
              setRenameDept(null); 
            }}>שמור</Button>
            <Button variant="outline" onClick={() => setRenameDept(null)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">מחיקת מוצר</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              למחוק את "{deleteTarget?.product_name}"? לא ניתן לבטל.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              className="bg-destructive"
              onClick={() => {
                if (deleteTarget) onDeleteProduct(deleteTarget.id);
                setDeleteTarget(null);
              }}
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
