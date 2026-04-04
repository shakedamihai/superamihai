import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Space = { id: string; name: string };

interface SpaceContextType {
  activeSpace: Space | null;
  spaces: Space[];
  setActiveSpace: (space: Space) => void;
  isLoadingSpaces: boolean;
  createSpace: (name: string) => Promise<void>;
  joinSpaceByToken: (token: string) => Promise<void>;
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
      const { data, error } = await supabase
        .from('space_members')
        .select('spaces(id, name)')
        .eq('user_id', user.id);

      if (data && !error) {
        const userSpaces = data.map((item: any) => item.spaces);
        setSpaces(userSpaces);
        if (userSpaces.length > 0 && !activeSpace) {
          setActiveSpace(userSpaces[0]);
        }
      }
      setIsLoadingSpaces(false);
    };

    fetchSpaces();
  }, [user]);

  const createSpace = async (name: string) => {
    if (!user) return;
    const { data: space, error: spaceError } = await supabase
      .from('spaces')
      .insert([{ name }])
      .select().single();
    if (spaceError) throw spaceError;
    await supabase.from('space_members').insert([{ space_id: space.id, user_id: user.id }]);
    setSpaces(prev => [...prev, space]);
    setActiveSpace(space);
  };

  const joinSpaceByToken = async (token: string) => {
    if (!user) return;
    const { data: invite, error: inviteError } = await supabase
      .from('invitations').select('space_id').eq('token', token).eq('status', 'pending').single();
    if (inviteError || !invite) throw new Error("הזמנה לא בתוקף");
    await supabase.from('space_members').insert([{ space_id: invite.space_id, user_id: user.id }]);
    await supabase.from('invitations').update({ status: 'accepted' }).eq('token', token);
    window.location.reload(); 
  };

  return (
    <SpaceContext.Provider value={{ activeSpace, spaces, setActiveSpace, isLoadingSpaces, createSpace, joinSpaceByToken }}>
      {children}
    </SpaceContext.Provider>
  );
}

export const useSpace = () => {
  const context = useContext(SpaceContext);
  if (context === undefined) throw new Error("useSpace must be used within a SpaceProvider");
  return context;
};
