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

// רשימת המחלקות המומלצות שסיכמנו עליהן
export const STANDARD_DEPARTMENTS = [
  "ירקות", "פירות", "מוצרי חלב ומקרר", "קצביה", "דגים", "קפואים",
  "מזווה ושימורים", "תבלינים ואפייה", "מאפייה ולחם", "חטיפים ומתוקים",
  "משקאות", "פארם וטואלטיקה", "חומרי ניקוי", "חד-פעמי", "תינוקות",
  "פיצוחים ופירות יבשים", "מעדניה", "בריאות ואורגני"
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
    "מוצרי חלב ומקרר": ["חלב", "גבינה", "יוגורט", "קוטג'", "שמנת", "ביצים", "טופו", "חמאה", "שוקו"],
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

  const renameDepartment = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      const { error: deptErr } = await supabase.from("departments").update({ name: newName }).eq("name", oldName);
      if (deptErr) throw deptErr;
      const { error: prodErr } = await supabase.from("products").update({ department: newName }).eq("department", oldName);
      if (prodErr) throw prodErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });

  const syncStandardDepartments = useMutation({
    mutationFn: async () => {
      // 1. מיפוי שמות ישנים לשמות חדשים
      const RENAME_MAP: Record<string, string> = {
        "מקרר": "מוצרי חלב ומקרר",
        "מוצרי יבש": "מזווה ושימורים",
        "מאפייה": "מאפייה ולחם",
        "ניקיון": "חומרי ניקוי",
        "פארם": "פארם וטואלטיקה"
      };

      for (const dept of departments) {
        if (RENAME_MAP[dept.name]) {
          await renameDepartment.mutateAsync({ oldName: dept.name, newName: RENAME_MAP[dept.name] });
        }
      }

      // 2. הוספת מחלקות חסרות (אחרי העדכון)
      const { data: updatedDepts } = await supabase.from("departments").select("name");
      const currentNames = updatedDepts?.map(d => d.name) || [];
      const toAdd = STANDARD_DEPARTMENTS.filter(name => !currentNames.includes(name));

      if (toAdd.length > 0) {
        const maxOrder = departments.reduce((max, d) => Math.max(max, d.sort_order), -1);
        const inserts = toAdd.map((name, index) => ({
          name,
          sort_order: maxOrder + 1 + index
        }));
        await supabase.from("departments").insert(inserts);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("סנכרון השמות והמחלקות הושלם!");
    },
    onError: () => toast.error("שגיאה בסנכרון מחלקות"),
  });

  return {
    departments,
    departmentNames: departments.map((d) => d.name),
    isLoading,
    syncStandardDepartments,
    addDepartment: (name: string) => {}, // Placeholder
    renameDepartment,
    reorderDepartments: (updates: any) => {} // Placeholder
  };
}
