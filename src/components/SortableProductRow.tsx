import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus, Minus, X, MoreHorizontal } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { isLactoseFree } from "@/hooks/useDepartments";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface SortableProductRowProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStock: (id: string, newStock: number) => void;
}

export function SortableProductRow({ product, onEdit, onDelete, onUpdateStock }: SortableProductRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });

  const [localStock, setLocalStock] = useState(product.current_stock ?? 0);
  const [showActions, setShowActions] = useState(false); // ניהול מצב התפריט החכם

  useEffect(() => {
    setLocalStock(product.current_stock ?? 0);
  }, [product.current_stock]);

  // סגירת התפריט אוטומטית אם מתחילים לגרור
  useEffect(() => {
    if (isDragging) setShowActions(false);
  }, [isDragging]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      handleStockChange(val);
    } else {
      handleStockChange(0);
    }
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
        {localStock} מתוך {product.base_quantity} {formattedUnit} במלאי
      </span>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-xl px-2 py-3 border transition-colors h-[72px] overflow-hidden ${isOutOfStock ? "bg-red-50/70 border-red-200" : "bg-white border-slate-100 shadow-sm"}`}
    >
      {/* צד ימין: ידית גרירה + שם המוצר והתגיות (מקבל את רוב המקום) */}
      <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
        <div
          className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1 touch-none shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex flex-col text-right flex-1 min-w-0">
          <span className={`text-[1.05rem] font-bold truncate ${isOutOfStock ? "text-red-900" : "text-slate-800"}`}>
            {product.product_name}
          </span>
          <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
            <span className="text-[11px] text-slate-500 font-bold whitespace-nowrap bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
               {product.base_quantity} {formattedUnit}
            </span>
            {getStockBadge()}
            {lactoseFree && <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold shrink-0 hidden sm:inline-flex">ללא לקטוז</span>}
          </div>
        </div>
      </div>

      {/* צד שמאל: פקדים חכמים מתחלפים */}
      <div className="flex items-center shrink-0 pl-1">
        {showActions ? (
          // מצב פתוח: כפתורי פעולות משניות
          <div className="flex items-center gap-1.5 animate-in slide-in-from-left-4 fade-in duration-200">
            {!isOutOfStock && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-[11px] font-bold border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
                onClick={() => {
                  handleStockChange(0);
                  setShowActions(false); // סוגר את התפריט אחרי הלחיצה
                }}
              >
                סמן כחסר
              </Button>
            )}
            <button onClick={onEdit} className="p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors">
              <Pencil className="h-4 w-4" />
            </button>
            <button onClick={onDelete} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
            
            <div className="w-px h-5 bg-slate-200 mx-0.5" /> {/* קו מפריד */}
            
            <button onClick={() => setShowActions(false)} className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          // מצב סגור (ברירת מחדל): כמות ו-3 נקודות
          <div className="flex items-center gap-2 animate-in slide-in-from-right-2 fade-in duration-200">
            <div className="flex items-center bg-white border border-slate-200 rounded-lg h-9 overflow-hidden shadow-sm">
              <button 
                onClick={() => handleStockChange(localStock - step)}
                className="px-2.5 h-full text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input 
                type="number" 
                value={localStock} 
                onChange={handleInputChange}
                className="w-10 text-center font-black text-sm bg-transparent border-none p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button 
                onClick={() => handleStockChange(localStock + step)}
                className="px-2.5 h-full text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            
            <button 
              onClick={() => setShowActions(true)} 
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
