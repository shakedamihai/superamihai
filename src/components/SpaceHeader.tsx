import { useSpace } from "@/contexts/SpaceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SpaceHeader() {
  const { spaces, activeSpace, setActiveSpace } = useSpace();

  const handleInvite = async () => {
    if (!activeSpace) return;
    
    // יצירת טוקן הזמנה חדש ב-Supabase
    const { data, error } = await supabase
      .from('invitations')
      .insert([{ space_id: activeSpace.id, email: "link@share" }]) 
      .select('token')
      .single();

    if (error) {
      toast.error("לא ניתן לייצר הזמנה כרגע");
      return;
    }

    const inviteLink = `${window.location.origin}/invite/${data.token}`;
    
    // ניסיון לשיתוף טבעי בנייד (Web Share API)
    if (navigator.share) {
      navigator.share({
        title: 'הצטרפו אליי לאפליקציית הקניות',
        text: `הזמנה להצטרף לחלל "${activeSpace.name}"`,
        url: inviteLink,
      }).catch(console.error);
    } else {
      // אם אין תמיכה בשיתוף טבעי (למשל במחשב), נעתיק ללוח
      navigator.clipboard.writeText(inviteLink);
      toast.success("קישור ההזמנה הועתק ללוח!");
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background shadow-sm">
      <div className="flex items-center gap-2">
        <select 
          className="bg-transparent text-lg font-bold outline-none cursor-pointer focus:ring-0"
          value={activeSpace?.id || ""}
          onChange={(e) => {
            const selected = spaces.find(s => s.id === e.target.value);
            if (selected) setActiveSpace(selected);
          }}
        >
          {spaces.map(space => (
            <option key={space.id} value={space.id}>{space.name}</option>
          ))}
        </select>
      </div>

      <Button variant="outline" size="sm" onClick={handleInvite}>
        הזמן שותף
      </Button>
    </div>
  );
}
