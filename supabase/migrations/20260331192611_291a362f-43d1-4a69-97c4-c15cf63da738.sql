
-- Create departments table for managing department names and order
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert departments" ON public.departments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update departments" ON public.departments FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete departments" ON public.departments FOR DELETE TO public USING (true);

-- Seed with existing departments
INSERT INTO public.departments (name, sort_order) VALUES
  ('מקרר', 0),
  ('ירקות', 1),
  ('פירות', 2),
  ('מוצרי יבש', 3),
  ('מאפייה', 4),
  ('קצביה', 5),
  ('ניקיון', 6),
  ('פארם', 7),
  ('קפואים', 8),
  ('כללי', 9);

-- Change base_quantity and current_stock to numeric for 0.5kg increments
ALTER TABLE public.products ALTER COLUMN base_quantity TYPE numeric USING base_quantity::numeric;
ALTER TABLE public.products ALTER COLUMN current_stock TYPE numeric USING current_stock::numeric;

-- Enable realtime for departments
ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
