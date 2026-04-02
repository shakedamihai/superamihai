import { 
  ChevronDown, Pencil, GripVertical, Search, X, Trash2, Settings2, Lock,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
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
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableProductRow } from "./SortableProductRow";

const SYSTEM_UNITS = [
  "יחידות", 'ק"ג', "ליטר", "חבילות", "מארזים", 
  "בקבוקים", "פחיות", "גלילים", "שפופרות", 
  "טבליות", "קפסולות", "זוגות", "גרם"
];

interface PantryCheckViewProps {
  productsByDepartment: Record<string, Product[]>;
  departments: Department[];
  onUpdateStock: (id: string, stock: number) => void;
  onUpdateProduct: (updates: { id: string; product_name?: string; department?: string; base_quantity?: number; unit?: string }) => void;
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
  if (lower.includes('פארם') || lower.includes('נקיון') || lower.includes('סבון')) return Sparkles;
  if (lower.includes('מאפי') || lower.includes('לחם')) return Wheat;
  return ShoppingBag;
};

function SortableDepartmentItem({ dept, disabled, isDragOverlay, children }: { dept: Department; disabled?: boolean; isDragOverlay?: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: `dept-${dept.id}`,
    disabled: disabled
  });
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition, 
    opacity: isDragging ? 0.3 : 1, 
    zIndex: isDragOverlay ? 50 : undefined,
  };
  return (
    <div id={`dept-wrapper-${dept.id}`} ref={setNodeRef} style={style} className={`w-full flex justify-center mb-5 transition-transform ${isDragOverlay ? 'shadow-xl' : ''}`}>
      <div className="w-full max-w-[calc(100vw-32px)] flex items-start gap-2">
        <button {...attributes} {...listeners} className="w-10 h-[60px] flex items-center justify-center bg-white border rounded-2xl text-muted-foreground shrink-0 touch-none shadow-sm"><GripVertical className="h-5 w-5 opacity-50" /></button>
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
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null); // State למחיקה
  const [manageUnitsOpen, setManageUnitsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const reorderTimeout = useRef<NodeJS.Timeout | null>(null);

  const isSearching = searchQuery.length > 0;

  const allUsedUnits = useMemo(() => {
    const units = new Set<string>(SYSTEM_UNITS);
    Object.values(productsByDepartment).flat().forEach(p => { if (p.unit) units.add(p.unit); });
    return Array.from(units).sort((a, b) => {
      const aIsSys = SYSTEM_UNITS.includes(a);
      const bIsSys = SYSTEM_UNITS.includes(b);
      if (aIsSys && !bIsSys) return -1;
      if (!aIsSys && bIsSys) return 1;
      return a.localeCompare(b);
    });
  }, [productsByDepartment]);

  const baseRecurringByDept = useMemo(() => {
    return Object.entries(productsByDepartment || {}).reduce((acc, [dept, items]) => {
      const recurring = (items || []).filter((p) => !p.is_one_time);
      if (recurring.length > 0) acc[dept] = recurring;
      return acc;
    }, {} as Record<string, Product[]>);
  }, [productsByDepartment]);

  const baseSortedDepts = useMemo(() => {
    return [...(departments || [])].filter((d) => baseRecurringByDept[d.name]).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [departments, baseRecurringByDept]);

  const [localDepts, setLocalDepts] = useState<Department[]>(baseSortedDepts);
  const [localRecurring, setLocalRecurring] = useState<Record<string, Product[]>>(baseRecurringByDept);

  useEffect(() => { if (!isReordering) setLocalDepts(baseSortedDepts); }, [baseSortedDepts, isReordering]);
  useEffect(() => { if (!isReordering) setLocalRecurring(baseRecurringByDept); }, [baseRecurringByDept, isReordering]);

  const deptColors = useMemo(() => {
    const mapping: Record<string, typeof COLORS[0]> = {};
    const usedIndices = new Set<number>();
    const preferences = [{ keys: ['ירק'], idx: 1 }, { keys: ['פיר'], idx: 6 }, { keys: ['חלב', 'גבינ', 'מקרר'], idx: 2 }, { keys: ['בשר', 'עוף', 'קצביה'], idx: 0 }, { keys: ['דג'], idx: 5 }];
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
        if (availableIndex !== -1) { mapping[dept.name] = COLORS[availableIndex]; usedIndices.add(availableIndex); }
        else { mapping[dept.name] = COLORS[Math.abs(dept.name.length) % COLORS.length]; }
      }
    });
    return mapping;
  }, [baseSortedDepts]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 10 } }));

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

  const handleUpdateUnit = (oldUnit: string, newUnit: string) => {
    if (SYSTEM_UNITS.includes(oldUnit)) return;
    Object.values(productsByDepartment).flat().filter(p => p.unit === oldUnit).forEach(p => {
      onUpdateProduct({ id: p.id, unit: newUnit });
    });
  };

  const handleDeleteUnit = (unitToDelete: string) => {
    if (SYSTEM_UNITS.includes(unitToDelete)) return;
    Object.values(productsByDepartment).flat().filter(p => p.unit === unitToDelete).forEach(p => {
      onUpdateProduct({ id: p.id, unit: "יחידות" });
    });
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

  return (
    <div className="w-full flex flex-col items-center py-4 min-h-screen bg-slate-50/50 font-sans">
      <div className="w-full max-w-[calc(100vw-32px)] space-y-6">
        <div className={`relative bg-white border border-slate-200 shadow-sm transition-all duration-300 ${isSearching ? 'rounded-2xl p-4' : 'rounded-[2rem] p-6'}`}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4"><Search className="h-5 w-5 text-slate-400" /></div>
              <Input placeholder="חיפוש פריט או מחלקה..." className="w-full pl-10 pr-12 py-6 rounded-xl bg-slate-50 border-slate-200 text-lg" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {isSearching && <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><X className="h-5 w-5" /></button>}
            </div>
            <Button variant="outline" size="icon" className="h-[60px] w-[60px] rounded-xl border-slate-200" onClick={() => setManageUnitsOpen(true)}><Settings2 className="h-6 w-6 text-slate-500" /></Button>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="space-y-4">
            {displayDepts.map((dept) => {
              const Icon = getDeptIcon(dept.name);
              const { borderClass, iconClass } = deptColors[dept.name] || COLORS[0];
              const items = localRecurring[dept.name] || [];
              const displayItems = searchQuery && !dept.name.toLowerCase().includes(lowerQuery) ? items.filter(p => p.product_name?.toLowerCase().includes(lowerQuery)) : items;

              return (
                <SortableDepartmentItem key={dept.id} dept={dept} disabled={activeId !== null && !activeId.startsWith("dept-")}>
                  <Collapsible open={isSearching ? true : (activeId?.startsWith("dept-") ? false : openDepts[dept.name] !== false)} onOpenChange={(o) => setOpenDepts({ ...openDepts, [dept.name]: o })} className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-r-8 ${borderClass}`}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-4 font-bold">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${iconClass}`} />
                        <span>{dept.name}</span>
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-black">{displayItems.length}</span>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-slate-300 transition-transform ${openDepts[dept.name] !== false || isSearching ? "rotate-180" : ""}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-3 pb-3 space-y-2 mt-1">
                      <SortableContext items={displayItems.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2 border-t border-slate-50 pt-3">
                          {displayItems.map((p) => (
                            <SortableProductRow 
                              key={p.id} 
                              product={p} 
                              onEdit={() => setEditProduct(p)} 
                              onDelete={() => setDeleteTarget(p)} // הנה התיקון! מעביר את המוצר למחיקה
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
          </div>
          <DragOverlay dropAnimation={null}>
            {activeId && activeId.startsWith("dept-") ? (() => {
              const draggedDeptId = activeId.replace("dept-", "");
              const draggedDept = localDepts.find(d => d.id === draggedDeptId);
              if (!draggedDept) return null;
              const Icon = getDeptIcon(draggedDept.name);
              const { borderClass, iconClass } = deptColors[draggedDept.name] || COLORS[0];
              const items = localRecurring[draggedDept.name] || [];
              return (
                <div className="w-full flex justify-center">
                  <div className="w-full max-w-[calc(100vw-32px)] flex items-start gap-2">
                    <div className="w-10 h-[60px] flex items-center justify-center bg-white border rounded-2xl text-muted-foreground shrink-0 shadow-sm">
                      <GripVertical className="h-5 w-5 opacity-50" />
                    </div>
                    <div className={`flex-1 bg-white rounded-2xl shadow-lg border border-slate-100 border-r-8 ${borderClass} px-4 py-4 font-bold`}>
                      <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${iconClass}`} />
                        <span>{draggedDept.name}</span>
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-black">{items.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })() : null}
          </DragOverlay>
        </DndContext>
        <DialogContent className="max-w-[95vw] sm:max-w-[400px] rounded-[2rem] p-6 font-sans">
          <DialogHeader><DialogTitle className="text-right text-xl font-black">ניהול יחידות מידה</DialogTitle></DialogHeader>
          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {allUsedUnits.map((unit) => (
              <UnitRow key={unit} unit={unit} isSystem={SYSTEM_UNITS.includes(unit)} onRename={handleUpdateUnit} onDelete={() => handleDeleteUnit(unit)} />
            ))}
          </div>
          <DialogFooter><Button className="w-full rounded-xl py-6 font-bold" onClick={() => setManageUnitsOpen(false)}>סיום</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <EditProductDialog product={editProduct} open={!!editProduct} onClose={() => setEditProduct(null)} onSave={onUpdateProduct} departmentNames={departmentNames} onAddDepartment={onAddDepartment} />
      
      {/* דיאלוג מחיקה למלאי */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl p-6 font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right text-xl">למחוק את המוצר?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
            <AlertDialogAction className="rounded-xl px-6 py-5 bg-red-500 hover:bg-red-600 text-white font-bold" onClick={() => { if (deleteTarget) onDeleteProduct(deleteTarget.id); setDeleteTarget(null); }}>
              מחק מוצר
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-xl px-6 py-5 font-medium">ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UnitRow({ unit, isSystem, onRename, onDelete }: { unit: string; isSystem: boolean; onRename: (old: string, n: string) => void; onDelete: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(unit);

  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isSystem ? 'bg-slate-50 border-slate-100 opacity-80' : 'bg-white border-slate-200 shadow-sm'}`}>
      {isEditing ? (
        <div className="flex flex-1 gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-10 text-right" autoFocus />
          <Button size="sm" onClick={() => { onRename(unit, newName); setIsEditing(false); }}>שמור</Button>
        </div>
      ) : (
        <>
          <div className="flex gap-1">
            {isSystem ? (
              <div className="p-2 text-slate-300"><Lock className="h-4 w-4" /></div>
            ) : (
              <>
                <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></button>
                <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </>
            )}
          </div>
          <span className={`font-bold ${isSystem ? 'text-slate-400' : 'text-slate-700'}`}>{unit}</span>
        </>
      )}
    </div>
  );
}
