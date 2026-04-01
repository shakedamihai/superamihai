// ... (כל ה-imports נשארים אותו דבר)

export function PantryCheckView({
  productsByDepartment,
  departments,
  onUpdateStock,
  onUpdateProduct,
  onDeleteProduct,
  onReorderProducts,
  onRenameDepartment,
  onReorderDepartments,
  departmentNames,
  onAddDepartment,
}: PantryCheckViewProps) {
  const [localOrderedDepts, setLocalOrderedDepts] = useState<Department[]>([]);
  const [localProductsByDept, setLocalProductsByDept] = useState<Record<string, Product[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [renameDept, setRenameDept] = useState<{ oldName: string; newName: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 10 } })
  );

  // סנכרון חכם: רק אם יש שינוי בכמות או בנתונים בסיסיים, לא בגלל סדר
  useEffect(() => {
    const recurring = Object.entries(productsByDepartment || {}).reduce((acc, [dept, items]) => {
      const rec = (items || []).filter((p) => !p.is_one_time);
      if (rec.length > 0) acc[dept] = rec;
      return acc;
    }, {} as Record<string, Product[]>);

    const ordered = [...(departments || [])]
      .filter((d) => recurring[d.name])
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    // בודקים אם באמת יש שינוי מהותי לפני שמעדכנים את ה-State המקומי
    // זה מונע את ה"קפיצה" של הדיליי
    if (JSON.stringify(ordered.map(d => d.id)) !== JSON.stringify(localOrderedDepts.map(d => d.id))) {
       setLocalOrderedDepts(ordered);
    }
    setLocalProductsByDept(recurring);
  }, [departments, productsByDepartment]);

  const handleDeptDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDeptDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = localOrderedDepts.findIndex((d) => d.id === active.id);
      const newIndex = localOrderedDepts.findIndex((d) => d.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // 1. עדכון אופטימי מיידי
        const reordered = arrayMove(localOrderedDepts, oldIndex, newIndex);
        setLocalOrderedDepts(reordered);
        
        // 2. עדכון שקט בשרת
        onReorderDepartments(reordered.map((d, i) => ({ id: d.id, sort_order: i })));
      }
    }
    
    // מאפסים את ה-ID רק בסוף כדי שהאנימציה תסתיים חלק
    setTimeout(() => setActiveId(null), 50);
  };

  const handleProductDragEnd = (deptName: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const items = localProductsByDept[deptName];
    if (items) {
      const oldIndex = items.findIndex((p) => p.id === active.id);
      const newIndex = items.findIndex((p) => p.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        setLocalProductsByDept(prev => ({ ...prev, [deptName]: reordered }));
        onReorderProducts(reordered.map((p, i) => ({ id: p.id, sort_order: i })));
      }
    }
  };

  return (
    // ... שאר ה-JSX נשאר אותו דבר, רק תוודאי שאת משתמשת ב-localOrderedDepts וב-localProductsByDept במפות (Maps)
  );
}
