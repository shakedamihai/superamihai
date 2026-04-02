import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";

export type Department = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

// מחלקות שמשתמשות במשקל (ק"ג) עם קפיצות של 0.5
const WEIGHT_DEPARTMENTS = ["ירקות", "פירות", "קצביה", "מעדניה"];
// מחלקות שנספרות בחבילות
const PACKAGE_DEPARTMENTS = ["מאפייה ולחם", "חד-פעמי"];

export function getDepartmentUnit(dept: string): { unit: string; step: number; min: number } {
  if (WEIGHT_DEPARTMENTS.includes(dept)) return { unit: 'ק"ג', step: 0.5, min: 0.5 };
  if (PACKAGE_DEPARTMENTS.includes(dept)) return { unit: "חבילות", step: 1, min: 1 };
  return { unit: "יחידות", step: 1, min: 1 };
}

// מילות מפתח לסיווג אוטומטי לפי השמות החדשים
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "מוצרי חלב ומקרר": ["חלב", "גבינה", "יוגורט", "קוטג'", "שמנת", "ביצים", "טופו", "חמאה", "שוקו", "סלט", "חומוס"],
  "ירקות": ["עגבני", "מלפפון", "בצל", "תפוח אדמה", "גזר", "פלפל", "חסה", "כרוב", "ברוקולי", "קישוא", "חציל", "אבוקדו"],
  "פירות": ["תפוח", "בננה", "תפוז", "אשכולית", "ענב", "אבטיח", "מלון", "נקטרינה", "אפרסק", "שזיף", "מנגו"],
  "מזווה ושימורים": ["אורז", "פסטה", "ספגטי", "רסק", "תירס", "טונה", "שמן", "שימורים", "פתיתים", "עדשים"],
  "מאפייה ולחם": ["לחם", "לחמני", "פית", "חלה", "באגט", "עוגה", "קרואסון"],
  "קצביה": ["עוף", "בשר", "כרעיים", "שוקיים", "סטייק", "נקניק", "הודו", "שניצל", "קבב", "המבורגר"],
  "חומרי ניקוי": ["סבון", "אקונומיק", "נייר", "שקית", "ספוג", "מגב", "מרכך", "כביסה", "ניקוי", "זבל"],
  "פארם וטואלטיקה": ["שמפו", "מברשת", "משחת", "דאודורנט", "קרם", "מגבון", "חיתול"],
  "חטיפים ומתוקים": ["שוקולד", "במבה", "ביסלי", "חטיף", "סוכריות", "עוגיות", "וופל"],
  "משקאות": ["מים", "קולה", "מיץ", "בירה", "יין", "שתייה", "סודה"],
  "תבלינים ואפייה": ["קמח", "סוכר", "מלח", "אבקת אפייה", "תמצית", "שמרים", "פירורי לחם"],
  "פיצוחים ופירות יבשים": ["אגוז", "שקד", "תמר", "צימוק", "פיצוחים", "גרעינים", "קשיו"],
  "מעדניה": ["נקניק", "זיתים", "גבינה במשקל", "פסטרמה"],
  "בריאות ואורגני": ["ללא גלוטן", "אורגני", "קוואקר", "זרעי צ'יה", "קינואה"],
};

export function autoCategorize(productName: string): string {
  const name = productName.toLowerCase();
  for (const [dept, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => name.includes(kw))) return dept;
  }
  return "כללי";
}

export function isLactoseFree(productName: string): boolean {
  return productName.includes("ללא לקטוז") || productName.includes("לקטוז");
}

export function useDepartments() {
  const queryClient = useQueryClient();

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Department[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("departments-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "departments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["departments"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const departmentNames = departments.map((d) => d.name);

  const addDepartment = useMutation({
    mutationFn: async (name: string) => {
      const maxOrder = departments.reduce((max, d) => Math.max(max, d.sort_order), -1);
      const { error } = await supabase
        .from("departments")
        .insert({ name, sort_order: maxOrder + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: () => toast.error("שגיאה בהוספת מחלקה"),
  });

  const renameDepartment = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      const { error: deptErr } = await supabase
        .from("departments")
        .update({ name: newName })
        .eq("name", oldName);
      if (deptErr) throw deptErr;
      const { error: prodErr } = await supabase
        .from("products")
        .update({ department: newName })
        .eq("department", oldName);
      if (prodErr) throw prodErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("שם המחלקה עודכן");
    },
    onError: () => toast.error("שגיאה בעדכון שם המחלקה"),
  });

  const reorderDepartments = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from("departments")
          .update({ sort_order: u.sort_order })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
    onError: () => toast.error("שגיאה בשינוי סדר מחלקות"),
  });

  return {
    departments,
    departmentNames,
    isLoading,
    addDepartment,
    renameDepartment,
    reorderDepartments,
  };
}
