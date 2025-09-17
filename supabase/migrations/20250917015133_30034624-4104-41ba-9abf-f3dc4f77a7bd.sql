-- Créer des restaurants d'exemple avec des adresses spécifiques
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
  (SELECT user_id FROM profiles LIMIT 1), -- Use existing user
  'Bistro du Plateau',
  'Restaurant français authentique au cœur du Plateau',
  '4567 Avenue du Mont-Royal, Montréal, QC H2H 2L7',
  ARRAY['Française', 'Bistro'],
  '$$',
  '514-555-0123',
  'contact@bistroduplateau.ca',
  true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Bistro du Plateau');

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
  (SELECT user_id FROM profiles LIMIT 1), -- Use existing user
  'Tacos El Sombrero',
  'Cuisine mexicaine fraîche et authentique',
  '789 Boulevard Saint-Laurent, Montréal, QC H2Z 1J1',
  ARRAY['Mexicaine', 'Tacos'],
  '$',
  '514-555-0456',
  'hola@tacoselsombrero.ca',
  true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Tacos El Sombrero');

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
  (SELECT user_id FROM profiles LIMIT 1), -- Use existing user
  'Sushi Zen',
  'Sushis frais et cuisine japonaise raffinée',
  '2345 Rue Sherbrooke Ouest, Montréal, QC H3H 1G8',
  ARRAY['Japonaise', 'Sushi'],
  '$$$',
  '514-555-0789',
  'info@sushizen.ca',
  true
WHERE NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Sushi Zen');