-- Migrate existing addresses to the new addresses table

-- Function to migrate restaurant addresses
CREATE OR REPLACE FUNCTION migrate_restaurant_addresses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO addresses (
    user_id,
    address_type,
    formatted_address,
    is_primary,
    is_active
  )
  SELECT 
    owner_id as user_id,
    'restaurant' as address_type,
    address as formatted_address,
    true as is_primary,
    is_active
  FROM restaurants 
  WHERE address IS NOT NULL 
    AND address != ''
    AND owner_id IS NOT NULL
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Migrated restaurant addresses';
END;
$$;

-- Function to migrate user preference addresses
CREATE OR REPLACE FUNCTION migrate_user_addresses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO addresses (
    user_id,
    address_type,
    formatted_address,
    street_name,
    neighborhood,
    postal_code,
    is_primary,
    is_active
  )
  SELECT 
    user_id,
    'user_delivery' as address_type,
    COALESCE(full_address, 
      CASE 
        WHEN street IS NOT NULL AND neighborhood IS NOT NULL THEN 
          street || ', ' || neighborhood || ', Montréal, QC' || COALESCE(' ' || postal_code, '')
        WHEN neighborhood IS NOT NULL THEN 
          neighborhood || ', Montréal, QC' || COALESCE(' ' || postal_code, '')
        WHEN street IS NOT NULL THEN 
          street || ', Montréal, QC' || COALESCE(' ' || postal_code, '')
        ELSE 'Montréal, QC' || COALESCE(' ' || postal_code, '')
      END
    ) as formatted_address,
    street as street_name,
    neighborhood,
    postal_code,
    true as is_primary,
    true as is_active
  FROM user_preferences 
  WHERE (full_address IS NOT NULL AND full_address != '')
     OR (street IS NOT NULL AND street != '')
     OR (neighborhood IS NOT NULL AND neighborhood != '')
     OR (postal_code IS NOT NULL AND postal_code != '')
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Migrated user delivery addresses';
END;
$$;

-- Execute the migration functions
SELECT migrate_restaurant_addresses();
SELECT migrate_user_addresses();

-- Clean up migration functions (optional, but good practice)
DROP FUNCTION IF EXISTS migrate_restaurant_addresses();
DROP FUNCTION IF EXISTS migrate_user_addresses();