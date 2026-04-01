import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Minus, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { isLactoseFree } from "@/hooks/useDepartments";

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

  const unit = p.unit || "יחידות";
  const step = unit === "קילו" ? 0.5 : unit === "גרם" ? 100 : 1;
  const toBuy = Math.max(0, p.base_quantity - p.current_stock);
  const lactoseFree = isLactoseFree(p.product_name);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center w-full max-w-full bg-card rounded-lg px-1.5 py-2 border overflow-hidden ${
        lactoseFree ? "border-sky-400 bg-sky-50/50 dark:bg-sky-950/20" : "border-border"
      }`}
    >
      {/* ידית גרירה - צמצמנו רוחב */}
      <button
        {...attributes}
        {...listeners}
        className="touch-none w-6 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* טקסט המוצר - הוספנו flex-1 ו-min-w-0 כדי שיצטמצם כשצריך */}
      <div className="flex-1 min-w-0 mx-1 flex flex-col justify-center">
        <div className="font-medium truncate text-xs sm:text-sm flex items-center gap-1">
          <span className="truncate">{p.product_name}</span>
          {lactoseFree && (
            <span className="text-[8px] bg-sky-100 text-sky-700 px-1 py-0.5 rounded font-bold shrink-0">
              ללא לקטוז
            </span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground truncate">
          {p.base_quantity} {unit} | חסר: <span className={toBuy > 0 ? "text-secondary font-bold" : "text-primary"}>{toBuy}</span>
        </div>
      </div>

      {/* כפתורי פעולה - הפכנו אותם ליותר קטנים וצפופים */}
      <div className="flex items-center gap-0.5 shrink-0 ml-auto">
        <button
          onClick={() => onEdit(p)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-primary/10 transition-colors"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete(p)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
        
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* בקרת כמות - צמצמנו רוחב של המספר והכפתורים */}
        <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
          <button
            onClick={() => onUpdateStock(p.id, Math.max(0, p.current_stock - step))}
            className="w-7 h-7 rounded-md bg-background flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-7 text-center font-bold text-sm tabular-nums">
            {p.current_stock}
          </span>
          <button
            onClick={() => onUpdateStock(p.id, p.current_stock + step)}
            className="w-7 h-7 rounded-md bg-background flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
