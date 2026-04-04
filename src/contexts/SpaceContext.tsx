import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";import { useAuth } from "@/hooks/useAuth";
type Space = { id: string; name: string };

interface SpaceContextType {
  activeSpace: Space | null;
  spaces: Space[];
  setActiveSpace: (space: Space) => void;
  isLoadingSpaces: boolean;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export function SpaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);

  useEffect(() => {
    if (!user) {
      setSpaces([]);
      setActiveSpace(null);
      setIsLoadingSpaces(false);
      return;
    }

    const fetchSpaces = async () => {
      // משיכת כל המרחבים שהיוזר חבר בהם
      const { data, error } = await supabase
        .from('space_members')
        .select('spaces(id, name)')
        .eq('user_id', user.id);

      if (data && !error) {
        const userSpaces = data.map((item: any) => item.spaces);
        setSpaces(userSpaces);
        
        // אם יש לו מרחבים, נגדיר את הראשון כברירת מחדל
        if (userSpaces.length > 0 && !activeSpace) {
          setActiveSpace(userSpaces[0]);
        }
      }
      setIsLoadingSpaces(false);
    };

    fetchSpaces();
  }, [user]);

  return (
    <SpaceContext.Provider value={{ activeSpace, spaces, setActiveSpace, isLoadingSpaces }}>
      {children}
    </SpaceContext.Provider>
  );
}

export const useSpace = () => {
  const context = useContext(SpaceContext);
  if (context === undefined) throw new Error("useSpace must be used within a SpaceProvider");
  return context;
};
