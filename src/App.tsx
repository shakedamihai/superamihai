import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useParams, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

// רכיב עזר לטיפול בהזמנות (שלב 3 באפיון)
const InviteHandler = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      // שמירת הטוקן ב-localStorage כדי שנוכל להשתמש בו אחרי ה-Login
      localStorage.setItem("perfectcart_invite_token", token);
      console.log("Invite token captured:", token);
    }
    // הפניה לדף הבית (שם תתבצע לוגיקת ה-Onboarding)
    navigate("/", { replace: true });
  }, [token, navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          {/* נתיב להזמנות: perfectcart.vercel.app/invite/TOKEN_HERE */}
          <Route path="/invite/:token" element={<InviteHandler />} />
          
          <Route path="/" element={<Index />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
