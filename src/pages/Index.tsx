import { useEffect, useState } from "react";
import { useSpace } from "@/contexts/SpaceContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { SpaceHeader } from "@/components/SpaceHeader";

// ייבוא נכון עם סוגריים מסולסלים (Named Imports)
import { ShoppingListView } from "@/components/ShoppingListView";
import { PantryCheckView } from "@/components/PantryCheckView";
import { AddProductView } from "@/components/AddProductView";
import { BottomNav } from "@/components/BottomNav";

// ייבוא ההוקים של הנתונים
import { useProducts } from "@/hooks/useProducts";
import { useDepartments } from "@/hooks/useDepartments";

type Tab = "shopping" | "pantry" | "add";

export default function Index() {
  const { user } = useAuth();
  const { spaces, activeSpace, isLoadingSpaces, createSpace, joinSpaceByToken } = useSpace();
  const [newSpaceName, setNewSpaceName] = useState("");
  const [isProcessingInvite, setIsProcessingInvite] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("shopping");

  // משיכת כל הנתונים מתוך ההוקים (הם כבר מסוננים לפי activeSpace בזכות העדכון הקודם)
  const {
    shoppingByDepartment,
    shoppingList,
    copyListAsText,
    finishChecked,
    deleteProduct,
    updateStock,
    updateProduct,
    productsByDepartment,
    reorderProducts,
    addProduct
  } = useProducts();

  const {
    departments,
    departmentNames,
    reorderDepartments,
    addDepartment,
    renameDepartment
  } = useDepartments();

  useEffect(() => {
    const processInvite = async () => {
      const token = localStorage.getItem("pending_invite_token");
      if (token && user && !isLoadingSpaces) {
        setIsProcessingInvite(true);
        try {
          await joinSpaceByToken(token);
          toast.success("הצטרפת לחלל בהצלחה!");
          localStorage.removeItem("pending_invite_token");
        } catch (error) {
          toast.error("שגיאה בקבלת ההזמנה, ייתכן שהיא פגה");
          localStorage.removeItem("pending_invite_token");
        } finally {
          setIsProcessingInvite(false);
        }
      }
    };
    processInvite();
  }, [user, isLoadingSpaces, joinSpaceByToken]);

  if (isLoadingSpaces || isProcessingInvite) {
    return <div className="flex h-screen items-center justify-center bg-background" dir="rtl">טוען נתונים...</div>;
  }

  // מסך יצירת חלל ראשון (Onboarding)
  if (spaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background" dir="rtl">
        <h1 className="text-3xl font-bold mb-2">ברוכים הבאים ל-SuperAmihai!</h1>
        <p className="text-muted-foreground mb-8">כדי להתחיל, צרו את החלל המשותף הראשון שלכם.</p>
        
        <div className="w-full max-w-sm space-y-4">
          <Input 
            placeholder="שם החלל (למשל: הבית שלי)" 
            value={newSpaceName}
            onChange={(e) => setNewSpaceName(e.target.value)}
          />
          <Button 
            className="w-full" 
            onClick={() => createSpace(newSpaceName || "הבית שלי")}
            disabled={!newSpaceName.trim()}
          >
            צור חלל
          </Button>
          <div className="mt-6 text-sm text-muted-foreground border p-4 rounded bg-muted/50">
            מחכים להזמנה? לחצו על הקישור שקיבלתם בוואטסאפ.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20" dir="rtl">
      <SpaceHeader />

      <main className="flex-1 p-4 md:max-w-2xl md:mx-auto md:w-full">
        {activeTab === "shopping" && (
          <ShoppingListView 
            shoppingByDepartment={shoppingByDepartment}
            shoppingList={shoppingList}
            onCopyList={copyListAsText}
            onFinishChecked={(ids) => finishChecked.mutate(ids)}
            onDeleteProduct={(id) => deleteProduct.mutate(id)}
            onUpdateStock={(id, stock) => updateStock.mutate({ id, current_stock: stock })}
            onUpdateProduct={(updates) => updateProduct.mutate(updates as any)}
            isFinishing={finishChecked.isPending}
          />
        )}
        
        {activeTab === "pantry" && (
          <PantryCheckView 
            productsByDepartment={productsByDepartment}
            departments={departments}
            onUpdateStock={(id, stock) => updateStock.mutate({ id, current_stock: stock })}
            onUpdateProduct={(updates) => updateProduct.mutate(updates as any)}
            onDeleteProduct={(id) => deleteProduct.mutate(id)}
            onReorderProducts={(updates) => reorderProducts.mutate(updates)}
            onReorderDepartments={(updates) => reorderDepartments.mutate(updates)}
            onRenameDepartment={(oldName, newName) => renameDepartment.mutate({ oldName, newName })}
            departmentNames={departmentNames}
            onAddDepartment={(name) => addDepartment.mutate(name)}
          />
        )}
        
        {activeTab === "add" && (
          <AddProductView 
            onAdd={(product) => addProduct.mutate(product)}
            isAdding={addProduct.isPending}
            departmentNames={departmentNames}
            onAddDepartment={(name) => addDepartment.mutate(name)}
          />
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className="md:max-w-2xl md:mx-auto">
          <BottomNav 
            active={activeTab} 
            onChange={setActiveTab} 
            shoppingCount={shoppingList.length} 
          />
        </div>
      </div>
    </div>
  );
}
