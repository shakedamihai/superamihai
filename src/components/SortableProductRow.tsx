import { Minus, Plus, Pencil, Trash2 } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { isLactoseFree } from "@/hooks/useDepartments";

interface SortableProductRowProps {
  product: Product;
  onUpdateStock: (id: string, stock: number) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

export function SortableProductRow({ product: p, onUpdateStock, onEdit, onDelete }: SortableProductRowProps) {
  const unit = p.unit || "יחידות";
  const step = unit === "קילו" ? 0.5 : unit === "גרם" ? 100 : 1;
  const toBuy = Math.max(0, p.base_quantity - (p.current_stock || 0));
  const lactoseFree = isLactoseFree(p.product_name);

  return (
    <div 
      className={`flex items-center w-full bg-card rounded-lg px-3 py-3 border shadow-sm ${
        lactoseFree ? "border-sky-400 bg-sky-50/50" : "border-border"
      }`}
    >
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="font-bold truncate text-sm flex items-center gap-1.5 flex-wrap">
          {/* פורמט: כמות יחידה שם_מוצר */}
          <span className="text-primary whitespace-nowrap">{p.current_stock || 0} {unit}</span>
          <span className="truncate text-foreground font-medium">{p.product_name}</span>
          {lactoseFree && (
            <span className="text-[9px] bg-sky-200 text-sky-800 px-1.5 py-0.5 rounded font-bold shrink-0">
              ללא לקטוז
            </span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          בסיס: {p.base_quantity} {unit} | חסר: {toBuy} {unit}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-auto">
        <button onClick={() => onEdit(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-primary/10">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={() => onDelete(p)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10">
          <Trash2 className="h-4 w-4" />
        </button>
        
        <div className="w-px h-6 bg-border mx-1" />

        <div className="flex items-center bg-muted/80 rounded-lg p-0.5">
          <button 
            onClick={() => onUpdateStock(p.id, Math.max(0, (p.current_stock || 0) - step))} 
            className="w-8 h-8 rounded-md bg-background flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-bold text-sm tabular-nums">
            {p.current_stock || 0}
          </span>
          <button 
            onClick={() => onUpdateStock(p.id, (p.current_stock || 0) + step)} 
            className="w-8 h-8 rounded-md bg-background flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
