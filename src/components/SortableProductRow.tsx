import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus, Minus, MoreVertical, Ban } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { isLactoseFree } from "@/hooks/useDepartments";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

  // פונקציה חכמה לתיקון שמות יחידות והפיכתן לרבים
  const displayUnit = (u?: string) => {
    if (!u || u.trim() === "") return "יחידות";
    const lowerUnit = u.toLowerCase().trim();
    if (lowerUnit.includes("קילו") || lowerUnit === 'ק"ג') return 'ק"ג';
    if (lowerUnit === "חבילה") return "חבילות";
    if (lowerUnit === "מארז") return "מארזים";
    if (lowerUnit === "ליטר") return "ליטרים";
    return u; // מחזיר את המקור אם לא נדרש שינוי
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

  // תווית הסטטוס (כבר לא כוללת את שם היחידה, כי הוא מופיע בתווית הראשונה)
  const getStockBadge = () => {
    if (localStock === 0) {
      return <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold shrink-0">חסר במלאי</span>;
    }
    if (localStock >= (product.base_quantity || 1)) {
      return <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold shrink-0">במלאי</span>;
    }
    return (
      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold shrink-0">
        {localStock} מתוך {product.base_quantity} במלאי
      </span>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-xl px-3 py-2.5 border transition-colors ${
        isOutOfStock ? "bg-red-50/40 border-red-100" : "bg-white border-slate-100 shadow-sm"
      }`}
    >
      {/* צד ימין: גרירה, שם ותגים */}
      <div className="flex items-center gap-2 flex-1 overflow-hidden">
        <div
          className="text-slate-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing p-1 touch-none shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </div>
        
        <div className="flex flex-col text-right flex-1 overflow-hidden">
          <span className={`text-[0.95rem] font-bold truncate leading-tight ${isOutOfStock ? "text-red-700" : "text-slate-800"}`}>
            {product.product_name}
          </span>
          
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {/* תווית ראשונה מימין: כמות ויחידה (תמיד מופיעה) */}
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold shrink-0">
              {product.base_quantity} {formattedUnit}
            </span>
            
            {/* תווית שנייה: סטטוס המלאי */}
            {getStockBadge()}
            
            {/* תווית שלישית (אופציונלית) */}
            {lactoseFree && <span className="text-[9px] bg-sky-50 text-sky-700 px-1 py-0.5 rounded font-bold border border-sky-100">ללא לקטוז</span>}
          </div>
        </div>
      </div>

      {/* צד שמאל: פלוס מינוס ותפריט שלוש נקודות */}
      <div className="flex items-center gap-2 shrink-0 pl-1">
        
        {/* פלוס מינוס קומפקטי */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg h-8 overflow-hidden">
          <button 
            onClick={() => handleStockChange(localStock - step)}
            className="px-1.5 h-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors border-l border-slate-200"
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
            className="px-1.5 h-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors border-r border-slate-200"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* תפריט שלוש נקודות */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-slate-400 p-1.5 hover:bg-slate-100 rounded-lg transition-all outline-none">
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 font-sans p-1.5 rounded-xl shadow-xl border-slate-100">
            
            {!isOutOfStock && (
              <>
                <DropdownMenuItem 
                  onClick={() => handleStockChange(0)}
                  className="flex flex-col items-end gap-1 p-2 focus:bg-slate-50 cursor-pointer rounded-lg group"
                >
                  <div className="flex items-center gap-2 text-slate-700 font-bold group-hover:text-indigo-600 transition-colors">
                    <span>סמן כחסר</span>
                    <Ban className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] text-slate-400 text-right leading-tight">
                    מאפס את המלאי ומוסיף את המוצר לרשימת הקניות
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-50" />
              </>
            )}

            <DropdownMenuItem onClick={onEdit} className="flex items-center justify-end gap-2 p-2 focus:bg-indigo-50 focus:text-indigo-600 font-bold rounded-lg cursor-pointer">
              <span>עריכת המוצר</span>
              <Pencil className="h-4 w-4" />
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onDelete} className="flex items-center justify-end gap-2 p-2 focus:bg-red-50 focus:text-red-600 font-bold rounded-lg cursor-pointer">
              <span>מחיקת המוצר</span>
              <Trash2 className="h-4 w-4" />
            </DropdownMenuItem>
            
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
  );
}
