
ALTER TABLE public.products ADD COLUMN unit text NOT NULL DEFAULT 'יחידות';

-- Migrate existing products based on department
UPDATE public.products SET unit = 'קילו' WHERE department IN ('ירקות', 'פירות', 'קצביה');
UPDATE public.products SET unit = 'חבילות' WHERE department = 'מאפייה';
