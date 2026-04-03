import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus, Minus, X } from "lucide-react"; // הוספנו את X
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

  // סטייט מקומי לעדכון מיידי על המסך (ללא המתנה למסד הנתונים)
  const [localStock, setLocalStock] = useState(product.current_stock ?? 0);

  // סנכרון במקרה שהנתון מתעדכן מבחוץ
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

  // פונקציה פנימית לניקוי והצגת יחידות מידה בצורה מקצועית
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

  // פונקציית עדכון שמשנה קודם את המסך, ורק אז שולחת לשרת
  const handleStockChange = (newVal: number) => {
    const validVal = Math.max(0, newVal);
    setLocalStock(validVal); // עדכון מיידי של הממשק
    onUpdateStock(product.id, validVal); // עדכון ברקע
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      handleStockChange(val);
    } else {
      handleStockChange(0);
    }
  };

  // אלגוריתם תצוגת המלאי החכמה
  const getStockBadge = () => {
    if (localStock === 0) {
      return <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold shrink-0">חסר במלאי</span>;
    }
    if (localStock >= (product.base_quantity || 1)) {
      return <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold shrink-0">במלאי</span>;
    }
    // תצוגת מלאי חלקי מפורטת
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
      className={`flex rounded-xl px-3 py-3 border transition-colors md:items-center ${isOutOfStock ? "bg-red-50 border-red-100" : "bg-white border-slate-100 shadow-sm"}`}
    >
      {/* פריסה למובייל: עמודה עם שתי שורות (שם למעלה, פקדים למטה) */}
      <div className="flex flex-col gap-3 w-full md:flex-row md:items-center md:justify-between md:gap-0">
        
        {/* שורה 1 (או צד ימין בדסקטופ): שם המוצר והתגיות */}
        <div className="flex items-center gap-2 flex-1 overflow-hidden pr-1 md:pr-0">
          <div
            className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing p-1.5 touch-none shrink-0 md:p-1"
            {...attributes}
            {...listeners}
            title="גרור לשינוי סדר"
          >
            <GripVertical className="h-5 w-5 md:h-4 md:w-4" />
          </div>
          <div className="flex flex-col text-right flex-1 overflow-hidden">
            <span className={`text-[1.05rem] font-medium truncate md:text-sm ${isOutOfStock ? "text-red-700 font-bold" : "text-slate-800"}`}>
              {product.product_name}
            </span>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap md:text-[11px]">
                {product.base_quantity} {formattedUnit}
              </span>
              {getStockBadge()}
              {lactoseFree && <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold shrink-0 md:text-[9px]">ללא לקטוז</span>}
            </div>
          </div>
        </div>

        {/* שורה 2 (או צד שמאל בדסקטופ): פקדי מלאי ועריכה (עכשיו גם במובייל זה אופקי למטה) */}
        <div className="flex items-center gap-1.5 justify-end shrink-0 pl-1 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0 md:gap-1">
          
          {/* שדה הזנת מלאי עם פלוס ומינוס */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg h-9 overflow-hidden md:h-7">
            <button 
              onClick={() => handleStockChange(localStock - step)}
              className="px-2.5 h-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors md:px-1.5"
            >
              <Minus className="h-4 w-4 md:h-3 md:w-3" />
            </button>
            <input 
              type="number" 
              value={localStock} 
              onChange={handleInputChange}
              className="w-12 text-center font-bold text-sm bg-transparent border-none p-0 focus:ring-0 md:w-8 md:text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button 
              onClick={() => handleStockChange(localStock + step)}
              className="px-2.5 h-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors md:px-1.5"
            >
              <Plus className="h-4 w-4 md:h-3 md:w-3" />
            </button>
          </div>

          {/* כפתור "סמן כחסר" בצבע אפור/ניטרלי. משנה אייקון במובייל לחיסכון במקום */}
          {!isOutOfStock && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3 text-[11px] font-bold border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 md:h-7 md:px-2 md:text-[10px]"
              onClick={() => handleStockChange(0)}
            >
              <X className="h-4 w-4 md:hidden" />
              <span className="hidden md:block">סמן כחסר</span>
            </Button>
          )}

          <button onClick={onEdit} className="text-slate-400 p-2 hover:text-indigo-600 rounded-lg transition-colors md:p-1.5"><Pencil className="h-4 w-4 md:h-3.5 md:w-3.5" /></button>
          <button onClick={onDelete} className="text-slate-400 p-2 hover:text-red-500 rounded-lg transition-colors md:p-1.5"><Trash2 className="h-4 w-4 md:h-3.5 md:w-3.5" /></button>
        </div>
      </div>
    </div>
  );
}
