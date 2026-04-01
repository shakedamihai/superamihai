import { ChevronDown, Pencil, GripVertical } from "lucide-react";
import { Product, getDepartmentColor } from "@/hooks/useProducts";
import { Department } from "@/hooks/useDepartments";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
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

function SortableDepartmentItem({
  dept,
  isCollapsedDuringDrag,
  children,
}: {
  dept: Department;
  isCollapsedDuringDrag: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: dept.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 100 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full flex justify-center mb-4">
      <div className={`w-full max-w-[calc(100vw-32px)] flex items-start gap-2 ${isDragging ? 'shadow-2xl' : ''}`}>
        <button
          {...attributes}
          {...listeners}
          className="w-10 h-12 flex items-center justify-center bg-muted rounded-lg text-muted-foreground shrink-0"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="h-6 w-6" />
        </button>
        <div className="flex-1 overflow-hidden">
          {/* אם אנחנו גוררים, נציג רק את הכותרת בלי התוכן (הילדים) */}
          {isDragging ? (
            <div className={`px-4 py-3 rounded-lg border font-bold shadow-sm ${getDepartmentColor(dept.name)}`}>
              {dept.name} (בגרירה...)
            </div>
          ) : (
            children
          )}
        </div>
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
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [renameDept, setRenameDept] = useState<{ oldName: string; newName: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 10 } })
  );

  const recurringByDept = Object.entries(productsByDepartment || {}).reduce(
    (acc, [dept, items]) => {
      const recurring = (items || []).filter((p) => !p.is_one_time);
      if (recurring.length > 0) acc[dept] = recurring;
      return acc;
    },
    {} as Record<string, Product[]>
  );

  const orderedDepts = [...(departments || [])]
    .filter((d) => recurringByDept[d.name])
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const handleDeptDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedDepts.findIndex((d) => d.id === active.id);
    const newIndex = orderedDepts.findIndex((d) => d.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(orderedDepts, oldIndex, newIndex);
      onReorderDepartments(reordered.map((d, i) => ({ id: d.id, sort_order: i })));
    }
  };

  const handleProductDragEnd = (dept: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const items = recurringByDept[dept];
    if (!items) return;
    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(items, oldIndex, newIndex);
      onReorderProducts(reordered.map((p, i) => ({ id: p.id, sort_order: i })));
    }
  };

  return (
    <div className="w-full flex flex-col items-center py-4 min-h-screen">
      <div className="w-full max-w-[calc(100vw-32px)] space-y-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDeptDragEnd}>
          <SortableContext items={orderedDepts.map(d => d.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col">
              {orderedDepts.map((dept) => (
                <SortableDepartmentItem key={dept.id} dept={dept} isCollapsedDuringDrag={true}>
                  <Collapsible 
                    open={openDepts[dept.name] !== false} 
                    onOpenChange={(open) => setOpenDepts(prev => ({ ...prev, [dept.name]: open }))}
                  >
                    <div className="flex items-center gap-2">
                      <CollapsibleTrigger className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg border font-bold ${getDepartmentColor(dept.name)}`}>
                        <span>{dept.name} ({recurringByDept[dept.name]?.length || 0})</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${openDepts[dept.name] !== false ? "rotate-180" : ""}`} />
                      </CollapsibleTrigger>
                      <button onClick={(e) => { e.stopPropagation(); setRenameDept({ oldName: dept.name, newName: dept.name }); }} className="p-3 border rounded-lg bg-card shadow-sm shrink-0">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                    <CollapsibleContent className="mt-2 space-y-2 pb-4">
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProductDragEnd(dept.name)}>
                        <SortableContext items={recurringByDept[dept.name]?.map(p => p.id) || []} strategy={verticalListSortingStrategy}>
                          <div className="flex flex-col gap-2">
                            {recurringByDept[dept.name]?.map((p) => (
                              <SortableProductRow key={p.id} product={p} onUpdateStock={onUpdateStock} onEdit={setEditProduct} onDelete={setDeleteTarget} />
                            ))}
                          </div>
