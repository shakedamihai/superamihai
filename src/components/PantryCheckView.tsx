import { 
  ChevronDown, Pencil, GripVertical, Search, 
  Beef, Carrot, Milk, Snowflake, Sparkles, 
  Wheat, CupSoda, Baby, ShoppingBag, Apple, Fish 
} from "lucide-react";
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

// מאגר של 20 צבעים ייחודיים שונים לחלוטין
const COLORS = [
  { borderClass: 'border-r-red-500', iconClass: 'text-red-500' },
  { borderClass: 'border-r-green-500', iconClass: 'text-green-500' },
  { borderClass: 'border-r-blue-500', iconClass: 'text-blue-500' },
  { borderClass: 'border-r-orange-500', iconClass: 'text-orange-500' },
  { borderClass: 'border-r-purple-500', iconClass: 'text-purple-500' },
  { borderClass: 'border-r-cyan-500', iconClass: 'text-cyan-500' },
  { borderClass: 'border-r-pink-500', iconClass: 'text-pink-500' },
  { borderClass: 'border-r-amber-500', iconClass: 'text-amber-500' },
  { borderClass: 'border-r-indigo-500', iconClass: 'text-indigo-500' },
  { borderClass: 'border-r-teal-500', iconClass: 'text-teal-500' },
  { borderClass: 'border-r-fuchsia-500', iconClass: 'text-fuchsia-500' },
  { borderClass: 'border-r-lime-500', iconClass: 'text-lime-500' },
  { borderClass: 'border-r-sky-500', iconClass: 'text-sky-500' },
  { borderClass: 'border-r-rose-500', iconClass: 'text-rose-500' },
  { borderClass: 'border-r-emerald-500', iconClass: 'text-emerald-500' },
  { borderClass: 'border-r-violet-500', iconClass: 'text-violet-500' },
  { borderClass: 'border-r-yellow-500', iconClass: 'text-yellow-500' },
  { borderClass: 'border-r-stone-500', iconClass: 'text-stone-500' },
  { borderClass: 'border-r-slate-500', iconClass: 'text-slate-500' },
  { borderClass: 'border-r-zinc-500', iconClass: 'text-zinc-500' },
];

// פונקציה חכמה לאייקונים (רק בסיס, כל השאר מקבלים שקית קניות)
const getDeptIcon = (name: string) => {
  const lower = name.toLowerCase();
  
  if (lower.includes('ירק')) return Carrot;
  if (lower.includes('פיר')) return Apple;
  if (lower.includes('חלב') || lower.includes('גבינ') || lower.includes('מקרר')) return Milk;
  // איחוד קצביה - בשר, עוף (דגים נפרד)
  if (lower.includes('בשר') || lower.includes('עוף') || lower.includes('קצביה')) return Beef;
  if (lower.includes('דג')) return Fish;
  if (lower.includes('קפוא')) return Snowflake;
  if (lower.includes('פארם') || lower.includes('נקיון') || lower.includes('סבון')) return Sparkles;
  if (lower.includes('מאפי') || lower.includes('לחם')) return Wheat;
  if (lower.includes('שתי') || lower.includes('משק')) return CupSoda;
  if (lower.includes('תינוק')) return Baby;
  
  // אייקון ברירת מחדל אלגנטי לכל מחלקה אחרת
  return ShoppingBag;
};

function SortableDepartmentItem({ dept, disabled, children }: { dept: Department; disabled?: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `dept-${dept.id}`,
    disabled: disabled
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 150ms cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 50 : undefined,
    scale: isDragging ? "1.01" : "1",
  };

  return (
    <div id={`dept-wrapper-${dept.id}`} ref={setNodeRef} style={style} className="w-full flex justify-center mb-5 transition-transform">
      <div className="w-full max-w-[calc(100vw-32px)] flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="w-10 h-[60px] flex items-center justify-center bg-white border rounded-2xl text-muted-foreground shrink-0 touch-none focus:outline-none shadow-sm hover:bg-gray-50 transition-colors"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="h-5 w-5 opacity-50" />
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

  // מנוע נעילת צבעים ייחודיים ויציבים
  const deptColors = useMemo(() => {
    const mapping: Record<string, typeof COLORS[0]> = {};
    const usedIndices = new Set<number>();

    // הגדרת משפחות וצבעים מועדפים למחלקות בסיס בלבד
    const preferences = [
      { keys: ['ירק'], idx: 1 }, // ירוק
      { keys: ['פיר'], idx: 14 }, // אמרלד (שונה מירוק של ירקות)
      { keys: ['חלב', 'גבינ', 'מקרר'], idx: 2 }, // כחול
      { keys: ['בשר', 'עוף', 'קצביה'], idx: 0 }, // אדום
      { keys: ['דג'], idx: 5 }, // ציאן (שונה מאדום)
      { keys: ['קפוא'], idx: 12 }, // תכלת
      { keys: ['פארם', 'נקיון', 'סבון'], idx: 4 }, // סגול
      { keys: ['מאפי', 'לחם'], idx: 7 }, // ענבר
      { keys: ['שתי', 'משק'], idx: 8 }, // אינדיגו
      { keys: ['תינוק'], idx: 10 }, // פוקסיה
    ];

    // מסדרים את המחלקות לפי ה-ID שלהן כדי שהצבעים לא יתחלפו אם משנים את הסדר
    const stableDepts = [...(departments || [])].sort((a, b) => a.id.localeCompare(b.id));

    // סיבוב 1: מחלקים את הצבעים המועדפים לבסיס (בתנאי שהם פנויים)
    stableDepts.forEach((dept) => {
      const lower = dept.name.toLowerCase();
      for (const pref of preferences) {
        if (pref.keys.some(k => lower.includes(k)) && !usedIndices.has(pref.idx)) {
          mapping[dept.name] = COLORS[pref.idx];
          usedIndices.add(pref.idx);
          break;
        }
      }
    });

    // סיבוב 2: מחלקים את שאר הצבעים הפנויים לכל המחלקות המומצאות/החדשות
    stableDepts.forEach((dept) => {
      if (!mapping[dept.name]) {
        // מוצא את הצבע הראשון שעוד לא נתפס
        const availableIndex = COLORS.findIndex((_, i) => !usedIndices.has(i));
        if (availableIndex !== -1) {
          mapping[dept.name] = COLORS[availableIndex];
          usedIndices.add(availableIndex);
        } else {
          // גיבוי נדיר למקרה שיש יותר מ-20 מחלקות שונות
          mapping[dept.name] = COLORS[Math.abs(dept.name.length) % COLORS.length];
        }
      }
    });

    return mapping;
  }, [departments]);

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
    <div className="w-full flex flex-col items-center py-4 min-h-screen bg-gray-50/50">
      <div className="w-full max-w-[calc(100vw-32px)] space-y-6">
        
        <div className="relative w-full shadow-sm rounded-2xl">
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground/70" />
          </div>
          <Input
            type="text"
            placeholder="חיפוש מחלקה או פריט..."
            className="w-full pl-4 pr-12 py-6 rounded-2xl bg-white border-border text-lg shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30"
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
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed shadow-sm">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">אין מוצרים במזווה עדיין</p>
              </div>
            ) : displayDepts.length === 0 && searchQuery ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed shadow-sm">
                <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">לא נמצאו תוצאות לחיפוש</p>
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

                  const Icon = getDeptIcon(dept.name);
                  const { borderClass, iconClass } = deptColors[dept.name] || COLORS[0];

                  return (
                    <SortableDepartmentItem key={dept.id} dept={dept} disabled={disableDeptDrag}>
                      <Collapsible
                        open={searchQuery ? true : (isDraggingDept ? false : (openDepts[dept.name] !== false))}
                        onOpenChange={(open) =>
                          setOpenDepts({ ...openDepts, [dept.name]: open })
                        }
                        className={`bg-white rounded-2xl shadow-sm border border-border overflow-hidden border-r-4 ${borderClass}`}
                      >
                        <div className="flex items-center gap-1 p-1">
                          <CollapsibleTrigger
                            className="flex-1 flex items-center justify-between px-4 py-3 bg-transparent font-bold transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`h-5 w-5 ${iconClass}`} />
                              <span className="text-[1.05rem] tracking-tight text-foreground">{dept.name}</span>
                              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-black">
                                {displayItems.length}
                              </span>
                            </div>
                            <ChevronDown className={`h-5 w-5 text-muted-foreground/50 transition-transform duration-300 ${openDepts[dept.name] !== false || searchQuery ? "rotate-180" : ""}`} />
                          </CollapsibleTrigger>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameDept({ oldName: dept.name, newName: dept.name });
                            }}
                            className="p-3.5 rounded-xl bg-transparent hover:bg-gray-50 text-muted-foreground/50 transition-colors focus:outline-none"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </div>
                        <CollapsibleContent className="px-3 pb-3 space-y-2 mt-1">
                          <SortableContext
                            items={displayItems.map((p) => p.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-1.5 border-t border-border/50 pt-3">
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
