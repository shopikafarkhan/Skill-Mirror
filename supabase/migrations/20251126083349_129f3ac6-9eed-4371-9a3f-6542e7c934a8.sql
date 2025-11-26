-- Fix security warnings by setting search_path on functions

-- Drop and recreate update_study_twin_timestamp function with search_path
DROP FUNCTION IF EXISTS update_study_twin_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION update_study_twin_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_study_twin_timestamp_trigger
  BEFORE UPDATE ON public.study_twin
  FOR EACH ROW
  EXECUTE FUNCTION update_study_twin_timestamp();

-- Drop and recreate handle_new_user function with search_path
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  
  INSERT INTO public.study_twin (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();