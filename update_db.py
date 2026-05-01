import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('DATABASE_URL')

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

# 1. Create Trigger to handle new users
cur.execute("""
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_service_id BIGINT;
  provider_role TEXT;
BEGIN
  -- Handle phone mapping (fallback to email if not provided)
  provider_role := COALESCE(new.raw_user_meta_data->>'role', 'user');
  
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'phone', split_part(new.email, '@', 1)),
    provider_role
  )
  ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  IF provider_role = 'provider' THEN
    SELECT id INTO new_service_id FROM services WHERE name = 'Househelper' LIMIT 1;
    IF new_service_id IS NULL THEN
      SELECT id INTO new_service_id FROM services LIMIT 1;
    END IF;

    INSERT INTO public.providers (profile_id, service_id, rating, base_price, is_active)
    VALUES (new.id, new_service_id, 5.0, 500, true)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE UNIQUE INDEX IF NOT EXISTS providers_profile_service_key
  ON public.providers (profile_id, service_id);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_booking_key
  ON public.reviews (booking_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own provider profiles" ON public.providers;
CREATE POLICY "Users can insert own provider profiles" ON public.providers
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update own provider profiles" ON public.providers;
CREATE POLICY "Users can update own provider profiles" ON public.providers
  FOR UPDATE USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.refresh_provider_rating()
RETURNS trigger AS $rating$
DECLARE
  target_provider_id BIGINT;
BEGIN
  target_provider_id := COALESCE(NEW.provider_id, OLD.provider_id);

  UPDATE public.providers
  SET rating = COALESCE((
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM public.reviews
    WHERE provider_id = target_provider_id
  ), 0)
  WHERE id = target_provider_id;

  RETURN COALESCE(NEW, OLD);
END;
$rating$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS reviews_refresh_provider_rating ON public.reviews;
CREATE TRIGGER reviews_refresh_provider_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.refresh_provider_rating();
""")

# 2. Backfill existing users
cur.execute("""
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM auth.users LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = r.id) THEN
      INSERT INTO public.profiles (id, full_name, phone, role)
      VALUES (
        r.id,
        r.raw_user_meta_data->>'full_name',
        COALESCE(r.raw_user_meta_data->>'phone', split_part(r.email, '@', 1)),
        COALESCE(r.raw_user_meta_data->>'role', 'user')
      );
      
      IF r.raw_user_meta_data->>'role' = 'provider' THEN
        INSERT INTO public.providers (profile_id, service_id, rating, base_price, is_active)
        VALUES (
            r.id, 
            (SELECT id FROM services WHERE name = 'Househelper' LIMIT 1),
            5.0, 
            500, 
            true
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
""")

cur.execute("""
UPDATE public.providers p
SET rating = COALESCE(agg.avg_rating, 0)
FROM (
  SELECT provider_id, ROUND(AVG(rating)::numeric, 2) AS avg_rating
  FROM public.reviews
  GROUP BY provider_id
) agg
WHERE p.id = agg.provider_id;
""")

print('Triggers created and existing users backfilled successfully!')
