-- Anti-recursion helper: checks admin role bypassing RLS on profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- programs: admin write access
CREATE POLICY "Admins can insert programs"
  ON public.programs
  FOR INSERT
  WITH CHECK (is_admin() = true);

CREATE POLICY "Admins can update programs"
  ON public.programs
  FOR UPDATE
  USING (is_admin() = true)
  WITH CHECK (is_admin() = true);

CREATE POLICY "Admins can delete programs"
  ON public.programs
  FOR DELETE
  USING (is_admin() = true);

-- letters: admin write access
CREATE POLICY "Admins can insert letters"
  ON public.letters
  FOR INSERT
  WITH CHECK (is_admin() = true);

CREATE POLICY "Admins can update letters"
  ON public.letters
  FOR UPDATE
  USING (is_admin() = true)
  WITH CHECK (is_admin() = true);

CREATE POLICY "Admins can delete letters"
  ON public.letters
  FOR DELETE
  USING (is_admin() = true);

-- profiles: admin read/update any profile
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (is_admin() = true);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (is_admin() = true)
  WITH CHECK (is_admin() = true);

-- letter_chunks: admin read access
CREATE POLICY "Admins can view letter chunks"
  ON public.letter_chunks
  FOR SELECT
  USING (is_admin() = true);

-- Restrict RPC exposure: is_admin() is for RLS policy evaluation only
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
