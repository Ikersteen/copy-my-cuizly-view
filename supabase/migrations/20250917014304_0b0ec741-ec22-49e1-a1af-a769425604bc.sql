-- Mettre à jour l'adresse du restaurant existant
UPDATE restaurants 
SET address = '1234 Rue Saint-Denis, Montréal, QC H2X 3J2'
WHERE name = 'Nouilles Star';

-- Ajouter un restaurant d'exemple avec une adresse spécifique
INSERT INTO restaurants (
    owner_id, 
    name, 
    description, 
    address, 
    cuisine_type, 
    price_range,
    phone,
    email,
    is_active
) 
SELECT 
    COALESCE((SELECT user_id FROM profiles LIMIT 1), gen_random_uuid()),
    'Bistro du Plateau',
    'Restaurant français authentique au cœur du Plateau',
    '4567 Avenue du Mont-Royal, Montréal, QC H2H 2L7',
    ARRAY['Française', 'Bistro'],
    '$$',
    '5145550123',
    'contact@bistroduplateau.ca',
    true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Bistro du Plateau');