import { 
  ChevronDown, Pencil, GripVertical, Search, X, Trash2, Settings2, Lock,
  Beef, Carrot, Milk, Snowflake, Sparkles, 
  Wheat, CupSoda, Baby, ShoppingBag, Apple, Fish, Package, ChefHat, Leaf, Droplets, UtensilsCrossed, Candy,
  CookingPot, Grape 
} from "lucide-react";import { 
  Plus, Search, ChevronDown, Edit2, Trash2, Package, 
  Beef, Carrot, Milk, Snowflake, Sparkles, Wheat, CupSoda, Baby, ShoppingBag, 
  Apple, Fish, ChefHat, Leaf, Droplets, UtensilsCrossed, Candy,
  CookingPot, Grape, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/hooks/useProducts";
import { useDepartments } from "@/hooks/useDepartments";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";

const DEPT_CONFIG: Record<string, { icon: any, color: string, border: string, bg: string }> = {
  "ירקות": { icon: Carrot, color: "text-emerald-500", border: "border-r-emerald-500", bg: "bg-emerald-50" },
  "פירות": { icon: Apple, color: "text-pink-500", border: "border-r-pink-500", bg: "bg-pink-50" },
  "מוצרי חלב ומקרר": { icon: Milk, color: "text-blue-500", border: "border-r-blue-500", bg: "bg-blue-50" },
  "קצביה": { icon: Beef, color: "text-red-500", border: "border-r-red-500", bg: "bg-red-50" },
  "דגים": { icon: Fish, color: "text-cyan-500", border: "border-r-cyan-500", bg: "bg-cyan-50" },
  "קפואים": { icon: Snowflake, color: "text-indigo-600", border: "border-r-indigo-600", bg: "bg-indigo-50" },
  "מזווה ושימורים": { icon: Package, color: "text-orange-500", border: "border-r-orange-500", bg: "bg-orange-50" },
  "תבלינים ואפייה": { icon: CookingPot, color: "text-stone-600", border: "border-r-stone-600", bg: "bg-stone-50" },
  "מאפייה ולחם": { icon: Wheat, color: "text-yellow-500", border: "border-r-yellow-500", bg: "bg-yellow-50" },
  "חטיפים ומתוקים": { icon: Candy, color: "text-purple-500", border: "border-r-purple-500", bg: "bg-purple-50" },
  "משקאות": { icon: CupSoda, color: "text-indigo-500", border: "border-r-indigo-500", bg: "bg-indigo-50" },
  "פארם וטואלטיקה": { icon: Sparkles, color: "text-fuchsia-500", border: "border-r-fuchsia-500", bg: "bg-fuchsia-50" },
  "חומרי ניקוי": { icon: Droplets, color: "text-slate-500", border: "border-r-slate-500", bg: "bg-slate-50" },
  "חד-פעמי": { icon: UtensilsCrossed, color: "text-rose-400", border: "border-r-rose-400", bg: "bg-rose-50" },
  "תינוקות": { icon: Baby, color: "text-teal-500", border: "border-r-teal-500", bg: "bg-teal-50" },
  "פיצוחים ופירות יבשים": { icon: Grape, color: "text-amber-700", border: "border-r-amber-700", bg: "bg-amber-50" },
  "מעדניה": { icon: ChefHat, color: "text-violet-600", border: "border-r-violet-600", bg: "bg-violet-50" },
  "בריאות ואורגני": { icon: Leaf, color: "text-lime-500", border: "border-r-lime-500", bg: "bg-lime-50" },
  "כללי": { icon: ShoppingBag, color: "text-slate-400", border: "border-r-slate-400", bg: "bg-slate-50" },
};

interface PantryCheckViewProps {
  productsByDepartment: Record<string, Product[]>;
  onUpdateStock: (id: string, newStock: number) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddProduct: () => void;
}

export function PantryCheckView({
  productsByDepartment,
  onUpdateStock,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
}: PantryCheckViewProps) {
  const { departments } = useDepartments();
  const [searchQuery, setSearchQuery] = useState("");
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>(() => 
    Object.keys(productsByDepartment).reduce((acc, dept) => ({ ...acc, [dept]: true }), {})
  );

  const filteredDepts = useMemo(() => {
    const sortedDepts = Object.keys(productsByDepartment).sort((a, b) => {
      const deptA = departments.find(d => d.name === a);
      const deptB = departments.find(d => d.name === b);
      return (deptA?.sort_order ?? 999) - (deptB?.sort_order ?? 999);
    });

    if (!searchQuery) return sortedDepts;
    
    const lowerQuery = searchQuery.toLowerCase();
    return sortedDepts.filter(dept => 
      dept.toLowerCase().includes(lowerQuery) ||
      productsByDepartment[dept].some(p => p.product_name.toLowerCase().includes(lowerQuery))
    );
  }, [productsByDepartment, searchQuery, departments]);

  return (
    <div className="space-y-6 pb-24 bg-slate-50 min-h-screen pt-4 px-2 font-sans">
      <div className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-6">
        <div className="flex flex-col gap-4">
          <div className="relative w-full">
            <Search className="absolute right-4 top-3.5 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="חיפוש מוצר או מחלקה..." 
              className="w-full pl-10 pr-12 py-6 rounded-xl bg-slate-50 border-slate-200 text-lg focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={onAddProduct}
            className="w-full gap-2 rounded-xl h-14 text-lg font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="h-6 w-6" />
            הוספת מוצר חדש
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredDepts.map((deptName) => {
          const config = DEPT_CONFIG[deptName] || DEPT_CONFIG["כללי"];
          const Icon = config.icon;
          const products = productsByDepartment[deptName];
          const isOpen = openDepts[deptName] !== false;

          return (
            <Collapsible
              key={deptName}
              open={isOpen}
              onOpenChange={(open) => setOpenDepts(prev => ({ ...prev, [deptName]: open }))}
              className={`bg-white rounded-2xl shadow-sm border border-slate-200 border-r-8 ${config.border} overflow-hidden`}
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between px-5 py-5 font-bold outline-none hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-lg text-slate-800">{deptName}</span>
                    <span className="text-xs text-slate-400 font-normal">{products.length} מוצרים</span>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-300 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="border-t border-slate-100">
                  {products.map((product) => (
                    <div 
                      key={product.id} 
                      className="flex items-center justify-between px-5 py-4 border-b border-slate-200 last:border-0 hover:bg-slate-50/30 transition-colors"
                    >
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-base">{product.product_name}</span>
                          {product.is_one_time && (
                            <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-600 border-orange-100 py-0 px-1.5 h-4">חד-פעמי</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className="text-slate-500">במלאי:</span>
                          <span className={`font-black ${product.current_stock < product.base_quantity ? 'text-red-500' : 'text-emerald-600'}`}>
                            {product.current_stock} / {product.base_quantity}
                          </span>
                          <span className="text-slate-400 text-xs">{product.unit || 'יח\''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm text-slate-600"
                            onClick={() => onUpdateStock(product.id, Math.max(0, product.current_stock - 1))}
                          >
                            <span className="text-xl font-bold">-</span>
                          </Button>
                          <div className="w-10 text-center font-black text-slate-800 text-lg">
                            {product.current_stock}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm text-slate-600"
                            onClick={() => onUpdateStock(product.id, product.current_stock + 1)}
                          >
                            <span className="text-xl font-bold">+</span>
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-full"
                          onClick={() => onEditProduct(product)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
      
      {filteredDepts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 italic">
          <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
          <p>לא נמצאו מוצרים תואמים לחיפוש...</p>
        </div>
      )}
    </div>
  );
}
import { Product } from "@/hooks/useProducts";
import { Department } from "@/hooks/useDepartments";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo, useEffect, useRef } from "react";
import { EditProductDialog } from "./EditProductDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, 
  DragEndEvent, DragStartEvent, MeasuringStrategy, DragOverlay, defaultDropAnimationSideEffects,
  CollisionDetection
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableProductRow } from "./SortableProductRow";
import { isLactoseFree } from "@/hooks/useDepartments";

const DEPT_CONFIG: Record<string, { icon: any, color: string, border: string }> = {
  "ירקות": { icon: Carrot, color: "text-emerald-500", border: "border-r-emerald-500" },
  "פירות": { icon: Apple, color: "text-pink-500", border: "border-r-pink-500" },
  "מוצרי חלב ומקרר": { icon: Milk, color: "text-blue-500", border: "border-r-blue-500" },
  "קצביה": { icon: Beef, color: "text-red-500", border: "border-r-red-500" },
  "דגים": { icon: Fish, color: "text-cyan-500", border: "border-r-cyan-500" },
  "קפואים": { icon: Snowflake, color: "text-indigo-600", border: "border-r-indigo-600" },
  "מזווה ושימורים": { icon: Package, color: "text-orange-500", border: "border-r-orange-500" },
  "תבלינים ואפייה": { icon: CookingPot, color: "text-stone-600", border: "border-r-stone-600" },
  "מאפייה ולחם": { icon: Wheat, color: "text-yellow-500", border: "border-r-yellow-500" },
  "חטיפים ומתוקים": { icon: Candy, color: "text-purple-500", border: "border-r-purple-500" },
  "משקאות": { icon: CupSoda, color: "text-indigo-500", border: "border-r-indigo-500" },
  "פארם וטואלטיקה": { icon: Sparkles, color: "text-fuchsia-500", border: "border-r-fuchsia-500" },
  "חומרי ניקוי": { icon: Droplets, color: "text-slate-500", border: "border-r-slate-500" },
  "חד-פעמי": { icon: UtensilsCrossed, color: "text-rose-400", border: "border-r-rose-400" },
  "תינוקות": { icon: Baby, color: "text-teal-500", border: "border-r-teal-500" },
  "פיצוחים ופירות יבשים": { icon: Grape, color: "text-amber-700", border: "border-r-amber-700" },
  "מעדניה": { icon: ChefHat, color: "text-violet-600", border: "border-r-violet-600" },
  "בריאות ואורגני": { icon: Leaf, color: "text-lime-500", border: "border-r-lime-500" },
  "כללי": { icon: ShoppingBag, color: "text-slate-400", border: "border-r-slate-400" },
};

const SYSTEM_UNITS = ["יחידות", 'ק"ג', "ליטרים", "חבילות", "מארזים", "בקבוקים", "פחיות", "גלילים", "שפופרות", "טבליות", "קפסולות", "זוגות", "גרם"];

interface PantryCheckViewProps {
  productsByDepartment: Record<string, Product[]>;
  departments: Department[];
  onUpdateStock: (id: string, stock: number) => void;
  onUpdateProduct: (updates: { id: string; product_name?: string; department?: string; base_quantity?: number; unit?: string }) => void;
  onDeleteProduct: (id: string) => void;
  onReorderProducts: (updates: { id: string; sort_order: number }[]) => void;
  onRenameDepartment?: (oldName: string, newName: string) => void;
  onReorderDepartments: (updates: { id: string; sort_order: number }[]) => void;
  departmentNames: string[];
  onAddDepartment: (name: string) => void;
}

const customCollisionDetection: CollisionDetection = (args) => {
  if (args.active.id.toString().startsWith("dept-")) {
    const deptDroppables = args.droppableContainers.filter(d => String(d.id).startsWith("dept-"));
    return closestCenter({ ...args, droppableContainers: deptDroppables });
  }
  const itemDroppables = args.droppableContainers.filter(d => !String(d.id).startsWith("dept-"));
  return closestCenter({ ...args, droppableContainers: itemDroppables });
};

function SortableDepartmentItem({ 
  id, 
  disabled, 
  onPrepareDrag, 
  renderCard 
}: { 
  id: string; 
  disabled?: boolean; 
  onPrepareDrag: () => void; 
  renderCard: (dragHandle: React.ReactNode) => React.ReactNode 
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, zIndex: isDragging ? 0 : 1, position: 'relative' as const };
  
  const dragHandle = (
    <div 
      onPointerDown={onPrepareDrag} 
      onTouchStart={onPrepareDrag}
      className="touch-none p-2 text-slate-300 hover:text-slate-500 active:text-slate-500 cursor-grab active:cursor-grabbing transition-colors"
      {...attributes} 
      {...listeners} 
    >
      <GripVertical className="h-5 w-5" />
    </div>
  );

  return (
    <div id={`${id}-wrapper`} ref={setNodeRef} style={style} className="w-full flex justify-center scroll-mt-6">
      <div className="w-full max-w-[calc(100vw-20px)] md:max-w-[calc(100vw-32px)]">
        {renderCard(dragHandle)}
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
  onReorderDepartments, 
  departmentNames, 
  onAddDepartment 
}: PantryCheckViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [manageUnitsOpen, setManageUnitsOpen] = useState(false);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPreparingDrag, setIsPreparingDrag] = useState(false);
  
  const pendingReorderRef = useRef(false);

  const isSearching = searchQuery.length > 0;
  const isDraggingDept = activeId?.startsWith("dept-");
  const forceCollapse = isPreparingDrag || isDraggingDept;

  useEffect(() => {
    const handlePointerUp = () => setIsPreparingDrag(false);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("touchend", handlePointerUp);
    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, []);

  const allUsedUnits = useMemo(() => {
    const units = new Set<string>(SYSTEM_UNITS);
    Object.values(productsByDepartment || {}).flat().forEach((p) => { if (p.unit) units.add(p.unit); });
    return Array.from(units).sort((a, b) => (SYSTEM_UNITS.includes(a) ? -1 : 1));
  }, [productsByDepartment]);

  const baseRecurringByDept = useMemo(() => {
    return Object.entries(productsByDepartment || {}).reduce((acc, [dept, items]) => {
      const rec = items.filter((p) => !p.is_one_time);
      if (rec.length > 0) acc[dept] = rec;
      return acc;
    }, {} as Record<string, Product[]>);
  }, [productsByDepartment]);

  const sortedDepts = useMemo(() => {
    return [...(departments || [])].filter(d => baseRecurringByDept[d.name]).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [departments, baseRecurringByDept]);

  const [localDepts, setLocalDepts] = useState<Department[]>(sortedDepts);
  const [localRecurring, setLocalRecurring] = useState<Record<string, Product[]>>(baseRecurringByDept);

  useEffect(() => { 
    if (!isDraggingDept && !isPreparingDrag && !pendingReorderRef.current) {
      setLocalDepts(sortedDepts);
      setLocalRecurring(baseRecurringByDept);
    }
  }, [sortedDepts, baseRecurringByDept, isDraggingDept, isPreparingDrag]);

  const handleUpdateUnit = (oldUnit: string, newUnit: string) => {
    if (SYSTEM_UNITS.includes(oldUnit)) return;
    Object.values(productsByDepartment || {}).flat().filter(p => p.unit === oldUnit).forEach(p => {
      onUpdateProduct({ id: p.id, unit: newUnit });
    });
  };

  const handleDeleteUnit = (unitToDelete: string) => {
    if (SYSTEM_UNITS.includes(unitToDelete)) return;
    Object.values(productsByDepartment || {}).flat().filter(p => p.unit === unitToDelete).forEach(p => {
      onUpdateProduct({ id: p.id, unit: "יחידות" });
    });
  };

  const activeDept = isDraggingDept ? localDepts.find(d => `dept-${d.id}` === activeId) : null;
  const activeDeptConfig = activeDept ? (DEPT_CONFIG[activeDept.name] || DEPT_CONFIG["כללי"]) : null;
  const ActiveDeptIcon = activeDeptConfig?.icon || ShoppingBag;
  const activeItemsCount = activeDept ? (localRecurring[activeDept.name]?.length || 0) : 0;

  const activeProduct = useMemo(() => {
    if (!activeId || isDraggingDept) return null;
    for (const items of Object.values(localRecurring)) {
      const found = items.find(p => p.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, isDraggingDept, localRecurring]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), 
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 10 } })
  );

  const handleDragStart = (event: DragStartEvent) => { setActiveId(event.active.id as string); };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setIsPreparingDrag(false);
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const activeStr = String(active.id);
    const overStr = String(over.id);

    if (activeStr.startsWith("dept-") && overStr.startsWith("dept-")) {
      const aId = activeStr.replace("dept-", "");
      const oId = overStr.replace("dept-", "");
      const oldIdx = localDepts.findIndex(d => d.id === aId);
      const newIdx = localDepts.findIndex(d => d.id === oId);
      
      if (oldIdx !== -1 && newIdx !== -1) {
        const reordered = arrayMove(localDepts, oldIdx, newIdx);
        setLocalDepts(reordered);
        
        pendingReorderRef.current = true;
        setTimeout(() => { pendingReorderRef.current = false; }, 2000);
        
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
        
        pendingReorderRef.current = true;
        setTimeout(() => { pendingReorderRef.current = false; }, 2000);

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

  return (
    <div className="w-full flex flex-col items-center py-4 min-h-[150vh] bg-slate-50/50 font-sans pb-12">
      <div className="w-full max-w-[calc(100vw-20px)] md:max-w-[calc(100vw-32px)] space-y-6">
        <div className="relative bg-white border border-slate-200 shadow-sm rounded-[2rem] p-6 font-sans">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3.5 h-5 w-5 text-slate-400" />
              <Input placeholder="חיפוש במלאי..." className="w-full pr-10 py-6 rounded-xl bg-slate-50 border-slate-200 text-lg" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {isSearching && <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><X className="h-5 w-5" /></button>}
            </div>
            <Button variant="outline" size="icon" className="h-[60px] w-[60px] rounded-xl border-slate-200" onClick={() => setManageUnitsOpen(true)}><Settings2 className="h-6 w-6 text-slate-500" /></Button>
          </div>
        </div>

        <DndContext 
          sensors={sensors} 
          collisionDetection={customCollisionDetection} 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd} 
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        >
          <div className="flex flex-col gap-4 w-full">
            <SortableContext items={displayDepts.map(d => `dept-${d.id}`)} strategy={verticalListSortingStrategy}>
              {displayDepts.map((dept) => {
                const config = DEPT_CONFIG[dept.name] || DEPT_CONFIG["כללי"];
                const items = localRecurring[dept.name] || [];
                const displayItems = searchQuery && !dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ? items.filter((p) => p.product_name?.toLowerCase().includes(searchQuery.toLowerCase())) : items;
                const isOpen = isSearching ? true : (forceCollapse ? false : openDepts[dept.name] !== false);

                return (
                  <SortableDepartmentItem 
                    key={dept.id} 
                    id={`dept-${dept.id}`}
                    disabled={activeId !== null && !activeId.startsWith("dept-")}
                    onPrepareDrag={() => setIsPreparingDrag(true)}
                    renderCard={(dragHandle) => (
                      <Collapsible 
                        open={isOpen} 
                        onOpenChange={(o) => setOpenDepts({ ...openDepts, [dept.name]: o })} 
                        className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-r-8 ${config.border}`}
                      >
                        <div className="w-full flex items-center justify-between pl-2 pr-1 py-3 outline-none">
                          <div className="flex items-center gap-1 flex-1 overflow-hidden">
                            {dragHandle}
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center gap-2 cursor-pointer flex-1 py-1 overflow-hidden">
                                <div className="p-2 rounded-lg bg-slate-50 shrink-0">
                                  <config.icon className={`h-5 w-5 ${config.color}`} />
                                </div>
                                <span className="text-lg text-slate-800 font-bold truncate">{dept.name}</span>
                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-black shrink-0">
                                  {displayItems.length}
                                </span>
                              </div>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleTrigger asChild>
                            <button className="p-3 text-slate-300 shrink-0 outline-none">
                              <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="px-3 pb-3">
                          <div className="flex flex-col gap-2 border-t border-slate-50 pt-3">
                            <SortableContext items={displayItems.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                              {displayItems.map((p) => (
                                <SortableProductRow key={p.id} product={p} onEdit={() => setEditProduct(p)} onDelete={() => setDeleteTarget(p)} onUpdateStock={onUpdateStock} />
                              ))}
                            </SortableContext>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  />
                );
              })}
            </SortableContext>
          </div>

          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }) }}>
            {activeDept && activeDeptConfig ? (
              <div className="w-full flex justify-center opacity-100 drop-shadow-2xl">
                <div className="w-full max-w-[calc(100vw-20px)] md:max-w-[calc(100vw-32px)]">
                  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-r-8 ${activeDeptConfig.border}`}>
                    <div className="w-full flex items-center justify-between pl-2 pr-1 py-3">
                      <div className="flex items-center gap-1 flex-1 overflow-hidden">
                        <div className="p-2 text-slate-300 cursor-grabbing"><GripVertical className="h-5 w-5" /></div>
                        <div className="flex items-center gap-2 flex-1 overflow-hidden py-1">
                          <div className="p-2 rounded-lg bg-slate-50 shrink-0">
                            <ActiveDeptIcon className={`h-5 w-5 ${activeDeptConfig.color}`} />
                          </div>
                          <span className="text-lg text-slate-800 font-bold truncate">{activeDept.name}</span>
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-black shrink-0">
                            {activeItemsCount}
                          </span>
                        </div>
                      </div>
                      <div className="p-3 text-slate-300 shrink-0">
                        <ChevronDown className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeProduct ? (
              <div className="opacity-100 drop-shadow-xl scale-[1.02]">
                <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${activeProduct.current_stock === 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-indigo-500 cursor-grabbing p-1"><GripVertical className="h-5 w-5" /></div>
                    <div className="flex flex-col text-right justify-center">
                      <span className="text-[1.05rem] font-bold text-slate-800">{activeProduct.product_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <Dialog open={manageUnitsOpen} onOpenChange={setManageUnitsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[400px] rounded-[2rem] p-6 font-sans">
          <DialogHeader><DialogTitle className="text-right text-xl font-black">ניהול יחידות מידה</DialogTitle></DialogHeader>
          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {allUsedUnits.map((unit) => (
              <UnitRow key={unit} unit={unit} isSystem={SYSTEM_UNITS.includes(unit)} onRename={handleUpdateUnit} onDelete={() => handleDeleteUnit(unit)} />
            ))}
          </div>
          <DialogFooter><Button className="w-full rounded-xl py-6 font-bold bg-indigo-600 text-white" onClick={() => setManageUnitsOpen(false)}>סיום</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <EditProductDialog product={editProduct} open={!!editProduct} onClose={() => setEditProduct(null)} onSave={onUpdateProduct} departmentNames={departmentNames} onAddDepartment={onAddDepartment} />
      
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl p-6 font-sans">
          <AlertDialogHeader><AlertDialogTitle className="text-right text-xl">למחוק את המוצר?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-3 mt-4">
            <AlertDialogAction 
              className="rounded-xl px-6 py-5 bg-red-500 hover:bg-red-600 text-white font-bold" 
              onClick={() => { 
                if (deleteTarget) {
                  // עדכון אופטימי - מוחק את הפריט מהמסך מיידית עוד לפני שהשרת מאשר
                  setLocalRecurring(prev => {
                    const newState = { ...prev };
                    for (const dept in newState) {
                      newState[dept] = newState[dept].filter(p => p.id !== deleteTarget.id);
                    }
                    return newState;
                  });
                  onDeleteProduct(deleteTarget.id); 
                }
                setDeleteTarget(null); 
              }}
            >
              מחק מוצר
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-xl px-6 py-5 font-medium border border-slate-200">ביטול</AlertDialogCancel>
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
