-- MENULY DATABASE SCHEMA
-- Restaurant Discovery Platform for Algeria

CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  role text CHECK (role IN ('customer', 'owner')) NOT NULL DEFAULT 'customer',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE restaurants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  wilaya text NOT NULL,
  commune text,
  address text,
  phone text,
  cover_photo text,
  logo text,
  opening_hours text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE menu_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  order_index int DEFAULT 0
);

CREATE TABLE menu_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES menu_categories(id) ON DELETE CASCADE NOT NULL,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price int NOT NULL,
  photo text,
  is_available boolean DEFAULT true,
  order_index int DEFAULT 0
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_edit_own" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "restaurants_read_active" ON restaurants FOR SELECT USING (is_active = true OR owner_id = auth.uid());
CREATE POLICY "restaurants_owner_manage" ON restaurants FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "categories_read" ON menu_categories FOR SELECT
  USING (EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_categories.restaurant_id AND (restaurants.is_active = true OR restaurants.owner_id = auth.uid())));
CREATE POLICY "categories_owner_manage" ON menu_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_categories.restaurant_id AND restaurants.owner_id = auth.uid()));

CREATE POLICY "items_read" ON menu_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_items.restaurant_id AND (restaurants.is_active = true OR restaurants.owner_id = auth.uid())));
CREATE POLICY "items_owner_manage" ON menu_items FOR ALL
  USING (EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = menu_items.restaurant_id AND restaurants.owner_id = auth.uid()));

-- Indexes
CREATE INDEX restaurants_owner_idx ON restaurants(owner_id);
CREATE INDEX restaurants_category_idx ON restaurants(category);
CREATE INDEX restaurants_wilaya_idx ON restaurants(wilaya);
CREATE INDEX restaurants_active_idx ON restaurants(is_active);
CREATE INDEX menu_categories_restaurant_idx ON menu_categories(restaurant_id);
CREATE INDEX menu_items_category_idx ON menu_items(category_id);
CREATE INDEX menu_items_restaurant_idx ON menu_items(restaurant_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS 
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS 
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
 LANGUAGE plpgsql;

CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
