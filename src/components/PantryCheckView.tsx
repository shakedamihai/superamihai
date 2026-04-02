import { ChevronDown, Pencil, GripVertical, Search } from "lucide-react";
import { Product } from "@/hooks/useProducts";
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

// --- פונקציות עיצוב מיוחדות ---

// פלטת צבעים מודרנית (פסטל)
const PASTEL_COLORS = [
  "bg-emerald-100 text-emerald-900 border-emerald-200",
  "bg-blue-100 text-blue-900 border-blue-200",
  "bg-rose-100 text-rose-900 border-rose-200",
  "bg-amber-100 text-amber-900 border-amber-200",
  "bg-purple-100 text-purple-900 border-purple-200",
  "bg-cyan-100 text-cyan-900 border-cyan-200",
  "bg-orange-100 text-orange-900 border-orange-200",
  "bg-indigo-100 text-indigo-900 border-indigo-200",
  "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200",
  "bg-lime-100 text-lime-900 border-lime-200",
];

// יצירת צבע קבוע לפי שם המחלקה
const getDynamicDeptColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PASTEL_COLORS[Math.abs(hash) % PASTEL_COLORS.length];
};

// זיהוי אימוג'י אוטומטי לפי שם
const getDeptIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('ירקות') || lower.includes('פירות')) return '🥗';
  if (lower.includes('חלב') || lower.includes('מקרר') || lower.includes('גבינות')) return '🥛';
  if (lower.includes('בשר') || lower.includes('עוף') || lower.includes('דגים')) return '🥩';
  if (lower.includes('קפואים')) return '❄️';
  if (lower.includes('פארם') || lower.includes('נקיון') || lower.includes('טיפוח')) return '🧼';
  if (lower.includes('מאפיה') || lower.includes('לחם')) return '🥖';
  if (lower.includes('שתיה') || lower.includes('משקאות')) return '🥤';
  if (lower.includes('מתוקים') || lower.includes('חטיפים') || lower.includes('שוקולד')) return '🍫';
  if (lower.includes('מזווה') || lower.includes('יבש') || lower.includes('שימורים')) return '🥫';
  if (lower.includes('תינוקות')) return '🍼';
  return '🛒'; // אימוג'י דיפולטיבי
};

// -------------------------------

function SortableDepartmentItem({ dept, disabled, children }: { dept: Department; disabled?: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `dept-${dept.id}`,
    disabled: disabled
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 150ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 50 : undefined,
    scale: isDragging ? "1.02" : "1", // אפקט גדילה קטנטן בגרירה
  };

  return (
    <div id={`dept-wrapper-${dept.id}`} ref={setNodeRef} style={style} className="w-full flex justify-center mb-5 transition-transform">
      <div className="w-full max-w-[calc(100vw-32px)] flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="w-10 h-[60px] flex items-center justify-center bg-card border rounded-2xl text-muted-foreground shrink-0 touch-none focus:outline-none shadow-sm hover:bg-accent"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="h-5 w-5 opacity-70" />
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
  const isDraggingProduct = activeId !== null && !isDraggingDept;
  const disableDeptDrag = isDraggingProduct || searchQuery.length > 0;

  const lowerQuery = searchQuery.toLowerCase();
  
  const displayDepts = useMemo(() => {
    if (!searchQuery) return localDepts;
    return localDepts.filter(dept => {
      const matchesDeptName = dept.name.toLowerCase().includes(lowerQuery);
      const items = localRecurring[dept.name] || [];
      const hasMatchingItems = items.some(p => p.product_name?.toLowerCase().includes(lowerQuery));
      return matchesDeptName || hasMatchingItems;
    });
  }, [localDepts, localRecurring, searchQuery, lowerQuery]);

  return (
    <div className="w-full flex flex-col items-center py-4 min-h-screen bg-gray-50/30">
      <div className="w-full max-w-[calc(100vw-32px)] space-y-6">
        
        {/* שורת חיפוש מעוצבת */}
        <div className="relative w-full shadow-sm rounded-2xl">
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <Input
            type="text"
            placeholder="חיפוש מחלקה או פריט..."
            className="w-full pl-4 pr-12 py-6 rounded-2xl bg-card border-muted text-lg shadow-sm focus-visible:ring-primary/20"
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
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed">
                <div className="text-4xl mb-3">🛒</div>
                <p className="text-muted-foreground font-medium">אין מוצרים במזווה עדיין</p>
              </div>
            ) : displayDepts.length === 0 && searchQuery ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-muted-foreground font-medium">לא נמצאו תוצאות</p>
              </div>
            ) : (
              <SortableContext
                items={displayDepts.map((d) => `dept-${d.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {displayDepts.map((dept) => {
                  
                  const deptItems = localRecurring[dept.name] || [];
                  const matchesDeptName = dept.name.toLowerCase().includes(lowerQuery);
                  
                  const displayItems = searchQuery 
                    ? (matchesDeptName 
                        ? deptItems 
                        : deptItems.filter(p => p.product_name?.toLowerCase().includes(lowerQuery)))
                    : deptItems;

                  // משיגים את הצבע והאימוג'י
                  const colorClass = getDynamicDeptColor(dept.name);
                  const icon = getDeptIcon(dept.name);

                  return (
                    <SortableDepartmentItem key={dept.id} dept={dept} disabled={disableDeptDrag}>
                      <Collapsible
                        open={searchQuery ? true : (isDraggingDept ? false : (openDepts[dept.name] !== false))}
                        onOpenChange={(open) =>
                          setOpenDepts({ ...openDepts, [dept.name]: open })
                        }
                        className="bg-white rounded-2xl shadow-sm border overflow-hidden"
                      >
                        <div className="flex items-center gap-1 p-1">
                          <CollapsibleTrigger
                            className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border font-bold transition-colors ${colorClass}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{icon}</span>
                              <span className="text-[1.05rem] tracking-tight">{dept.name}</span>
                              <span className="ml-2 px-2 py-0.5 bg-white/50 rounded-full text-xs font-black shadow-sm">
                                {displayItems.length}
                              </span>
                            </div>
                            <ChevronDown className={`h-5 w-5 opacity-70 transition-transform duration-300 ${openDepts[dept.name] !== false || searchQuery ? "rotate-180" : ""}`} />
                          </CollapsibleTrigger>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameDept({ oldName: dept.name, newName: dept.name });
                            }}
                            className="p-3.5 rounded-xl bg-card hover:bg-accent text-muted-foreground transition-colors focus:outline-none"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                        <CollapsibleContent className="px-3 pb-3 space-y-2 mt-1">
                          <SortableContext
                            items={displayItems.map((p) => p.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-1.5">
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

      {/* --- Dialogs --- */}
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
        <DialogContent className="max-w-[90vw] rounded-3xl p-6">
          <DialogHeader><DialogTitle className="text-right text-xl">עריכת מחלקה</DialogTitle></DialogHeader>
          <div className="py-4">
            <Input 
              value={renameDept?.newName || ""} 
              onChange={(e) => setRenameDept(prev => prev ? { ...prev, newName: e.target.value } : null)} 
              className="text-right text-lg py-6 rounded-2xl" 
            />
          </div>
          <DialogFooter className="flex-row-reverse gap-3">
            <Button 
              className="rounded-xl px-6 py-5 text-md"
              onClick={() => { 
                if (renameDept?.newName.trim()) onRenameDepartment(renameDept.oldName, renameDept.newName.trim()); 
                setRenameDept(null); 
              }}>
                שמור שינויים
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl px-6 py-5 text-md"
              onClick={() => setRenameDept(null)}>
                ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right text-xl">למחוק את המוצר?</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-base mt-2">
              המוצר <span className="font-bold text-foreground">"{deleteTarget?.product_name}"</span> יימחק לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 rounded-xl px-6 py-5 text-md"
              onClick={() => {
                if (deleteTarget) onDeleteProduct(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              מחק מוצר
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-xl px-6 py-5 text-md border-muted-foreground/20">ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
