import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { SpaceProvider } from "./contexts/SpaceContext";
import { Toaster } from "@/components/ui/sonner";

// רכיב שתופס את ההזמנה מוואטסאפ (Deep Link)
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

function App() {
  return (
    <Router>
      <SpaceProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/invite/:token" element={<InviteHandler />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </SpaceProvider>
    </Router>
  );
}

export default App;
