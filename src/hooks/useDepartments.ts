import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";
import { useSpace } from "@/contexts/SpaceContext";

export type Department = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  space_id?: string;
};

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
    "ירקות": ["עגבני", "מלפפון", "בצל", "תפוח אדמה", "גזר", "פלפל", "חסה", "כרוב", "ברוקולי", "קישוא", "חציל", "אבוקדו", "פטרוזיליה", "כוסברה", "ירק"],
    "פירות": ["תפוח", "בננה", "תפוז", "אשכולית", "ענב", "אבטיח", "מלון", "נקטרינה", "אפרסק", "שזיף", "מנגו", "תות"],
    "מוצרי חלב ומקרר": ["חלב", "גבינה", "יוגורט", "קוטג'", "שמנת", "ביצים", "טופו", "חמאה", "שוקו", "צהובה", "מעדן", "חריף", "חומוס", "טחינה"],
    "קצביה": ["עוף", "בשר", "כרעיים", "שוקיים", "סטייק", "נקניק", "הודו", "שניצל", "קבב", "המבורגר", "פרגיות", "בקר"],
    "מזווה ושימורים": ["אורז", "פסטה", "ספגטי", "רסק", "תירס", "טונה", "שמן", "שימורים", "פתיתים", "עדשים", "שעועית", "קוסקוס", "גרנולה", "דגנים", "זיתים"],
    "מאפייה ולחם": ["לחם", "לחמני", "פית", "חלה", "באגט", "עוגה", "קרואסון", "בורקס", "עוגיות"],
    "חטיפים ומתוקים": ["שוקולד", "במבה", "ביסלי", "חטיף", "סוכריות", "וופל", "מסטיק", "קינדר", "נוטלה", "דבש"],
    "משקאות": ["מים", "קולה", "מיץ", "בירה", "יין", "שתייה", "סודה", "נסטה", "תירוש", "ספרייט", "זירו"],
    "תבלינים ואפייה": ["קמח", "סוכר", "מלח", "אבקת אפייה", "תמצית", "שמרים", "פירורי לחם", "תבלין", "כמון", "פפריקה", "מרק"],
    "פארם וטואלטיקה": ["שמפו", "מברשת", "משחת", "דאודורנט", "קרם", "מגבון", "סבון גוף", "קונדישינר", "טמפון", "פד"],
    "חומרי ניקוי": ["סבון כלים", "אקונומיק", "נייר", "שקית", "ספוג", "מגב", "מרכך", "כביסה", "ניקוי", "זבל", "אבקת כביסה", "פיירי"],
    "חד-פעמי": ["צלחת", "כוס", "מזלג", "סכין", "מפית", "חד פעמי", "תבנית"],
    "תינוקות": ["חיתול", "מטרנה", "סימילאק", "גרבר", "מוצץ", "בקבוק לתינוק"],
    "פיצוחים ופירות יבשים": ["אגוז", "שקד", "תמר", "צימוק", "פיצוחים", "גרעינים", "קשיו", "פיסטוק", "בוטנים"],
    "בריאות ואורגני": ["ללא גלוטן", "אורגני", "קוואקר", "צ'יה", "קינואה", "חלב סויה", "חלב שיבולת", "טבעוני"]
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

export function useDepartments(spaceIdParam?: string) {
  const queryClient = useQueryClient();
  const { activeSpace } = useSpace();
  const currentSpaceId = spaceIdParam || activeSpace?.id;

  // 1. קריאה טהורה ובטוחה מ-Supabase בלבד
  const { data: dbDepartments = [], isLoading } = useQuery({
    queryKey: ["departments", currentSpaceId],
    queryFn: async () => {
      if (!currentSpaceId) return [];
      
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("space_id", currentSpaceId)
        .order("sort_order", { ascending: true });
        
      if (error) throw error;
      return data as Department[];
    },
    enabled: !!currentSpaceId,
  });
// התיקון האמיתי: מיזוג של השרת עם מחלקות הסטנדרט.
  // ככה מונעים מצב שהוספת מחלקה אחת לשרת מוחקת את כל ה-19 האחרות.
  const dbDeptNames = new Set(dbDepartments.map(d => d.name));
  
  const missingStandard = STANDARD_DEPARTMENTS
    .filter(name => !dbDeptNames.has(name)) // ניקח רק את הסטנדרטיות שעוד לא קיימות בשרת
    .map((name, index) => ({
        id: `std-dept-${index}`,
        name,
        sort_order: index, // נשמור על הסדר המקורי שלהן
        created_at: new Date().toISOString(),
        space_id: currentSpaceId
    }));

  // נאחד את המחלקות מהשרת יחד עם הסטנדרטיות שחסרות, ונמיין לפי סדר
  const departments = [...dbDepartments, ...missingStandard].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  useEffect(() => {
    if (!currentSpaceId) return;

    const uniqueChannelName = `departments-realtime-${currentSpaceId}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(uniqueChannelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "departments", filter: `space_id=eq.${currentSpaceId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["departments", currentSpaceId] });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, currentSpaceId]);

  const syncStandardDepartments = useMutation({
    mutationFn: async () => {
      if (!currentSpaceId) throw new Error("No active space");

      const RENAME_MAP: Record<string, string> = {
        "מקרר": "מוצרי חלב ומקרר",
        "מוצרי יבש": "מזווה ושימורים",
        "מאפייה": "מאפייה ולחם",
        "ניקיון": "חומרי ניקוי",
        "פארם": "פארם וטואלטיקה"
      };

      const { data: currentDepts } = await supabase.from("departments").select("*").eq("space_id", currentSpaceId);
      
      for (const dept of (currentDepts || [])) {
        if (RENAME_MAP[dept.name]) {
          const newName = RENAME_MAP[dept.name];
          await supabase.from("products")
            .update({ department: newName })
            .eq("department", dept.name)
            .eq("space_id", currentSpaceId);
          await supabase.from("departments").delete().eq("id", dept.id);
        }
      }

      const { data: afterUpdateDepts } = await supabase.from("departments").select("name").eq("space_id", currentSpaceId);
      const currentNames = afterUpdateDepts?.map(d => d.name) || [];
      const toAdd = STANDARD_DEPARTMENTS.filter(name => !currentNames.includes(name));

      if (toAdd.length > 0) {
        const { data: maxOrderData } = await supabase.from("departments").select("sort_order").eq("space_id", currentSpaceId).order("sort_order", { ascending: false }).limit(1);
        const maxOrder = maxOrderData?.[0]?.sort_order ?? -1;
        
        const inserts = toAdd.map((name, index) => ({
          name,
          sort_order: maxOrder + 1 + index,
          space_id: currentSpaceId
        }));
        await supabase.from("departments").insert(inserts);
      }

      const { data: finalDepts } = await supabase.from("departments").select("*").eq("space_id", currentSpaceId);
      const deptsToDelete = (finalDepts || []).filter(d => !STANDARD_DEPARTMENTS.includes(d.name));
      
      for (const dept of deptsToDelete) {
        await supabase.from("products").update({ department: "כללי" }).eq("department", dept.name).eq("space_id", currentSpaceId);
        await supabase.from("departments").delete().eq("id", dept.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", currentSpaceId] });
      queryClient.invalidateQueries({ queryKey: ["products", currentSpaceId] });
      toast.success("סנכרון הושלם: המחלקות והמוצרים עודכנו לחלל זה.");
    },
    onError: () => toast.error("שגיאה בסנכרון מחלקות"),
  });

  const addDepartment = useMutation({
    mutationFn: async (name: string) => {
      if (!currentSpaceId) throw new Error("No active space");
      const { data: maxOrderData } = await supabase.from("departments").select("sort_order").eq("space_id", currentSpaceId).order("sort_order", { ascending: false }).limit(1);
      const maxOrder = maxOrderData?.[0]?.sort_order ?? -1;
      const { error } = await supabase.from("departments").insert({ name, sort_order: maxOrder + 1, space_id: currentSpaceId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments", currentSpaceId] }),
  });

  const renameDepartment = useMutation({
    mutationFn: async ({ oldName, newName }: { oldName: string; newName: string }) => {
      if (!currentSpaceId) throw new Error("No active space");
      const { error: deptErr } = await supabase.from("departments").update({ name: newName }).eq("name", oldName).eq("space_id", currentSpaceId);
      if (deptErr) throw deptErr;
      const { error: prodErr } = await supabase.from("products").update({ department: newName }).eq("department", oldName).eq("space_id", currentSpaceId);
      if (prodErr) throw prodErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", currentSpaceId] });
      queryClient.invalidateQueries({ queryKey: ["products", currentSpaceId] });
      toast.success("שם המחלקה עודכן");
    },
    onError: () => toast.error("שגיאה בעדכון שם המחלקה"),
  });

  const reorderDepartments = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        await supabase.from("departments").update({ sort_order: u.sort_order }).eq("id", u.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments", currentSpaceId] }),
  });

 return {
    departments,
    // עכשיו זה פשוט ונקי - המדפים למעלה כבר מסודרים, אז פשוט שולפים מהם את השמות:
    departmentNames: departments.map(d => d.name),
    isLoading,
    syncStandardDepartments,
    addDepartment,
    renameDepartment,
    reorderDepartments
  };
}
