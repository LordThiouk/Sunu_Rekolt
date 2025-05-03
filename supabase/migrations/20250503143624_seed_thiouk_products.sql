-- Seed products for farmer 'thiouk'

DO $$
DECLARE
    thiouk_user_id uuid;
BEGIN
    -- Find the user ID for 'thiouk'
    SELECT id INTO thiouk_user_id FROM public.profiles WHERE name = 'thiouk' LIMIT 1;

    -- Check if the user was found
    IF thiouk_user_id IS NULL THEN
        RAISE EXCEPTION 'User "thiouk" not found in profiles table. Seed data cannot be added.';
    END IF;

    -- Insert seed products
    INSERT INTO public.products (farmer_id, name, description, price, quantity, unit, category, image_url, is_approved)
    VALUES
        (thiouk_user_id, 'Tomates Fraîches', 'Belles tomates rouges et juteuses, cultivées localement.', 1500, 50, 'kg', 'vegetables', 'https://exemple.com/images/tomates.jpg', true),
        (thiouk_user_id, 'Oignons Locaux', 'Oignons frais du Sénégal, parfaits pour vos plats.', 1000, 100, 'kg', 'vegetables', 'https://exemple.com/images/oignons.jpg', true),
        (thiouk_user_id, 'Mangues Kent', 'Mangues Kent sucrées et savoureuses, récolte de saison.', 2500, 30, 'kg', 'fruits', 'https://exemple.com/images/mangues.jpg', true),
        (thiouk_user_id, 'Pommes de Terre', 'Pommes de terre de bonne qualité, idéales pour frites ou purée.', 800, 200, 'kg', 'vegetables', 'https://exemple.com/images/pdt.jpg', true);

END $$;
