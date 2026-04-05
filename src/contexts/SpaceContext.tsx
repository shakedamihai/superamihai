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

  // הפונקציה החכמה: משנה את הסטייט וגם שומרת בדפדפן
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
      
      // כשהנתונים חוזרים, בודקים מה שמרנו בזיכרון
      if (data && data.length > 0 && !activeSpace) {
        const savedId = localStorage.getItem('active_space_id');
        const savedSpace = savedId ? data.find(s => s.id === savedId) : null;
        
        if (savedSpace) {
          setActiveSpace(savedSpace);
        } else {
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

      // 1. יצירת הרשימה
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .insert([{ name, owner_id: session.user.id }])
        .select()
        .single();

      if (spaceError) throw spaceError;

      if (space) {
        // 2. הוספת המשתמש כחבר
        await supabase.from('space_members').insert([{ space_id: space.id, user_id: session.user.id }]);

        // 3. SEEDING: הוספת מחלקות ברירת מחדל (כדי שלא יהיה 0 בזיכרון)
        const { STANDARD_DEPARTMENTS } = await import('@/hooks/useDepartments');
        const departmentInserts = STANDARD_DEPARTMENTS.map((deptName, index) => ({
          name: deptName,
          space_id: space.id,
          sort_order: index
        }));
        
        await supabase.from('departments').insert(departmentInserts);

        await fetchSpaces();
        handleSetActiveSpace(space);
        toast.success("הרשימה נוצרה עם כל המחלקות!");
      }
    } catch (error: any) {
      console.error("Error creating space:", error);
      toast.error("שגיאה ביצירת הרשימה");
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
    // חושפים את הפונקציה החכמה תחת השם המקורי כדי לא לשבור שום דבר
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
