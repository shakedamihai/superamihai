import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus, Minus, Info } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { isLactoseFree } from "@/hooks/useDepartments";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      return <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold shrink-0">חסר במלאי</span>;
    }
    if (localStock >= (product.base_quantity || 1)) {
      return <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold shrink-0">במלאי</span>;
    }
    return (
      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold shrink-0">
        {localStock} מתוך {product.base_quantity} {formattedUnit}
      </span>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={setNodeRef}
        style={style}
        className={`flex flex-col gap-3 rounded-2xl px-3 py-4 border transition-all ${
          isOutOfStock ? "bg-red-50/40 border-red-100" : "bg-white border-slate-100 shadow-sm"
        } md:flex-row md:items-center md:py-3`}
      >
        {/* חלק עליון: ידית, שם ותגים */}
        <div className="flex items-start gap-2 flex-1 overflow-hidden">
          <div
            className="text-slate-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing p-1 touch-none shrink-0"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </div>
          
          <div className="flex flex-col text-right flex-1 overflow-hidden">
            <span className={`text-[1.05rem] font-bold truncate leading-tight ${isOutOfStock ? "text-red-700" : "text-slate-800"}`}>
              {product.product_name}
            </span>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                יעד: {product.base_quantity} {formattedUnit}
              </span>
              {getStockBadge()}
              {lactoseFree && <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-bold border border-sky-100">ללא לקטוז</span>}
            </div>
          </div>
        </div>

        {/* חלק תחתון: פקדי שליטה (מיושרים לימין במובייל) */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50 md:border-t-0 md:pt-0 shrink-0">
          
          {/* עריכה ומחיקה */}
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={onEdit} className="text-slate-400 p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all">
                  <Pencil className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-white border-none font-sans font-bold">עריכת המוצר</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={onDelete} className="text-slate-400 p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
                  <Trash2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-white border-none font-sans font-bold">מחיקת המוצר</TooltipContent>
            </Tooltip>
          </div>

          <div className="h-6 w-px bg-slate-100 mx-1" />

          {/* סמן כחסר */}
          {!isOutOfStock && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 text-[11px] font-bold border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl"
                  onClick={() => handleStockChange(0)}
                >
                  סמן כחסר
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[180px] bg-slate-800 text-white border-none font-sans text-center leading-snug">
                מאפס את המלאי ומעביר את המוצר לרשימת הקניות
              </TooltipContent>
            </Tooltip>
          )}

          {/* פלוס מינוס */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-9 overflow-hidden">
            <button 
              onClick={() => handleStockChange(localStock - step)}
              className="px-2.5 h-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors border-l border-slate-200"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input 
              type="number" 
              value={localStock} 
              onChange={(e) => handleStockChange(parseFloat(e.target.value) || 0)}
              className="w-10 text-center font-bold text-sm bg-transparent border-none p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button 
              onClick={() => handleStockChange(localStock + step)}
              className="px-2.5 h-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors border-r border-slate-200"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
