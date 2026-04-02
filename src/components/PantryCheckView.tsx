import { ChevronDown, Pencil, GripVertical, Search } from "lucide-react";
import { Product, getDepartmentColor } from "@/hooks/useProducts";
import { Department } from "@/hooks/useDepartments";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useMemo, useEffect, useRef } from "react";
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

function SortableDepartmentItem({ dept, disabled, children }: { dept: Department; disabled?: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `dept-${dept.id}`,
    disabled: disabled
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 150ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div id={`dept-wrapper-${dept.id}`} ref={setNodeRef} style={style} className="w-full flex justify-center mb-4">
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
  
  // הוספת סטייט לחיפוש
  const [searchQuery, setSearchQuery] = useState("");

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

  const [localDepts, setLocalDepts] = useState<Department[]>(baseSortedDepts);
  const [localRecurring, setLocalRecurring] = useState<Record<string, Product[]>>(baseRecurringByDept);

  const [isReordering, setIsReordering] = useState(false);
  const reorderTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { 
    if (!isReordering) setLocalDepts(baseSortedDepts); 
  }, [baseSortedDepts, isReordering]);

  useEffect(() => { 
    if (!isReordering) setLocalRecurring(baseRecurringByDept); 
  }, [baseRecurringByDept, isReordering]);

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

    const activeStr = String(active.id);
    const overStr = String(over.id);

    setIsReordering(true);
    if (reorderTimeout.current) clearTimeout(reorderTimeout.current);
    reorderTimeout.current = setTimeout(() => {
      setIsReordering(false);
    }, 2000);

    if (activeStr.startsWith("dept-") && overStr.startsWith("dept-")) {
      const activeDeptId = activeStr.replace("dept-", "");
      const overDeptId = overStr.replace("dept-", "");

      const oldIndex = localDepts.findIndex((d) => d.id === activeDeptId);
      const newIndex = localDepts.findIndex((d) => d.id === overDeptId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(localDepts, oldIndex, newIndex);
        setLocalDepts(reordered);
        
        try {
          onReorderDepartments(reordered.map((d, i) => ({ id: d.id, sort_order: i })));
        } catch(e) { console.error("Reorder Dept Error", e); }

        setTimeout(() => {
          const element = document.getElementById(`dept-wrapper-${activeDeptId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
      return;
    }

    let foundDeptName: string | null = null;
    for (const [deptName, items] of Object.entries(localRecurring)) {
      if (items.some((p) => p.id === activeStr)) {
        foundDeptName = deptName;
        break;
      }
    }

    if (foundDeptName && localRecurring[foundDeptName]) {
      const items = localRecurring[foundDeptName];
      const oldIndex = items.findIndex((p) => p.id === activeStr);
      const newIndex = items.findIndex((p) => p.id === overStr);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        setLocalRecurring((prev) => ({
          ...prev,
          [foundDeptName as string]: reordered,
        }));
        try {
          onReorderProducts(reordered.map((p, i) => ({ id: p.id, sort_order: i })));
        } catch (e) { console.error("Reorder Product Error", e); }
      }
    }
  };

  const isDraggingDept = activeId?.startsWith("dept-") || false;
  // ביטול גרירת מחלקה אם אנחנו גוררים מוצר או אם אנחנו באמצע חיפוש (למניעת באגים)
  const isDraggingProduct = activeId !== null && !isDraggingDept;
  const disableDeptDrag = isDraggingProduct || searchQuery.length > 0;

  // לוגיקת הסינון
  const lowerQuery = searchQuery.toLowerCase();
  
  const displayDepts = useMemo(() => {
    if (!searchQuery) return localDepts;
    return localDepts.filter(dept => {
      const items = localRecurring[dept.name] || [];
      return items.some(p => p.product_name?.toLowerCase().includes(lowerQuery));
    });
  }, [localDepts, localRecurring, searchQuery, lowerQuery]);

  return (
    <div className="w-full flex flex-col items-center py-4 min-h-screen">
      <div className="w-full max-w-[calc(100vw-32px)] space-y-4">
        
        {/* שורת החיפוש החדשה */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="חיפוש פריטים במלאי..."
            className="w-full pl-3 pr-10 rounded-xl bg-card border-muted shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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
            ) : displayDepts.length === 0 && searchQuery ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">לא נמצאו מוצרים תואמים לחיפוש 🔍</p>
              </div>
            ) : (
              <SortableContext
                items={displayDepts.map((d) => `dept-${d.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {displayDepts.map((dept) => {
                  
                  // סינון הפריטים בתוך המחלקה
                  const deptItems = localRecurring[dept.name] || [];
                  const displayItems = searchQuery
                    ? deptItems.filter(p => p.product_name?.toLowerCase().includes(lowerQuery))
                    : deptItems;

                  return (
                    <SortableDepartmentItem key={dept.id} dept={dept} disabled={disableDeptDrag}>
                      <Collapsible
                        // אם יש חיפוש -> נפתח אוטומטית. אם גוררים מחלקה -> נסגר.
                        open={searchQuery ? true : (isDraggingDept ? false : (openDepts[dept.name] !== false))}
                        onOpenChange={(open) =>
                          setOpenDepts({ ...openDepts, [dept.name]: open })
                        }
                      >
                        <div className="flex items-center gap-2">
                          <CollapsibleTrigger
                            className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg border font-bold ${getDepartmentColor(dept.name)}`}
                          >
                            <span>{dept.name} ({displayItems.length})</span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${openDepts[dept.name] !== false || searchQuery ? "rotate-180" : ""}`} />
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
                            items={displayItems.map((p) => p.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {displayItems.map((product) => (
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
                  );
                })}
              </SortableContext>
            )}
          </div>
        </DndContext>
      </div>

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
