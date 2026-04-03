import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus, Minus } from "lucide-react";
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

  const getStep = (u?: string) => {
    if (!u) return 1;
    const l = u.toLowerCase();
    if (l.includes("קילו") || l === 'ק"ג' || l.includes("ליטר")) return 0.5;
    if (l.includes("גרם") || l.includes('מ"ל')) return 100;
    return 1;
  };
  const step = getStep(product.unit);

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      onUpdateStock(product.id, Math.max(0, val));
    } else {
      // אם המשתמש מוחק הכל, נניח שזה 0 זמנית
      onUpdateStock(product.id, 0);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex flex-col gap-3 rounded-xl px-4 py-3 border transition-colors ${isOutOfStock ? "bg-red-50/50 border-red-100" : "bg-white border-slate-100 shadow-sm"}`}
    >
      {/* שורה עליונה: שם המוצר, כמות יעד וכפתורי עריכה */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div 
            className="text-slate-300 hover:text-indigo-500 cursor-grab active:cursor-grabbing p-1 touch-none"
            {...attributes} 
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-right">
            <span className={`text-[1.05rem] font-medium ${isOutOfStock ? "text-red-700" : "text-slate-800"}`}>
              {product.product_name}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500 font-medium">
                תקן: {product.base_quantity} {product.unit || "יחידות"}
              </span>
              {lactoseFree && <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold">ללא לקטוז</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="text-slate-400 p-2 hover:text-indigo-600 rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
          <button onClick={onDelete} className="text-slate-400 p-2 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      {/* שורה תחתונה: שליטה במלאי הקיים */}
      <div className="flex items-center justify-between pr-8">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg h-9 overflow-hidden">
          <button 
            onClick={() => onUpdateStock(product.id, Math.max(0, stock - step))}
            className="px-2.5 h-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input 
            type="number" 
            value={stock} 
            onChange={handleStockChange}
            className="w-12 text-center font-bold text-sm bg-transparent border-none p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button 
            onClick={() => onUpdateStock(product.id, stock + step)}
            className="px-2.5 h-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {!isOutOfStock ? (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 text-xs font-bold text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors" 
            onClick={() => onUpdateStock(product.id, 0)}
          >
            סמן כחסר
          </Button>
        ) : (
          <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1.5 rounded-md">
            חסר במלאי
          </span>
        )}
      </div>
    </div>
  );
}
