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

// מילות מפתח לסיווג אוטומטי למחלקות החדשות
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "ירקות": ["עגבני", "מלפפון", "בצל", "תפוח אדמה", "גזר", "פלפל", "חסה", "כרוב", "ברוקולי", "קישוא", "חציל", "אבוקדו"],
  "פירות": ["תפוח", "בננה", "תפוז", "אשכולית", "ענב", "אבטיח", "מלון", "נקטרינה", "אפרסק", "שזיף", "מנגו", "תמר"],
  "מוצרי חלב ומקרר": ["חלב", "גבינה", "יוגורט", "קוטג'", "שמנת", "ביצים", "טופו", "חמאה", "שוקו", "יוגורט"],
  "קצביה": ["עוף", "בשר", "כרעיים", "שוקיים", "סטייק", "נקניק", "הודו", "שניצל", "קבב", "המבורגר"],
  "מזווה ושימורים": ["אורז", "פסטה", "ספגטי", "רסק", "תירס", "טונה", "שמן", "שימורים", "פתיתים", "עדשים", "שעועית", "גרנולה"],
  "מאפייה ולחם": ["לחם", "לחמני", "פית", "חלה", "באגט", "עוגה", "קרואסון"],
  "חומרי ניקוי": ["סבון", "אקונומיק", "נייר", "שקית", "ספוג", "מגב", "מרכך", "כביסה", "ניקוי", "זבל"],
  "פארם וטואלטיקה": ["שמפו", "מברשת", "משחת", "דאודורנט", "קרם", "מגבון", "חיתול"],
  "חטיפים ומתוקים": ["שוקולד", "במבה", "ביסלי", "חטיף", "סוכריות", "עוגיות", "וופל"],
  "משקאות": ["מים", "קולה", "מיץ", "בירה", "יין", "שתייה", "סודה"],
  "תבלינים ואפייה": ["קמח", "סוכר", "מלח", "אבקת אפייה", "תמצית", "שמרים", "פירורי לחם"],
  "פיצוחים ופירות יבשים": ["אגוז", "שקד", "פיצוחים", "גרעינים", "קשיו", "פיסטוק"],
  "מעדניה": ["זיתים", "פסטרמה", "סלטים"],
  "בריאות ואורגני": ["ללא גלוטן", "אורגני", "קוואקר", "צ'יה", "קינואה"],
};

export function autoCategorize(productName: string): string {
  const name = productName.toLowerCase();
  for (const [dept, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => name.includes(kw))) return dept;
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

  const addDepartment = useMutation({
    mutationFn: async (name: string) => {
      const maxOrder = departments.reduce((max, d) => Math.max(max, d.sort_order), -1);
      const { error } = await supabase
        .from("departments")
        .insert({ name, sort_order: maxOrder + 1 });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });

  // מוטציה חדשה להוספת כל המחלקות הסטנדרטיות בבת אחת
  const syncStandardDepartments = useMutation({
    mutationFn: async () => {
      const existingNames = departments.map(d => d.name);
      const toAdd = STANDARD_DEPARTMENTS.filter(name => !existingNames.includes(name));
      
      if (toAdd.length === 0) return;

      const maxOrder = departments.reduce((max, d) => Math.max(max, d.sort_order), -1);
      const inserts = toAdd.map((name, index) => ({
        name,
        sort_order: maxOrder + 1 + index
      }));

      const { error } = await supabase.from("departments").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("כל המחלקות המומלצות התווספו!");
    },
    onError: () => toast.error("שגיאה בסנכרון מחלקות"),
  });

  return {
    departments,
    departmentNames: departments.map((d) => d.name),
    isLoading,
    addDepartment,
    syncStandardDepartments,
  };
}
