import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner"; // השארנו רק אחד
import { TooltipProvider } from "@/components/ui/tooltip";
import { SpaceProvider } from "./contexts/SpaceContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// רכיב לטיפול בהזמנות שמגיעות מהקישור
function InviteHandler() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (token) {
      localStorage.setItem("pending_invite_token", token);
      // replace: true מונע לופים של כפתור "חזור"
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-background" dir="rtl">
      <p className="text-lg animate-pulse">מעבד הזמנה לרשימה...</p>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <SpaceProvider>
          <Toaster position="top-center" closeButton /> 
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/invite/:token" element={<InviteHandler />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SpaceProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
