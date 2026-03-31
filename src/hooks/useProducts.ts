import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";

export type Product = {
  id: string;
  product_name: string;
  department: string;
  base_quantity: number;
  current_stock: number;
  is_one_time: boolean;
  created_at: string;
  updated_at: string;
};

export const DEPARTMENTS = [
  "מקרר",
  "ירקות ופירות",
  "מוצרי יבש",
  "מאפייה",
  "קצביה",
  "ניקיון",
  "פארם",
  "קפואים",
  "כללי",
] as const;

export const getDepartmentColor = (dept: string) => {
  const map: Record<string, string> = {
    "מקרר": "bg-department-fridge/15 text-department-fridge border-department-fridge/30",
    "ירקות ופירות": "bg-department-vegetables/15 text-department-vegetables border-department-vegetables/30",
    "מוצרי יבש": "bg-department-dry/15 text-department-dry border-department-dry/30",
    "מאפייה": "bg-secondary/15 text-secondary border-secondary/30",
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
        .order("product_name", { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
  });

  // Realtime subscription
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
      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id);
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
      const { error } = await supabase
        .from("products")
        .update({ current_stock })
        .eq("id", id);
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

  const finishShopping = useMutation({
    mutationFn: async () => {
      // Get items that need buying (to_buy > 0)
      const toBuy = products.filter(
        (p) => !p.is_one_time && p.base_quantity - p.current_stock > 0
      );
      // Set current_stock = base_quantity for recurring items
      for (const p of toBuy) {
        const { error } = await supabase
          .from("products")
          .update({ current_stock: p.base_quantity })
          .eq("id", p.id);
        if (error) throw error;
      }
      // Delete one-time items
      const oneTimeIds = products.filter((p) => p.is_one_time).map((p) => p.id);
      if (oneTimeIds.length > 0) {
        const { error } = await supabase
          .from("products")
          .delete()
          .in("id", oneTimeIds);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("הקניות הושלמו! המלאי עודכן");
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
      return `${qty} ${p.product_name}`;
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
    finishShopping,
    copyListAsText,
  };
}
