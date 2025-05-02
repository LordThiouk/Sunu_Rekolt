/*
  # Add seed data for testing

  1. Initial Data
    - Create admin user
    - Add sample farmers
    - Add sample products
    - Add agricultural inputs
*/

-- Insert admin user
INSERT INTO auth.users (id, phone, created_at)
VALUES 
  ('d0d7d0e0-0d1a-4c1a-8f8a-8b8b8b8b8b8b', '+221777777777', now())
ON CONFLICT (phone) DO NOTHING;

INSERT INTO public.profiles (id, phone, role, name, location, farm_size)
VALUES
  ('d0d7d0e0-0d1a-4c1a-8f8a-8b8b8b8b8b8b', '+221777777777', 'admin', 'Admin', 'Dakar', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert sample farmers
INSERT INTO auth.users (id, phone, created_at)
VALUES 
  ('f1d7d0e0-0d1a-4c1a-8f8a-8b8b8b8b8b8b', '+221781234567', now()),
  ('f2d7d0e0-0d1a-4c1a-8f8a-8b8b8b8b8b8b', '+221782345678', now())
ON CONFLICT (phone) DO NOTHING;

INSERT INTO public.profiles (id, phone, role, name, location, farm_size)
VALUES
  ('f1d7d0e0-0d1a-4c1a-8f8a-8b8b8b8b8b8b', '+221781234567', 'farmer', 'Moussa Diop', 'Saint-Louis', 5.5),
  ('f2d7d0e0-0d1a-4c1a-8f8a-8b8b8b8b8b8b', '+221782345678', 'farmer', 'Fatou Sow', 'Thiès', 3.2)
ON CONFLICT (id) DO NOTHING;

-- Insert sample products
INSERT INTO public.products (
  farmer_id,
  name,
  description,
  price,
  quantity,
  unit,
  category,
  image_url,
  is_approved
)
VALUES
  (
    'f1d7d0e0-0d1a-4c1a-8f8a-8b8b8b8b8b8b',
    'Tomates fraîches',
    'Tomates fraîches de qualité supérieure, cultivées sans pesticides',
    1000,
    100,
    'kg',
    'vegetables',
    'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg',
    true
  ),
  (
    'f1d7d0e0-0d1a-4c1a-8f8a-8b8b8b8b8b8b',
    'Oignons',
    'Oignons locaux de grande taille',
    800,
    200,
    'kg',
    'vegetables',
    'https://images.pexels.com/photos/144206/pexels-photo-144206.jpeg',
    true
  ),
  (
    'f2d7d0e0-0d1a-4c1a-8f8a-8b8b8b8b8b8b',
    'Mangues Kent',
    'Mangues Kent mûres et juteuses',
    2500,
    50,
    'kg',
    'fruits',
    'https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg',
    true
  );

-- Insert agricultural inputs
INSERT INTO public.agricultural_inputs (
  name,
  description,
  price,
  category,
  image_url,
  stock
)
VALUES
  (
    'Semences de tomates',
    'Semences de tomates certifiées de haute qualité',
    5000,
    'seeds',
    'https://images.pexels.com/photos/1647757/pexels-photo-1647757.jpeg',
    100
  ),
  (
    'Engrais organique',
    'Engrais 100% naturel pour tous types de cultures',
    15000,
    'fertilizer',
    'https://images.pexels.com/photos/9976767/pexels-photo-9976767.jpeg',
    50
  ),
  (
    'Kit d''outils de jardinage',
    'Kit complet avec pelle, râteau et binette',
    25000,
    'tools',
    'https://images.pexels.com/photos/2736497/pexels-photo-2736497.jpeg',
    20
  );