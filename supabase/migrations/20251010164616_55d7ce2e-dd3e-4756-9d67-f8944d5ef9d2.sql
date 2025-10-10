-- Add category, subcategory and pdf_menu_url columns to menus table
ALTER TABLE public.menus 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS pdf_menu_url TEXT;

-- Add comment to explain the structure
COMMENT ON COLUMN public.menus.category IS 'Main category (e.g., Boissons, Plats, Desserts)';
COMMENT ON COLUMN public.menus.subcategory IS 'Subcategory under main category (e.g., Cocktails, Vins under Boissons)';
COMMENT ON COLUMN public.menus.pdf_menu_url IS 'Optional external PDF menu link for redirection';