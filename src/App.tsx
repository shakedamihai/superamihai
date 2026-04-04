import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
      navigate("/");
    }
  }, [token, navigate]);

  return <div className="flex h-screen items-center justify-center" dir="rtl">מעבד הזמנה...</div>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SpaceProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/invite/:token" element={<InviteHandler />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SpaceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
