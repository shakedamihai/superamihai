import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Plus } from "lucide-react";

// הרשימה המעודכנת והתקנית ברבים
const DEFAULT_UNITS = ['ק"ג', "גרם", "יחידות", "חבילות", "מארזים", "ליטרים", "בקבוקים", "פחיות", "גלילים"];

interface UnitComboboxProps {
  value: string;
  onChange: (unit: string) => void;
}

export function UnitCombobox({ value, onChange }: UnitComboboxProps) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newUnit, setNewUnit] = useState("");

  const handleAdd = () => {
    if (newUnit.trim()) {
      onChange(newUnit.trim());
      setNewUnit("");
      setAdding(false);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {value || "בחר יחידה"}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2" align="start">
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {DEFAULT_UNITS.map((u) => (
            <button
              key={u}
              onClick={() => { onChange(u); setOpen(false); setAdding(false); }}
              className={`w-full text-right px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors ${
                value === u ? "bg-primary/10 text-primary font-medium" : ""
              }`}
            >
              {u}
            </button>
          ))}
          {adding ? (
            <div className="flex gap-1 pt-1">
              <Input
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="יחידה חדשה..."
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button size="sm" className="h-8 px-2" onClick={handleAdd}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full text-right px-3 py-2 rounded-md text-sm text-primary hover:bg-accent transition-colors flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              הוסף חדש
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
