import { 
  Plus, Search, ChevronDown, Edit2, Trash2, Package, 
  Beef, Carrot, Milk, Snowflake, Sparkles, Wheat, CupSoda, Baby, ShoppingBag, 
  Apple, Fish, ChefHat, Leaf, Droplets, UtensilsCrossed, Candy,
  CookingPot, Grape, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/hooks/useProducts";
import { useDepartments } from "@/hooks/useDepartments";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useMemo } from "react";

const DEPT_CONFIG: Record<string, { icon: any, color: string, border: string, bg: string }> = {
  "ירקות": { icon: Carrot, color: "text-emerald-500", border: "border-r-emerald-500", bg: "bg-emerald-50" },
  "פירות": { icon: Apple, color: "text-pink-500", border: "border-r-pink-500", bg: "bg-pink-50" },
  "מוצרי חלב ומקרר": { icon: Milk, color: "text-blue-500", border: "border-r-blue-500", bg: "bg-blue-50" },
  "קצביה": { icon: Beef, color: "text-red-500", border: "border-r-red-500", bg: "bg-red-50" },
  "דגים": { icon: Fish, color: "text-cyan-500", border: "border-r-cyan-500", bg: "bg-cyan-50" },
  "קפואים": { icon: Snowflake, color: "text-indigo-600", border: "border-r-indigo-600", bg: "bg-indigo-50" },
  "מזווה ושימורים": { icon: Package, color: "text-orange-500", border: "border-r-orange-500", bg: "bg-orange-50" },
  "תבלינים ואפייה": { icon: CookingPot, color: "text-stone-600", border: "border-r-stone-600", bg: "bg-stone-50" },
  "מאפייה ולחם": { icon: Wheat, color: "text-yellow-500", border: "border-r-yellow-500", bg: "bg-yellow-50" },
  "חטיפים ומתוקים": { icon: Candy, color: "text-purple-500", border: "border-r-purple-500", bg: "bg-purple-50" },
  "משקאות": { icon: CupSoda, color: "text-indigo-500", border: "border-r-indigo-500", bg: "bg-indigo-50" },
  "פארם וטואלטיקה": { icon: Sparkles, color: "text-fuchsia-500", border: "border-r-fuchsia-500", bg: "bg-fuchsia-50" },
  "חומרי ניקוי": { icon: Droplets, color: "text-slate-500", border: "border-r-slate-500", bg: "bg-slate-50" },
  "חד-פעמי": { icon: UtensilsCrossed, color: "text-rose-400", border: "border-r-rose-400", bg: "bg-rose-50" },
  "תינוקות": { icon: Baby, color: "text-teal-500", border: "border-r-teal-500", bg: "bg-teal-50" },
  "פיצוחים ופירות יבשים": { icon: Grape, color: "text-amber-700", border: "border-r-amber-700", bg: "bg-amber-50" },
  "מעדניה": { icon: ChefHat, color: "text-violet-600", border: "border-r-violet-600", bg: "bg-violet-50" },
  "בריאות ואורגני": { icon: Leaf, color: "text-lime-500", border: "border-r-lime-500", bg: "bg-lime-50" },
  "כללי": { icon: ShoppingBag, color: "text-slate-400", border: "border-r-slate-400", bg: "bg-slate-50" },
};

interface PantryCheckViewProps {
  productsByDepartment: Record<string, Product[]>;
  onUpdateStock: (id: string, newStock: number) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddProduct: () => void;
}

export function PantryCheckView({
  productsByDepartment,
  onUpdateStock,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
}: PantryCheckViewProps) {
  const { departments } = useDepartments();
  const [searchQuery, setSearchQuery] = useState("");
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>(() => 
    Object.keys(productsByDepartment).reduce((acc, dept) => ({ ...acc, [dept]: true }), {})
  );

  const filteredDepts = useMemo(() => {
    const sortedDepts = Object.keys(productsByDepartment).sort((a, b) => {
      const deptA = (departments || []).find(d => d.name === a);
      const deptB = (departments || []).find(d => d.name === b);
      return (deptA?.sort_order ?? 999) - (deptB?.sort_order ?? 999);
    });

    if (!searchQuery) return sortedDepts;
    
    const lowerQuery = searchQuery.toLowerCase();
    return sortedDepts.filter(dept => 
      dept.toLowerCase().includes(lowerQuery) ||
      productsByDepartment[dept].some(p => p.product_name.toLowerCase().includes(lowerQuery))
    );
  }, [productsByDepartment, searchQuery, departments]);

  return (
    <div className="space-y-6 pb-24 bg-slate-50 min-h-screen pt-4 px-2 font-sans">
      <div className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-6 text-right">
        <div className="flex flex-col gap-4">
          <div className="relative w-full">
            <Search className="absolute right-4 top-3.5 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="חיפוש מוצר או מחלקה..." 
              className="w-full pl-10 pr-12 py-6 rounded-xl bg-slate-50 border-slate-200 text-lg focus-visible:ring-primary/20 text-right"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            onClick={onAddProduct}
            className="w-full gap-2 rounded-xl h-14 text-lg font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="h-6 w-6" />
            הוספת מוצר חדש
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredDepts.map((deptName) => {
          const config = DEPT_CONFIG[deptName] || DEPT_CONFIG["כללי"];
          const Icon = config.icon;
          const products = productsByDepartment[deptName];
          const isOpen = openDepts[deptName] !== false;

          return (
            <Collapsible
              key={deptName}
              open={isOpen}
              onOpenChange={(open) => setOpenDepts(prev => ({ ...prev, [deptName]: open }))}
              className={`bg-white rounded-2xl shadow-sm border border-slate-200 border-r-8 ${config.border} overflow-hidden`}
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between px-5 py-5 font-bold outline-none hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${config.bg}`}>
                    <Icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-lg text-slate-800">{deptName}</span>
                    <span className="text-xs text-slate-400 font-normal">{products.length} מוצרים</span>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-300 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="border-t border-slate-100 text-right">
                  {products.map((product) => (
                    <div 
                      key={product.id} 
                      className="flex items-center justify-between px-5 py-4 border-b border-slate-300 last:border-0 hover:bg-slate-50/30 transition-colors"
                    >
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2 justify-start">
                          <span className="font-bold text-slate-800 text-base">{product.product_name}</span>
                          {product.is_one_time && (
                            <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 py-0 px-1.5 rounded-full font-bold">חד-פעמי</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm justify-start">
                          <span className="text-slate-500">במלאי:</span>
                          <span className={`font-black ${product.current_stock < product.base_quantity ? 'text-red-500' : 'text-emerald-600'}`}>
                            {product.current_stock} / {product.base_quantity}
                          </span>
                          <span className="text-slate-400 text-xs">{product.unit || 'יח\''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm text-slate-600"
                            onClick={() => onUpdateStock(product.id, Math.max(0, product.current_stock - 1))}
                          >
                            <span className="text-xl font-bold">-</span>
                          </Button>
                          <div className="w-10 text-center font-black text-slate-800 text-lg">
                            {product.current_stock}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-white hover:shadow-sm text-slate-600"
                            onClick={() => onUpdateStock(product.id, product.current_stock + 1)}
                          >
                            <span className="text-xl font-bold">+</span>
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-full"
                          onClick={() => onEditProduct(product)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full"
                          onClick={() => onDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
      
      {filteredDepts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 italic">
          <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
          <p>לא נמצאו מוצרים תואמים לחיפוש...</p>
        </div>
      )}
    </div>
  );
}
