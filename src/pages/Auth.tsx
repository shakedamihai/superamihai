import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false); // הוספנו סטייט חדש
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsEmailConfirmation(false);

    try {
      if (isLogin) {
        // התחברות
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("התחברת בהצלחה!");
        navigate("/");
      } else {
        // הרשמה
        const { error, data } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin // מבקש מ-Supabase להחזיר לאתר שלנו אחרי האישור
          }
        });
        if (error) throw error;
        
        // בדיקה אם המשתמש נרשם אבל דורש אישור מייל
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            toast.error("כתובת המייל כבר קיימת במערכת.");
        } else {
             // הרשמה הצליחה, מציגים הודעה לאישור מייל
             setNeedsEmailConfirmation(true);
             toast.success("נרשמת בהצלחה! שלחנו לך קישור לאישור למייל.");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "שגיאה בתהליך ההתחברות/הרשמה");
    } finally {
      setLoading(false);
    }
  };

  // מסך הודעה לאחר הרשמה מוצלחת שדורשת אישור מייל
  if (needsEmailConfirmation) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center" dir="rtl">
            <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl shadow-lg border">
                <h2 className="text-2xl font-bold text-primary">עוד שלב אחד קטן...</h2>
                <p className="text-muted-foreground">
                    שלחנו אימייל אימות לכתובת <strong>{email}</strong>.
                    <br/><br/>
                    אנא היכנס לתיבת הדואר שלך ולחץ על הקישור כדי להפעיל את החשבון.
                </p>
                <Button variant="outline" className="w-full mt-4" onClick={() => setNeedsEmailConfirmation(false)}>
                    חזור להתחברות
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4" dir="rtl">
      <div className="w-full max-w-sm p-8 space-y-6 bg-card rounded-xl shadow-lg border">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-primary">SuperAmihai</h1>
          <p className="text-muted-foreground">
            {isLogin ? "התחבר לחשבון שלך" : "צור חשבון חדש"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">אימייל</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-left"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">סיסמה</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-left"
              dir="ltr"
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "טוען..." : isLogin ? "התחבר" : "הרשם"}
          </Button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-600 hover:underline"
          >
            {isLogin ? "אין לך חשבון? לחץ כאן להרשמה" : "כבר יש לך חשבון? לחץ להתחברות"}
          </button>
        </div>
      </div>
    </div>
  );
}
