
ALTER TABLE public.products ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Set initial sort_order based on product name within each department
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY department ORDER BY product_name) as rn
  FROM public.products
)
UPDATE public.products SET sort_order = ranked.rn FROM ranked WHERE products.id = ranked.id;
