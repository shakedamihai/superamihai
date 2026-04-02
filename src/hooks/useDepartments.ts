import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Department = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

// רשימת המחלקות המומלצות והקבועות
export const STANDARD_DEPARTMENTS = [
  "ירקות", "פירות", "מוצרי חלב ומקרר", "קצביה", "דגים", "קפואים",
  "מזווה ושימורים", "תבלינים ואפייה", "מאפייה ולחם", "חטיפים ומתוקים",
  "משקאות", "פארם וטואלטיקה", "חומרי ניקוי", "חד-פעמי", "תינוקות",
  "פיצוחים ופירות יבשים", "מעדניה", "בריאות ואורגני", "כללי"
];

const WEIGHT_DEPARTMENTS = ["ירקות", "פירות", "קצביה", "מעדניה", "דגים"];
const PACKAGE_DEPARTMENTS = ["מאפייה ולחם", "חד-פעמי"];

export function getDepartmentUnit(dept: string): { unit: string; step: number; min: number } {
  if (WEIGHT_DEPARTMENTS.includes(dept)) return { unit: 'ק"ג', step: 0.5, min: 0.5 };
  if (PACKAGE_DEPARTMENTS.includes(dept)) return { unit: "חבילות", step: 1, min: 1 };
  return { unit: "יחידות", step: 1, min: 1 };
}

export function autoCategorize(productName: string): string {
  const name = productName.toLowerCase();
  const keywords: Record<string, string[]> = {
    "ירקות": ["עגבני", "מלפפון", "בצל", "תפוח אדמה", "גזר", "פלפל", "חסה", "כרוב", "ברוקולי", "קישוא", "חציל", "אבוקדו"],
    "פירות": ["תפוח", "בננה", "תפוז", "אשכולית", "ענב", "אבטיח", "מלון", "נקטרינה", "אפרסק", "שזיף", "מנגו", "תמר"],
    "מוצרי חלב ומקרר": ["חלב", "גבינה", "יוגורט", "קוטג'", "שמנת", "ביצים", "טופו", "חמאה", "שוקו", "יוגורט"],
    "קצביה": ["עוף", "בשר", "כרעיים", "שוקיים", "סטייק", "נקניק", "הודו", "שניצל", "קבב", "המבורגר"],
    "מזווה ושימורים": ["אורז", "פסטה", "ספגטי", "רסק", "תירס", "טונה", "שמן", "שימורים", "פתיתים", "עדשים"],
    "מאפייה ולחם": ["לחם", "לחמני", "פית", "חלה", "באגט", "עוגה", "קרואסון"]
  };

  for (const [dept, kws] of Object.entries(keywords)) {
    if (kws.some((kw) => name.includes(kw))) return dept;
  }
  return "כללי";
}

export function isLactoseFree(productName: string): boolean {
  const name = productName.toLowerCase();
  return name.includes("ללא לקטוז") || name.includes("לקטוז");
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

  const syncStandardDepartments = useMutation({
    mutationFn: async () => {
      // 1. הגדרת מיפוי שמות ישנים לחדשים
      const RENAME_MAP: Record<string, string> = {
        "מקרר": "מוצרי חלב ומקרר",
        "מוצרי יבש": "מזווה ושימורים",
        "מאפייה": "מאפייה ולחם",
        "ניקיון": "חומרי ניקוי",
        "פארם": "פארם וטואלטיקה"
      };

      // 2. עדכון מוצרים ומחיקת מחלקות ישנות שמוחלפות
      const { data: currentDepts } = await supabase.from("departments").select("*");
      for (const dept of (currentDepts || [])) {
        if (RENAME_MAP[dept.name]) {
          const newName = RENAME_MAP[dept.name];
          // מעביר את כל המוצרים למחלקה החדשה
          await supabase.from("products").update({ department: newName }).eq("department", dept.name);
          // מוחק את המחלקה הישנה (היא תיווצר מחדש בשם הנכון בשלב 3 אם צריך)
          await supabase.from("departments").delete().eq("id", dept.id);
        }
      }

      // 3. הוספת כל המחלקות הסטנדרטיות שחסרות
      const { data: afterUpdateDepts } = await supabase.from("departments").select("name");
      const currentNames = afterUpdateDepts?.map(d => d.name) || [];
      const toAdd = STANDARD_DEPARTMENTS.filter(name => !currentNames.includes(name));

      if (toAdd.length > 0) {
        const { data: maxOrderData } = await supabase.from("departments").select("sort_order").order("sort_order", { ascending: false }).limit(1);
        const maxOrder = maxOrderData?.[0]?.sort_order ?? -1;
        
        const inserts = toAdd.map((name, index) => ({
          name,
          sort_order: maxOrder + 1 + index
        }));
        await supabase.from("departments").insert(inserts);
      }

      // 4. מחיקה סופית של כל מחלקה שאינה ברשימה הסטנדרטית
      const { data: finalDepts } = await supabase.from("departments").select("*");
      const deptsToDelete = (finalDepts || []).filter(d => !STANDARD_DEPARTMENTS.includes(d.name));
      
      for (const dept of deptsToDelete) {
        await supabase.from("products").update({ department: "כללי" }).eq("department", dept.name);
        await supabase.from("departments").delete().eq("id", dept.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("סנכרון מלא הושלם: מחלקות ישנות נמחקו והמוצרים עודכנו");
    },
    onError: () => toast.error("שגיאה בסנכרון מחלקות"),
  });

  const addDepartment = useMutation({
    mutationFn: async (name: string) => {
      const { data: maxOrderData } = await supabase.from("departments").select("sort_order").order("sort_order", { ascending: false }).limit(1);
      const maxOrder = maxOrderData?.[0]?.sort_order ?? -1;
      const { error } = await supabase.from("departments").insert({ name, sort_order: maxOrder + 1 });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });

  const reorderDepartments = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        await supabase.from("departments").update({ sort_order: u.sort_order }).eq("id", u.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });

  return {
    departments,
    departmentNames: departments.map((d) => d.name),
    isLoading,
    syncStandardDepartments,
    addDepartment,
    reorderDepartments,
  };
}
