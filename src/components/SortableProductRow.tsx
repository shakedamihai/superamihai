import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus, Minus, MoreHorizontal, RotateCcw } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { isLactoseFree } from "@/hooks/useDepartments";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SortableProductRowProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStock: (id: string, newStock: number) => void;
}

export function SortableProductRow({ product, onEdit, onDelete, onUpdateStock }: SortableProductRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });

  const [localStock, setLocalStock] = useState(product.current_stock ?? 0);

  useEffect(() => {
    setLocalStock(product.current_stock ?? 0);
  }, [product.current_stock]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 2 : 1,
    position: 'relative' as const,
  };

  const displayUnit = (u?: string) => {
    if (!u || u.trim() === "") return "יחידות";
    const lowerUnit = u.toLowerCase();
    if (lowerUnit.includes("קילו") || lowerUnit === 'ק"ג') return 'ק"ג';
    return u;
  };

  const formattedUnit = displayUnit(product.unit);
  const lactoseFree = isLactoseFree(product.product_name);
  const isOutOfStock = localStock === 0;

  const getStep = (u?: string) => {
    if (!u) return 1;
    const l = u.toLowerCase();
    if (l.includes("קילו") || l === 'ק"ג' || l.includes("ליטר")) return 0.5;
    if (l.includes("גרם") || l.includes('מ"ל')) return 100;
    return 1;
  };
  const step = getStep(product.unit);

  const handleStockChange = (newVal: number) => {
    const validVal = Math.max(0, newVal);
    setLocalStock(validVal);
    onUpdateStock(product.id, validVal);
  };

  const getStockBadge = () => {
    if (localStock === 0) {
      return <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">חסר</span>;
    }
    if (localStock >= (product.base_quantity || 1)) {
      return <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">במלאי</span>;
    }
    return (
      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
        {localStock}/{product.base_quantity} {formattedUnit}
      </span>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-xl px-2 py-3 border transition-all ${
        isOutOfStock ? "bg-red-50/40 border-red-100" : "bg-white border-slate-100 shadow-sm"
      }`}
    >
      {/* צד ימין: גרירה, שם ותגים */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
        <div
          className="text-slate-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing p-1 touch-none shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="flex flex-col text-right min-w-0">
          <span className={`text-sm font-bold truncate ${isOutOfStock ? "text-red-700" : "text-slate-800"}`}>
            {product.product_name}
          </span>
          <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
            {getStockBadge()}
            {lactoseFree && <span className="text-[9px] bg-sky-50 text-sky-700 px-1 rounded font-bold border border-sky-100 shrink-0">ללא לקטוז</span>}
          </div>
        </div>
      </div>

      {/* צד שמאל: פקדים ו-3 נקודות */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1">
        
        {/* פלוס מינוס קומפקטי */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg h-8 overflow-hidden">
          <button 
            onClick={() => handleStockChange(localStock - step)}
            className="px-1.5 h-full text-slate-400 hover:bg-slate-200"
          >
            <Minus className="h-3 w-3" />
          </button>
          <input 
            type="number" 
            value={localStock} 
            onChange={(e) => handleStockChange(parseFloat(e.target.value) || 0)}
            className="w-8 text-center font-bold text-xs bg-transparent border-none p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button 
            onClick={() => handleStockChange(localStock + step)}
            className="px-1.5 h-full text-slate-400 hover:bg-slate-200"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* תפריט 3 נקודות עם כל ההסברים */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 font-sans">
            <DropdownMenuLabel className="text-right text-xs text-slate-500">אפשרויות מוצר</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => handleStockChange(0)} className="flex flex-col items-end gap-0.5 cursor-pointer">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <span>סמן כחסר</span>
                <RotateCcw className="h-4 w-4" />
              </div>
              <span className="text-[10px] text-slate-400 text-right leading-tight">
                מאפס את המלאי ומוסיף את המוצר לרשימת הקניות
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onEdit} className="flex items-center justify-end gap-2 cursor-pointer font-medium">
              <span>עריכת המוצר</span>
              <Pencil className="h-4 w-4 text-slate-500" />
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onDelete} className="flex items-center justify-end gap-2 cursor-pointer text-red-600 font-medium">
              <span>מחיקת המוצר</span>
              <Trash2 className="h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
  );
}
