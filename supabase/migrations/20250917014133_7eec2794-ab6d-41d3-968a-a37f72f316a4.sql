-- Mettre à jour les adresses des restaurants avec des adresses spécifiques de Montréal

-- Restaurant Nouilles Star
UPDATE restaurants 
SET address = '1234 Rue Saint-Denis, Montréal, QC H2X 3J2'
WHERE name = 'Nouilles Star';

-- Si il y a d'autres restaurants, on peut les ajouter ici
-- Ou créer quelques restaurants d'exemple avec des adresses spécifiques

-- Exemple de restaurants avec adresses spécifiques si besoin:
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
) VALUES 
  (
    (SELECT id FROM auth.users LIMIT 1), -- Utilise le premier utilisateur disponible
    'Bistro du Plateau',
    'Restaurant français authentique au cœur du Plateau',
    '4567 Avenue du Mont-Royal, Montréal, QC H2H 2L7',
    ARRAY['Française', 'Bistro'],
    '$$',
    '(514) 555-0123', 
    'contact@bistroduplateau.ca',
    true
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Tacos El Sombrero', 
    'Cuisine mexicaine fraîche et authentique',
    '789 Boulevard Saint-Laurent, Montréal, QC H2Z 1J1',
    ARRAY['Mexicaine', 'Tacos'],
    '$',
    '(514) 555-0456',
    'hola@tacoselsombrero.ca', 
    true
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Sushi Zen',
    'Sushis frais et cuisine japonaise raffinée', 
    '2345 Rue Sherbrooke Ouest, Montréal, QC H3H 1G8',
    ARRAY['Japonaise', 'Sushi'],
    '$$$',
    '(514) 555-0789',
    'info@sushizen.ca',
    true
  )
ON CONFLICT (name) DO NOTHING;