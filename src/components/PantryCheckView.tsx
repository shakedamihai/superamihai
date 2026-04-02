import { 
  ChevronDown, Pencil, GripVertical, Search, X, Trash2, Settings2, Lock,
  Beef, Carrot, Milk, Snowflake, Sparkles, Wheat, CupSoda, Baby, ShoppingBag, 
  Apple, Fish, Package, Citrus, ChefHat, Leaf, Droplets, UtensilsCrossed, Candy
} from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { Department } from "@/hooks/useDepartments";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo, useEffect, useRef } from "react";
import { EditProductDialog } from "./EditProductDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, MeasuringStrategy } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableProductRow } from "./SortableProductRow";

const DEPT_CONFIG: Record<string, { icon: any, color: string, border: string }> = {
  "ירקות": { icon: Carrot, color: "text-emerald-500", border: "border-r-emerald-500" },
  "פירות": { icon: Apple, color: "text-pink-500", border: "border-r-pink-500" },
  "מוצרי חלב ומקרר": { icon: Milk, color: "text-blue-500", border: "border-r-blue-500" },
  "קצביה": { icon: Beef, color: "text-red-500", border: "border-r-red-500" },
  "דגים": { icon: Fish, color: "text-cyan-500", border: "border-r-cyan-500" },
  "קפואים": { icon: Snowflake, color: "text-sky-400", border: "border-r-sky-400" },
  "מזווה ושימורים": { icon: Package, color: "text-orange-500", border: "border-r-orange-500" },
  "תבלינים ואפייה": { icon: UtensilsCrossed, color: "text-amber-600", border: "border-r-amber-600" },
  "מאפייה ולחם": { icon: Wheat, color: "text-yellow-500", border: "border-r-yellow-500" },
  "חטיפים ומתוקים": { icon: Candy, color: "text-purple-500", border: "border-r-purple-500" },
  "משקאות": { icon: CupSoda, color: "text-indigo-500", border: "border-r-indigo-500" },
  "פארם וטואלטיקה": { icon: Sparkles, color: "text-fuchsia-500", border: "border-r-fuchsia-500" },
  "חומרי ניקוי": { icon: Droplets, color: "text-slate-500", border: "border-r-slate-500" },
  "חד-פעמי": { icon: UtensilsCrossed, color: "text-rose-400", border: "border-r-rose-400" },
  "תינוקות": { icon: Baby, color: "text-teal-500", border: "border-r-teal-500" },
  "פיצוחים ופירות יבשים": { icon: Citrus, color: "text-orange-700", border: "border-r-orange-700" },
  "מעדניה": { icon: ChefHat, color: "text-violet-600", border: "border-r-violet-600" },
  "בריאות ואורגני": { icon: Leaf, color: "text-lime-500", border: "border-r-lime-500" },
};
const DEPT_CONFIG: Record<string, { icon: any, color: string, border: string }> = {
  // ... שאר המחלקות ...
  "כללי": { icon: ShoppingBag, color: "text-slate-400", border: "border-r-slate-400" },
};

const SYSTEM_UNITS = ["יחידות", 'ק"ג', "ליטרים", "חבילות", "מארזים", "בקבוקים", "פחיות", "גלילים", "שפופרות", "טבליות", "קפסולות", "זוגות", "גרם"];

function SortableDepartmentItem({ dept, disabled, children }: { dept: Department; disabled?: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `dept-${dept.id}`, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition: transition || 'transform 200ms ease', opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 50 : 1, position: 'relative' as const };
  return (
    <div id={`dept-wrapper-${dept.id}`} ref={setNodeRef} style={style} className="w-full flex justify-center mb-4 touch-none scroll-mt-6">
      <div className="w-full max-w-[calc(100vw-32px)] flex items-start gap-2">
        <button {...attributes} {...listeners} className="w-10 h-[64px] flex items-center justify-center bg-white border rounded-2xl text-muted-foreground shrink-0 touch-none shadow-sm"><GripVertical className="h-5 w-5 opacity-40" /></button>
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export function PantryCheckView({ productsByDepartment, departments, onUpdateStock, onUpdateProduct, onDeleteProduct, onReorderProducts, onRenameDepartment, onReorderDepartments, departmentNames, onAddDepartment }: any) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [editProduct, setEditProduct] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [manageUnitsOpen, setManageUnitsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  const isSearching = searchQuery.length > 0;
  const isDraggingDept = activeId?.startsWith("dept-");

  const baseRecurringByDept = useMemo(() => {
    return Object.entries(productsByDepartment || {}).reduce((acc, [dept, items]: any) => {
      const rec = items.filter((p: any) => !p.is_one_time);
      if (rec.length > 0) acc[dept] = rec;
      return acc;
    }, {} as any);
  }, [productsByDepartment]);

  const sortedDepts = useMemo(() => {
    return [...departments].filter(d => baseRecurringByDept[d.name]).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [departments, baseRecurringByDept]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const activeStr = String(active.id);
    const overStr = String(over.id);

    if (activeStr.startsWith("dept-")) {
      const aId = activeStr.replace("dept-", "");
      const oId = overStr.replace("dept-", "");
      const oldIdx = sortedDepts.findIndex(d => d.id === aId);
      const newIdx = sortedDepts.findIndex(d => d.id === oId);
      if (oldIdx !== -1 && newIdx !== -1) {
        const reordered = arrayMove(sortedDepts, oldIdx, newIdx);
        onReorderDepartments(reordered.map((d, i) => ({ id: d.id, sort_order: i })));
        setTimeout(() => document.getElementById(`dept-wrapper-${aId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
      }
    }
  };

  const displayDepts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return sortedDepts;
    return sortedDepts.filter(d => d.name.toLowerCase().includes(query) || baseRecurringByDept[d.name]?.some((p: any) => p.product_name.toLowerCase().includes(query)));
  }, [sortedDepts, baseRecurringByDept, searchQuery]);

  return (
    <div className={`w-full flex flex-col items-center py-4 min-h-screen bg-slate-50/50 transition-all ${isDraggingDept ? 'pb-[100vh]' : 'pb-12'}`}>
      <div className="w-full max-w-[calc(100vw-32px)] space-y-6">
        <div className="relative bg-white border border-slate-200 shadow-sm rounded-[2rem] p-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3.5 h-5 w-5 text-slate-400" />
              <Input placeholder="חיפוש במלאי..." className="w-full pr-10 py-6 rounded-xl bg-slate-50 border-slate-200 text-lg" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Button variant="outline" size="icon" className="h-[64px] w-[64px] rounded-xl border-slate-200" onClick={() => setManageUnitsOpen(true)}><Settings2 className="h-6 w-6 text-slate-500" /></Button>
          </div>
        </div>

        <DndContext sensors={useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }))} collisionDetection={closestCenter} onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd} measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}>
          <SortableContext items={displayDepts.map(d => `dept-${d.id}`)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-4">
              {displayDepts.map((dept) => {
                const config = DEPT_CONFIG[dept.name] || { icon: ShoppingBag, color: "text-slate-400", border: "border-r-slate-200" };
                return (
                  <SortableDepartmentItem key={dept.id} dept={dept} disabled={activeId !== null && !isDraggingDept}>
                    <Collapsible open={isSearching ? true : (isDraggingDept ? false : openDepts[dept.name] !== false)} onOpenChange={(o) => setOpenDepts({ ...openDepts, [dept.name]: o })} className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-r-8 ${config.border}`}>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-5 font-bold outline-none group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-slate-50"><config.icon className={`h-5 w-5 ${config.color}`} /></div>
                          <span className="text-slate-800 text-lg">{dept.name}</span>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-slate-300 transition-transform ${openDepts[dept.name] !== false || isSearching ? "rotate-180" : ""}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-3 pb-4 space-y-2 border-t border-slate-50 pt-4">
                        {(baseRecurringByDept[dept.name] || []).map((p: any) => <SortableProductRow key={p.id} product={p} onEdit={() => setEditProduct(p)} onDelete={() => setDeleteTarget(p)} onUpdateStock={onUpdateStock} />)}
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
    </div>
  );
}
