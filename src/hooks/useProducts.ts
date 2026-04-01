import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";
import { getDepartmentUnit } from "./useDepartments";

export type Product = {
  id: string;
  product_name: string;
  department: string;
  base_quantity: number;
  current_stock: number;
  is_one_time: boolean;
  created_at: string;
  sort_order: number;
  updated_at: string;
};

export const getDepartmentColor = (dept: string) => {
  const map: Record<string, string> = {
    "מקרר": "bg-department-fridge/15 text-department-fridge border-department-fridge/30",
    "ירקות": "bg-department-vegetables/15 text-department-vegetables border-department-vegetables/30",
    "פירות": "bg-secondary/15 text-secondary border-secondary/30",
    "מוצרי יבש": "bg-department-dry/15 text-department-dry border-department-dry/30",
    "מאפייה": "bg-muted text-muted-foreground border-border",
    "קצביה": "bg-destructive/15 text-destructive border-destructive/30",
    "ניקיון": "bg-department-cleaning/15 text-department-cleaning border-department-cleaning/30",
    "פארם": "bg-department-pharmacy/15 text-department-pharmacy border-department-pharmacy/30",
  };
  return map[dept] || "bg-muted text-muted-foreground border-border";
};

export function useProducts() {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("department", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("product_name", { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("products-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["products"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const addProduct = useMutation({
    mutationFn: async (product: {
      product_name: string;
      department: string;
      base_quantity: number;
      current_stock?: number;
      is_one_time?: boolean;
    }) => {
      const { error } = await supabase.from("products").insert(product);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("המוצר נוסף בהצלחה");
    },
    onError: () => toast.error("שגיאה בהוספת מוצר"),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; product_name?: string; department?: string; base_quantity?: number; current_stock?: number }) => {
      const { error } = await supabase.from("products").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("המוצר עודכן");
    },
    onError: () => toast.error("שגיאה בעדכון מוצר"),
  });

  const updateStock = useMutation({
    mutationFn: async ({ id, current_stock }: { id: string; current_stock: number }) => {
      const { error } = await supabase.from("products").update({ current_stock }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    onError: () => toast.error("שגיאה בעדכון מלאי"),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("המוצר נמחק");
    },
    onError: () => toast.error("שגיאה במחיקת מוצר"),
  });

  const reorderProducts = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase.from("products").update({ sort_order: u.sort_order }).eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
    onError: () => toast.error("שגיאה בשינוי סדר"),
  });

  const finishChecked = useMutation({
    mutationFn: async (checkedIds: Set<string>) => {
      const checkedProducts = products.filter((p) => checkedIds.has(p.id));
      // For non-one-time checked items, reset stock to base
      const toReset = checkedProducts.filter((p) => !p.is_one_time);
      for (const p of toReset) {
        const { error } = await supabase
          .from("products")
          .update({ current_stock: p.base_quantity })
          .eq("id", p.id);
        if (error) throw error;
      }
      // Delete one-time checked items
      const oneTimeIds = checkedProducts.filter((p) => p.is_one_time).map((p) => p.id);
      if (oneTimeIds.length > 0) {
        const { error } = await supabase.from("products").delete().in("id", oneTimeIds);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("המוצרים שנקנו עודכנו!");
    },
    onError: () => toast.error("שגיאה בעדכון"),
  });

  const shoppingList = products.filter((p) => {
    if (p.is_one_time) return true;
    return p.base_quantity - p.current_stock > 0;
  });

  const productsByDepartment = products.reduce((acc, p) => {
    if (!acc[p.department]) acc[p.department] = [];
    acc[p.department].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  const shoppingByDepartment = shoppingList.reduce((acc, p) => {
    if (!acc[p.department]) acc[p.department] = [];
    acc[p.department].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  const copyListAsText = () => {
    const lines = shoppingList.map((p) => {
      const qty = p.is_one_time ? 1 : p.base_quantity - p.current_stock;
      const { unit } = getDepartmentUnit(p.department);
      return `${qty} ${unit} ${p.product_name}`;
    });
    navigator.clipboard.writeText(lines.join(", "));
    toast.success("הרשימה הועתקה!");
  };

  return {
    products,
    isLoading,
    productsByDepartment,
    shoppingList,
    shoppingByDepartment,
    addProduct,
    updateProduct,
    updateStock,
    deleteProduct,
    reorderProducts,
    finishChecked,
    copyListAsText,
  };
}
