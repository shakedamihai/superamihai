import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DepartmentComboboxProps {
  value: string;
  onChange: (value: string) => void;
  departments: string[];
  onAddDepartment?: (name: string) => void;
}

export function DepartmentCombobox({
  value,
  onChange,
  departments,
  onAddDepartment,
}: DepartmentComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = departments.filter((d) =>
    d.includes(search)
  );

  const showAddOption = search.trim() && !departments.includes(search.trim());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (dept: string) => {
    onChange(dept);
    setSearch("");
    setOpen(false);
  };

  const handleAdd = () => {
    const name = search.trim();
    if (!name) return;
    onAddDepartment?.(name);
    onChange(name);
    setSearch("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        )}
      >
        <span>{value || "בחר מחלקה..."}</span>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <div className="p-2">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש או הקלד מחלקה חדשה..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleSelect(d)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                  value === d && "bg-accent"
                )}
              >
                <Check className={cn("h-4 w-4", value === d ? "opacity-100" : "opacity-0")} />
                {d}
              </button>
            ))}
            {showAddOption && (
              <button
                type="button"
                onClick={handleAdd}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-primary font-medium"
              >
                <Plus className="h-4 w-4" />
                הוסף "{search.trim()}"
              </button>
            )}
            {filtered.length === 0 && !showAddOption && (
              <div className="px-3 py-2 text-sm text-muted-foreground">לא נמצאו תוצאות</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
