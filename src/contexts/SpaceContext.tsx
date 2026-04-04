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

  // 1. פונקציה חכמה שגם משנה את הסטייט וגם שומרת בזיכרון הדפדפן
  const handleSetActiveSpace = (space: Space) => {
    setActiveSpace(space);
    localStorage.setItem('active_space_id', space.id);
  };

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
      
      // 2. כשהנתונים חוזרים, בודקים קודם מה שמור בזיכרון הדפדפן
      if (data && data.length > 0 && !activeSpace) {
        const savedId = localStorage.getItem('active_space_id');
        const savedSpace = savedId ? data.find(s => s.id === savedId) : null;
        
        if (savedSpace) {
          // אם מצאנו רשימה שמורה - נטען אותה
          setActiveSpace(savedSpace);
        } else {
          // אם אין כלום בזיכרון - נטען את הראשונה ונשמור אותה
          setActiveSpace(data[0]);
          localStorage.setItem('active_space_id', data[0].id);
        }
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

      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .insert([{ name, owner_id: session.user.id }])
        .select()
        .single();

      if (spaceError) throw spaceError;

      if (space) {
        const { error: memberError } = await supabase
          .from('space_members')
          .insert([{ space_id: space.id, user_id: session.user.id }]);

        if (memberError) console.error("Member insert error:", memberError);

        await fetchSpaces();
        // 3. משתמשים בפונקציה החדשה כדי שגם רשימה חדשה תישמר בזיכרון
        handleSetActiveSpace(space);
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
    // 4. מעבירים החוצה את הפונקציה החדשה שלנו תחת השם המקורי, כדי לא לשבור שום רכיב אחר באפליקציה
    <SpaceContext.Provider value={{ spaces, activeSpace, setActiveSpace: handleSetActiveSpace, isLoadingSpaces, createSpace, joinSpaceByToken, fetchSpaces }}>
      {children}
    </SpaceContext.Provider>
  );
};

export const useSpace = () => {
  const context = useContext(SpaceContext);
  if (context === undefined) throw new Error('useSpace must be used within a SpaceProvider');
  return context;
};
