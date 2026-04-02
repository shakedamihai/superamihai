import { 
  ChevronDown, Pencil, GripVertical, Search, X,
  Beef, Carrot, Milk, Snowflake, Sparkles, 
  Wheat, CupSoda, Baby, ShoppingBag, Apple, Fish, Package
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
];

const getDeptIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('ירק')) return Carrot;
  if (lower.includes('פיר')) return Apple;
  if (lower.includes('חלב') || lower.includes('גבינ') || lower.includes('מקרר')) return Milk;
  if (lower.includes('בשר') || lower.includes('עוף') || lower.includes('קצביה')) return Beef;
  if (lower.includes('דג')) return Fish;
  if (lower.includes('קפוא')) return Snowflake;
  if (lower.includes('פארם') || lower.includes('נקיון')) return Sparkles;
  if (lower.includes('מאפי') || lower.includes('לחם')) return Wheat;
  return ShoppingBag;
};

function SortableDepartmentItem({ dept, disabled, children }: { dept: Department; disabled?: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `dept-${dept.id}`,
    disabled: disabled
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div id={`dept-wrapper-${dept.id}`} ref={setNodeRef} style={style} className="w-full flex justify-center mb-5 transition-transform">
      <div className="w-full max-w-[calc(100vw-32px)] flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="w-10 h-[60px] flex items-center justify-center bg-white border rounded-2xl text-muted-foreground shrink-0 touch-none focus:outline-none shadow-sm"
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [renameDept, setRenameDept] = useState<{ oldName: string; newName: string } | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const reorderTimeout = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => { if (!isReordering) setLocalDepts(baseSortedDepts); }, [baseSortedDepts, isReordering]);
  useEffect(() => { if (!isReordering) setLocalRecurring(baseRecurringByDept); }, [baseRecurringByDept, isReordering]);

  const deptColors = useMemo(() => {
    const mapping: Record<string, typeof COLORS[0]> = {};
    const usedIndices = new Set<number>();
    const preferences = [
      { keys: ['ירק'], idx: 1 }, { keys: ['פיר'], idx: 6 },
      { keys: ['חלב', 'גבינ', 'מקרר'], idx: 2 }, { keys: ['בשר', 'עוף', 'קצביה'], idx: 0 }, 
      { keys: ['דג'], idx: 5 }, { keys: ['קפוא'], idx: 12 }, 
    ];

    baseSortedDepts.forEach((dept) => {
      const lower = dept.name.toLowerCase();
      for (const pref of preferences) {
        if (pref.keys.some(k => lower.includes(k)) && !usedIndices.has(pref.idx)) {
          mapping[dept.name] = COLORS[pref.idx];
          usedIndices.add(pref.idx);
          break;
        }
      }
    });

    baseSortedDepts.forEach((dept) => {
      if (!mapping[dept.name]) {
        const availableIndex = COLORS.findIndex((_, i) => !usedIndices.has(i));
        if (availableIndex !== -1) {
          mapping[dept.name] = COLORS[availableIndex];
          usedIndices.add(availableIndex);
        } else {
          mapping[dept.name] = COLORS[Math.abs(dept.name.length) % COLORS.length];
        }
      }
    });
    return mapping;
  }, [baseSortedDepts]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 10 } })
  );

  const handleDragStart = (event: DragStartEvent) => { setActiveId(event.active.id as string); };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setIsReordering(true);
    if (reorderTimeout.current) clearTimeout(reorderTimeout.current);
    reorderTimeout.current = setTimeout(() => setIsReordering(false), 2000);

    const activeStr = String(active.id);
    const overStr = String(over.id);

    if (activeStr.startsWith("dept-") && overStr.startsWith("dept-")) {
      const activeDeptId = activeStr.replace("dept-", "");
      const overDeptId = overStr.replace("dept-", "");
      const oldIndex = localDepts.findIndex((d) => d.id === activeDeptId);
      const newIndex = localDepts.findIndex((d) => d.id === overDeptId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(localDepts, oldIndex, newIndex);
        setLocalDepts(reordered);
        onReorderDepartments(reordered.map((d, i) => ({ id: d.id, sort_order: i })));
        setTimeout(() => {
          document.getElementById(`dept-wrapper-${activeDeptId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
      return;
    }

    let foundDeptName: string | null = null;
    for (const [name, items] of Object.entries(localRecurring)) {
      if (items.some((p) => p.id === activeStr)) { foundDeptName = name; break; }
    }

    if (foundDeptName && localRecurring[foundDeptName]) {
      const items = localRecurring[foundDeptName];
      const oldIndex = items.findIndex((p) => p.id === activeStr);
      const newIndex = items.findIndex((p) => p.id === overStr);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        setLocalRecurring(prev => ({ ...prev, [foundDeptName as string]: reordered }));
        onReorderProducts(reordered.map((p, i) => ({ id: p.id, sort_order: i })));
      }
    }
  };

  const lowerQuery = searchQuery.toLowerCase();
  const displayDepts = useMemo(() => {
    if (!searchQuery) return localDepts;
    return localDepts.filter(dept => {
      const matchesDept = dept.name.toLowerCase().includes(lowerQuery);
      const items = localRecurring[dept.name] || [];
      return matchesDept || items.some(p => p.product_name?.toLowerCase().includes(lowerQuery));
    });
  }, [localDepts, localRecurring, searchQuery, lowerQuery]);

  const isDraggingDept = activeId?.startsWith("dept-");

  return (
    <div className="w-full flex flex-col items-center py-4 min-h-screen bg-slate-50/50">
      <div className="w-full max-w-[calc(100vw-32px)] space-y-6">
        <div className="relative w-full shadow-sm rounded-2xl">
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <Input
            placeholder="חיפוש פריט או מחלקה..."
            className="w-full pl-4 pr-12 py-6 rounded-2xl bg-white border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={displayDepts.map(d => `dept-${d.id}`)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {displayDepts.map((dept) => {
                const items = localRecurring[dept.name] || [];
                const displayItems = searchQuery && !dept.name.toLowerCase().includes(lowerQuery)
                  ? items.filter(p => p.product_name?.toLowerCase().includes(lowerQuery))
                  : items;
                const Icon = getDeptIcon(dept.name);
                const { borderClass, iconClass } = deptColors[dept.name] || COLORS[0];

                return (
                  <SortableDepartmentItem key={dept.id} dept={dept} disabled={activeId !== null && !isDraggingDept}>
                    <Collapsible open={searchQuery ? true : (isDraggingDept ? false : openDepts[dept.name] !== false)} onOpenChange={(o) => setOpenDepts({ ...openDepts, [dept.name]: o })} className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-r-8 ${borderClass}`}>
                      <div className="flex items-center gap-1 p-1">
                        <CollapsibleTrigger className="flex-1 flex items-center justify-between px-4 py-4 font-bold">
                          <div className="flex items-center gap-3">
                            <Icon className={`h-5 w-5 ${iconClass}`} />
                            <span>{dept.name}</span>
                            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">{displayItems.length}</span>
                          </div>
                          <ChevronDown className={`h-5 w-5 text-slate-300 transition-transform ${openDepts[dept.name] !== false || searchQuery ? "rotate-180" : ""}`} />
                        </CollapsibleTrigger>
                        <button onClick={() => setRenameDept({ oldName: dept.name, newName: dept.name })} className="p-3.5 text-slate-300 hover:text-slate-600 transition-colors"><Pencil className="h-4 w-4" /></button>
                      </div>
                      <CollapsibleContent className="px-3 pb-3 space-y-2 mt-1">
                        <SortableContext items={displayItems.map(p => p.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2 border-t border-slate-50 pt-3">
                            {displayItems.map((p) => (
                              <SortableProductRow key={p.id} product={p} onEdit={() => setEditProduct(p)} onDelete={() => setDeleteTarget(p)} onUpdateStock={onUpdateStock} />
                            ))}
                          </div>
                        </SortableContext>
                      </CollapsibleContent>
                    </Collapsible>
                  </SortableDepartmentItem>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <EditProductDialog product={editProduct} open={!!editProduct} onClose={() => setEditProduct(null)} onSave={onUpdateProduct} departmentNames={departmentNames} onAddDepartment={onAddDepartment} />
      <Dialog open={!!renameDept} onOpenChange={(o) => !o && setRenameDept(null)}>
        <DialogContent className="max-w-[90vw] rounded-3xl p-6">
          <DialogHeader><DialogTitle className="text-right">עריכת מחלקה</DialogTitle></DialogHeader>
          <Input value={renameDept?.newName || ""} onChange={(e) => setRenameDept(p => p ? { ...p, newName: e.target.value } : null)} className="text-right py-6 rounded-2xl" />
          <DialogFooter className="flex-row-reverse gap-3 pt-4">
            <Button onClick={() => { if (renameDept?.newName.trim()) onRenameDepartment(renameDept.oldName, renameDept.newName.trim()); setRenameDept(null); }}>שמור</Button>
            <Button variant="outline" onClick={() => setRenameDept(null)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">למחוק את "{deleteTarget?.product_name}"?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
            <AlertDialogAction className="bg-red-500" onClick={() => { if (deleteTarget) onDeleteProduct(deleteTarget.id); setDeleteTarget(null); }}>מחק</AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
