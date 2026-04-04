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
    setIsLoadingSpaces(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSpaces([]);
        setActiveSpace(null);
        return;
      }

      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching spaces:", error);
        return;
      }

      setSpaces(data || []);
      
      // אם אין רשימה פעילה כרגע, תבחר את הראשונה אוטומטית
      if (data && data.length > 0) {
        if (!activeSpace || !data.find(s => s.id === activeSpace.id)) {
          setActiveSpace(data[0]);
        }
      } else {
        setActiveSpace(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSpaces(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') fetchSpaces();
      if (event === 'SIGNED_OUT') {
        setSpaces([]);
        setActiveSpace(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createSpace = async (name: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("משתמש לא מחובר");
        return;
      }

      // התיקון הקריטי: שולחים את ה-owner_id יחד עם שם הרשימה למסד הנתונים!
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .insert([{ name, owner_id: session.user.id }])
        .select()
        .single();

      if (spaceError) {
        console.error("Error creating space:", spaceError);
        toast.error("שגיאה ביצירת הרשימה: אין הרשאה לשמור נתונים");
        return;
      }

      if (space) {
        // ברגע שהרשימה נוצרה, נוסיף את המשתמש כחבר ברשימה
        const { error: memberError } = await supabase
          .from('space_members')
          .insert([{ space_id: space.id, user_id: session.user.id }]);

        if (memberError) {
          console.error("Error joining space:", memberError);
        }

        // מרעננים את האפליקציה כדי שתציג את הרשימה החדשה
        await fetchSpaces();
        setActiveSpace(space);
        toast.success("הרשימה המשותפת נוצרה בהצלחה!");
      }

    } catch (error) {
      console.error("Unknown error creating space:", error);
      toast.error("שגיאה לא צפויה ביצירת רשימה");
    }
  };

  const joinSpaceByToken = async (token: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const { data: invite, error: inviteError } = await supabase
      .from('invitations')
      .select('space_id')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      throw new Error("Invalid token");
    }

    const { error: memberError } = await supabase
      .from('space_members')
      .insert([{ space_id: invite.space_id, user_id: session.user.id }]);

    // שגיאה 23505 אומרת שהמשתמש כבר חבר ברשימה, אז אנחנו מתעלמים ממנה
    if (memberError && memberError.code !== '23505') {
      throw memberError; 
    }

    await supabase.from('invitations').update({ status: 'accepted' }).eq('token', token);
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
  if (context === undefined) {
    throw new Error('useSpace must be used within a SpaceProvider');
  }
  return context;
};
