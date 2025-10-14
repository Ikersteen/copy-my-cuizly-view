-- Corriger les dates de Noël et Boxing Day
UPDATE restaurant_holidays 
SET holiday_date = '2025-12-25' 
WHERE holiday_name LIKE '%Noël%' AND holiday_name LIKE '%Christmas%';

UPDATE restaurant_holidays 
SET holiday_date = '2025-12-26' 
WHERE holiday_name LIKE '%Boxing Day%';