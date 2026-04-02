import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isLactoseFree } from "@/hooks/useDepartments";

interface SortableProductRowProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStock: (id: string, stock: number) => void;
}

export function SortableProductRow({
  product,
  onEdit,
  onDelete,
  onUpdateStock,
}: SortableProductRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lactoseFree = isLactoseFree(product.product_name);

  // לוגיקת עיבוד היחידות למלאי
  let baseUnitDisplay = product.unit?.includes("קילו") ? "ק\"ג" : (product.unit || "יחידות");
  if (product.base_quantity === 1 && (baseUnitDisplay === "יחידות" || !product.unit)) {
    baseUnitDisplay = "יחידה";
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-card border rounded-xl shadow-sm group ${
        lactoseFree ? "border-sky-100 bg-sky-50/20" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-muted-foreground/40 hover:text-muted-foreground shrink-0 touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex flex-col text-right">
          <span className="font-bold text-foreground">
            {product.product_name}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              מלאי: {product.current_stock} / {product.base_quantity} {baseUnitDisplay}
            </span>
            {lactoseFree && (
              <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold">
                ללא לקטוז
              </span>
            )}
            {product.is_one_time && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                מוצר חד-פעמי
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="p-2 text-muted-foreground/40 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
