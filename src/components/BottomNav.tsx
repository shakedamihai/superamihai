import { ShoppingCart, ClipboardList, Plus } from "lucide-react";

type Tab = "shopping" | "pantry" | "add";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  shoppingCount: number;
}

export function BottomNav({ active, onChange, shoppingCount }: BottomNavProps) {
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "shopping",
      label: "רשימת קניות",
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      id: "pantry",
      label: "בדיקת מלאי",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      id: "add",
      label: "הוספה",
      icon: <Plus className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors relative ${
              active === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            <span className="text-[11px] font-medium">{tab.label}</span>
            {tab.id === "shopping" && shoppingCount > 0 && (
              <span className="absolute -top-0.5 right-1 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {shoppingCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
