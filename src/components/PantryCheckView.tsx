import { ChevronDown, Pencil, GripVertical } from "lucide-react";
import { Product, getDepartmentColor } from "@/hooks/useProducts";
import { Department } from "@/hooks/useDepartments";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useMemo, useCallback } from "react";
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
import { useQueryClient } from "@tanstack/react-query";

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `dept-${dept.id}` } as any);
  
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
          className="w-10 h-12 flex items-center justify-center bg-muted rounded-lg text-muted-foreground shrink-0 touch-none"
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
  const queryClient = useQueryClient();

  const recurringByDept = useMemo(() => {
    return Object.entries(productsByDepartment || {}).reduce((acc, [dept, items]) => {
      const recurring = (items || []).filter((p) => !p.is_one_time);
      if (recurring.length > 0) acc[dept] = recurring;
      return acc;
    }, {} as Record<string, Product[]>);
  }, [productsByDepartment]);

  const sortedDepts = useMemo(() => {
    return [...(departments || [])]
      .filter((d) => recurringByDept[d.name])
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [departments, recurringByDept]);

  // Build all sortable IDs: dept-{id} for departments, product id for products
  const allSortableIds = useMemo(() => {
    const ids: string[] = [];
    for (const dept of sortedDepts) {
      ids.push(`dept-${dept.id}`);
      const products = recurringByDept[dept.name] || [];
      for (const p of products) {
        ids.push(p.id);
      }
    }
    return ids;
  }, [sortedDepts, recurringByDept]);

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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeStr = active.id as string;
    const overStr = over.id as string;

    // Department reorder
    if (activeStr.startsWith("dept-") && overStr.startsWith("dept-")) {
      const activeRealId = activeStr.replace("dept-", "");
      const overRealId = overStr.replace("dept-", "");

      const oldIndex = sortedDepts.findIndex((d) => d.id === activeRealId);
      const newIndex = sortedDepts.findIndex((d) => d.id === overRealId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(sortedDepts, oldIndex, newIndex);
        const updates = reordered.map((d, i) => ({ id: d.id, sort_order: i }));

        // Optimistic update
        queryClient.setQueryData<Department[]>(["departments"], (old) => {
          if (!old) return old;
          return old.map((d) => {
            const upd = updates.find((u) => u.id === d.id);
            return upd ? { ...d, sort_order: upd.sort_order } : d;
          });
        });

        onReorderDepartments(updates);
      }
      return;
    }

    // Product reorder - find which department both belong to
    for (const [deptName, items] of Object.entries(recurringByDept)) {
      const oldIndex = items.findIndex((p) => p.id === activeStr);
      const newIndex = items.findIndex((p) => p.id === overStr);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        const updates = reordered.map((p, i) => ({ id: p.id, sort_order: i }));

        // Optimistic update
        queryClient.setQueryData<Product[]>(["products"], (old) => {
          if (!old) return old;
          return old.map((p) => {
            const upd = updates.find((u) => u.id === p.id);
            return upd ? { ...p, sort_order: upd.sort_order } : p;
          }).sort((a, b) => {
            if (a.department !== b.department) return a.department.localeCompare(b.department);
            return (a.sort_order || 0) - (b.sort_order || 0);
          });
        });

        onReorderProducts(updates);
        break;
      }
    }
  }, [sortedDepts, recurringByDept, queryClient, onReorderDepartments, onReorderProducts]);

  return (
    <div className="w-full flex flex-col items-center py-4 min-h-screen">
      <div className="w-full max-w-[calc(100vw-32px)] space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedDepts.map(d => `dept-${d.id}`)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col">
              {sortedDepts.map((dept) => (
                <SortableDepartmentItem key={dept.id} dept={dept}>
                  <Collapsible 
                    open={activeId ? false : (openDepts[dept.name] !== false)} 
                    onOpenChange={(open) => setOpenDepts(prev => ({ ...prev, [dept.name]: open }))}
                  >
                    <div className="flex items-center gap-2">
                      <CollapsibleTrigger className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg border font-bold ${getDepartmentColor(dept.name)}`}>
                        <span>{dept.name} ({recurringByDept[dept.name]?.length || 0})</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${openDepts[dept.name] !== false ? "rotate-180" : ""}`} />
                      </CollapsibleTrigger>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setRenameDept({ oldName: dept.name, newName: dept.name }); 
                        }} 
                        className="p-3 border rounded-lg bg-card"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                    <CollapsibleContent className="mt-2 space-y-2 pb-4">
                      <SortableContext items={recurringByDept[dept.name]?.map(p => p.id) || []} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-2">
                          {recurringByDept[dept.name]?.map((p) => (
                            <SortableProductRow 
                              key={p.id} 
                              product={p} 
                              onUpdateStock={onUpdateStock} 
                              onEdit={setEditProduct} 
                              onDelete={setDeleteTarget} 
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </CollapsibleContent>
                  </Collapsible>
                </SortableDepartmentItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <EditProductDialog 
        product={editProduct} 
        open={!!editProduct} 
        onClose={() => setEditProduct(null)} 
        onSave={onUpdateProduct} 
        departmentNames={departmentNames} 
        onAddDepartment={onAddDepartment} 
      />
      
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
