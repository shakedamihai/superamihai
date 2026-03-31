import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { ShoppingListView } from "@/components/ShoppingListView";
import { PantryCheckView } from "@/components/PantryCheckView";
import { AddProductView } from "@/components/AddProductView";
import { useProducts } from "@/hooks/useProducts";
import { Loader2, ShoppingBasket } from "lucide-react";

type Tab = "shopping" | "pantry" | "add";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("shopping");
  const {
    isLoading,
    productsByDepartment,
    shoppingList,
    shoppingByDepartment,
    addProduct,
    updateStock,
    deleteProduct,
    finishShopping,
    copyListAsText,
  } = useProducts();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const titles: Record<Tab, string> = {
    shopping: "רשימת קניות",
    pantry: "בדיקת מלאי",
    add: "הוספת מוצר",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <ShoppingBasket className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">{titles[activeTab]}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {activeTab === "shopping" && (
          <ShoppingListView
            shoppingByDepartment={shoppingByDepartment}
            shoppingList={shoppingList}
            onCopyList={copyListAsText}
            onFinishShopping={() => finishShopping.mutate()}
            onDeleteProduct={(id) => deleteProduct.mutate(id)}
            isFinishing={finishShopping.isPending}
          />
        )}
        {activeTab === "pantry" && (
          <PantryCheckView
            productsByDepartment={productsByDepartment}
            onUpdateStock={(id, stock) => updateStock.mutate({ id, current_stock: stock })}
            onUpdateProduct={(updates) => updateProduct.mutate(updates)}
            onDeleteProduct={(id) => deleteProduct.mutate(id)}
          />
        )}
        {activeTab === "add" && (
          <AddProductView
            onAdd={(p) => addProduct.mutate(p)}
            isAdding={addProduct.isPending}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <BottomNav
        active={activeTab}
        onChange={setActiveTab}
        shoppingCount={shoppingList.length}
      />
    </div>
  );
};

export default Index;
