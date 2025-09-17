-- Mettre à jour l'adresse du restaurant existant
UPDATE restaurants 
SET address = '1234 Rue Saint-Denis, Montréal, QC H2X 3J2'
WHERE name = 'Nouilles Star';

-- Ajouter quelques restaurants d'exemple avec des adresses spécifiques
DO $$
DECLARE
    sample_owner_id uuid;
BEGIN
    -- Récupérer un utilisateur existant
    SELECT user_id INTO sample_owner_id FROM profiles LIMIT 1;
    
    -- Si pas d'utilisateur trouvé, créer avec un UUID générique
    IF sample_owner_id IS NULL THEN
        sample_owner_id := gen_random_uuid();
    END IF;
    
    -- Insérer seulement si les restaurants n'existent pas déjà
    IF NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Bistro du Plateau') THEN
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
        ) VALUES (
            sample_owner_id,
            'Bistro du Plateau',
            'Restaurant français authentique au cœur du Plateau',
            '4567 Avenue du Mont-Royal, Montréal, QC H2H 2L7',
            ARRAY['Française', 'Bistro'],
            '$$',
            '514-555-0123', 
            'contact@bistroduplateau.ca',
            true
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Tacos El Sombrero') THEN
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
        ) VALUES (
            sample_owner_id,
            'Tacos El Sombrero', 
            'Cuisine mexicaine fraîche et authentique',
            '789 Boulevard Saint-Laurent, Montréal, QC H2Z 1J1',
            ARRAY['Mexicaine', 'Tacos'],
            '$',
            '514-555-0456',
            'hola@tacoselsombrero.ca', 
            true
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM restaurants WHERE name = 'Sushi Zen') THEN
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
        ) VALUES (
            sample_owner_id,
            'Sushi Zen',
            'Sushis frais et cuisine japonaise raffinée', 
            '2345 Rue Sherbrooke Ouest, Montréal, QC H3H 1G8',
            ARRAY['Japonaise', 'Sushi'],
            '$$$',
            '514-555-0789',
            'info@sushizen.ca',
            true
        );
    END IF;
END $$;