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

// קומפוננטה בטוחה למחלקה נגררת
function SortableDepartmentItem({ dept, children }: { dept: Department; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: dept?.id || "fallback-id" 
  });
  
  // הגנה למניעת קריסה אם מחלקה לא תקינה
  if (!dept || !dept.id) return null;

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
  productsByDepartment = {}, // הגנה - ערך דיפולטיבי
  departments = [], // הגנה - ערך דיפולטיבי
  onUpdateStock,
  onUpdateProduct,
  onDeleteProduct,
  onReorderProducts,
  onRenameDepartment,
  onReorderDepartments,
  departmentNames = [],
  onAddDepartment,
}: PantryCheckViewProps) {
  
  // חישוב בטוח של המידע המגיע מהשרת
  const baseRecurringByDept = useMemo(() => {
    try {
      return Object.entries(productsByDepartment || {}).reduce((acc, [dept, items]) => {
        const recurring = (items || []).filter((p) => p && !p.is_one_time);
        if (recurring.length > 0) acc[dept] = recurring;
        return acc;
      }, {} as Record<string, Product[]>);
    } catch (e) {
      console.error("Error formatting products:", e);
      return {};
    }
  }, [productsByDepartment]);

  const baseSortedDepts = useMemo(() => {
    try {
      return [...(departments || [])]
        .filter((d) => d && d.name && baseRecurringByDept[d.name])
        .sort((a, b) => (a?.sort_order || 0) - (b?.sort_order || 0));
    } catch (e) {
      console.error("Error sorting depts:", e);
      return [];
    }
  }, [departments, baseRecurringByDept]);

  // סטייט מקומי לעדכונים אופטימיים (מהירים ללא דיליי)
  const [localDepts, setLocalDepts] = useState<Department[]>(baseSortedDepts);
  const [localRecurring, setLocalRecurring] = useState<Record<string, Product[]>>(baseRecurringByDept);

  // סנכרון הסטייט עם השרת בצורה בטוחה
  useEffect(() => { setLocalDepts(baseSortedDepts); }, [baseSortedDepts]);
  useEffect(() => { setLocalRecurring(baseRecurringByDept); }, [baseRecurringByDept]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [renameDept, setRenameDept] = useState<{ oldName: string; newName: string } | null>(null);
  const [newDeptName, setNewDeptName] = useState<string>("");
  const [showAddDept, setShowAddDept] = useState<boolean>(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 10 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active && event.active.id) {
      setActiveId(event.active.id as string);
    }
  };

  // פונקציית סיום גרירה מרכזית ובטוחה
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !active || active.id === over.id) return;

    // 1. האם זאת מחלקה שנגררת?
    const isDeptDrag = localDepts.some((d) => d && d.id === active.id);

    if (isDeptDrag) {
      const oldIndex = localDepts.findIndex((d) => d?.id === active.id);
      const newIndex = localDepts.findIndex((d) => d?.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(localDepts, oldIndex, newIndex);
        setLocalDepts(reordered); // עדכון UI אופטימי ומיידי
        try {
          onReorderDepartments(reordered.map((d, i) => ({ id: d.id, sort_order: i })));
        } catch(e) { console.error("Reorder Dept Error", e); }
      }
      return;
    }

    // 2. אם זאת לא מחלקה, זה כנראה מוצר. נחפש באיזו מחלקה הוא נמצא
    let foundDeptName: string | null = null;
    for (const [deptName, items] of Object.entries(localRecurring)) {
      if (items && items.some(p => p?.id === active.id)) {
        foundDeptName = deptName;
        break;
      }
    }

    // 3. Product moved within same department
    if (foundDeptName && localRecurring[foundDeptName]) {
      const items = localRecurring[foundDeptName];
      const oldIndex = items.findIndex((p) => p?.id === active.id);
      const newIndex = items.findIndex((p) => p?.id === over.id);

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

  // MAIN RENDER
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {/* Header with Add Department Button */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">בדיקת מחסן</h1>
            <Dialog open={showAddDept} onOpenChange={setShowAddDept}>
              <Button onClick={() => setShowAddDept(true)}>+ הוסף מחלקה</Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>הוסף מחלקה חדשה</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="שם המחלקה"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDept(false);
                      setNewDeptName("");
                    }}
                  >
                    ביטול
                  </Button>
                  <Button
                    onClick={() => {
                      if (newDeptName.trim()) {
                        onAddDepartment(newDeptName);
                        setNewDeptName("");
                        setShowAddDept(false);
                      }
                    }}
                  >
                    הוסף
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Departments List */}
          {localDepts.length === 0 ? (
            <div className="text-center py-12 bg-muted rounded-lg">
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
                    open={openDepts[dept.name] || false}
                    onOpenChange={(open) =>
                      setOpenDepts({ ...openDepts, [dept.name]: open })
                    }
                  >
                    <CollapsibleTrigger className="w-full">
                      <div
                        className="p-4 rounded-lg flex items-center justify-between text-white hover:opacity-90 transition-opacity"
                        style={{
                          backgroundColor: getDepartmentColor(dept.name),
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{dept.name}</h3>
                          <span className="text-sm opacity-75">
                            ({localRecurring[dept.name]?.length || 0} מוצרים)
                          </span>
                        </div>
                        <ChevronDown className="h-5 w-5 transition-transform" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <SortableContext
                        items={
                          localRecurring[dept.name]?.map((p) => p.id) || []
                        }
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                          {localRecurring[dept.name] &&
                          localRecurring[dept.name].length > 0 ? (
                            localRecurring[dept.name].map((product) => (
                              <SortableProductRow
                                key={product.id}
                                product={product}
                                onEdit={() => setEditProduct(product)}
                                onDelete={() => setDeleteTarget(product)}
                                onUpdateStock={onUpdateStock}
                              />
                            ))
                          ) : (
                            <p className="text-muted-foreground text-center py-4">
                              אין מוצרים בקטגוריה זו
                            </p>
                          )}
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

      {/* Edit Product Dialog */}
      {editProduct && (
        <EditProductDialog
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSave={(updates) => {
            onUpdateProduct(updates);
            setEditProduct(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>מחק מוצר?</AlertDialogTitle>
              <AlertDialogDescription>
                האם אתה בטוח שברצונך למחוק את "{deleteTarget.product_name}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDeleteProduct(deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Rename Department Dialog */}
      {renameDept && (
        <Dialog open={!!renameDept} onOpenChange={() => setRenameDept(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>שנה שם מחלקה</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="שם חדש"
              defaultValue={renameDept.oldName}
              onChange={(e) =>
                setRenameDept({
                  ...renameDept,
                  newName: e.target.value,
                })
              }
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRenameDept(null)}
              >
                ביטול
              </Button>
              <Button
                onClick={() => {
                  if (renameDept.newName.trim()) {
                    onRenameDepartment(renameDept.oldName, renameDept.newName);
                    setRenameDept(null);
                  }
                }}
              >
                שנה
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
