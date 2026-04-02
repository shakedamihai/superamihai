import { GripVertical, Pencil, Trash2, Plus, Minus } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isLactoseFree } from "@/hooks/useDepartments";
import { Button } from "./ui/button";

interface SortableProductRowProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStock: (id: string, stock: number) => void;
}

// פונקציית עזר להחלטה על קפיצות הפלוס/מינוס לפי היחידה
const getStepForUnit = (unit?: string) => {
  if (!unit) return 1;
  const lowerUnit = unit.toLowerCase();
  if (lowerUnit.includes("קילו") || lowerUnit === 'ק"ג') return 0.5;
  if (lowerUnit.includes("ליטר")) return 0.5;
  if (lowerUnit.includes("גרם") && !lowerUnit.includes("קילו")) return 100;
  if (lowerUnit.includes('מ"ל') || lowerUnit.includes("מיליליטר")) return 100;
  return 1; // ברירת מחדל ליחידות, חבילות, מארזים וכו'
};

export function SortableProductRow({
  product,
  onEdit,
  onDelete,
  onUpdateStock,
}: SortableProductRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const lactoseFree = isLactoseFree(product.product_name);
  const unitDisplay = product.unit?.toLowerCase().includes("קילו") ? 'ק"ג' : (product.unit || "יחידות");
  const missingQuantity = Math.max(0, product.base_quantity - product.current_stock);
  
  const stockInfoText = missingQuantity > 0 ? `חסר ${Number(missingQuantity.toFixed(2))} ${unitDisplay}` : "במלאי";

  // משיכת כמות הקפיצה המתאימה
  const step = getStepForUnit(product.unit);

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center justify-between p-3 bg-card border rounded-xl shadow-sm group ${lactoseFree ? "border-sky-100 bg-sky-50/20" : ""}`}>
      <div className="flex items-center gap-3 flex-1">
        <button {...attributes} {...listeners} className="p-1 text-muted-foreground/40 hover:text-muted-foreground shrink-0 touch-none">
          <GripVertical className="h-4 w-4" />
        </button>
        
        <div className="flex flex-col text-right flex-1">
          <span className="font-bold text-foreground">{product.product_name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-medium ${missingQuantity > 0 ? "text-orange-600" : "text-emerald-600"}`}>
              {stockInfoText}
            </span>
            {lactoseFree && <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-bold">ללא לקטוז</span>}
            {product.is_one_time && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">מוצר חד-פעמי</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-2 border-x border-slate-100 mx-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full border-slate-200 bg-slate-50" 
          onClick={() => {
            const newValue = Math.max(0, product.current_stock - step);
            onUpdateStock(product.id, Number(newValue.toFixed(2))); // toFixed פותר בעיות של עשרוניים
          }}
        >
          <Minus className="h-3 w-3 text-slate-600" />
        </Button>
        
        {/* הגדלתי את הרוחב (min-w) כדי שמספרים כמו 100 או 1.5 ייכנסו טוב */}
        <span className="min-w-[1.5rem] text-center font-black text-sm text-slate-700">
          {Number(product.current_stock.toFixed(2))}
        </span>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full border-slate-200 bg-slate-50" 
          onClick={() => {
            const newValue = product.current_stock + step;
            onUpdateStock(product.id, Number(newValue.toFixed(2)));
          }}
        >
          <Plus className="h-3 w-3 text-slate-600" />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onEdit} className="p-2 text-muted-foreground/40 hover:text-primary rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-muted-foreground/40 hover:text-destructive rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
