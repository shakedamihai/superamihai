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
  const stock = product.current_stock ?? 0;
  const isOutOfStock = stock === 0;

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onUpdateStock(product.id, Math.max(0, val));
    } else {
      onUpdateStock(product.id, 0); // אם המשתמש מוחק את המספר
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-colors ${isOutOfStock ? "bg-red-50 border-red-100" : "bg-white border-slate-100 shadow-sm"}`}
    >
      {/* צד ימין: ידית גרירה ופרטי המוצר */}
      <div className="flex items-center gap-3 flex-1 overflow-hidden">
        <div
          className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1 touch-none shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex flex-col text-right flex-1 overflow-hidden">
          <span className={`text-[1.05rem] font-medium truncate ${isOutOfStock ? "text-red-700 font-bold" : "text-slate-800"}`}>
            {product.product_name}
          </span>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
              תקן: {product.base_quantity} {product.unit || "יחידות"}
            </span>
            {lactoseFree && <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold shrink-0">ללא לקטוז</span>}
            {isOutOfStock && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold shrink-0">חסר במלאי</span>}
          </div>
        </div>
      </div>

      {/* צד שמאל: כפתורים והזנת מלאי */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1">
        
        {/* שדה הזנת מלאי */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg h-8 px-1" title="כמות נוכחית במזווה">
          <input
            type="number"
            value={stock}
            onChange={handleStockChange}
            className="w-10 text-center font-bold text-sm bg-transparent border-none p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        {/* כפתור "סמן כחסר" בצבע אפור/ניטרלי למניעת בלבול */}
        {!isOutOfStock && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 text-[11px] font-bold border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            onClick={() => onUpdateStock(product.id, 0)}
          >
            סמן כחסר
          </Button>
        )}

        <button onClick={onEdit} className="text-slate-400 p-1.5 hover:text-indigo-600 rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
        <button onClick={onDelete} className="text-slate-400 p-1.5 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
