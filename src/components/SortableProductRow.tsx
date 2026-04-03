import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { isLactoseFree } from "@/hooks/useDepartments";
import { Button } from "@/components/ui/button";

interface SortableProductRowProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStock: (id: string, newStock: number) => void;
}

export function SortableProductRow({ product, onEdit, onDelete, onUpdateStock }: SortableProductRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 2 : 1,
    position: 'relative' as const,
  };

  const lactoseFree = isLactoseFree(product.product_name);
  const isOutOfStock = product.current_stock === 0;

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors ${isOutOfStock ? "bg-red-50 border-red-100" : "bg-slate-50/50 border-slate-100"}`}>
      <div className="flex items-center gap-3 flex-1 overflow-hidden">
        <div 
          className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1 touch-none"
          {...attributes} 
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex flex-col text-right flex-1 overflow-hidden">
          <span className={`text-[1.05rem] font-medium truncate ${isOutOfStock ? "text-red-700 font-bold" : ""}`}>
            {product.product_name}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-primary font-bold">
              {product.base_quantity} {product.unit || "יחידות"}
            </span>
            {lactoseFree && <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold">ללא לקטוז</span>}
            {isOutOfStock && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">חסר במלאי</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!isOutOfStock && (
          <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-red-200 text-red-600 hover:bg-red-50" onClick={() => onUpdateStock(product.id, 0)}>
            סמן כחסר
          </Button>
        )}
        <button onClick={onEdit} className="text-muted-foreground/50 p-2 hover:text-primary rounded-lg"><Pencil className="h-4 w-4" /></button>
        <button onClick={onDelete} className="text-muted-foreground/50 p-2 hover:text-red-500 rounded-lg"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
