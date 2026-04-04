import { useEffect, useState } from "react";
import { useSpace } from "@/contexts/SpaceContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { SpaceHeader } from "@/components/SpaceHeader";

// התיקון כאן: הוספנו סוגריים מסולסלים (Named Imports)
import { ShoppingListView } from "@/components/ShoppingListView";
import { PantryCheckView } from "@/components/PantryCheckView";
import { AddProductView } from "@/components/AddProductView";
import BottomNav from "@/components/BottomNav"; // אם גם עליו הוא צועק, שים אותו גם בסוגריים: import { BottomNav }

export default function Index() {
  const { user } = useAuth();
  const { spaces, activeSpace, isLoadingSpaces, createSpace, joinSpaceByToken } = useSpace();
  const [newSpaceName, setNewSpaceName] = useState("");
  const [isProcessingInvite, setIsProcessingInvite] = useState(false);
  const [activeTab, setActiveTab] = useState("shopping");

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
        {activeTab === "shopping" && <ShoppingListView />}
        {activeTab === "pantry" && <PantryCheckView />}
        {activeTab === "add" && <AddProductView />}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
        <div className="md:max-w-2xl md:mx-auto">
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    </div>
  );
}
