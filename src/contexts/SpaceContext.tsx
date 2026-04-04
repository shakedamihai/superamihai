import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Space = {
  id: string;
  name: string;
  created_at: string;
  owner_id?: string;
};

type SpaceContextType = {
  spaces: Space[];
  activeSpace: Space | null;
  setActiveSpace: (space: Space) => void;
  isLoadingSpaces: boolean;
  createSpace: (name: string) => Promise<void>;
  joinSpaceByToken: (token: string) => Promise<void>;
  fetchSpaces: () => Promise<void>;
};

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export const SpaceProvider = ({ children }: { children: ReactNode }) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);

  const fetchSpaces = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSpaces([]);
        setActiveSpace(null);
        setIsLoadingSpaces(false);
        return;
      }

      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setSpaces(data || []);
      if (data && data.length > 0 && !activeSpace) {
        setActiveSpace(data[0]);
      }
    } catch (err) {
      console.error("Error fetching spaces:", err);
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const createSpace = async (name: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. יצירת הרשימה עם owner_id מפורש
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .insert([{ name, owner_id: session.user.id }])
        .select()
        .single();

      if (spaceError) throw spaceError;

      if (space) {
        // 2. הוספת המשתמש כחבר
        const { error: memberError } = await supabase
          .from('space_members')
          .insert([{ space_id: space.id, user_id: session.user.id }]);

        if (memberError) console.error("Member insert error:", memberError);

        await fetchSpaces();
        setActiveSpace(space);
        toast.success("הרשימה נוצרה בהצלחה!");
      }
    } catch (error: any) {
      console.error("Error creating space:", error);
      toast.error(error.message || "שגיאה ביצירת הרשימה");
    }
  };

  const joinSpaceByToken = async (token: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: invite, error: inviteError } = await supabase
      .from('invitations')
      .select('space_id')
      .eq('token', token)
      .single();

    if (inviteError || !invite) throw new Error("הזמנה לא בתוקף");

    const { error: memberError } = await supabase
      .from('space_members')
      .insert([{ space_id: invite.space_id, user_id: session.user.id }]);

    if (memberError && memberError.code !== '23505') throw memberError;

    await fetchSpaces();
  };

  return (
    <SpaceContext.Provider value={{ spaces, activeSpace, setActiveSpace, isLoadingSpaces, createSpace, joinSpaceByToken, fetchSpaces }}>
      {children}
    </SpaceContext.Provider>
  );
};

export const useSpace = () => {
  const context = useContext(SpaceContext);
  if (context === undefined) throw new Error('useSpace must be used within a SpaceProvider');
  return context;
};
