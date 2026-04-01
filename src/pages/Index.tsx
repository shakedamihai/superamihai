import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { ShoppingListView } from "@/components/ShoppingListView";
import { PantryCheckView } from "@/components/PantryCheckView";
import { AddProductView } from "@/components/AddProductView";
import { useProducts } from "@/hooks/useProducts";
import { useDepartments } from "@/hooks/useDepartments";
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
    updateProduct,
    updateStock,
    deleteProduct,
    reorderProducts,
    finishChecked,
    copyListAsText,
  } = useProducts();

  const {
    departments,
    departmentNames,
    isLoading: deptsLoading,
    addDepartment,
    renameDepartment,
    reorderDepartments,
  } = useDepartments();

  if (isLoading || deptsLoading) {
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
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden" dir="rtl">
      <header className="shrink-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <ShoppingBasket className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">{titles[activeTab]}</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 py-4">
        {activeTab === "shopping" && (
          <ShoppingListView
            shoppingByDepartment={shoppingByDepartment}
            shoppingList={shoppingList}
            onCopyList={copyListAsText}
            onFinishChecked={(checkedIds) => finishChecked.mutate(checkedIds)}
            onDeleteProduct={(id) => deleteProduct.mutate(id)}
            isFinishing={finishChecked.isPending}
          />
        )}
        {activeTab === "pantry" && (
          <PantryCheckView
            productsByDepartment={productsByDepartment}
            departments={departments}
            onUpdateStock={(id, stock) => updateStock.mutate({ id, current_stock: stock })}
            onUpdateProduct={(updates) => updateProduct.mutate(updates)}
            onDeleteProduct={(id) => deleteProduct.mutate(id)}
            onReorderProducts={(updates) => reorderProducts.mutate(updates)}
            onRenameDepartment={(oldName, newName) => renameDepartment.mutate({ oldName, newName })}
            onReorderDepartments={(updates) => reorderDepartments.mutate(updates)}
            departmentNames={departmentNames}
            onAddDepartment={(name) => addDepartment.mutate(name)}
          />
        )}
        {activeTab === "add" && (
          <AddProductView
            onAdd={(p) => addProduct.mutate(p)}
            isAdding={addProduct.isPending}
            departmentNames={departmentNames}
            onAddDepartment={(name) => addDepartment.mutate(name)}
          />
        )}
      </main>

      <div className="shrink-0">
        <BottomNav
          active={activeTab}
          onChange={setActiveTab}
          shoppingCount={shoppingList.length}
        />
      </div>
    </div>
  );
};

export default Index;
