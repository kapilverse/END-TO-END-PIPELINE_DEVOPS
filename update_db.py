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

print('Triggers created and existing users backfilled successfully!')
