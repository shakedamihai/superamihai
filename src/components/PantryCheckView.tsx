import { ChevronDown, Pencil } from "lucide-react";
import { Product, getDepartmentColor } from "@/hooks/useProducts";
import { Department } from "@/hooks/useDepartments";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { EditProductDialog } from "./EditProductDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SortableProductRow } from "./SortableProductRow";

interface PantryCheckViewProps {
  productsByDepartment: Record<string, Product[]>;
  departments: Department[];
  onUpdateStock: (id: string, stock: number) => void;
  onUpdateProduct: (updates: { id: string; product_name?: string; department?: string; base_quantity?: number }) => void;
  onDeleteProduct: (id: string) => void;
  onRenameDepartment: (oldName: string, newName: string) => void;
  departmentNames: string[];
  onAddDepartment: (name: string) => void;
}

export function PantryCheckView({
  productsByDepartment,
  departments,
  onUpdateStock,
  onUpdateProduct,
  onDeleteProduct,
  onRenameDepartment,
  departmentNames,
  onAddDepartment,
}: PantryCheckViewProps) {
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [renameDept, setRenameDept] = useState<{ oldName: string; newName: string } | null>(null);

  const recurringByDept = Object.entries(productsByDepartment || {}).reduce((acc, [dept, items]) => {
    const recurring = (items || []).filter((p) => !p.is_one_time);
    if (recurring.length > 0) acc[dept] = recurring;
    return acc;
  }, {} as Record<string, Product[]>);

  const orderedDepts = [...(departments || [])]
    .filter((d) => recurringByDept[d.name])
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="w-full flex flex-col items-center py-4 min-h-screen bg-background overflow-x-hidden">
      <div className="w-full max-w-[calc(100vw-32px)] space-y-4">
        {orderedDepts.map((dept) => (
          <div key={dept.id} className="w-full">
            <Collapsible 
              open={openDepts[dept.name] !== false} 
              onOpenChange={(open) => setOpenDepts(prev => ({ ...prev, [dept.name]: open }))}
            >
              <div className="flex items-center gap-2">
                <CollapsibleTrigger className={`flex-1 flex items-center justify-between px-4 py-3 rounded-lg border font-bold shadow-sm ${getDepartmentColor(dept.name)}`}>
                  <span>{dept.name} ({recurringByDept[dept.name]?.length || 0})</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openDepts[dept.name] !== false ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <button 
                  onClick={(e) => { e.stopPropagation(); setRenameDept({ oldName: dept.name, newName: dept.name }); }} 
                  className="w-11 h-11 flex items-center justify-center border rounded-lg bg-card shadow-sm shrink-0"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <CollapsibleContent className="mt-2 space-y-2 pb-4">
                <div className="flex flex-col gap-2">
                  {recurringByDept[dept.name]?.map((p) => (
                    <SortableProductRow 
                      key={p.id} 
                      product={p} 
                      onUpdateStock={onUpdateStock} 
                      onEdit={setEditProduct} 
                      onDelete={setDeleteTarget} 
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
      </div>

      <EditProductDialog product={editProduct} open={!!editProduct} onClose={() => setEditProduct(null)} onSave={onUpdateProduct} departmentNames={departmentNames} onAddDepartment={onAddDepartment} />
      
      <Dialog open={!!renameDept} onOpenChange={(o) => !o && setRenameDept(null)}>
        <DialogContent className="max-w-[90vw] rounded-2xl p-6">
          <DialogHeader><DialogTitle className="text-right">עריכת מחלקה</DialogTitle></DialogHeader>
          <div className="py-4"><Input value={renameDept?.newName || ""} onChange={(e) => setRenameDept(p => p ? { ...p, newName: e.target.value } : null)} className="text-right h-12" autoFocus /></div>
          <DialogFooter className="flex-row-reverse gap-3">
            <Button className="h-12 flex-1 font-bold" onClick={() => { if (renameDept?.newName.trim()) onRenameDepartment(renameDept.oldName, renameDept.newName.trim()); setRenameDept(null); }}>שמור שם חדש</Button>
            <Button variant="outline" className="h-12 flex-1" onClick={() => setRenameDept(null)}>ביטול</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">מחיקת מוצר</AlertDialogTitle>
            <AlertDialogDescription className="text-right">למחוק את "{deleteTarget?.product_name}"? לא ניתן לבטל.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction className="bg-destructive" onClick={() => { if (deleteTarget) onDeleteProduct(deleteTarget.id); setDeleteTarget(null); }}>מחק</AlertDialogAction>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
