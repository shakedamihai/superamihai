import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Minus, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface SortableProductRowProps {
  product: Product;
  onUpdateStock: (id: string, stock: number) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

export function SortableProductRow({ product: p, onUpdateStock, onEdit, onDelete }: SortableProductRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const toBuy = Math.max(0, p.base_quantity - p.current_stock);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between bg-card rounded-lg px-2 py-3 border border-border"
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0 mr-1">
        <div className="font-medium truncate text-sm">{p.product_name}</div>
        <div className="text-xs text-muted-foreground">
          בסיס: {p.base_quantity} | חסר:{" "}
          <span className={toBuy > 0 ? "text-secondary font-bold" : "text-primary"}>
            {toBuy}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-0.5 mr-1">
        <button
          onClick={() => onEdit(p)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(p)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-6 bg-border mx-0.5" />
        <button
          onClick={() => onUpdateStock(p.id, Math.max(0, p.current_stock - 1))}
          className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-destructive/20 hover:text-destructive transition-colors active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center font-bold text-lg tabular-nums">
          {p.current_stock}
        </span>
        <button
          onClick={() => onUpdateStock(p.id, p.current_stock + 1)}
          className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-primary/20 hover:text-primary transition-colors active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
